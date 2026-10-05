import React, { useId } from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "../config/brand.ts";
import { mulberry32 } from "../lib/rng.ts";
import { useCamera } from "../world/cameraContext.ts";

/**
 * PAPEL — fondo crema (#FFF6E7) con un grano apenas perceptible (motas y fibras diminutas en un patrón
 * que se repite: barato, sin filtros). Va POR DEBAJO del mundo, fijo a la pantalla; `parallax` lo desliza un
 * poco con la cámara para que no se sienta como un fondo muerto.
 */
const TILE = 256;

const buildSpecks = (): { dark: string; light: string; fibers: string } => {
  const rnd = mulberry32(4242);
  let dark = "";
  let light = "";
  let fibers = "";
  for (let i = 0; i < 420; i++) {
    const r = 0.45 + rnd() * rnd() * 1.1;
    const x = 2 + rnd() * (TILE - 4);
    const y = 2 + rnd() * (TILE - 4);
    dark += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0Z`;
  }
  for (let i = 0; i < 300; i++) {
    const r = 0.5 + rnd() * rnd() * 1.3;
    const x = 2 + rnd() * (TILE - 4);
    const y = 2 + rnd() * (TILE - 4);
    light += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0Z`;
  }
  for (let i = 0; i < 22; i++) {
    const x = 14 + rnd() * (TILE - 40);
    const y = 14 + rnd() * (TILE - 40);
    const a = rnd() * Math.PI * 2;
    const l = 6 + rnd() * 12;
    const bend = (rnd() - 0.5) * 6;
    fibers += `M${x.toFixed(1)} ${y.toFixed(1)}q${(Math.cos(a) * l * 0.5 + bend).toFixed(1)} ${(Math.sin(a) * l * 0.5 - bend).toFixed(1)} ${(Math.cos(a) * l).toFixed(1)} ${(Math.sin(a) * l).toFixed(1)}`;
  }
  return { dark, light, fibers };
};
const SPECKS = buildSpecks();

type PaperProps = {
  /** intensidad del grano 0..1 (por defecto 1: apenas perceptible). */
  grain?: number;
  /** cuánto sigue el grano a la cámara (0 = fijo a pantalla). Por defecto 0.1. */
  parallax?: number;
  color?: string;
  style?: React.CSSProperties;
};

export const Paper: React.FC<PaperProps> = ({ grain = 1, parallax = 0.1, color = COLORS.cream, style }) => {
  const cam = useCamera();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ox = -(cam.cx * parallax);
  const oy = -(cam.cy * parallax);
  return (
    <AbsoluteFill style={{ backgroundColor: color, ...style }}>
      {grain > 0 ? (
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <pattern id={`p${id}`} width={TILE} height={TILE} patternUnits="userSpaceOnUse" patternTransform={`translate(${ox.toFixed(1)} ${oy.toFixed(1)})`}>
              <path d={SPECKS.dark} fill="#5C4528" opacity={0.085 * grain} />
              <path d={SPECKS.light} fill="#FFFFFF" opacity={0.55 * grain} />
              <path d={SPECKS.fibers} fill="none" stroke="#6B5334" strokeWidth={0.6} strokeLinecap="round" opacity={0.07 * grain} />
            </pattern>
          </defs>
          <rect width={1080} height={1920} fill={`url(#p${id})`} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
