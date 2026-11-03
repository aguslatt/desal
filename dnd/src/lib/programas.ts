import { condicion } from "./catalogo";
import { coincidencia } from "./match";
import { hoy } from "./fecha";
import type { Coincidencia, Lugar, Programa, TipoPrograma } from "./types";

/**
 * Para evaluar un programa con las mismas reglas que un lugar: las condiciones físicas del café (escalones, baño,
 * ascensor) se heredan, y las del programa se suman y mandan si hay las dos (ej. el programa tiene intérprete de LSA).
 */
export function programaComoLugar(programa: Programa, lugar: Lugar): Lugar {
  // Lo que depende del momento (LSA en ciertos horarios, ruido, concurrencia) no se hereda: si el programa
  // no lo dice, queda "sin información" en vez de dar por buena una condición de otro horario.
  const heredados = Object.fromEntries(Object.entries(lugar.datos).filter(([id]) => !condicion(id).dependeDelMomento));
  return { ...lugar, id: programa.id, nombre: programa.titulo, datos: { ...heredados, ...programa.datos } };
}

export interface FiltrosProgramas {
  necesidades: string[];
  dia?: string;
  tipo?: TipoPrograma;
  ocultarNoDisponible?: boolean;
}

export interface ResultadoPrograma {
  programa: Programa;
  lugar: Lugar;
  coincidencia: Coincidencia;
}

const cuando = (p: Programa) => `${p.fecha} ${p.desde}`;

/**
 * Mismas reglas que los cafés: orden por coincidencia (cumple todo, con sin información, con "No disponible"),
 * y un programa de un café patrocinado solo aparece si cumple TODAS las condiciones elegidas.
 * Ante un empate, el programa que viene antes.
 */
export function buscarProgramas(programas: Programa[], lugares: Lugar[], f: FiltrosProgramas, ahora: Date = hoy()) {
  const desdeHoy = ahora.toISOString().slice(0, 10);
  let ocultos = 0;
  const items: ResultadoPrograma[] = [];
  for (const programa of programas) {
    if (programa.fecha < desdeHoy) continue;
    if (f.dia && programa.fecha !== f.dia) continue;
    if (f.tipo && programa.tipo !== f.tipo) continue;
    const lugar = lugares.find((l) => l.id === programa.lugarId);
    if (!lugar) continue;
    const c = coincidencia(programaComoLugar(programa, lugar), f.necesidades);
    if (lugar.patrocinado && c.grupo !== 0) continue;
    if (f.ocultarNoDisponible && c.grupo === 2) {
      ocultos++;
      continue;
    }
    items.push({ programa, lugar, coincidencia: c });
  }
  items.sort(
    (a, b) =>
      a.coincidencia.grupo - b.coincidencia.grupo ||
      b.coincidencia.cumple - a.coincidencia.cumple ||
      a.coincidencia.noDisponible - b.coincidencia.noDisponible ||
      cuando(a.programa).localeCompare(cuando(b.programa)),
  );
  return {
    items,
    ocultos,
    cumplenTodo: items.filter((i) => i.coincidencia.grupo === 0).length,
    conSinInfo: items.filter((i) => i.coincidencia.grupo === 1).length,
  };
}

export function mensajeProgramas(b: { items: unknown[]; cumplenTodo: number; conSinInfo: number }, hayNecesidades: boolean): string {
  const n = b.items.length;
  const programas = (k: number) => `${k} ${k === 1 ? "programa" : "programas"}`;
  if (!hayNecesidades) return `${programas(n)} para elegir`;
  if (n === 0) return "Ningún programa cumple tus condiciones. Probá sacando alguna.";
  const base = `${programas(b.cumplenTodo)} ${b.cumplenTodo === 1 ? "cumple" : "cumplen"} tus condiciones`;
  return b.conSinInfo > 0 ? `${base} y ${b.conSinInfo} con información incompleta` : base;
}

export const TIPOS_PROGRAMA: TipoPrograma[] = ["Música", "Taller", "Charla", "Cata", "Juegos", "Lectura", "Cine", "Feria", "Paseo", "Brunch"];
