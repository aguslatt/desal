import { COLORS, ROLE, TYPE } from "../config/brand.ts";

/**
 * ESTILO DE LOS TEXTOS (v3) — módulo PURO (sin React): lo usan las piezas de src/text/* y el montaje.
 * Jerarquía ÚNICA = TYPE de brand.ts (display 88/800, title 68/700, body 52/600). Aquí solo se derivan valores de acabado
 * (interlineado en px, línea base) y la animación de entradas/salidas. Los TIEMPOS narrativos salen de config/timeline.ts.
 */

export type TypeToken = (typeof TYPE)[keyof typeof TYPE];

export type TextStyleSpec = {
  readonly size: number;
  readonly weight: number;
  /** relación (TYPE) */
  readonly lineHeight: number;
  /** interlineado en px (size × lineHeight, sin redondear: igual que el texto de la respuesta del chat) */
  readonly lineHeightPx: number;
  readonly letterSpacing: number;
  readonly color: string;
};

const spec = (t: TypeToken): TextStyleSpec => ({
  size: t.size,
  weight: t.weight,
  lineHeight: t.lineHeight,
  lineHeightPx: t.size * t.lineHeight,
  letterSpacing: t.letterSpacing,
  color: ROLE.text,
});

/** Estilos de texto en pantalla (negro sobre naranja / gris: 8,3:1 y 18,3:1). */
export const TEXT_STYLE = {
  /** frases del giro (S3) */
  display: spec(TYPE.display),
  /** acompañamiento (S4), firma (S5), mensaje de cierre y fecha (S6) */
  title: spec(TYPE.title),
  /** campaña (S6) */
  body: spec(TYPE.body),
} as const;

/**
 * Línea base dentro de la caja de línea (px desde el borde superior de la línea). Montserrat: ascenso 0,968 em y descenso 0,251 em
 * (Chrome los redondea por separado); el interlineado reparte el sobrante en mitades (redondeo hacia abajo). Verificado con el DOM real
 * (dev/text/verify.tsx): display 79, title 63, body 49 px.
 */
export const FONT_METRICS = { ascent: 0.968, descent: 0.251, capHeight: 0.703, xHeight: 0.547, ascender: 0.766, descender: 0.203 } as const;

export const baselineOffset = (s: Pick<TextStyleSpec, "size" | "lineHeightPx">): number => {
  const a = Math.round(FONT_METRICS.ascent * s.size);
  const d = Math.round(FONT_METRICS.descent * s.size);
  // Chrome redondea hacia abajo el medio-interlineado (half-leading) → la línea base cae en un píxel entero
  return a + Math.floor((s.lineHeightPx - (a + d)) / 2);
};

/**
 * Acentos de énfasis (contraste medido sobre el fondo REAL):
 *  · S3 sobre NARANJA: subrayado a mano en VIOLETA #8A00B7 → 3,01:1 contra el naranja (blanco: 2,52:1; rosa 1,55:1; amarillo 1,66:1).
 *  · S5 sobre GRIS: marcador amarillo DETRÁS del texto (el texto sigue negro: 13,8:1 sobre el amarillo; sobre el gris 18,3:1).
 */
export const ACCENT = {
  onOrange: COLORS.purple,
  onGrey: COLORS.yellow,
} as const;

/** Acabado de animación (fotogramas / px): NO son tiempos de guion; los hitos narrativos salen de timeline.ts. */
export const TEXT_FX = {
  /** duración de la entrada de una línea y desfase entre líneas consecutivas */
  lineIn: 16,
  lineStagger: 5,
  /** desplazamiento vertical inicial de la entrada (px) */
  riseDisplay: 26,
  riseTitle: 20,
  /** salida (fundido + leve ascenso) */
  exit: 12,
  exitRise: 12,
  /** énfasis: espera tras terminar de entrar la línea y duración del trazo */
  markDelay: 8,
  markDraw: 18,
  /** logo: revelado limpio (fundido + escala 0,97 → 1, sin rebote) y movimiento S5 → S6 */
  logoIn: 16,
  logoScaleFrom: 0.97,
} as const;

/** Margen izquierdo de TODOS los textos (x = 120, como los titulares del manual). */
export const TEXT_X = 120;
/** Ancho máximo de línea (zona segura 120–960). */
export const TEXT_MAX_W = 840;
