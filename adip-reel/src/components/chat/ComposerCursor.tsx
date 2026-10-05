import type React from "react";
import { COLORS } from "../../config/brand.ts";
import { CURSOR } from "../../config/layout.ts";

/**
 * Cursor naranja (barra 8×64, radio 4). Mismas medidas y color que usa ThreadLine al recibirlo.
 * `left`/`top` en px absolutos del encuadre (ver cursorBox en typingLayout.ts).
 */
export const ComposerCursor: React.FC<{
  readonly left: number;
  readonly top: number;
  readonly opacity?: number;
  readonly style?: React.CSSProperties;
}> = ({ left, top, opacity = 1, style }) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width: CURSOR.w,
      height: CURSOR.h,
      borderRadius: CURSOR.radius,
      backgroundColor: COLORS.orange,
      opacity,
      ...style,
    }}
  />
);
