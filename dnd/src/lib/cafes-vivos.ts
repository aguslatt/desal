import { barrios as barriosBase, lugares as lugaresBase, programas, reportesDemo } from "./datos";
import { discrepancias } from "./discrepancia";
import { store } from "./store";
import type { Lugar, Programa } from "./types";

/**
 * Los cafés "vivos": los del archivo base (src/data/lugares.json) más lo que la admin agrega, edita,
 * oculta o elimina desde el panel (tabla `cafes`). Todas las páginas públicas leen de acá.
 */
export type EstadoCafe = "activo" | "oculto" | "eliminado";

export interface CafeRegistro {
  id: string;
  estado: EstadoCafe;
  /** El café completo cuando se agregó o se editó desde el panel. */
  lugar?: Lugar;
  actualizado: string;
}

export interface CafeAdmin {
  lugar: Lugar;
  estado: "activo" | "oculto";
  /** viene del archivo base (true) o fue agregado desde el panel (false) */
  base: boolean;
  /** se editó desde el panel */
  editado: boolean;
}

async function registros(): Promise<CafeRegistro[]> {
  try {
    return (await store().listar("cafes")) as unknown as CafeRegistro[];
  } catch {
    return []; // si la base no responde, se muestran los cafés del archivo base
  }
}

/** Todos los cafés que conoce el panel (activos y ocultos; sin los eliminados). */
export async function cafesAdmin(): Promise<CafeAdmin[]> {
  const reg = new Map((await registros()).map((r) => [r.id, r]));
  const out = new Map<string, CafeAdmin>();
  for (const l of lugaresBase) out.set(l.id, { lugar: l, estado: "activo", base: true, editado: false });
  for (const r of reg.values()) {
    if (r.estado === "eliminado") {
      out.delete(r.id);
      continue;
    }
    const previo = out.get(r.id);
    const lugar = r.lugar ?? previo?.lugar;
    if (!lugar) continue;
    out.set(r.id, { lugar, estado: r.estado, base: !!previo?.base, editado: !!r.lugar });
  }
  return [...out.values()].sort((a, b) => a.lugar.nombre.localeCompare(b.lugar.nombre, "es"));
}

/** Los cafés visibles para el público. */
export async function obtenerLugares(): Promise<Lugar[]> {
  return (await cafesAdmin()).filter((c) => c.estado === "activo").map((c) => c.lugar);
}

export async function obtenerLugar(id: string): Promise<Lugar | undefined> {
  return (await obtenerLugares()).find((l) => l.id === id);
}

export const barriosDe = (lugares: Lugar[]) => [...new Set(lugares.map((l) => l.barrio))].sort((a, b) => a.localeCompare(b, "es"));

/** Programas cuyo café sigue visible. */
export function programasVisibles(lugares: Lugar[]): Programa[] {
  const ids = new Set(lugares.map((l) => l.id));
  return programas.filter((p) => ids.has(p.lugarId));
}

export function idsConDiscrepancia(lugares: Lugar[]): string[] {
  return lugares.filter((l) => discrepancias(l, reportesDemo).length > 0).map((l) => l.id);
}

export { barriosBase };

export async function guardarRegistro(r: Omit<CafeRegistro, "actualizado">) {
  await store().poner("cafes", { ...r, actualizado: new Date().toISOString() } as unknown as Record<string, unknown> & { id: string });
}
