import { clamp, clamp01, lerp } from "../../geom.ts";

/**
 * MARCHA POR PASOS (sin patinaje). En vez de un ciclo periódico, la caminata se define por los PASOS reales
 * de cada pie (instante de apoyo + posición en el suelo). Un pie apoyado queda QUIETO en el suelo mientras
 * dura el apoyo; después se levanta, avanza en arco y vuelve a apoyar. La cadera se deduce de los pies, así
 * que la figura frena y se detiene con naturalidad (paso de cierre) y nunca se desliza.
 *
 * Unidades: u de mundo locales de la amiga (x hacia la derecha; el asiento está en x = 0). Tiempo: fotogramas.
 */
export type Plant = {
  /** fotograma del contacto con el suelo */
  t: number;
  /** posición x (u) donde apoya */
  x: number;
  /** fotogramas que permanece apoyado antes de levantarse (por defecto `STANCE`) */
  stance?: number;
  /** altura máxima (u) del arco del paso que ARRANCA en este apoyo (por defecto según la distancia) */
  lift?: number;
};

export type FootSample = {
  x: number;
  /** altura sobre el suelo (u) */
  lift: number;
  /** 0 = apoyado/quieto … 1 = en el aire */
  air: number;
  /** progreso del tramo en el aire (0..1; 0 si está apoyado) */
  swing: number;
  /** progreso del apoyo hacia el despegue (0 al apoyar … 1 al levantarse) */
  roll: number;
  /** distancia horizontal (u) y sentido del paso en curso (para la inclinación del pie) */
  dir: number;
};

export const STANCE = 21;

/** Muestra la trayectoria de UN pie en el fotograma `f`. */
export const footAt = (plants: readonly Plant[], f: number): FootSample => {
  const n = plants.length;
  if (n === 0) return { x: 0, lift: 0, air: 0, swing: 0, roll: 0, dir: 0 };
  if (f < plants[0].t) return { x: plants[0].x, lift: 0, air: 0, swing: 0, roll: 0, dir: 0 };
  let i = 0;
  while (i + 1 < n && plants[i + 1].t <= f) i++;
  const a = plants[i];
  const b = plants[i + 1];
  if (!b) {
    // último apoyo: queda quieto
    return { x: a.x, lift: 0, air: 0, swing: 0, roll: 0, dir: 0 };
  }
  const stance = a.stance ?? STANCE;
  const liftAt = Math.min(a.t + stance, b.t - 4);
  if (f < liftAt) {
    return { x: a.x, lift: 0, air: 0, swing: 0, roll: clamp01((f - a.t) / Math.max(1, liftAt - a.t)), dir: Math.sign(b.x - a.x) };
  }
  const u = clamp01((f - liftAt) / (b.t - liftAt));
  const dist = Math.abs(b.x - a.x);
  const h = a.lift ?? clamp(dist * 0.17, 5, 46);
  // perfil de velocidad en campana (mínimo tirón): el pie arranca, pasa a la cadera y llega frenando
  const e = u * u * u * (10 - 15 * u + 6 * u * u);
  return { x: lerp(a.x, b.x, e), lift: h * Math.pow(Math.sin(Math.PI * u), 0.85), air: 1, swing: u, roll: 1, dir: Math.sign(b.x - a.x) };
};

/** Promedio suavizado de los dos pies (cadera): ventana corta para que no «salte» con cada paso. */
export const hipFromFeet = (a: readonly Plant[], b: readonly Plant[], f: number, win = 9): number => {
  let sum = 0;
  let cnt = 0;
  for (let k = -win; k <= win; k++) {
    const w = 1 - Math.abs(k) / (win + 1);
    sum += w * (footAt(a, f + k).x + footAt(b, f + k).x) * 0.5;
    cnt += w;
  }
  return sum / cnt;
};
