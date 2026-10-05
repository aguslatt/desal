import { Easing } from "remotion";
import { CAMERA_TIMING } from "../config/timeline.ts";
import type { CameraState } from "./cameraContext.ts";
import { CHAT_SCALE, FINAL_VIEW, PHONE_AT, WIDE_VIEW } from "./stage.ts";

/**
 * CÁMARA CONTINUA del mundo. Función PURA: `cameraAt(frame)` → { scale, cx, cy } (pantalla = (mundo − c)·scale + (540, 960)).
 *
 *  S1  f0 → f96     «persona + celular» (scale 1) → la pantalla del celular llena EXACTAMENTE el encuadre
 *                    (scale = 1/PHONE_SCALE, centro = centro de la pantalla). Acercamiento rápido y suave.
 *  S2  f96 → f428   chat fijo (primer plano).
 *  S3  f428 → f512  la cámara se aleja hasta el encuadre «persona + celular + aire» (el hilo rodea a la persona).
 *      f512 → f612  encuadre fijo.
 *  S4  f612 → f716  se amplía (≈ 0,45×).        ← WORLD-B ajusta CAMERA_KEYS.wide
 *  S5  f790 → f842  encuadre final (≈ 0,30×).   ← WORLD-B ajusta CAMERA_KEYS.final
 *
 * Los movimientos de zoom son «dolly»: la escala se interpola en el espacio logarítmico (el zoom se siente de velocidad
 * constante) y el centro sigue un PIVOTE fijo (los objetos se expanden desde un mismo punto, como un acercamiento real),
 * con una leve curva de trayectoria lateral (`bulge`, en px de pantalla). Sin rebotes: solo easings de entrada/salida suaves.
 */
export type CameraKey = CameraState;

export const CAMERA_KEYS = {
  /** S1: persona + celular en el banco. El banco entero cabe (251–1051) con el celular algo a la izquierda del eje. */
  s1: { scale: 1, cx: 600, cy: 900 },
  /** S2: la pantalla del celular llena el encuadre. NO TOCAR: scale = 1/PHONE_SCALE, centro = centro de la pantalla. */
  chat: { scale: CHAT_SCALE, cx: PHONE_AT[0], cy: PHONE_AT[1] },
  /** S3 (fin) – persona + celular con aire para el hilo y para el texto de arriba. */
  person: { scale: 0.85, cx: 700, cy: 905 },
  /** S4: se amplía (aparecen los demás). */
  wide: WIDE_VIEW,
  /** S5/S6: encuadre final (personas de 220–280 px de alto con aire). */
  final: FINAL_VIEW,
} as const satisfies Record<string, CameraKey>;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Easings de cada tramo (todos con entrada y salida suaves; ninguno rebota). */
const EASE = {
  /** el acercamiento arranca despacio (≈ 1 s para leer «persona + celular» y el gancho), acelera y aterriza con suavidad */
  zoomIn: Easing.bezier(0.65, 0, 0.2, 1),
  pullOut: Easing.bezier(0.42, 0, 0.2, 1),
  widen: Easing.bezier(0.45, 0, 0.2, 1),
  final: Easing.bezier(0.45, 0, 0.25, 1),
} as const;

type Move = { readonly from: number; readonly to: number; readonly a: CameraKey; readonly b: CameraKey; readonly ease: (t: number) => number; readonly bulge: number };

/** Interpola entre dos encuadres con pivote fijo (dolly) y curva de trayectoria. */
const dolly = (a: CameraKey, b: CameraKey, t: number, ease: (t: number) => number, bulge: number): CameraKey => {
  const e = ease(clamp01(t));
  const scale = Math.exp(lerp(Math.log(a.scale), Math.log(b.scale), e));
  let cx: number;
  let cy: number;
  const ds = b.scale - a.scale;
  if (Math.abs(ds) < 1e-4) {
    cx = lerp(a.cx, b.cx, e);
    cy = lerp(a.cy, b.cy, e);
  } else {
    // pivote: el punto F del mundo que no se mueve en pantalla durante el zoom (los objetos se expanden desde F)
    const fx = (b.cx * b.scale - a.cx * a.scale) / ds;
    const fy = (b.cy * b.scale - a.cy * a.scale) / ds;
    cx = fx - (fx - a.cx) * (a.scale / scale);
    cy = fy - (fy - a.cy) * (a.scale / scale);
  }
  if (bulge) {
    // curva de trayectoria: desvío lateral que vale 0 al salir y al llegar (px de pantalla → u de mundo)
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const d = Math.hypot(dx, dy) || 1;
    const k = (Math.sin(Math.PI * e) * bulge) / scale;
    cx += (-dy / d) * k;
    cy += (dx / d) * k;
  }
  return { scale, cx, cy };
};

const MOVES: readonly Move[] = [
  { from: CAMERA_TIMING.zoomInFrom, to: CAMERA_TIMING.zoomInTo, a: CAMERA_KEYS.s1, b: CAMERA_KEYS.chat, ease: EASE.zoomIn, bulge: 26 },
  { from: CAMERA_TIMING.pullOutFrom, to: CAMERA_TIMING.pullOutTo, a: CAMERA_KEYS.chat, b: CAMERA_KEYS.person, ease: EASE.pullOut, bulge: -20 },
  { from: CAMERA_TIMING.widenFrom, to: CAMERA_TIMING.widenTo, a: CAMERA_KEYS.person, b: CAMERA_KEYS.wide, ease: EASE.widen, bulge: 0 },
  { from: CAMERA_TIMING.finalFrom, to: CAMERA_TIMING.finalTo, a: CAMERA_KEYS.wide, b: CAMERA_KEYS.final, ease: EASE.final, bulge: 0 },
];

/** Cámara en el fotograma ABSOLUTO `frame` del reel. */
export const cameraAt = (frame: number): CameraState => {
  let state: CameraKey = CAMERA_KEYS.s1;
  for (const m of MOVES) {
    if (frame < m.from) return state;
    if (frame < m.to) return dolly(m.a, m.b, (frame - m.from) / (m.to - m.from), m.ease, m.bulge);
    state = m.b;
  }
  return state;
};

/** Mundo → pantalla (px) con una cámara dada. */
export const worldToScreen = (p: readonly [number, number], cam: CameraState): [number, number] => [(p[0] - cam.cx) * cam.scale + 540, (p[1] - cam.cy) * cam.scale + 960];
/** Pantalla (px) → mundo con una cámara dada. */
export const screenToWorld = (p: readonly [number, number], cam: CameraState): [number, number] => [(p[0] - 540) / cam.scale + cam.cx, (p[1] - 960) / cam.scale + cam.cy];
