import type React from "react";
import { COLORS } from "../../config/brand.ts";
import { H, W } from "../../config/layout.ts";

/**
 * Fondo crema del chat con tres resplandores muy suaves (naranja, rosa y amarillo de la paleta)
 * para dar calidez sin competir con el texto. `drift` (px) los desplaza lentamente; `glow` (0–1) los atenúa.
 */
const GLOWS = [
  { cx: 1010, cy: 250, r: 640, rgb: "254, 128, 28", a: 0.13, k: [1, -1] },
  { cx: 30, cy: 1560, r: 720, rgb: "237, 41, 149", a: 0.07, k: [-1, 1] },
  { cx: 880, cy: 1130, r: 520, rgb: "255, 203, 1", a: 0.09, k: [-1, -1] },
] as const;

export const ChatBackground: React.FC<{
  readonly drift?: number;
  readonly glow?: number;
  readonly style?: React.CSSProperties;
}> = ({ drift = 0, glow = 1, style }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, backgroundColor: COLORS.cream, overflow: "hidden", ...style }}>
    {GLOWS.map((g, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: g.cx - g.r + g.k[0] * drift,
          top: g.cy - g.r + g.k[1] * drift,
          width: g.r * 2,
          height: g.r * 2,
          borderRadius: g.r,
          opacity: glow,
          background: `radial-gradient(circle at center, rgba(${g.rgb}, ${g.a}) 0%, rgba(${g.rgb}, 0) 70%)`,
        }}
      />
    ))}
  </div>
);
