import React from "react";
import { Easing, Interactive, interpolate, useVideoConfig } from "remotion";
import { COLORS } from "../../config/brand.ts";
import { MOTION } from "./geometry.ts";
import { SCENES } from "../../config/timeline.ts";
import { useAbsFrame } from "../../lib/scene.ts";

/**
 * Fondo de la escena 5: crema de marca (#FFF6E7) que entra por fundido sobre la escena 4 durante el solape
 * (SCENES.s5.from → +OVERLAP). Estático después. Sin elementos en la franja del hilo ni en la zona del texto.
 */
export const ClosingBackground: React.FC = () => {
  const frame = useAbsFrame(SCENES.s5.from);
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Fondo crema"
      premountFor={fps}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.cream,
        opacity: interpolate(frame, [MOTION.bgFrom, MOTION.bgTo], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
      }}
    />
  );
};
