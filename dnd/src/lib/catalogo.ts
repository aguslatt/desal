import data from "@/data/catalogo.json";
import type { Condicion, Dimension } from "./types";

export const dimensiones = data.dimensiones as Dimension[];
export const condiciones = data.condiciones as Condicion[];

const porId = new Map(condiciones.map((c) => [c.id, c]));

export function condicion(id: string): Condicion {
  const c = porId.get(id);
  if (!c) throw new Error(`Condición desconocida: ${id}`);
  return c;
}

export function condicionesDe(dimension: Dimension["id"]): Condicion[] {
  return condiciones.filter((c) => c.dimension === dimension);
}

export const RUBROS = {
  bar: "Bar",
  restaurante: "Restaurante",
  cafe: "Café",
  cine: "Cine",
  centro_cultural: "Centro cultural",
} as const;
