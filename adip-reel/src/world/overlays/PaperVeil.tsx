import type React from "react";
import { COLORS } from "../../config/brand.ts";

/**
 * VELO DE PAPEL: una placa crema de bordes difuminados (máscara de degradés, sin filtros) que va entre el mundo y el texto
 * cuando el dibujo invade la franja de texto (escena 1: el acercamiento mete la cabeza y el celular detrás del gancho).
 * Sobre el papel vacío es invisible (crema sobre crema); sobre el dibujo lo apaga lo justo para que el texto se lea.
 */
type Props = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  /** ancho del degradé de los bordes (px) */
  readonly feather: number;
  readonly opacity: number;
};

export const PaperVeil: React.FC<Props> = ({ left, top, width, height, feather, opacity }) => {
  if (opacity <= 0.003) return null;
  const f = feather;
  const mask = `linear-gradient(to right, transparent 0, #000 ${f}px, #000 ${width - f}px, transparent ${width}px), linear-gradient(to bottom, transparent 0, #000 ${f}px, #000 ${height - f}px, transparent ${height}px)`;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        background: COLORS.cream,
        opacity,
        maskImage: mask,
        WebkitMaskImage: mask,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
        pointerEvents: "none",
      }}
    />
  );
};
