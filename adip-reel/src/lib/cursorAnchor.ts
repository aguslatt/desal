import { measureText } from "@remotion/layout-utils";
import { MESSAGES } from "../config/script.ts";
import { COMPOSER, CURSOR } from "../config/layout.ts";
import { FONT } from "../config/brand.ts";
import "./fonts.ts";

/**
 * Posición del cursor al final del 3.er mensaje ("empezar…") dentro del campo de redacción.
 * La usan Scene2 (cursor titilando) y ThreadLine (el cursor se estira y se vuelve línea)
 * para que el traspaso sea exacto, sin saltos. Centro vertical = centro de la 2.ª línea (y = 960).
 */
export const getFinalCursorAnchor = (): { x: number; cy: number; left: number; w: number; h: number } => {
  const lines = MESSAGES[2].lines;
  const last = lines[lines.length - 1];
  const { width } = measureText({
    text: last,
    fontFamily: FONT.family,
    fontSize: COMPOSER.fontSize,
    fontWeight: String(COMPOSER.fontWeight),
    letterSpacing: `${COMPOSER.letterSpacing}px`,
    validateFontIsLoaded: true,
  });
  const left = COMPOSER.textX + width + CURSOR.gap; // borde izquierdo de la barra
  const cy = COMPOSER.textY + COMPOSER.lineHeight * (lines.length - 1) + COMPOSER.lineHeight / 2;
  return { x: left + CURSOR.w / 2, cy, left, w: CURSOR.w, h: CURSOR.h };
};
