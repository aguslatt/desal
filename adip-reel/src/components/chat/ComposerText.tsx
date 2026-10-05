import type React from "react";
import { COLORS } from "../../config/brand.ts";
import { COMPOSER } from "../../config/layout.ts";
import { fontFamily } from "../../lib/fonts.ts";

/**
 * Texto que se está redactando, alineado a la izquierda en la caja de texto del campo (COMPOSER.text*).
 * Una <div> por línea de diseño; no hace saltos de línea propios (white-space: pre).
 */
export const ComposerText: React.FC<{
  readonly lines: readonly string[];
  readonly opacity?: number;
  readonly style?: React.CSSProperties;
}> = ({ lines, opacity = 1, style }) => (
  <div
    style={{
      position: "absolute",
      left: COMPOSER.textX,
      top: COMPOSER.textY,
      width: COMPOSER.textW,
      opacity,
      color: COLORS.ink,
      fontFamily,
      fontSize: COMPOSER.fontSize,
      fontWeight: COMPOSER.fontWeight,
      lineHeight: `${COMPOSER.lineHeight}px`,
      letterSpacing: `${COMPOSER.letterSpacing}px`,
      ...style,
    }}
  >
    {lines.map((line, i) => (
      <div key={i} style={{ height: COMPOSER.lineHeight, whiteSpace: "pre" }}>
        {line}
      </div>
    ))}
  </div>
);
