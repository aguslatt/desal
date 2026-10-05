import { clamp01, lerp, smoothstep } from "../../geom.ts";

/**
 * MARCHA CON PIES SIN PATINAR — controla cuándo y cuánto camina una figura del reparto.
 *
 * Una figura «sale» de su posición inicial, camina `steps` pasos (1 paso = medio ciclo de `walkSide`) y se detiene
 * en su posición de reposo. La velocidad sigue un perfil trapezoidal (arranca, crucero, frena): el avance en el
 * mundo es proporcional a la fase del ciclo, así que el pie de apoyo no se desliza (la distancia por ciclo es
 * 4 × stride RU × altura/1000). Todo es función del fotograma: determinista.
 */
export type GaitSpec = {
  /** fotograma absoluto en que da el primer paso */
  start: number;
  /** pasos (medios ciclos); la figura avanza `steps/2 · cycleLen` */
  steps: number;
  /** duración del tramo en fotogramas */
  frames: number;
  /** fracción de rampa de aceleración/frenado (0,28 por defecto) */
  ramp?: number;
  /** fase inicial (0,25 = pie izquierdo apoyado a mitad de zancada) */
  p0?: number;
};

export type GaitState = {
  /** fase del ciclo (acumulada, sin módulo) */
  phase: number;
  /** avance acumulado en ciclos desde el arranque (fase − p0) */
  cycles: number;
  /** fracción 0..1 de la distancia total recorrida */
  s: number;
  /** 0 = de pie … 1 = caminando a pleno (mezcla de pose) */
  walk: number;
  /** fracción 0..1 del tiempo del tramo */
  t: number;
};

/** Duración en fotogramas para una cadencia de crucero `cycleFrames` (fotogramas por ciclo = 2 pasos). */
export const gaitFrames = (steps: number, cycleFrames: number, ramp = 0.28): number => Math.round(((steps / 2) * cycleFrames) / (1 - ramp));

export const gaitAt = (g: GaitSpec, frame: number): GaitState => {
  const a = g.ramp ?? 0.28;
  const p0 = g.p0 ?? 0.25;
  const t = clamp01((frame - g.start) / g.frames);
  const area = 1 - a;
  let d: number;
  if (t < a) d = (t * t) / (2 * a);
  else if (t <= 1 - a) d = a / 2 + (t - a);
  else {
    const u = 1 - t;
    d = 1 - a - (u * u) / (2 * a);
  }
  const s = clamp01(d / area);
  const cycles = (g.steps / 2) * s;
  // mezcla caminar/parado: se funde en los extremos para que arranque y frene sin saltos
  const walk = smoothstep(0, 0.1, t) * (1 - smoothstep(0.9, 1, t));
  return { phase: p0 + cycles, cycles, s, walk, t };
};

/** Distancia total (u de mundo) de un tramo: pasos × (2 · stride RU) × (altura/1000). */
export const gaitDistance = (steps: number, strideRU: number, heightU: number): number => steps * 2 * strideRU * (heightU / 1000);

export { lerp };
