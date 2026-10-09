import { Easing } from "remotion";
import { COLORS } from "../config/brand.ts";
import { H, W } from "../config/layout.ts";
import { REPLY_BUBBLE, REPLY_TEXT } from "../chat/geometry.ts";
import { TURN_LAYOUT, LOGO_MOVE_EASING, LOGO_PLACEMENT, logoBox, type LogoPlacement, type TextExtent } from "../text/layout.ts";
import { mulberry32 } from "../lib/rng.ts";
import { makeOpenCurve } from "../illustration/curve.tsx";
import { catmullRom, type Pt } from "../illustration/geom.ts";

/**
 * GEOMETRÍA DEL MONTAJE (v3) — módulo PURO (sin React): composición vertical de S3–S6, la expansión/retirada del naranja y la
 * trayectoria del hilo. Coordenadas de pantalla 1080×1920. Los TIEMPOS salen de src/config/timeline.ts (no hay tiempos aquí:
 * solo geometría y acabado de movimiento).
 *
 *  S4  texto arriba (y 240) · pareja en la banda baja (suelo 1560) · hilo naranja que entra por el borde derecho
 *  S5  firma (y 240–652) · LOGO grande (x 120, y 712) · pareja debajo; el hilo pasa a ≥ 40 px del logo y baja entre las dos personas
 *  S6  el conjunto [logo + pareja + hilo] SUBE `S6_LIFT` px (cámara vertical uniforme: no cambia ningún tamaño) para que entren
 *      el mensaje arriba y la fecha abajo: mensaje · logo · pareja · fecha, estático desde CLOSING_TIMING.allVisible.
 */

// ───────────────────────── pareja y logo
/** Colocación de la pareja de escucha (escala 1 en todo el reel: las figuras NUNCA cambian de tamaño). */
export const PAIR_PLACE = { x: 540, y: 1560, scale: 1 } as const;

/** Elevación (px) del conjunto logo + pareja + hilo entre S5 y S6 (THREAD_TIMING.settleFrom → settleTo). */
export const S6_LIFT = 176;

/** Ancho del logo en S5/S6 (≤ 734: el PNG oficial no se amplía). 700 deja pasar el hilo entre el logo y la cabeza de B con ≥ 40 px. */
export const LOGO_WIDTH = 700;
export const LOGO_S5: LogoPlacement = { left: LOGO_PLACEMENT.s5.left, top: LOGO_PLACEMENT.s5.top, width: LOGO_WIDTH };
export const LOGO_S6: LogoPlacement = { left: LOGO_S5.left, top: LOGO_S5.top - S6_LIFT, width: LOGO_WIDTH };

/** Mismo easing para el logo, la pareja y el hilo al subir: se mueven como un solo cuerpo. */
export const LIFT_EASING = LOGO_MOVE_EASING;

/** Cajas (pantalla) que el hilo no puede tocar en S5 (con aire de 40 px se verifica con curveClearance). */
export const LOGO_BOX_S5 = (() => {
  const b = logoBox(LOGO_S5);
  return { x0: b.left, y0: b.top, x1: b.right, y1: b.bottom };
})();

// ───────────────────────── texto del giro (S3): conserva la posición de la respuesta
/** y del bloque «Podés empezar / por ahí.»: la MISMA que la del texto de la respuesta del chat (REPLY_TEXT.y). */
export const TURN_Y = REPLY_TEXT.y;
export const TURN_DY = TURN_Y - TURN_LAYOUT.y;

/** Desplaza un bloque de texto en vertical (cajas de línea, línea base, tinta). */
export const shiftExtent = (e: TextExtent, dy: number): TextExtent => ({
  ...e,
  y: e.y + dy,
  lines: e.lines.map((l) => ({ ...l, y: l.y + dy, baseline: l.baseline + dy })),
  ink: { top: e.ink.top + dy, bottom: e.ink.bottom + dy },
});

// ───────────────────────── naranja: de la burbuja a la pantalla, y la retirada
export type Radii = readonly [number, number, number, number];
export type RoundRect = { x0: number; y0: number; x1: number; y1: number; r: Radii };

export const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

/** Rectángulo redondeado como path (radios tl, tr, br, bl; se limitan a la mitad del lado menor). */
export const roundedRectPath = (b: RoundRect): string => {
  const w = b.x1 - b.x0;
  const h = b.y1 - b.y0;
  const m = Math.min(w, h) / 2;
  const [tl, tr, br, bl] = b.r.map((v) => Math.max(0, Math.min(v, m)));
  const f = (v: number) => Math.round(v * 100) / 100;
  return (
    `M${f(b.x0 + tl)} ${f(b.y0)}H${f(b.x1 - tr)}A${f(tr)} ${f(tr)} 0 0 1 ${f(b.x1)} ${f(b.y0 + tr)}` +
    `V${f(b.y1 - br)}A${f(br)} ${f(br)} 0 0 1 ${f(b.x1 - br)} ${f(b.y1)}` +
    `H${f(b.x0 + bl)}A${f(bl)} ${f(bl)} 0 0 1 ${f(b.x0)} ${f(b.y1 - bl)}` +
    `V${f(b.y0 + tl)}A${f(tl)} ${f(tl)} 0 0 1 ${f(b.x0 + tl)} ${f(b.y0)}Z`
  );
};

/** La burbuja de respuesta (REPLY_BUBBLE: esquina inferior izquierda más cerrada = «cola») y el rectángulo que cubre la pantalla. */
export const BUBBLE_RECT: RoundRect = {
  x0: REPLY_BUBBLE.x,
  y0: REPLY_BUBBLE.y,
  x1: REPLY_BUBBLE.x + REPLY_BUBBLE.w,
  y1: REPLY_BUBBLE.y + REPLY_BUBBLE.h,
  r: [REPLY_BUBBLE.radius, REPLY_BUBBLE.radius, REPLY_BUBBLE.radius, REPLY_BUBBLE.tail],
};
const BIG = 240;
export const SCREEN_RECT: RoundRect = { x0: -240, y0: -240, x1: W + 240, y1: H + 240, r: [BIG, BIG, BIG, BIG] };

/** Rectángulo en la fracción `p` (0 = burbuja, 1 = pantalla completa). */
export const growRect = (p: number): RoundRect => ({
  x0: lerpN(BUBBLE_RECT.x0, SCREEN_RECT.x0, p),
  y0: lerpN(BUBBLE_RECT.y0, SCREEN_RECT.y0, p),
  x1: lerpN(BUBBLE_RECT.x1, SCREEN_RECT.x1, p),
  y1: lerpN(BUBBLE_RECT.y1, SCREEN_RECT.y1, p),
  r: [0, 1, 2, 3].map((i) => lerpN(BUBBLE_RECT.r[i], SCREEN_RECT.r[i], p)) as unknown as Radii,
});

/** Easing del crecimiento y de la retirada. */
export const GROW_EASING = Easing.bezier(0.4, 0, 0.5, 1);
export const RETREAT_EASING = Easing.bezier(0.55, 0, 0.4, 1);

/** y por donde sale el último naranja y donde nace el hilo (borde derecho). */
export const THREAD_START_Y = 540;
/** lóbulo redondeado que retiene el último naranja en THREAD_START_Y (profundidad y ancho en px) */
export const TONGUE = { depth: 250, sigma: 150, y0: THREAD_START_Y };

/** Ondulación orgánica del borde que se retira (px). Determinista. */
export const edgeWobble = (y: number): number =>
  30 * Math.sin(y / 212 + 1.3) + 17 * Math.sin(y / 97 + 0.4) + 7 * Math.sin(y / 43 + 2.1) + 3 * Math.sin(y / 19 + 0.7);

/** x del borde del naranja que se retira, en la altura `y`, cuando el borde «principal» está en `e` y la lengüeta tiene fuerza `tongue` (0..1). */
export const edgeX = (y: number, e: number, tongue: number): number => {
  const d = (y - TONGUE.y0) / TONGUE.sigma;
  return e + edgeWobble(y) - TONGUE.depth * tongue * Math.exp(-d * d);
};

/** Granos del borde (el crayón no es un corte limpio): offsets deterministas respecto del borde. */
export type Speck = { readonly y: number; readonly dx: number; readonly r: number; readonly o: number };
export const EDGE_SPECKS: readonly Speck[] = (() => {
  const rnd = mulberry32(2024);
  const out: Speck[] = [];
  for (let i = 0; i < 150; i++) {
    const y = -40 + rnd() * (H + 80);
    const dx = (rnd() - 0.62) * 150 * (0.35 + rnd());
    out.push({ y, dx, r: 1.2 + rnd() * 3.6, o: 0.55 + rnd() * 0.4 });
  }
  return out;
})();

// ───────────────────────── el hilo naranja (una sola curva abierta)
/**
 * Control de la curva (coordenadas de pantalla de S5, ANTES de subir en S6):
 *  1) NACE en el borde derecho donde se va el último naranja (THREAD_START_Y);
 *  2) baja en un gran barrido, rodea por fuera la esquina del logo (≥ 40 px), pasa por encima de la cabeza de B y llega al hueco
 *     entre las dos personas (índice GAP_INDEX: acá termina la conexión de S4);
 *  3) en S5 (THREAD_TIMING.logoFrom → logoTo) completa el descenso entre las dos manos, sin tocar a nadie.
 */
export const THREAD_POINTS: readonly Pt[] = [
  [1108, 528],
  [1076, 544],
  [1030, 596],
  [986, 664],
  [954, 744],
  [928, 828],
  [904, 912],
  [882, 990],
  [868, 1052],
  [826, 1082],
  [770, 1088],
  [716, 1086],
  [654, 1094],
  [596, 1112],
  [556, 1142],
  [520, 1190],
  [490, 1248],
  [452, 1316],
];
/** índice del punto de control donde se detiene la conexión de S4 (hueco entre las dos cabezas) */
export const GAP_INDEX = 14;

/** Fracción de longitud de arco de la curva completa donde está el punto de control `i` (para animar por tramos). */
export const progressAtControl = (points: readonly Pt[], i: number): number => {
  const geo = makeOpenCurve(points);
  const target = points[i];
  const dense = geo.points;
  let best = 0;
  let bd = Infinity;
  for (let k = 0; k < dense.length; k++) {
    const d = Math.hypot(dense[k][0] - target[0], dense[k][1] - target[1]);
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  // longitud acumulada hasta la muestra más cercana
  let acc = 0;
  for (let k = 1; k <= best; k++) acc += Math.hypot(dense[k][0] - dense[k - 1][0], dense[k][1] - dense[k - 1][1]);
  return acc / geo.length;
};

export const THREAD_GAP_PROGRESS = progressAtControl(THREAD_POINTS, GAP_INDEX);

/** Muestras densas del eje (para medir holguras). */
export const threadDense = (): Pt[] => catmullRom(THREAD_POINTS, 4);

export const ORANGE = COLORS.orange;
