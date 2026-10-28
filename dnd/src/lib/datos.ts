import lugaresJson from "@/data/lugares.json";
import reportesJson from "@/data/reportes-demo.json";
import type { Lugar, Reporte } from "./types";

/** Para usar relevamientos reales, reemplazá src/data/lugares.json (ver README). */
export const lugares = lugaresJson as unknown as Lugar[];
export const reportesDemo = reportesJson as unknown as Reporte[];
export const ES_DEMO = true;

export function lugarPorId(id: string): Lugar | undefined {
  return lugares.find((l) => l.id === id);
}

export const barrios = [...new Set(lugares.map((l) => l.barrio))].sort((a, b) => a.localeCompare(b, "es"));
