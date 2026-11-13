import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Capa de datos intercambiable. Cada tabla guarda objetos JSON sin identificadores de persona
 * (las cuentas de cafés guardan solo correo y un hash de la clave, nunca la clave).
 * - Con SUPABASE_URL y SUPABASE_SERVICE_KEY: Supabase (ver supabase/schema.sql).
 * - Sin eso: archivos JSON locales (.data/) y, si no se puede escribir (Vercel), memoria.
 *
 * Tablas de registro (solo se agrega): reportes, leads, eventos.
 * Tablas con clave (cada fila tiene `id`): cafes, cuentas.
 */
export type Tabla = "reportes" | "leads" | "eventos" | "cafes" | "cuentas";
export type Fila = Record<string, unknown>;

export interface Store {
  readonly nombre: string;
  agregar(tabla: Tabla, fila: Fila): Promise<void>;
  listar(tabla: Tabla): Promise<Fila[]>;
  /** Crea o reemplaza la fila con ese `id` (tablas con clave). */
  poner(tabla: Tabla, fila: Fila & { id: string }): Promise<void>;
  quitar(tabla: Tabla, id: string): Promise<void>;
}

const TABLAS: Tabla[] = ["reportes", "leads", "eventos", "cafes", "cuentas"];

/* Respaldo en memoria compartido por todo el proceso: Next empaqueta las rutas y las páginas por separado,
   y cada paquete tiene su propia copia de este módulo. */
const g = globalThis as unknown as { __umbralMemoria?: Map<Tabla, Fila[]> };
const memoria = (g.__umbralMemoria ??= new Map<Tabla, Fila[]>());

class ArchivoStore implements Store {
  readonly nombre = "archivo local";
  private dir = process.env.DATA_DIR ?? path.join(process.cwd(), ".data");
  private archivo = (t: Tabla) => path.join(this.dir, `${t}.json`);

  /** Siempre lee el archivo (otro paquete pudo escribirlo); si no se puede, usa la memoria. */
  private async cargar(tabla: Tabla): Promise<Fila[]> {
    try {
      const filas = JSON.parse(await fs.readFile(this.archivo(tabla), "utf8")) as Fila[];
      memoria.set(tabla, filas);
      return filas;
    } catch {
      return memoria.get(tabla) ?? [];
    }
  }

  private async guardar(tabla: Tabla, filas: Fila[]) {
    memoria.set(tabla, filas);
    try {
      await fs.mkdir(this.dir, { recursive: true });
      await fs.writeFile(this.archivo(tabla), JSON.stringify(filas));
    } catch {
      /* sistema de solo lectura (ej. Vercel): queda en memoria de esta instancia */
    }
  }

  async listar(tabla: Tabla) {
    return [...(await this.cargar(tabla))];
  }
  async agregar(tabla: Tabla, fila: Fila) {
    await this.guardar(tabla, [...(await this.cargar(tabla)), fila]);
  }
  async poner(tabla: Tabla, fila: Fila & { id: string }) {
    const filas = (await this.cargar(tabla)).filter((f) => f.id !== fila.id);
    await this.guardar(tabla, [...filas, fila]);
  }
  async quitar(tabla: Tabla, id: string) {
    await this.guardar(tabla, (await this.cargar(tabla)).filter((f) => f.id !== id));
  }
}

class SupabaseStore implements Store {
  readonly nombre = "Supabase";
  constructor(private url: string, private key: string) {}
  private h = () => ({ apikey: this.key, Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" });
  private conClave = (t: Tabla) => t === "cafes" || t === "cuentas";

  async agregar(tabla: Tabla, fila: Fila): Promise<void> {
    const r = await fetch(`${this.url}/rest/v1/${tabla}`, { method: "POST", headers: { ...this.h(), Prefer: "return=minimal" }, body: JSON.stringify({ payload: fila }) });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
  }

  async listar(tabla: Tabla): Promise<Fila[]> {
    const orden = this.conClave(tabla) ? "id.asc" : "creado.desc";
    const r = await fetch(`${this.url}/rest/v1/${tabla}?select=payload&order=${orden}&limit=5000`, { headers: this.h(), cache: "no-store" });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
    return ((await r.json()) as { payload: Fila }[]).map((x) => x.payload);
  }

  async poner(tabla: Tabla, fila: Fila & { id: string }): Promise<void> {
    const r = await fetch(`${this.url}/rest/v1/${tabla}?on_conflict=id`, {
      method: "POST",
      headers: { ...this.h(), Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: fila.id, payload: fila }),
    });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
  }

  async quitar(tabla: Tabla, id: string): Promise<void> {
    const r = await fetch(`${this.url}/rest/v1/${tabla}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: this.h() });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
  }
}

let instancia: Store | undefined;
export function store(): Store {
  if (!instancia) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    instancia = url && key ? new SupabaseStore(url.replace(/\/$/, ""), key) : new ArchivoStore();
  }
  return instancia;
}

export { TABLAS };
