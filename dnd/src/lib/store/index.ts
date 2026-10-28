import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Capa de datos intercambiable. Tres tablas, cada fila es un objeto JSON sin identificadores de persona.
 * - Con SUPABASE_URL y SUPABASE_SERVICE_KEY: Supabase (ver supabase/schema.sql).
 * - Sin eso: archivos JSON locales (.data/) y, si no se puede escribir (Vercel), memoria.
 */
export type Tabla = "reportes" | "leads" | "eventos";
export type Fila = Record<string, unknown>;

export interface Store {
  readonly nombre: string;
  agregar(tabla: Tabla, fila: Fila): Promise<void>;
  listar(tabla: Tabla): Promise<Fila[]>;
}

const memoria: Record<Tabla, Fila[]> = { reportes: [], leads: [], eventos: [] };

class ArchivoStore implements Store {
  readonly nombre = "archivo local";
  private dir = process.env.DATA_DIR ?? path.join(process.cwd(), ".data");
  private archivo = (t: Tabla) => path.join(this.dir, `${t}.json`);

  async listar(tabla: Tabla): Promise<Fila[]> {
    try {
      const filas = JSON.parse(await fs.readFile(this.archivo(tabla), "utf8")) as Fila[];
      return filas.length >= memoria[tabla].length ? filas : memoria[tabla];
    } catch {
      return memoria[tabla];
    }
  }

  async agregar(tabla: Tabla, fila: Fila): Promise<void> {
    const filas = [...(await this.listar(tabla)), fila];
    memoria[tabla] = filas;
    try {
      await fs.mkdir(this.dir, { recursive: true });
      await fs.writeFile(this.archivo(tabla), JSON.stringify(filas));
    } catch {
      /* sistema de solo lectura (ej. Vercel): queda en memoria de esta instancia */
    }
  }
}

class SupabaseStore implements Store {
  readonly nombre = "Supabase";
  constructor(private url: string, private key: string) {}
  private h = () => ({ apikey: this.key, Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" });

  async agregar(tabla: Tabla, fila: Fila): Promise<void> {
    const r = await fetch(`${this.url}/rest/v1/${tabla}`, { method: "POST", headers: { ...this.h(), Prefer: "return=minimal" }, body: JSON.stringify({ payload: fila }) });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
  }

  async listar(tabla: Tabla): Promise<Fila[]> {
    const r = await fetch(`${this.url}/rest/v1/${tabla}?select=payload&order=creado.desc&limit=5000`, { headers: this.h(), cache: "no-store" });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
    return ((await r.json()) as { payload: Fila }[]).map((x) => x.payload);
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
