import { measureText } from "@remotion/layout-utils";
import { COMPOSER, CURSOR } from "../../config/layout.ts";
import { FONT } from "../../config/brand.ts";
import "../../lib/fonts.ts";

/**
 * Geometría del texto que se está tipeando dentro del campo de redacción.
 * Módulo de medición compartido por Scene1Hook, Scene2Messages y ComposerCard (portada).
 */

/**
 * Líneas visibles de un mensaje partido en `lines` cuando hay `chars` caracteres visibles
 * (`chars` cuenta sobre text = lines.join(" "), igual que visibleChars() de typing.ts).
 * Siempre devuelve al menos una línea; la ÚLTIMA es donde está el cursor (puede ser "" justo
 * después de escribir el espacio del corte de línea: el cursor ya está en la línea siguiente).
 */
export const visibleLines = (lines: readonly string[], chars: number): string[] => {
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const glyphs = Array.from(lines[i]);
    const local = chars - start;
    if (local <= glyphs.length) {
      out.push(glyphs.slice(0, Math.max(0, local)).join(""));
      return out;
    }
    out.push(lines[i]);
    start += glyphs.length + 1; // +1: el espacio del corte de línea
  }
  return out;
};

/** Ancho (px) de un texto con la tipografía exacta del campo de redacción. */
export const measureComposerText = (text: string): number =>
  text.length === 0
    ? 0
    : measureText({
        text,
        fontFamily: FONT.family,
        fontSize: COMPOSER.fontSize,
        fontWeight: String(COMPOSER.fontWeight),
        letterSpacing: `${COMPOSER.letterSpacing}px`,
        validateFontIsLoaded: true,
      }).width;

export type CursorBox = { readonly left: number; readonly top: number; readonly w: number; readonly h: number; readonly cy: number };

/**
 * Posición del cursor al final de la última línea de `visible`.
 * Misma fórmula que getFinalCursorAnchor() (src/lib/cursorAnchor.ts): left = textX + ancho + CURSOR.gap
 * (en una línea vacía: left = textX, sin separación).
 */
export const cursorBox = (visible: readonly string[]): CursorBox => {
  const lineIndex = Math.max(0, visible.length - 1);
  const last = visible[lineIndex] ?? "";
  const width = measureComposerText(last);
  const left = COMPOSER.textX + (width > 0 ? width + CURSOR.gap : 0);
  const cy = COMPOSER.textY + COMPOSER.lineHeight * lineIndex + COMPOSER.lineHeight / 2;
  return { left, cy, top: cy - CURSOR.h / 2, w: CURSOR.w, h: CURSOR.h };
};
