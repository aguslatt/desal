import {H, W, lerp, clamp, easeInOutCubic} from './tokens';

export const SRC_W = 2160;
export const SRC_H = 3840;

/** Reencuadre sobre el original 2160×3840. z=1 → ancho completo. (px,py) = punto del original que cae en (ax,ay) de la salida. */
export type Cam = {z: number; px: number; py: number; ax: number; ay: number};
export type Rect = {x: number; y: number; w: number; h: number};

export const camXform = (c: Cam, win: Rect = {x: 0, y: 0, w: W, h: H}) => {
  const s = (c.z * W) / SRC_W;
  let tx = c.ax - c.px * s;
  let ty = c.ay - c.py * s;
  // nunca mostrar fuera del cuadro original
  tx = clamp(tx, win.x + win.w - SRC_W * s, win.x);
  ty = clamp(ty, win.y + win.h - SRC_H * s, win.y);
  return {s, tx, ty};
};

export const lerpCam = (a: Cam, b: Cam, p: number): Cam => ({
  z: lerp(a.z, b.z, p),
  px: lerp(a.px, b.px, p),
  py: lerp(a.py, b.py, p),
  ax: lerp(a.ax, b.ax, p),
  ay: lerp(a.ay, b.ay, p),
});

// Posiciones de las caras en el original (px de 2160×3840, medidas sobre los cuadros).
//   Lu (izquierda): x≈300–350, y≈1930 · Entrevistadora (derecha): x≈1700–1860, y≈1880–1950
const LU = {px: 320, py: 1935};
const INT = {px: 1800, py: 1900};

export const SHOTS: Record<string, Cam> = {
  // Lu en primer plano; cara baja para dejar la pared (blanca) al titular
  luA: {z: 1.55, ...LU, ax: 360, ay: 1170},
  luB: {z: 1.42, ...LU, ax: 350, ay: 1260},
  luC: {z: 1.7, px: 360, py: 1940, ax: 350, ay: 1200},
  intCU: {z: 1.55, ...INT, ax: 690, ay: 1200},
  // dos personas
  wide: {z: 1.12, px: 1000, py: 1930, ax: 540, ay: 1085},
  frontal: {z: 1.0, px: 1080, py: 1920, ax: 540, ay: 960},
};

/** Ventana (marco) del video: pantalla completa o arco del cierre. */
export const FULL: Rect = {x: 0, y: 0, w: W, h: H};
export const ARC: Rect = {x: 150, y: 790, w: 780, h: 560};
export const ease = easeInOutCubic;

export const ARC_CAM = (ax: number, ay: number, z = 0.8): Cam => ({z, px: 1005, py: 1600, ax, ay});

export const closeCam = (t: number, tAdm: number): {cam: Cam; win: Rect; rTop: number; p: number} => {
  const p = ease(clamp((t - (tAdm - 0.1)) / 0.95));
  const win: Rect = {x: lerp(0, ARC.x, p), y: lerp(0, ARC.y, p), w: lerp(W, ARC.w, p), h: lerp(H, ARC.h, p)};
  const target: Cam = ARC_CAM(ARC.x + ARC.w / 2, ARC.y + 0.5 * ARC.h);
  return {cam: lerpCam(SHOTS.frontal, target, p), win, rTop: lerp(0, ARC.w / 2, p), p};
};
