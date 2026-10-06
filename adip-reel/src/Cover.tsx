import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { COLORS, LOGO } from "./config/brand.ts";
import { CoverText } from "./cover/CoverText.tsx";
import { LOGO_BOX } from "./cover/layout.ts";
import { CoverScene } from "./cover/Scene.tsx";
import "./lib/fonts.ts";

/**
 * PORTADA independiente (Still «Cover», 1080×1920, PNG) — misma dirección visual que el reel v2:
 * ilustración editorial de trazo manual sobre papel crema, el hilo naranja que nace del cursor del mensaje SIN ENVIAR,
 * la protagonista con su celular, figuras pequeñas del reparto en los bordes, título en Montserrat y logo oficial.
 * Estática y determinista (todo se calcula del fotograma fijo; sin CSS animation).
 */
export const Cover: React.FC<{ readonly style?: React.CSSProperties }> = ({ style }) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.cream, ...style }}>
    <CoverScene />
    <CoverText />
    <Img
      src={staticFile(LOGO.file)}
      alt="Equipo ADIP"
      style={{ position: "absolute", left: LOGO_BOX.left, top: LOGO_BOX.top, width: LOGO_BOX.width, height: LOGO_BOX.height }}
    />
  </AbsoluteFill>
);
