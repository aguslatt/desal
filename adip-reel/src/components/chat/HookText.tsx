import type React from "react";
import { measureText } from "@remotion/layout-utils";
import { COLORS, FONT } from "../../config/brand.ts";
import { SAFE } from "../../config/layout.ts";
import { HOOK } from "../../config/script.ts";
import { fontFamily } from "../../lib/fonts.ts";

/**
 * Gancho de la escena 1: HOOK partido en 3 líneas por palabras (el texto sale de script.ts; acá solo se
 * decide dónde cortar: «¿Cuántas veces / escribiste esto… / y lo borraste?»). Centrado en la zona segura.
 */
export const HOOK_STYLE = { fontSize: 80, fontWeight: 600, lineHeight: 100, top: 392 } as const;
/** Cantidad de palabras por línea (suma = palabras de HOOK). */
const WORDS_PER_LINE = [2, 2, 3] as const;
/** Índice de la línea y palabra que lleva el subrayado fino (la 4.ª palabra: «esto…»). */
const UNDERLINE = { line: 1, wordInLine: 1 } as const;

export const hookLines = (): string[] => {
  const words = HOOK.split(" ");
  const lines: string[] = [];
  let at = 0;
  for (const n of WORDS_PER_LINE) {
    lines.push(words.slice(at, at + n).join(" "));
    at += n;
  }
  return lines;
};

const widthOf = (text: string): number =>
  measureText({
    text,
    fontFamily: FONT.family,
    fontSize: HOOK_STYLE.fontSize,
    fontWeight: String(HOOK_STYLE.fontWeight),
    letterSpacing: "0px",
    validateFontIsLoaded: true,
  }).width;

/** Posición horizontal (px absolutos) y ancho de la palabra subrayada; requiere la fuente cargada. */
export const underlineSpan = (): { left: number; width: number } => {
  const line = hookLines()[UNDERLINE.line];
  const words = line.split(" ");
  const before = words.slice(0, UNDERLINE.wordInLine).join(" ") + " ";
  const lineLeft = SAFE.x0 + (SAFE.width - widthOf(line)) / 2;
  return { left: lineLeft + widthOf(before), width: widthOf(words[UNDERLINE.wordInLine]) };
};

/** Bloque de texto (sin animación): las líneas del gancho centradas en x 120–960. */
export const HookText: React.FC<{ readonly style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      position: "absolute",
      left: SAFE.x0,
      top: HOOK_STYLE.top,
      width: SAFE.width,
      textAlign: "center",
      color: COLORS.ink,
      fontFamily,
      fontSize: HOOK_STYLE.fontSize,
      fontWeight: HOOK_STYLE.fontWeight,
      lineHeight: `${HOOK_STYLE.lineHeight}px`,
      letterSpacing: "0px",
      ...style,
    }}
  >
    {hookLines().map((line, i) => (
      <div key={i} style={{ height: HOOK_STYLE.lineHeight, whiteSpace: "pre" }}>
        {line}
      </div>
    ))}
  </div>
);
