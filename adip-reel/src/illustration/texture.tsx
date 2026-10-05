import React from "react";
import { COLORS } from "../config/brand.ts";
import { mulberry32 } from "../lib/rng.ts";

/**
 * TEXTURA DE PAPEL — motas claras (el papel asoma entre el pigmento) que se superponen a los rellenos planos
 * para que se vean impresos/dibujados a mano, no vectoriales. Un solo <pattern> por figura (barato).
 * El patrón vive en las coordenadas de la figura: la textura escala con ella (sin «arrastrarse» al hacer zoom).
 */
export const GRAIN_TILE = 96;

export const dotsPathTile = (seed: number, tile: number, count: number, r0: number, r1: number, power: number): string => {
  const rnd = mulberry32(seed);
  let d = "";
  for (let i = 0; i < count; i++) {
    const r = r0 + (r1 - r0) * Math.pow(rnd(), power);
    const x = r1 + rnd() * (tile - 2 * r1);
    const y = r1 + rnd() * (tile - 2 * r1);
    d += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0Z`;
  }
  return d;
};

const LIGHT = dotsPathTile(515, GRAIN_TILE, 420, 0.3, 1.1, 2.6);

/** Definición del patrón de motas (id único por instancia). Uso: fill={`url(#${id})`}. */
export const GrainDefs: React.FC<{ id: string; opacity?: number }> = ({ id, opacity = 0.22 }) => (
  <defs>
    <pattern id={id} width={GRAIN_TILE} height={GRAIN_TILE} patternUnits="userSpaceOnUse">
      <path d={LIGHT} fill={COLORS.cream} opacity={opacity} />
    </pattern>
  </defs>
);
