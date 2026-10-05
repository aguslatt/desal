import type React from "react";
import { CanvasImage, staticFile, useVideoConfig } from "remotion";
import { LOGO } from "../../config/brand.ts";
import { W } from "../../config/layout.ts";
import { LOGO_BOX, logoHeight } from "./geometry.ts";

/**
 * Logo oficial de Equipo ADIP (public/brand/logo-equipo-adip.png), centrado en x = 540 y SIN deformar:
 * el alto sale siempre de la relación original 734:326. Detrás, una luz blanca muy suave (la misma del cierre
 * del reel) que levanta los colores del isologotipo sobre la crema.
 */
export const CoverLogo: React.FC<{ readonly width?: number; readonly style?: React.CSSProperties }> = ({
  width = LOGO_BOX.width,
  style,
}) => {
  const { fps } = useVideoConfig();
  const height = logoHeight(width);
  const left = (W - width) / 2;
  const cy = LOGO_BOX.top + height / 2;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", ...style }}>
      <div
        style={{
          position: "absolute",
          left: W / 2 - 480,
          top: cy - 250,
          width: 960,
          height: 500,
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.42) 48%, rgba(255,255,255,0) 100%)",
        }}
      />
      <CanvasImage
        name="Logo oficial Equipo ADIP"
        src={staticFile(LOGO.file)}
        premountFor={fps}
        width={LOGO.width}
        height={LOGO.height}
        style={{ position: "absolute", left, top: LOGO_BOX.top, width, height }}
      />
    </div>
  );
};
