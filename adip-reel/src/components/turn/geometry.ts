import { THREAD, ZONES } from "../../config/layout.ts";
import { TURN_TIMING } from "../../config/timeline.ts";

/**
 * Escena 3 · El giro — geometría y ritmo de la tipografía animada.
 * Todo sale de layout.ts (zonas y carril del hilo) y timeline.ts (hitos); aquí solo se derivan medidas.
 */
export const TYPE = {
  fontSize: 80,
  lineHeight: 94,
  weight: 600,
  emphasisWeight: 700,
  letterSpacing: -0.8,
} as const;

/** Margen entre la tinta del bloque y el borde de la franja libre alrededor del hilo. */
const PAD = 7;
/** Cuánto sobresale (px) la cola de la «p» de la última línea por debajo de la caja de línea (Montserrat 80 px, medido en el render). */
const DESCENDER_OVERSHOOT = 15;
const BLOCK_H = TYPE.lineHeight * 2;

/**
 * 1.ª oración: sobre el carril, bloque apoyado en el borde inferior de la zona (y 700–904).
 * 2.ª oración: bajo el carril, bloque colgado del borde superior de la zona (y 1016–1260).
 * Entre ambas queda libre la franja 904–1016 (= carril ± THREAD.clearance) para la línea naranja.
 */
export const FIRST_TOP = ZONES.s3.aboveLane.y1 - PAD - DESCENDER_OVERSHOOT - BLOCK_H;
export const SECOND_TOP = ZONES.s3.belowLane.y0 + PAD;
export const FREE_BAND = { y0: THREAD.lanes.s3 - THREAD.clearance, y1: THREAD.lanes.s3 + THREAD.clearance } as const;

/** Ritmo de entrada/salida (fotogramas). */
export const MOTION = {
  /** retraso entre líneas de una misma oración */
  lineStagger: 7,
  /** duración del revelado de cada línea */
  enter: 26,
  /** el fundido de opacidad es más corto que el ascenso: la línea se lee pronto */
  enterFade: 15,
  /** ascenso inicial (px) */
  rise: 16,
  /** marcador de énfasis: arranca cuando la 2.ª línea ya asentó */
  markerDelay: 26,
  markerDraw: 18,
  /** salida (la 2.ª oración sale primero: el hilo baja por esa zona desde THREAD_TIMING.descendFrom) */
  exit: 10,
  exitStagger: 2,
  exitLift: 10,
  /** la 1.ª oración sale justo después que la 2.ª */
  exitFirstDelay: 2,
  /** el color del fondo "florece" tras el fundido: las manchas pasan de este nivel a 1 en `bloomFrames` */
  bloomFrom: 0.55,
  bloomFrames: 48,
  /** fundido del fondo sobre el chat (= OVERLAP) */
  bgFade: 12,
} as const;

/** Salida de la 1.ª oración (modo video: deja paso a la 2.ª sin superponerlas). */
export const FIRST_SUBTITLE_OUT = TURN_TIMING.secondIn - 10;

/** Última palabra de una oración sin puntuación final (derivada del guion: no se retipea). */
export const lastWord = (sentence: string): string => {
  const words = sentence.replace(/[.,;:!?¿¡…]+$/u, "").trim().split(/\s+/u);
  return words[words.length - 1];
};
