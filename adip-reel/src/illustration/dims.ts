import { rad, type Pt } from "./geom.ts";

/**
 * COTAS de los objetos de la escena (puro, sin React; px de escena a escala 1: un adulto de pie mide 440 px).
 * Marco local de cada objeto = marco de la figura que lo usa: origen en el SUELO, mira a +x, y hacia abajo.
 */

/** Altura de la cara superior del asiento del banco sobre el suelo (px). ≈ 45 cm reales. */
export const SEAT_TOP = 116;

export const BENCH = {
  /** extremos del tablón respecto de la cadera de quien se sienta (el de adelante pasa más allá del zapato: así se leen las patas de ese lado) */
  x0: -90,
  x1: 196,
  thickness: 13,
} as const;

/** Cotas de la silla (px, marco local: origen en el suelo bajo el eje trasero; la silla mira a +x). */
export const WHEELCHAIR = {
  rear: { x: 0, y: -79, r: 79 },
  caster: { x: 98, y: -26, r: 26 },
  /** cara superior del cojín */
  seatTop: -128,
  /** cadera de quien se sienta, en el marco de la silla */
  hip: [8, -144] as Pt,
  /** punta del apoyapiés */
  footplateFront: 204,
  /** aro de empuje (radio) donde apoyan las manos */
  rim: 66,
} as const;

/** Celular a TAMAÑO REAL (grande): 46 × 20 px frente a una persona de 440 px de pie (≈ 18 × 8 cm) → ≈ 1/7,3 de su altura sentada. */
export const PHONE = { len: 46, wid: 20 } as const;

/** Punto del aro de empuje (marco de la silla) a un ángulo de pantalla (°; −90 = arriba, 0 = adelante). */
export const rimPoint = (angleDeg: number, r: number = WHEELCHAIR.rim): Pt => {
  const a = rad(angleDeg);
  return [WHEELCHAIR.rear.x + Math.cos(a) * r, WHEELCHAIR.rear.y + Math.sin(a) * r];
};
