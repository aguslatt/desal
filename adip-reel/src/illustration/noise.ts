import { mulberry32 } from "../lib/rng.ts";

/**
 * Ruido 1D suave y determinista (valor en retícula + interpolación cúbica Catmull-Rom).
 * Se usa para el temblor de la mano, la presión del trazo y el grosor irregular de las curvas.
 * Solo depende de (semilla, t): el mismo trazo se dibuja igual en el Studio y en el render.
 */
const SIZE = 512;
const cache = new Map<number, Float32Array>();

const lattice = (seed: number): Float32Array => {
  const key = seed | 0;
  let l = cache.get(key);
  if (!l) {
    const rnd = mulberry32(key * 7919 + 13);
    l = new Float32Array(SIZE);
    for (let i = 0; i < SIZE; i++) l[i] = rnd() * 2 - 1;
    cache.set(key, l);
  }
  return l;
};

/** Ruido suave en [-1, 1] aprox.; `t` en unidades de retícula (período ≈ 1 por cada «cambio de valor»). */
export const noise1 = (seed: number, t: number): number => {
  const l = lattice(seed);
  const i = Math.floor(t);
  const f = t - i;
  const p0 = l[(((i - 1) % SIZE) + SIZE) % SIZE];
  const p1 = l[((i % SIZE) + SIZE) % SIZE];
  const p2 = l[(((i + 1) % SIZE) + SIZE) % SIZE];
  const p3 = l[(((i + 2) % SIZE) + SIZE) % SIZE];
  const v = p1 + 0.5 * f * (p2 - p0 + f * (2 * p0 - 5 * p1 + 4 * p2 - p3 + f * (3 * (p1 - p2) + p3 - p0)));
  return Math.max(-1.25, Math.min(1.25, v));
};

/** Suma de 2–3 octavas (más «orgánico»). Aprox. en [-1, 1]. */
export const fbm1 = (seed: number, t: number, octaves = 3): number => {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise1(seed + o * 31, t * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm;
};

/** Número pseudoaleatorio estable en [0,1) a partir de enteros (para variaciones por índice). */
export const hash01 = (a: number, b = 0, c = 0): number => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
