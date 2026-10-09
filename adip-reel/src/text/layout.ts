import { Easing, interpolate } from "remotion";
import { LOGO } from "../config/brand.ts";
import { COMPOSITION, SAFE, TEXT, TURN_ANCHOR } from "../config/layout.ts";
import { CLOSING, COMPANION_TEXT_LINES, SIGNATURE_BLOCKS, TURN } from "../config/script.ts";
import {
  CLOSING_TIMING,
  COMPANION_TIMING,
  SIGNATURE_TIMING,
  THREAD_TIMING,
  TOTAL_FRAMES,
  TURN_TIMING,
} from "../config/timeline.ts";
import { FONT_METRICS, TEXT_FX, TEXT_MAX_W, TEXT_STYLE, TEXT_X, baselineOffset, type TextStyleSpec } from "./style.ts";

/**
 * GEOMETRÍA DE LOS TEXTOS Y DEL LOGO (v3) — módulo PURO. Coordenadas de pantalla (1080×1920). El montaje y las curvas usan estas
 * cajas para dejar aire alrededor de los textos y del logo (`TEXT_EXTENTS`, `logoBox`, `logoClearBox`).
 * Los textos salen SIEMPRE de config/script.ts; aquí solo se deciden los cortes de línea (por cantidad de palabras) y la posición.
 */

// ───────────────────────── cortes de línea (sin retipear texto)
const byWords = (text: string, counts: readonly number[]): readonly string[] => {
  const words = text.split(" ");
  let i = 0;
  return counts.map((c) => {
    const s = words.slice(i, i + c).join(" ");
    i += c;
    return s;
  });
};

/**
 * Firma (S5): «estamos para escucharte» mide 886 px a title 68/700 (> 840), así que el bloque 1 se corta en 3 líneas
 * («En Equipo ADIP / estamos para / escucharte») y el bloque 2 conserva sus 2 líneas de guion: 5 líneas legibles, todas ≤ 840 px.
 */
export const SIGNATURE_WORD_BREAKS: readonly [readonly number[], readonly number[]] = [[3, 2, 1], [2, 3]];
export const SIGNATURE_LINES: readonly [readonly string[], readonly string[]] = [
  byWords(SIGNATURE_BLOCKS[0].text, SIGNATURE_WORD_BREAKS[0]),
  byWords(SIGNATURE_BLOCKS[1].text, SIGNATURE_WORD_BREAKS[1]),
];

/** Cierre (S6): «podés compartir este video.» mide 984 px (> 840): se parte en «podés compartir / este video.». */
export const CLOSING_LINES: readonly string[] = [CLOSING.message[0], ...byWords(CLOSING.message[1], [2, 2])];

// ───────────────────────── anchos medidos (px) con measureText de @remotion/layout-utils y Montserrat REAL cargada
/**
 * Alineados con las líneas de cada bloque. Se verifican en vivo con dev/text/verify.tsx (diferencia < 1 px). Incluyen el
 * letterSpacing del estilo. Sirven para las cajas exportadas (módulo puro: sin DOM).
 */
const MEASURED = {
  turnFirst: [716.5, 349.3],
  turnSecond: [587.2, 714.3],
  companion: [681.6, 712.6],
  signature1: [558.2, 474.1, 393.5],
  signature2: [550.2, 366.1],
  closingMessage: [834.2, 585.8, 379.3],
  closingDate: [477.5, 829.8],
} as const;
export const MEASURED_LINE_WIDTHS = MEASURED;

// ───────────────────────── cajas
export type LineBox = {
  readonly text: string;
  readonly x: number;
  /** borde superior de la caja de línea */
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** y de la línea base */
  readonly baseline: number;
  readonly size: number;
  readonly weight: number;
  readonly letterSpacing: number;
  readonly lineHeightPx: number;
};

export type Box = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

export type TextExtent = Box & {
  readonly id: string;
  /** fotogramas absolutos en que el bloque ocupa la pantalla: [from, to) (incluye la salida) */
  readonly from: number;
  readonly to: number;
  readonly lines: readonly LineBox[];
  /** tinta real aproximada (ascendente de la 1.ª línea → descendente de la última) */
  readonly ink: { readonly top: number; readonly bottom: number };
};

type LineSpec = { readonly text: string; readonly style: TextStyleSpec; readonly width: number };

const buildExtent = (
  id: string,
  x: number,
  y: number,
  from: number,
  to: number,
  specs: readonly LineSpec[],
  gaps: readonly number[] = [],
  /** em bajo la línea base de la última línea que ocupa el subrayado a mano (S3); por defecto solo los descendentes */
  inkBelowEm: number = FONT_METRICS.descender,
): TextExtent => {
  let cy = y;
  const lines: LineBox[] = specs.map((s, i) => {
    if (i > 0) cy += gaps[i - 1] ?? 0;
    const box: LineBox = {
      text: s.text,
      x,
      y: cy,
      w: s.width,
      h: s.style.lineHeightPx,
      baseline: cy + baselineOffset(s.style),
      size: s.style.size,
      weight: s.style.weight,
      letterSpacing: s.style.letterSpacing,
      lineHeightPx: s.style.lineHeightPx,
    };
    cy += s.style.lineHeightPx;
    return box;
  });
  const first = lines[0];
  const last = lines[lines.length - 1];
  return {
    id,
    x,
    y,
    w: Math.max(...lines.map((l) => l.w)),
    h: cy - y,
    from,
    to,
    lines,
    ink: { top: first.baseline - FONT_METRICS.ascender * first.size, bottom: last.baseline + inkBelowEm * last.size },
  };
};

const specsOf = (lines: readonly string[], style: TextStyleSpec, widths: readonly number[]): LineSpec[] =>
  lines.map((text, i) => ({ text, style, width: widths[i] }));

// ───────────────────────── S3 — frases del giro (display 88/800, x = 120 desde TURN_ANCHOR)
const TURN_GAP = 32;
/** el subrayado a mano de «ahí» / «empezar» llega a 0,30 em + medio trazo (0,05 em) bajo la línea base */
const UNDERLINE_BELOW_EM = 0.36;
const TURN_FIRST_Y = TURN_ANCHOR.y0;
const TURN_SECOND_Y = TURN_FIRST_Y + 2 * TEXT_STYLE.display.lineHeightPx + TURN_GAP;
const TURN_EXIT_TO = TURN_TIMING.exitFrom + TEXT_FX.exit;

const turnFirst = buildExtent("turnFirst", TURN_ANCHOR.x, TURN_FIRST_Y, TURN_TIMING.firstIn, TURN_EXIT_TO, specsOf(TURN.firstLines, TEXT_STYLE.display, MEASURED.turnFirst), [], UNDERLINE_BELOW_EM);
const turnSecond = buildExtent("turnSecond", TURN_ANCHOR.x, TURN_SECOND_Y, TURN_TIMING.secondIn, TURN_EXIT_TO, specsOf(TURN.secondLines, TEXT_STYLE.display, MEASURED.turnSecond), [], UNDERLINE_BELOW_EM);

/**
 * POSICIÓN EXACTA del bloque de frases del giro (para que el montaje alinee el texto de la respuesta «Estoy acá. / Te escucho.»
 * con la 1.ª frase durante la transición: ambas son de 2 líneas y arrancan en x = 120).
 */
export const TURN_LAYOUT = {
  x: TURN_ANCHOR.x,
  /** borde superior del bloque (= TURN_ANCHOR.y0) */
  y: TURN_FIRST_Y,
  size: TEXT_STYLE.display.size,
  weight: TEXT_STYLE.display.weight,
  lineHeight: TEXT_STYLE.display.lineHeight,
  lineHeightPx: TEXT_STYLE.display.lineHeightPx,
  letterSpacing: TEXT_STYLE.display.letterSpacing,
  color: TEXT_STYLE.display.color,
  /** distancia (px) del borde superior de una línea a su línea base */
  baselineOffset: baselineOffset(TEXT_STYLE.display),
  /** separación vertical entre la 1.ª frase y la 2.ª */
  gap: TURN_GAP,
  /** líneas de la 1.ª frase (y de cada una) y de la 2.ª */
  first: turnFirst,
  second: turnSecond,
  /** caja que abarca ambas frases */
  box: { x: TURN_ANCHOR.x, y: TURN_FIRST_Y, w: Math.max(turnFirst.w, turnSecond.w), h: TURN_SECOND_Y + turnSecond.h - TURN_FIRST_Y },
} as const;

// ───────────────────────── S4 — «No tenés que pasar por esto en soledad.» (title 68/700, franja TEXT.top)
const COMPANION_EXIT_TO = COMPANION_TIMING.textExitFrom + TEXT_FX.exit;
const companion = buildExtent("companion", TEXT_X, TEXT.top.y0, COMPANION_TIMING.textIn, COMPANION_EXIT_TO, specsOf(COMPANION_TEXT_LINES, TEXT_STYLE.title, MEASURED.companion));

// ───────────────────────── S5 — firma completa en dos bloques (title 68/700)
const SIGNATURE_BLOCK_GAP = 24;
const SIGNATURE_EXIT_TO = SIGNATURE_TIMING.exitFrom + TEXT_FX.exit;
const sig1H = SIGNATURE_LINES[0].length * TEXT_STYLE.title.lineHeightPx;
const signature1 = buildExtent("signature1", TEXT_X, TEXT.top.y0, SIGNATURE_TIMING.block1In, SIGNATURE_EXIT_TO, specsOf(SIGNATURE_LINES[0], TEXT_STYLE.title, MEASURED.signature1));
const signature2 = buildExtent("signature2", TEXT_X, TEXT.top.y0 + sig1H + SIGNATURE_BLOCK_GAP, SIGNATURE_TIMING.block2In, SIGNATURE_EXIT_TO, specsOf(SIGNATURE_LINES[1], TEXT_STYLE.title, MEASURED.signature2));

// ───────────────────────── S6 — cierre (mensaje en title; fecha en title; campaña en body)
const CLOSING_DATE_GAP = 14;
const dateH = TEXT_STYLE.title.lineHeightPx + CLOSING_DATE_GAP + TEXT_STYLE.body.lineHeightPx;
const closingMessage = buildExtent("closingMessage", TEXT_X, TEXT.top.y0, CLOSING_TIMING.messageIn, TOTAL_FRAMES, specsOf(CLOSING_LINES, TEXT_STYLE.title, MEASURED.closingMessage));
const closingDate = buildExtent(
  "closingDate",
  TEXT_X,
  COMPOSITION.s6.date.y1 - dateH,
  CLOSING_TIMING.dateIn,
  TOTAL_FRAMES,
  [
    { text: CLOSING.dateLine, style: TEXT_STYLE.title, width: MEASURED.closingDate[0] },
    { text: CLOSING.campaign, style: TEXT_STYLE.body, width: MEASURED.closingDate[1] },
  ],
  [CLOSING_DATE_GAP],
);

/** Cajas de cada bloque de texto en pantalla (con su ventana de fotogramas absolutos), para el montaje y las curvas. */
export const TEXT_EXTENTS = {
  turnFirst,
  turnSecond,
  companion,
  signature1,
  signature2,
  closingMessage,
  closingDate,
} as const;

export const TEXT_EXTENT_LIST: readonly TextExtent[] = Object.values(TEXT_EXTENTS);

export const TEXT_LAYOUT = {
  companionLines: COMPANION_TEXT_LINES,
  signatureBlockGap: SIGNATURE_BLOCK_GAP,
  closingDateGap: CLOSING_DATE_GAP,
  /** ancho máximo de línea medido: ningún renglón supera TEXT_MAX_W (840) */
  maxLineWidth: Math.max(...TEXT_EXTENT_LIST.flatMap((e) => e.lines.map((l) => l.w))),
  maxWidth: TEXT_MAX_W,
} as const;

/** Bloques visibles (entrando, quietos o saliendo) en el fotograma absoluto `frame`. */
export const textExtentsAt = (frame: number): readonly TextExtent[] => TEXT_EXTENT_LIST.filter((e) => frame >= e.from && frame < e.to);

export const padBox = (b: Box, pad: number): Box => ({ x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad });

export const unionBox = (boxes: readonly Box[]): Box => {
  const x0 = Math.min(...boxes.map((b) => b.x));
  const y0 = Math.min(...boxes.map((b) => b.y));
  const x1 = Math.max(...boxes.map((b) => b.x + b.w));
  const y1 = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

/** Caja que abarca el texto de cada escena (sin aire). */
export const SCENE_TEXT_BOX = {
  s3: TURN_LAYOUT.box,
  s4: unionBox([companion]),
  s5: unionBox([signature1, signature2]),
  s6: unionBox([closingMessage]),
  s6date: unionBox([closingDate]),
} as const;

// ───────────────────────── LOGO
export type LogoPlacement = { readonly left: number; readonly top: number; readonly width: number };
export type LogoBoxT = { readonly left: number; readonly top: number; readonly width: number; readonly height: number; readonly right: number; readonly bottom: number };

/** El PNG oficial mide 734×326: nunca se muestra a más de 734 px de ancho (sin ampliar). */
export const LOGO_MAX_WIDTH = LOGO.width;
const SIG_BOTTOM = signature2.y + signature2.h;

/**
 * Ubicación del logo (borde izquierdo en x = 120, el mismo eje que los textos y el logo del manual). S5: grande y a TAMAÑO NATIVO
 * (734 px: el PNG se muestra sin remuestrear, máxima nitidez), debajo de la firma (5 líneas: termina en y ≈ 652; el logo arranca 60 px
 * más abajo). S6: más chico, sobre la fecha; el paso S5 → S6 es un
 * desplazamiento suave (THREAD_TIMING.settleFrom → settleTo) con la misma proporción 734:326.
 */
export const LOGO_PLACEMENT = {
  s5: { left: TEXT_X, top: Math.ceil(SIG_BOTTOM + 60), width: LOGO.width },
  s6: { left: TEXT_X, top: COMPOSITION.s6.logo.top, width: COMPOSITION.s6.logo.width },
} as const satisfies Record<string, LogoPlacement>;

const clampWidth = (w: number) => Math.min(w, LOGO_MAX_WIDTH);

/** Caja del logo (proporción exacta 734:326). */
export const logoBox = (p: LogoPlacement = LOGO_PLACEMENT.s5): LogoBoxT => {
  const width = clampWidth(p.width);
  const height = width / LOGO.ratio;
  return { left: p.left, top: p.top, width, height, right: p.left + width, bottom: p.top + height };
};

/** Caja del logo ampliada con aire (por defecto 40 px = COMPOSITION.clearance): nada ilustrado debe entrar en ella. */
export const logoClearBox = (p: LogoPlacement = LOGO_PLACEMENT.s5, pad: number = COMPOSITION.clearance): LogoBoxT => {
  const b = logoBox(p);
  return { left: b.left - pad, top: b.top - pad, width: b.width + 2 * pad, height: b.height + 2 * pad, right: b.right + pad, bottom: b.bottom + pad };
};

/** Curva del desplazamiento S5 → S6 del logo (suave, sin rebote). */
export const LOGO_MOVE_EASING = Easing.bezier(0.65, 0, 0.35, 1);

/** Mezcla lineal de dos ubicaciones (t: 0 → a, 1 → b). */
export const lerpPlacement = (a: LogoPlacement, b: LogoPlacement, t: number): LogoPlacement => ({
  left: a.left + (b.left - a.left) * t,
  top: a.top + (b.top - a.top) * t,
  width: a.width + (b.width - a.width) * t,
});

/** Posición del logo en el fotograma absoluto `frame`: S5 hasta settleFrom, desplazamiento suave y S6 desde settleTo. */
export const logoPlacementAt = (frame: number): LogoPlacement => {
  const t = interpolate(frame, [THREAD_TIMING.settleFrom, THREAD_TIMING.settleTo], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: LOGO_MOVE_EASING,
  });
  return lerpPlacement(LOGO_PLACEMENT.s5, LOGO_PLACEMENT.s6, t);
};

/** Caja del logo en `frame` (null antes de que aparezca: SIGNATURE_TIMING.logoIn). */
export const logoBoxAt = (frame: number): LogoBoxT | null => (frame < SIGNATURE_TIMING.logoIn ? null : logoBox(logoPlacementAt(frame)));
export const logoClearBoxAt = (frame: number, pad: number = COMPOSITION.clearance): LogoBoxT | null =>
  frame < SIGNATURE_TIMING.logoIn ? null : logoClearBox(logoPlacementAt(frame), pad);

/** Zona segura de referencia (re-exportada para las pruebas). */
export const TEXT_SAFE = SAFE;
