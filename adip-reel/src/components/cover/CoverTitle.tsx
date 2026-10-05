import type React from "react";
import { measureText } from "@remotion/layout-utils";
import { COLORS, FONT } from "../../config/brand.ts";
import { COVER } from "../../config/script.ts";
import { fontFamily } from "../../lib/fonts.ts";
import { useFontsReady } from "../chat/useFontsReady.ts";
import { TEXT_BOX, TITLE } from "./geometry.ts";
import { splitWords } from "./splitWords.ts";

/**
 * Título de la portada: COVER.title partido por palabras en dos líneas, 96 px bold, centrado en la zona
 * segura (x 120–960). Detalle de marca: subrayado naranja bajo la última palabra («borraste»), el mismo
 * recurso del gancho del reel (subrayado fino con extremos redondeados, separado de las letras).
 */
const UNDERLINE = { thickness: 8, gap: 22 } as const;

// Montserrat: ascender 0,968 em · descender 0,251 em → línea base dentro de la caja de línea
const baselineIn = (fontSize: number, lineHeight: number): number =>
  (lineHeight - 1.219 * fontSize) / 2 + 0.968 * fontSize;

const widthOf = (text: string): number =>
  measureText({
    text,
    fontFamily: FONT.family,
    fontSize: TITLE.fontSize,
    fontWeight: String(TITLE.fontWeight),
    letterSpacing: `${TITLE.letterSpacing}px`,
    validateFontIsLoaded: true,
  }).width;

export const CoverTitle: React.FC<{ readonly underline?: boolean; readonly style?: React.CSSProperties }> = ({
  underline = true,
  style,
}) => {
  const fontsReady = useFontsReady();
  const lines = splitWords(COVER.title, TITLE.wordsPerLine);

  // Subrayado bajo la última palabra de la última línea (el espacio final del letterSpacing se descuenta).
  let mark: { left: number; width: number; top: number } | null = null;
  if (fontsReady && underline) {
    const last = lines[lines.length - 1];
    const words = last.split(" ");
    const word = words[words.length - 1];
    const lineW = widthOf(last);
    const lineLeft = TEXT_BOX.left + (TEXT_BOX.width - lineW) / 2;
    const before = words.length > 1 ? widthOf(words.slice(0, -1).join(" ") + " ") : 0;
    const wordW = widthOf(word) - Math.abs(TITLE.letterSpacing);
    mark = {
      left: lineLeft + before,
      width: wordW,
      top:
        TITLE.top +
        TITLE.lineHeight * (lines.length - 1) +
        baselineIn(TITLE.fontSize, TITLE.lineHeight) +
        UNDERLINE.gap,
    };
  }

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", ...style }}>
      <div
        style={{
          position: "absolute",
          left: TEXT_BOX.left,
          top: TITLE.top,
          width: TEXT_BOX.width,
          textAlign: "center",
          color: COLORS.ink,
          fontFamily,
          fontSize: TITLE.fontSize,
          fontWeight: TITLE.fontWeight,
          lineHeight: `${TITLE.lineHeight}px`,
          letterSpacing: `${TITLE.letterSpacing}px`,
        }}
      >
        {lines.map((line, i) => (
          <div key={i} style={{ height: TITLE.lineHeight, whiteSpace: "pre" }}>
            {line}
          </div>
        ))}
      </div>
      {mark ? (
        <div
          style={{
            position: "absolute",
            left: mark.left,
            top: mark.top,
            width: mark.width,
            height: UNDERLINE.thickness,
            borderRadius: UNDERLINE.thickness / 2,
            backgroundColor: COLORS.orange,
          }}
        />
      ) : null}
    </div>
  );
};
