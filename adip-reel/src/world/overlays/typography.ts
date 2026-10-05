import { measureText } from "@remotion/layout-utils";
import { Easing, interpolate } from "remotion";
import { FONT } from "../../config/brand.ts";
import { TEXT_ZONES } from "../../config/layout.ts";

/**
 * Tipografía y composición de los textos de pantalla (capa «Overlays»).
 * Todo en Montserrat; las líneas se colocan por LÍNEA BASE (no por caja), así cada pieza queda centrada
 * en su franja con la métrica real de la fuente (medida en el navegador: ver `MONT`).
 */

/** Métricas de Montserrat (em), medidas con canvas a 1000 px: ascenso/descenso de caja y altura de glifos. */
export const MONT = {
  ascent: 0.968,
  descent: 0.251,
  xHeight: 0.547,
  cap: 0.703,
  /** ascendentes (l, d, b, í) */
  ascender: 0.75,
  /** descendentes (p, q, y) */
  descender: 0.203,
} as const;

/** Distancia del borde superior de una caja de línea (alto `lineHeight`) a su línea base. */
export const baselineIn = (fontSize: number, lineHeight: number): number =>
  (lineHeight - (MONT.ascent + MONT.descent) * fontSize) / 2 + MONT.ascent * fontSize;

/**
 * Ancho de un texto con Montserrat REAL (@remotion/layout-utils). Si la fuente todavía no se cargó
 * devuelve una estimación (y no se memoriza nada): el siguiente fotograma ya mide bien.
 */
export const measureWidth = (text: string, fontSize: number, fontWeight: number): number => {
  try {
    return measureText({ text, fontFamily: FONT.family, fontSize, fontWeight, validateFontIsLoaded: true }).width;
  } catch {
    return text.length * fontSize * 0.6;
  }
};

/** Especificación tipográfica de cada pieza (tamaños en px; `step` = distancia entre líneas base). */
export const TYPE = {
  hook: { size: 80, weight: 600, step: 100 },
  turn: { size: 80, weight: 700, step: 96, pairGap: 28 },
  companion: { size: 64, weight: 600, step: 78 },
  signature: { size: 60, weight: 600, step: 74 },
  closing: { size: 58, weight: 600, step: 72 },
  date: { size: 64, weight: 700, step: 64 },
  campaign: { size: 52, weight: 500, step: 0 },
} as const;

/** Alto de la caja de línea que se usa para todas las piezas (múltiplo de la altura de la fuente). */
export const lineBoxHeight = (fontSize: number): number => Math.round(fontSize * 1.3);

/**
 * Líneas base de un bloque de `n` líneas CENTRADO (por su tinta: ascendente de la primera línea a descendente
 * de la última) en una franja vertical. `gapAfter[i]` agrega aire extra tras la línea i.
 */
export const stackBaselines = (opts: {
  readonly n: number;
  readonly fontSize: number;
  readonly step: number;
  readonly zone: { readonly y0: number; readonly y1: number };
  readonly gapAfter?: readonly number[];
  /** si la última línea no tiene descendentes (p, q, y…) */
  readonly lastDescender?: boolean;
}): { baselines: number[]; inkTop: number; inkBottom: number } => {
  const { n, fontSize, step, zone, gapAfter = [], lastDescender = true } = opts;
  const offs: number[] = [0];
  for (let i = 1; i < n; i++) offs.push(offs[i - 1] + step + (gapAfter[i - 1] ?? 0));
  const asc = MONT.ascender * fontSize;
  const desc = lastDescender ? MONT.descender * fontSize : 0;
  const height = asc + offs[n - 1] + desc;
  const center = (zone.y0 + zone.y1) / 2;
  const inkTop = center - height / 2;
  const first = inkTop + asc;
  return { baselines: offs.map((o) => first + o), inkTop, inkBottom: inkTop + height };
};

/** Extensión vertical (y de pantalla) que ocupa la tinta de cada pieza: para que el mundo deje el aire necesario. */
const turnLayout = stackBaselines({ n: 4, fontSize: TYPE.turn.size, step: TYPE.turn.step, gapAfter: [0, TYPE.turn.pairGap, 0], zone: TEXT_ZONES.big });
const hookLayout = stackBaselines({ n: 3, fontSize: TYPE.hook.size, step: TYPE.hook.step, zone: TEXT_ZONES.big });
const companionLayout = stackBaselines({ n: 2, fontSize: TYPE.companion.size, step: TYPE.companion.step, zone: TEXT_ZONES.message });
const signatureLayout = stackBaselines({ n: 2, fontSize: TYPE.signature.size, step: TYPE.signature.step, zone: TEXT_ZONES.message });
const closingLayout = stackBaselines({ n: 2, fontSize: TYPE.closing.size, step: TYPE.closing.step, zone: TEXT_ZONES.message });

export const TEXT_EXTENTS = {
  hook: { y0: hookLayout.inkTop, y1: hookLayout.inkBottom },
  turn: { y0: turnLayout.inkTop, y1: turnLayout.inkBottom },
  companion: { y0: companionLayout.inkTop, y1: companionLayout.inkBottom },
  signature: { y0: signatureLayout.inkTop, y1: signatureLayout.inkBottom },
  closing: { y0: closingLayout.inkTop, y1: closingLayout.inkBottom },
} as const;

// ───────────────────────── Animación (solo fotogramas) ─────────────────────────

/** Entrada suave sin rebote (salida rápida, asentamiento largo). */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
/** Salidas y fundidos simétricos. */
export const EASE_IO = Easing.bezier(0.45, 0, 0.55, 1);
/** Trazo a mano: arranca decidido y se afloja al final. */
export const EASE_DRAW = Easing.bezier(0.3, 0.1, 0.25, 1);

/** Progreso 0..1 de `frame` entre `from` y `to` con `easing`. */
export const prog = (frame: number, from: number, to: number, easing: (t: number) => number = EASE_OUT): number =>
  interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
