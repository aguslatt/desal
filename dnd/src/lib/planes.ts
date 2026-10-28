import { condicion } from "./catalogo";
import { coincidencia } from "./match";
import { hoy } from "./fecha";
import type { Coincidencia, Lugar, Plan, TipoPlan } from "./types";

/**
 * Para evaluar un plan con las mismas reglas que un lugar: las condiciones físicas del café (escalones, baño,
 * ascensor) se heredan, y las del plan se suman y mandan si hay las dos (ej. el plan tiene intérprete de LSA).
 */
export function planComoLugar(plan: Plan, lugar: Lugar): Lugar {
  // Lo que depende del momento (LSA en ciertos horarios, ruido, concurrencia) no se hereda: si el plan
  // no lo dice, queda "sin información" en vez de dar por buena una condición de otro horario.
  const heredados = Object.fromEntries(Object.entries(lugar.datos).filter(([id]) => !condicion(id).dependeDelMomento));
  return { ...lugar, id: plan.id, nombre: plan.titulo, datos: { ...heredados, ...plan.datos } };
}

export interface FiltrosPlanes {
  necesidades: string[];
  dia?: string;
  tipo?: TipoPlan;
  ocultarNoDisponible?: boolean;
}

export interface ResultadoPlan {
  plan: Plan;
  lugar: Lugar;
  coincidencia: Coincidencia;
}

const cuando = (p: Plan) => `${p.fecha} ${p.desde}`;

/**
 * Mismas reglas que los cafés: orden por coincidencia (cumple todo, con sin información, con "No disponible"),
 * y un plan de un café patrocinado solo aparece si cumple TODAS las condiciones elegidas.
 * Ante un empate, el plan que viene antes.
 */
export function buscarPlanes(planes: Plan[], lugares: Lugar[], f: FiltrosPlanes, ahora: Date = hoy()) {
  const desdeHoy = ahora.toISOString().slice(0, 10);
  let ocultos = 0;
  const items: ResultadoPlan[] = [];
  for (const plan of planes) {
    if (plan.fecha < desdeHoy) continue;
    if (f.dia && plan.fecha !== f.dia) continue;
    if (f.tipo && plan.tipo !== f.tipo) continue;
    const lugar = lugares.find((l) => l.id === plan.lugarId);
    if (!lugar) continue;
    const c = coincidencia(planComoLugar(plan, lugar), f.necesidades);
    if (lugar.patrocinado && c.grupo !== 0) continue;
    if (f.ocultarNoDisponible && c.grupo === 2) {
      ocultos++;
      continue;
    }
    items.push({ plan, lugar, coincidencia: c });
  }
  items.sort(
    (a, b) =>
      a.coincidencia.grupo - b.coincidencia.grupo ||
      b.coincidencia.cumple - a.coincidencia.cumple ||
      a.coincidencia.noDisponible - b.coincidencia.noDisponible ||
      cuando(a.plan).localeCompare(cuando(b.plan)),
  );
  return {
    items,
    ocultos,
    cumplenTodo: items.filter((i) => i.coincidencia.grupo === 0).length,
    conSinInfo: items.filter((i) => i.coincidencia.grupo === 1).length,
  };
}

export function mensajePlanes(b: { items: unknown[]; cumplenTodo: number; conSinInfo: number }, hayNecesidades: boolean): string {
  const n = b.items.length;
  const planes = (k: number) => `${k} ${k === 1 ? "plan" : "planes"}`;
  if (!hayNecesidades) return `${planes(n)} para elegir`;
  if (n === 0) return "Ningún plan cumple tus condiciones. Probá sacando alguna.";
  const base = `${planes(b.cumplenTodo)} ${b.cumplenTodo === 1 ? "cumple" : "cumplen"} tus condiciones`;
  return b.conSinInfo > 0 ? `${base} y ${b.conSinInfo} con información incompleta` : base;
}

export const TIPOS_PLAN: TipoPlan[] = ["Música", "Taller", "Charla", "Cata", "Juegos", "Lectura", "Cine", "Feria", "Paseo", "Brunch"];
