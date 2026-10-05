import type React from "react";
import { COLORS } from "../../config/brand.ts";
import { COMPOSER, H, W } from "../../config/layout.ts";
import { FIELD } from "./geometry.ts";

/**
 * Fondo crema de la portada (misma receta que el chat del reel): resplandores muy suaves con los colores
 * oficiales (naranja, rosa y amarillo) que dan calidez sin competir con el texto. A diferencia del reel, el
 * campo de redacción está más arriba, así que el halo amarillo/naranja se centra detrás de la tarjeta.
 */
const FIELD_CY = FIELD.top + COMPOSER.h / 2;

const GLOWS = [
  { name: "naranja arriba", cx: 1000, cy: 270, r: 640, rgb: "254, 128, 28", a: 0.13 },
  { name: "rosa abajo", cx: 40, cy: 1620, r: 720, rgb: "237, 41, 149", a: 0.075 },
  { name: "amarillo tras el campo", cx: 900, cy: FIELD_CY + 60, r: 560, rgb: "255, 203, 1", a: 0.1 },
] as const;

export const CoverBackground: React.FC<{ readonly style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: W,
      height: H,
      backgroundColor: COLORS.cream,
      overflow: "hidden",
      ...style,
    }}
  >
    {GLOWS.map((g) => (
      <div
        key={g.name}
        style={{
          position: "absolute",
          left: g.cx - g.r,
          top: g.cy - g.r,
          width: g.r * 2,
          height: g.r * 2,
          borderRadius: g.r,
          background: `radial-gradient(circle at center, rgba(${g.rgb}, ${g.a}) 0%, rgba(${g.rgb}, 0) 70%)`,
        }}
      />
    ))}
  </div>
);
