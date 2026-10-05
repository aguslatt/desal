import type React from "react";
import { COLORS } from "../../config/brand.ts";
import { COVER } from "../../config/script.ts";
import { fontFamily } from "../../lib/fonts.ts";
import { SUBTITLE, TEXT_BOX } from "./geometry.ts";
import { splitWords } from "./splitWords.ts";

/** Texto secundario de la portada: COVER.subtitle en dos líneas (54 px medium), centrado en x 120–960. */
export const CoverSubtitle: React.FC<{ readonly style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      position: "absolute",
      left: TEXT_BOX.left,
      top: SUBTITLE.top,
      width: TEXT_BOX.width,
      textAlign: "center",
      color: COLORS.ink,
      fontFamily,
      fontSize: SUBTITLE.fontSize,
      fontWeight: SUBTITLE.fontWeight,
      lineHeight: `${SUBTITLE.lineHeight}px`,
      letterSpacing: `${SUBTITLE.letterSpacing}px`,
      ...style,
    }}
  >
    {splitWords(COVER.subtitle, SUBTITLE.wordsPerLine).map((line, i) => (
      <div key={i} style={{ height: SUBTITLE.lineHeight, whiteSpace: "pre" }}>
        {line}
      </div>
    ))}
  </div>
);
