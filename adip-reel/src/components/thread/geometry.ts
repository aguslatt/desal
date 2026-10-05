import { Easing, interpolate } from "remotion";
import { COLORS } from "../../config/brand.ts";
import { CURSOR, THREAD, W } from "../../config/layout.ts";
import { CHAT_FADE, THREAD_TIMING } from "../../config/timeline.ts";

/**
 * Hilo gráfico — geometría y ritmo. Módulo PURO (solo remotion/interpolate): todo sale de
 * layout.ts (carriles, grosor, cursor), timeline.ts (hitos) y brand.ts (color).
 *
 * Una única "cinta" (trazo de extremos redondeados) cuenta toda la historia:
 *   nace  (bornFrom → bornTo)   barra del cursor 8×64 → se acuesta → crece a ambos lados hasta x 120–960
 *   vive  escena 3 (y = lanes.s3), con un destello de luz lento que la recorre
 *   baja  (descendFrom → descendTo)  a lanes.s4, en S suave (el extremo izquierdo guía)
 *   vive  escena 4 (y = lanes.s4)
 *   sube  (riseFrom → riseTo)   a lanes.s5
 *   llega (arriveFrom → arriveTo) se recoge hacia x = 540 y queda como un trazo corto, ESTÁTICO, sobre el logo
 */
export type Pt = readonly [number, number];

/** Posición del cursor del 3.er mensaje (getFinalCursorAnchor): borde izquierdo de la barra y centro vertical. */
export type CursorAnchor = { readonly left: number; readonly cy: number };

export type ThreadShape = {
  /** Vértices de la cinta (polilínea; los extremos se redondean con stroke-linecap). */
  readonly points: readonly Pt[];
  /** Grosor del trazo (px). */
  readonly width: number;
};

const { bornFrom, bornTo, descendFrom, descendTo, riseFrom, riseTo, arriveFrom, arriveTo } = THREAD_TIMING;

export const CENTER_X = W / 2;

/** Ritmo interno (fotogramas) y medidas del diseño; todo derivado de los hitos de THREAD_TIMING. */
export const MOTION = {
  /** la barra se acuesta (gira 90°) */
  tipFrames: 14,
  /** el grosor pasa de CURSOR.w (8) a THREAD.thickness (6) */
  tipWidthFrames: 24,
  /** el extremo derecho sale un instante después de que la barra empieza a acostarse */
  reachRightDelay: 8,
  /** el extremo izquierdo espera a que el texto del campo (que se desvanece hasta CHAT_FADE.to) ya no se vea */
  reachLeftFrom: CHAT_FADE.to - 3,
  /** desfase (fotogramas) entre el extremo izquierdo y el derecho al bajar / subir: arma la S suave */
  descendSkew: 4,
  riseSkew: 4,
  /** longitud visible (px, con extremos) del trazo final sobre el logo */
  dashLength: 120,
  /**
   * altura (y) final del trazo: baja unos px desde el carril s5 hasta el punto medio entre el mensaje
   * (zona hasta y 724) y el logo (y 884): queda a ~80 px de cada uno, apoyado sobre el logo y sin tocarlo.
   */
  dashLane: 802,
  /** destello: ancho de media banda (px) y duración del recorrido */
  shadowMax: 0.28,
  glintHalfWidth: 130,
  glintFrames: 100,
} as const;

/** Destellos lentos: uno en la escena 3 y otro en la escena 4 (siempre sobre la línea quieta). */
/** Opacidad de la sombra del trazo: nace con la barra (0 en CURSOR_HANDOFF) y asienta en `tipWidthFrames`. */
export const shadowAlpha = (f: number): number =>
  interpolate(f, [bornFrom, bornFrom + MOTION.tipWidthFrames], [0, MOTION.shadowMax], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const GLINTS = [
  { from: bornTo + 36, to: bornTo + 36 + MOTION.glintFrames },
  { from: descendTo + 40, to: descendTo + 40 + MOTION.glintFrames },
] as const;

const EASE = {
  tip: Easing.bezier(0.5, 0, 0.2, 1),
  reach: Easing.bezier(0.22, 1, 0.36, 1),
  /** arranque lento: deja salir el texto de la escena 3 antes de que la línea entre en su zona */
  descend: Easing.bezier(0.4, 0, 0.4, 1),
  rise: Easing.bezier(0.4, 0, 0.4, 1),
  arrive: Easing.bezier(0.5, 0, 0.1, 1),
  glint: Easing.bezier(0.45, 0, 0.55, 1),
} as const;

const prog = (f: number, a: number, b: number, easing: (t: number) => number): number =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Altura (y) de la línea en la columna `x` en el fotograma absoluto `f` (carriles + S de bajada/subida). */
export const laneY = (x: number, f: number): number => {
  const k = clamp01((x - THREAD.x0) / (THREAD.x1 - THREAD.x0));
  const down = prog(f, descendFrom + k * MOTION.descendSkew, descendTo - (1 - k) * MOTION.descendSkew, EASE.descend);
  const up = prog(f, riseFrom + k * MOTION.riseSkew, riseTo - (1 - k) * MOTION.riseSkew, EASE.rise);
  return THREAD.lanes.s3 + (THREAD.lanes.s4 - THREAD.lanes.s3) * down + (THREAD.lanes.s5 - THREAD.lanes.s4) * up;
};

/** Forma de la cinta en el fotograma absoluto `f`; null si todavía no existe (antes de CURSOR_HANDOFF). */
export const threadShape = (f: number, anchor: CursorAnchor, thickness: number = THREAD.thickness): ThreadShape | null => {
  if (f < bornFrom) return null;
  const R = thickness / 2;
  // El cursor de la escena 2 es un <div>: el navegador ajusta su borde izquierdo al píxel entero. Para que el
  // traspaso sea idéntico (sin medio píxel de diferencia en los bordes) se usa el mismo borde redondeado.
  const cx = Math.round(anchor.left) + CURSOR.w / 2;
  const cy = anchor.cy;

  // ── Nacimiento: la barra del cursor (8×64) se acuesta y crece hacia ambos lados ───────────────
  if (f < bornTo) {
    const half = (CURSOR.h - CURSOR.w) / 2; // 28: distancia del centro a cada extremo (sin los remates redondos)
    const tip = prog(f, bornFrom, bornFrom + MOTION.tipFrames, EASE.tip);
    const phi = (tip * Math.PI) / 2; // gira "hacia atrás": el extremo superior va hacia la izquierda, donde no hay tinta
    const mid = cx + half * tip; // al terminar de girar, el borde izquierdo de la barra sigue en el del cursor
    const reachRight = prog(f, bornFrom + MOTION.reachRightDelay, bornTo, EASE.reach);
    const reachLeft = prog(f, MOTION.reachLeftFrom, bornTo, EASE.reach);
    const settle = prog(f, bornFrom, bornTo, EASE.reach);
    const dy = (THREAD.lanes.s3 - cy) * settle;
    const topX = mid - half * Math.sin(phi) - reachLeft * (cx - (THREAD.x0 + R));
    const botX = mid + half * Math.sin(phi) + reachRight * (THREAD.x1 - R - (cx + 2 * half));
    return {
      points: [
        [topX, cy - half * Math.cos(phi) + dy],
        [botX, cy + half * Math.cos(phi) + dy],
      ],
      width: lerp(CURSOR.w, thickness, prog(f, bornFrom, bornFrom + MOTION.tipWidthFrames, EASE.tip)),
    };
  }

  // ── Vida: extremos (se recogen al llegar al cierre) + curva en y ──────────────────────────────
  const arrive = prog(f, arriveFrom, arriveTo, EASE.arrive);
  const xa = lerp(THREAD.x0 + R, CENTER_X - MOTION.dashLength / 2 + R, arrive);
  const xb = lerp(THREAD.x1 - R, CENTER_X + MOTION.dashLength / 2 - R, arrive);
  const settle = arrive * (MOTION.dashLane - THREAD.lanes.s5);
  const moving = (f > descendFrom && f < descendTo) || (f > riseFrom && f < riseTo);
  if (!moving) {
    const y = laneY(CENTER_X, f) + settle;
    return { points: [[xa, y], [xb, y]], width: thickness };
  }
  const n = Math.max(2, Math.ceil((xb - xa) / 6) + 1);
  const points: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const x = lerp(xa, xb, i / (n - 1));
    points.push([x, laneY(x, f) + settle]);
  }
  return { points, width: thickness };
};

export const pathData = (points: readonly Pt[]): string =>
  points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");

// ── Color y destello ─────────────────────────────────────────────────────────────────────────────
const hexToRgb = (hex: string): readonly [number, number, number] => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

/** Mezcla `a` → `b` (t 0–1) en RGB; devuelve #RRGGBB. */
export const mixHex = (a: string, b: string, t: number): string => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = (i: number) => Math.round(lerp(A[i], B[i], t)).toString(16).padStart(2, "0");
  return `#${c(0)}${c(1)}${c(2)}`;
};

/** Color del punto más luminoso del destello: el naranja virando al amarillo oficial (sigue siendo cálido y saturado). */
export const glintColor = (base: string): string => mixHex(base, COLORS.yellow, 0.6);

export type GlintStop = { readonly offset: number; readonly color: string };

/**
 * Paradas del degradado (userSpaceOnUse, x 0 → W) del destello activo en `f`, o null si no hay ninguno.
 * La banda recorre la línea de izquierda a derecha con perfil cos² (sin bordes duros).
 */
export const glintStops = (f: number, base: string): readonly GlintStop[] | null => {
  const g = GLINTS.find((w) => f >= w.from && f <= w.to);
  if (!g) return null;
  const hw = MOTION.glintHalfWidth;
  const center = lerp(THREAD.x0 - hw, THREAD.x1 + hw, prog(f, g.from, g.to, EASE.glint));
  const peak = glintColor(base);
  const stops: GlintStop[] = [];
  for (let k = -3; k <= 3; k++) {
    const intensity = Math.pow(Math.cos(((Math.PI / 2) * k) / 3), 2);
    stops.push({ offset: clamp01((center + (k * hw) / 3) / W), color: mixHex(base, peak, intensity) });
  }
  return stops;
};
