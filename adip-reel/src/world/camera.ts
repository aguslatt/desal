import { Easing } from "remotion";
import { CAMERA_TIMING } from "../config/timeline.ts";
import type { CameraState } from "./cameraContext.ts";
import { CHAT_SCALE, FINAL_VIEW, HOLD_VIEW, PHONE_AT, WIDE_VIEW } from "./stage.ts";

/**
 * CÁMARA CONTINUA del mundo. Función PURA: `cameraAt(frame)` → { scale, cx, cy } (pantalla = (mundo − c)·scale + (540, 960)).
 *
 *  S1  f0 → f96     «persona + celular» (scale 1,22) → la pantalla del celular llena EXACTAMENTE el encuadre
 *                    (scale = 1/PHONE_SCALE, centro = centro de la pantalla). Acercamiento «rápido y suave» en DOS tiempos: hasta
 *                    ≈ f76 la persona casi no se mueve (una deriva de ≈ 7 % de escala: el gancho se lee con la escena quieta) y recién cuando el
 *                    gancho salió (HOOK_TIMING.exitTo = f80; la coronilla cruza y 650 en f81) el zoom acelera (pico ≈ f86) y aterriza con
 *                    suavidad en f96 (ver `ZOOM_IN_CURVE`).
 *  S2  f96 → f428   chat fijo (primer plano).
 *  S3  f428 → f512  la cámara se aleja hasta el encuadre «persona + celular + aire» (el hilo rodea a la persona).
 *      f512 → f612  encuadre fijo.
 *  S4  f612 → f716  se amplía de 0,85× a 0,575× (WIDE_VIEW, en stage.ts) SIN alejarse demasiado: la protagonista, el banco y la amiga que llega
 *                    quedan hacia el centro vertical de la pantalla (suelo en y ≈ 1100; el grupo ocupa y 595–1163) y la franja de texto, libre.
 *      f716 → f768  empuje MUY sutil (+8,7 %: 0,575× → 0,625×, HOLD_VIEW; `CAMERA_TIMING.pushFrom/pushTo`) hacia el par mientras la amiga
 *                    se sienta y ofrece la mano; el encuadre sube ≈ 90 px (el grupo deja lugar a la firma: desde f772 el logo aparece en
 *                    y ≥ 1120). Termina quieto (el gesto, el texto y el logo se leen).
 *      f768 → f790  encuadre fijo.
 *  S5  f790 → f842  se abre al encuadre FINAL 0,30× (FINAL_VIEW) con el mismo pivote (el grupo casi no se desplaza: solo se aleja):
 *                    se revelan las demás personas (ya dibujadas antes de entrar a cuadro); el logo ya está abajo.
 *  S6  f842 → fin   fija.
 *
 * Los movimientos de zoom son «dolly»: la escala se interpola en el espacio logarítmico (el zoom se siente de velocidad
 * constante) y el centro sigue un PIVOTE fijo (los objetos se expanden desde un mismo punto, como un acercamiento real),
 * con una leve curva de trayectoria lateral (`bulge`, en px de pantalla). Sin rebotes: solo easings de entrada/salida suaves.
 */
export type CameraKey = CameraState;

export const CAMERA_KEYS = {
  /**
   * S1: persona + celular en el banco, algo más cerca que antes (scale 1,22) para que el celular y su pantalla («Amiga», «¿Cómo estás?»)
   * se reconozcan desde el f0. La coronilla (mundo y ≈ 698) queda en y ≈ 770 de pantalla: la franja del gancho (230–650) está libre.
   */
  s1: { scale: 1.22, cx: 600, cy: 855 },
  /** S2: la pantalla del celular llena el encuadre. NO TOCAR: scale = 1/PHONE_SCALE, centro = centro de la pantalla. */
  chat: { scale: CHAT_SCALE, cx: PHONE_AT[0], cy: PHONE_AT[1] },
  /** S3 (fin) – persona + celular con aire para el hilo y para el texto de arriba. */
  person: { scale: 0.85, cx: 700, cy: 905 },
  /** S4: se amplía (la protagonista, el banco y la amiga que llega, con aire); ver stage.ts. */
  wide: WIDE_VIEW,
  /** S4 (gesto): encuadre del empuje sutil, +8,7 % sobre `wide`; es el último encuadre antes de abrir al final. */
  hold: HOLD_VIEW,
  /** S5/S6: encuadre final (personas de 220–280 px de alto con aire); ver stage.ts. */
  final: FINAL_VIEW,
} as const satisfies Record<string, CameraKey>;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Curva de progreso (en el espacio logarítmico del zoom) del acercamiento S1: puntos (fotograma local 0…96, progreso 0…1) unidos con una
 * spline monótona (PCHIP: sin rebotes ni sobreimpulsos, derivada continua).
 *  · f0 → f72: deriva lenta (≈ 6 % del recorrido): la persona está casi quieta mientras se lee el gancho completo;
 *  · f72 → f80: el gancho se está yendo (HOOK_TIMING.exitFrom → exitTo): el dibujo apenas empieza a subir;
 *  · f80 → f96: el zoom acelera (pico ≈ f86) y aterriza sin golpe: la pantalla llena el encuadre EXACTO en f96.
 */
export const ZOOM_IN_CURVE: readonly (readonly [number, number])[] = [
  [0, 0],
  [24, 0.01],
  [48, 0.028],
  [72, 0.06],
  [80, 0.108],
  [83, 0.24],
  [86, 0.48],
  [89, 0.72],
  [92, 0.9],
  [94, 0.972],
  [96, 1],
];

/** Spline cúbica monótona (Fritsch–Carlson) por puntos (x creciente): devuelve f(x), con extremos fijos. */
const pchip = (pts: readonly (readonly [number, number])[]): ((x: number) => number) => {
  const n = pts.length;
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(pts[i + 1][0] - pts[i][0]);
    d.push((pts[i + 1][1] - pts[i][1]) / h[i]);
  }
  const m: number[] = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  return (x: number): number => {
    if (x <= pts[0][0]) return pts[0][1];
    if (x >= pts[n - 1][0]) return pts[n - 1][1];
    let i = 0;
    while (i < n - 2 && x > pts[i + 1][0]) i++;
    const t = (x - pts[i][0]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * pts[i][1] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * pts[i + 1][1] + (t3 - t2) * h[i] * m[i + 1];
  };
};

const zoomInSpline = pchip(ZOOM_IN_CURVE);

/** Easings de cada tramo (todos con entrada y salida suaves; ninguno rebota). */
const EASE = {
  /** el acercamiento arranca en calma (el gancho se lee con la persona casi quieta), acelera cuando el gancho ya salió y aterriza con suavidad */
  zoomIn: (t: number): number => zoomInSpline(clamp01(t) * (CAMERA_TIMING.zoomInTo - CAMERA_TIMING.zoomInFrom)),
  pullOut: Easing.bezier(0.42, 0, 0.2, 1),
  widen: Easing.bezier(0.45, 0, 0.2, 1),
  /** el empuje del gesto: entra y sale despacio (casi imperceptible al comienzo) */
  push: Easing.bezier(0.5, 0, 0.3, 1),
  final: Easing.bezier(0.4, 0, 0.3, 1),
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
  { from: CAMERA_TIMING.zoomInFrom, to: CAMERA_TIMING.zoomInTo, a: CAMERA_KEYS.s1, b: CAMERA_KEYS.chat, ease: EASE.zoomIn, bulge: 20 },
  { from: CAMERA_TIMING.pullOutFrom, to: CAMERA_TIMING.pullOutTo, a: CAMERA_KEYS.chat, b: CAMERA_KEYS.person, ease: EASE.pullOut, bulge: -20 },
  { from: CAMERA_TIMING.widenFrom, to: CAMERA_TIMING.widenTo, a: CAMERA_KEYS.person, b: CAMERA_KEYS.wide, ease: EASE.widen, bulge: 0 },
  { from: CAMERA_TIMING.pushFrom, to: CAMERA_TIMING.pushTo, a: CAMERA_KEYS.wide, b: CAMERA_KEYS.hold, ease: EASE.push, bulge: 0 },
  { from: CAMERA_TIMING.finalFrom, to: CAMERA_TIMING.finalTo, a: CAMERA_KEYS.hold, b: CAMERA_KEYS.final, ease: EASE.final, bulge: 0 },
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
