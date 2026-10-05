import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "../../config/brand.ts";
import { H, W } from "../../config/layout.ts";

/**
 * Fondo de la escena 4: crema cálido de marca (#FFF6E7) con dos lavados de color casi imperceptibles
 * (amarillo arriba a la derecha, rosa abajo a la izquierda) para que no se vea plano.
 * Contraste de los subtítulos (ink sobre este fondo) ≥ 10:1.
 */
export const CompanionBackground: React.FC = () => (
  <AbsoluteFill
    style={{
      width: W,
      height: H,
      backgroundColor: COLORS.cream,
      backgroundImage:
        "radial-gradient(ellipse 820px 640px at 96% 6%, rgba(255, 203, 1, 0.10) 0%, rgba(255, 203, 1, 0) 70%), radial-gradient(ellipse 900px 720px at 2% 98%, rgba(237, 41, 149, 0.06) 0%, rgba(237, 41, 149, 0) 72%)",
    }}
  />
);
