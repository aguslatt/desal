import React from "react";
import { CanvasImage, Easing, Interactive, interpolate, staticFile, useVideoConfig } from "remotion";
import { LOGO } from "../../config/brand.ts";
import { W } from "../../config/layout.ts";
import { CLOSING_TIMING, SCENES } from "../../config/timeline.ts";
import { useAbsFrame } from "../../lib/scene.ts";
import { LOGO_BOX, MOTION, logoHeight } from "./geometry.ts";

export type ClosingLogoProps = {
  /** Ancho del logo (px). El alto sale SIEMPRE de la relación original 734:326. */
  readonly width?: number;
};

/**
 * Logo oficial de Equipo ADIP (public/brand/logo-equipo-adip.png), sin deformar, centrado en x = 540.
 * Entra en CLOSING_TIMING.logoIn con fundido + escala sutil 0.96 → 1 (perceptual-scale), sin rebote.
 * Detrás, una luz cálida muy suave que nace con él y levanta los colores del isologotipo sobre la crema.
 */
export const ClosingLogo: React.FC<ClosingLogoProps> = ({ width = LOGO_BOX.width }) => {
  const frame = useAbsFrame(SCENES.s5.from);
  const { fps } = useVideoConfig();
  const height = logoHeight(width);
  const cy = LOGO_BOX.top + height / 2;

  return (
    <>
      <Interactive.Div
        name="Luz del logo"
        premountFor={fps}
        style={{
          position: "absolute",
          left: W / 2 - 500,
          top: cy - 270,
          width: 1000,
          height: 540,
          background: "radial-gradient(closest-side, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.21) 48%, rgba(255,255,255,0) 100%)",
          opacity: interpolate(frame, [CLOSING_TIMING.logoIn, CLOSING_TIMING.logoIn + MOTION.logoScale], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          }),
        }}
      />
      <CanvasImage
        name="Logo oficial Equipo ADIP"
        src={staticFile(LOGO.file)}
        premountFor={fps}
        width={LOGO.width}
        height={LOGO.height}
        style={{
          position: "absolute",
          left: (W - width) / 2,
          top: LOGO_BOX.top,
          width,
          height,
          opacity: interpolate(frame, [CLOSING_TIMING.logoIn, CLOSING_TIMING.logoIn + MOTION.logoFade], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [CLOSING_TIMING.logoIn, CLOSING_TIMING.logoIn + MOTION.logoScale], [0.96, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
        }}
      />
    </>
  );
};
