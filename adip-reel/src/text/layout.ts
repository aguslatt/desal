import { Easing } from "remotion";
import { LOGO } from "../config/brand.ts";
import { COMPOSITION, TEXT, TURN_ANCHOR } from "../config/layout.ts";
import { CLOSING, COMPANION_TEXT, SIGNATURE_BLOCKS, TURN } from "../config/script.ts";
import {
  CLOSING_TIMING,
  COMPANION_TIMING,
  SIGNATURE_TIMING,
  TOTAL_FRAMES,
  TURN_TIMING,
} from "../config/timeline.ts";
import { FONT_METRICS, TEXT_FX, TEXT_STYLE, TEXT_X, baselineOffset, type TextStyleSpec } from "./style.ts";

/**
 * GEOMETRÍA DE LOS TEXTOS Y DEL LOGO (v3) — módulo PURO. Coordenadas de pantalla (1080×1920). El montaje y las curvas usan estas
 * cajas para dejar aire alrededor de los textos y del logo (`TEXT_EXTENTS`, `logoBox`).
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
 * Firma (S5): a title 68/700 «estamos para escucharte» mide 886 px y «En Equipo ADIP estamos» 877 px (ambas > 840), así que el bloque 1
 * NO entra en 2 líneas: se corta en 3 («En Equipo ADIP / estamos para / escucharte») y el bloque 2 conserva sus 2 líneas de guion:
 * 5 líneas legibles, todas ≤ 840 px (558 / 474 / 393 / 550 / 366: un renglón largo, uno corto y así, sin viudas). Achicar el cuerpo
 * a 64 px para ganar una línea rompería la jerarquía única (TYPE.title = 68).
 */
export const SIGNATURE_WORD_BREAKS: readonly [readonly number[], readonly number[]] = [[3, 2, 1], [2, 3]];
export const SIGNATURE_LINES: readonly [readonly string[], readonly string[]] = [
  byWords(SIGNATURE_BLOCKS[0].text, SIGNATURE_WORD_BREAKS[0]),
  byWords(SIGNATURE_BLOCKS[1].text, SIGNATURE_WORD_BREAKS[1]),
];

/**
 * Acompañamiento (S4): a display 88/800 «No tenés que pasar» mide 895 px (> 840): se corta en 3 líneas («No tenés que / pasar por esto /
 * en soledad.», 614 / 662 / 532 px). Los cortes de script.ts (2 líneas, pensados para title) no se usan: son «de diseño», no obligatorios.
 */
export const COMPANION_LINES: readonly string[] = byWords(COMPANION_TEXT, [3, 3, 2]);

/**
 * Cierre (S6): «podés compartir este video.» mide 984 px (> 840): se parte en «podés compartir / este video.». El primer corte cae en la
 * coma del guion («Si hoy te cuesta decirlo, / …»): la condición arriba, la invitación debajo; 834 / 586 / 379 px, rag descendente.
 */
export const CLOSING_LINES: readonly string[] = [CLOSING.message[0], ...byWords(CLOSING.message[1], [2, 2])];

// ───────────────────────── anchos medidos (px) con measureText de @remotion/layout-utils y Montserrat REAL cargada
/**
 * Alineados con las líneas de cada bloque. Se midieron en vivo (DOM real, diferencia < 1 px) con una prueba privada que no se versiona:
 * si cambia el texto o el tipo de una línea, hay que volver a medirla (por ejemplo con `measureText` de @remotion/layout-utils).
 * Incluyen el letterSpacing del estilo. Sirven para las cajas exportadas (módulo puro: sin DOM).
 */
const MEASURED = {
  turnFirst: [716.5, 349.3],
  turnSecond: [587.2, 714.3],
  companion: [614.2, 661.9, 532.3],
  signature1: [558.2, 474.1, 393.5],
  signature2: [550.2, 366.1],
  closingMessage: [834.2, 585.8, 379.3],
  closingDate: [362.5, 829.8],
} as const;

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
    ink: { top: first.baseline - FONT_METRICS.ascender * first.size, bottom: last.baseline + FONT_METRICS.descender * last.size },
  };
};

const specsOf = (lines: readonly string[], style: TextStyleSpec, widths: readonly number[]): LineSpec[] =>
  lines.map((text, i) => ({ text, style, width: widths[i] }));

// ───────────────────────── S3 — frases del giro (display 88/800, x = 120 desde TURN_ANCHOR)
const TURN_GAP = 32;
const TURN_FIRST_Y = TURN_ANCHOR.y0;
const TURN_SECOND_Y = TURN_FIRST_Y + 2 * TEXT_STYLE.display.lineHeightPx + TURN_GAP;
const TURN_EXIT_TO = TURN_TIMING.exitFrom + TEXT_FX.exit;

const turnFirst = buildExtent("turnFirst", TURN_ANCHOR.x, TURN_FIRST_Y, TURN_TIMING.firstIn, TURN_EXIT_TO, specsOf(TURN.firstLines, TEXT_STYLE.display, MEASURED.turnFirst));
const turnSecond = buildExtent("turnSecond", TURN_ANCHOR.x, TURN_SECOND_Y, TURN_TIMING.secondIn, TURN_EXIT_TO, specsOf(TURN.secondLines, TEXT_STYLE.display, MEASURED.turnSecond));

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

// ───────────────────────── S4 — «No tenés que pasar por esto en soledad.» (display 88/800, franja TEXT.top)
/**
 * La frase de la escena de escucha es la misma voz que el giro de S3 («Podés empezar por ahí…»): va en `display` como ella y ocupa la
 * franja alta (3 líneas, y 240–525) frente a la pareja de abajo. Antes iba en `title` (2 líneas de 68 px) y quedaba como un pie de foto
 * chico sobre 700 px de vacío. La voz de ADIP (firma y cierre) sigue en `title`.
 */
const COMPANION_EXIT_TO = COMPANION_TIMING.textExitFrom + TEXT_FX.exit;
const companion = buildExtent("companion", TEXT_X, TEXT.top.y0, COMPANION_TIMING.textIn, COMPANION_EXIT_TO, specsOf(COMPANION_LINES, TEXT_STYLE.display, MEASURED.companion));

// ───────────────────────── S5 — firma completa en dos bloques (title 68/700)
/** Los dos bloques de la firma son UNA oración: el interlineado es el mismo de arriba abajo (0 px extra entre bloques). El 2.º solo entra después. */
const SIGNATURE_BLOCK_GAP = 0;
const SIGNATURE_EXIT_TO = SIGNATURE_TIMING.exitFrom + TEXT_FX.exit;
const sig1H = SIGNATURE_LINES[0].length * TEXT_STYLE.title.lineHeightPx;
const signature1 = buildExtent("signature1", TEXT_X, TEXT.top.y0, SIGNATURE_TIMING.block1In, SIGNATURE_EXIT_TO, specsOf(SIGNATURE_LINES[0], TEXT_STYLE.title, MEASURED.signature1));
const signature2 = buildExtent("signature2", TEXT_X, TEXT.top.y0 + sig1H + SIGNATURE_BLOCK_GAP, SIGNATURE_TIMING.block2In, SIGNATURE_EXIT_TO, specsOf(SIGNATURE_LINES[1], TEXT_STYLE.title, MEASURED.signature2));

// ───────────────────────── S6 — cierre (mensaje en title; fecha y campaña en body, como pie)
/**
 * «10 de octubre» y «Día Mundial de la Salud Mental» van los dos en `body` 52/600, uno bajo el otro (0 px extra): son el pie del cierre.
 * En `title` la fecha competía con el mensaje (dos titulares del mismo cuerpo, uno arriba y otro abajo). El borde inferior del pie
 * (COMPOSITION.s6.date.y1) ancla su posición.
 */
const CLOSING_DATE_GAP = 0;
const dateH = 2 * TEXT_STYLE.body.lineHeightPx + CLOSING_DATE_GAP;
const closingMessage = buildExtent("closingMessage", TEXT_X, TEXT.top.y0, CLOSING_TIMING.messageIn, TOTAL_FRAMES, specsOf(CLOSING_LINES, TEXT_STYLE.title, MEASURED.closingMessage));
const closingDate = buildExtent(
  "closingDate",
  TEXT_X,
  COMPOSITION.s6.date.y1 - dateH,
  CLOSING_TIMING.dateIn,
  TOTAL_FRAMES,
  [
    { text: CLOSING.dateLine, style: TEXT_STYLE.body, width: MEASURED.closingDate[0] },
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

// ───────────────────────── LOGO
export type LogoPlacement = { readonly left: number; readonly top: number; readonly width: number };
export type LogoBoxT = { readonly left: number; readonly top: number; readonly width: number; readonly height: number; readonly right: number; readonly bottom: number };

/** El PNG oficial mide 734×326: nunca se muestra a más de 734 px de ancho (sin ampliar). */
export const LOGO_MAX_WIDTH = LOGO.width;

/** Ancho del logo en S5 y S6 (el PNG mide 734: a 700 px se muestra sin ampliar y deja ≥ 40 px de aire a la curva y a la cabeza de la amiga). */
export const LOGO_WIDTH = 700;
/** Cuánto sube el conjunto [logo + pareja + hilo] en el paso S5 → S6 (cámara vertical uniforme: no cambia ningún tamaño). */
export const LOGO_LIFT_S6 = 176;

/**
 * y del borde superior del logo en S5. FIJO (no se deriva del texto): el hilo naranja (THREAD_POINTS) pasa por el pasillo que dejan el
 * borde inferior del logo (712 + 311 = 1023) y la cabeza de B (pelo en y ≈ 1121) con ≥ 40 px de aire, y en S6 (la cámara sube
 * LOGO_LIFT_S6) el mensaje de 3 líneas (tinta hasta y ≈ 458) y la pareja quedan a ≈ 78 px del logo y a ≈ 70 px del pie de fecha.
 * Con la firma de 5 líneas (tinta hasta y ≈ 613) queda un aire de ≈ 99 px entre el texto y el logo, igual al del pasillo del hilo (98 px).
 */
export const LOGO_TOP_S5 = 712;

/**
 * Ubicación del logo (borde izquierdo en x = 120, el mismo eje que los textos y el logo del manual). S5: grande, debajo de la firma
 * (5 líneas: terminan en y ≈ 628). S6: el mismo tamaño, `LOGO_LIFT_S6` px más arriba (sube con la pareja y el hilo en
 * THREAD_TIMING.settleFrom → settleTo; proporción 734:326 siempre intacta).
 */
export const LOGO_PLACEMENT = {
  s5: { left: TEXT_X, top: LOGO_TOP_S5, width: LOGO_WIDTH },
  s6: { left: TEXT_X, top: LOGO_TOP_S5 - LOGO_LIFT_S6, width: LOGO_WIDTH },
} as const satisfies Record<string, LogoPlacement>;

const clampWidth = (w: number) => Math.min(w, LOGO_MAX_WIDTH);

/** Caja del logo (proporción exacta 734:326). */
export const logoBox = (p: LogoPlacement = LOGO_PLACEMENT.s5): LogoBoxT => {
  const width = clampWidth(p.width);
  const height = width / LOGO.ratio;
  return { left: p.left, top: p.top, width, height, right: p.left + width, bottom: p.top + height };
};

/** Curva del desplazamiento S5 → S6 del logo (suave, sin rebote). */
export const LOGO_MOVE_EASING = Easing.bezier(0.65, 0, 0.35, 1);

/** Mezcla lineal de dos ubicaciones (t: 0 → a, 1 → b). */
export const lerpPlacement = (a: LogoPlacement, b: LogoPlacement, t: number): LogoPlacement => ({
  left: a.left + (b.left - a.left) * t,
  top: a.top + (b.top - a.top) * t,
  width: a.width + (b.width - a.width) * t,
});
