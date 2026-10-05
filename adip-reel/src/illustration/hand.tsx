import React from "react";
import { clamp01, deg, lerp, mix, type Pt } from "./geom.ts";
import { InkStroke } from "./ink.tsx";
import { Blob } from "./scribble.tsx";

/**
 * MANO DE LA AMIGA — mano dibujada a mano que se abre: de relajada (dedos juntos, pulgar pegado) a abierta con la
 * palma hacia arriba (dedos largos y apenas curvados, pulgar separado), como en un gesto de ofrecer.
 * Se define en un marco local (x a lo largo de los dedos, y perpendicular; y negativo = lado del pulgar) en unidades
 * de largo de mano y se lleva al rig con la muñeca, el ángulo de los dedos y el largo.
 */
type Poly = readonly Pt[];

// 14 vértices con la misma topología en las dos formas, para poder mezclarlas
const RELAXED: Poly = [
  [0, 0.2], // muñeca, borde inferior
  [0.3, 0.26], // dorso
  [0.62, 0.24], // nudillos
  [0.9, 0.12], // dedos curvados (punta inferior)
  [0.98, -0.02], // punta
  [0.88, -0.14], // punta superior
  [0.66, -0.17], // lomo de los dedos
  [0.5, -0.2], // unión del pulgar
  [0.64, -0.27], // pulgar pegado: borde externo
  [0.62, -0.33], // punta del pulgar
  [0.5, -0.34],
  [0.4, -0.27], // base del pulgar
  [0.12, -0.24], // muñeca, borde superior
  [0, -0.18],
];
const OPEN: Poly = [
  [0, 0.19],
  [0.34, 0.25],
  [0.7, 0.19],
  [0.98, 0.07], // punta inferior
  [1.1, -0.06], // punta (dedos largos, apenas hacia arriba)
  [1.0, -0.17],
  [0.72, -0.15],
  [0.56, -0.17], // unión del pulgar
  [0.84, -0.4], // pulgar abierto: borde externo
  [0.84, -0.55], // punta redondeada
  [0.68, -0.58],
  [0.48, -0.36], // base del pulgar
  [0.14, -0.22],
  [0, -0.18],
];

const mixPoly = (a: Poly, b: Poly, t: number): Pt[] => a.map((p, i) => mix(p, b[i], t));

export type FriendHandProps = {
  /** muñeca (rig, RU) */
  wrist: Pt;
  /** dirección de los dedos en grados del rig (0 = +x, 90 = hacia abajo) */
  angle: number;
  /** 0 = relajada … 1 = abierta */
  open: number;
  /** largo de la mano en RU */
  len?: number;
  skin: string;
  /** grosor de tinta en RU */
  ink: number;
  seed: number;
  /** 0..1 dibujo progresivo */
  progress?: number;
  grainId?: string;
  /** invierte el lado del pulgar (mano contraria) */
  flip?: boolean;
};

export const FriendHand: React.FC<FriendHandProps> = ({ wrist, angle, open, len = 60, skin, ink, seed, progress = 1, grainId, flip }) => {
  if (progress <= 0) return null;
  const o = clamp01(open);
  const local = mixPoly(RELAXED, OPEN, o);
  const a = deg(angle);
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const s = flip ? -1 : 1;
  const toRig = (p: Pt): Pt => [wrist[0] + (dx * p[0] - dy * p[1] * s) * len, wrist[1] + (dy * p[0] + dx * p[1] * s) * len];
  const ps = local.map(toRig);
  const line = ink * 0.74 * 0.8;
  const p = clamp01(progress);
  // dedos: tres rayitas que se ven al abrirse
  const fingerLines: React.ReactNode[] = [];
  if (o > 0.35) {
    const k = clamp01((o - 0.35) / 0.4);
    const ys = [-0.06, 0.04, 0.13];
    ys.forEach((yy, i) => {
      const p0 = toRig([lerp(0.6, 0.66, i / 2), yy + 0.01]);
      const p1 = toRig([lerp(0.96, 1.0, 1 - Math.abs(i - 1) * 0.5), yy + (i - 1) * 0.015]);
      fingerLines.push(<InkStroke key={`f${i}`} points={[p0, p1]} width={line * 0.62} seed={seed + 7 + i} taperStart={3} taperEnd={4} startWidth={0.5} endWidth={0.3} pressure={0.1} opacity={k * 0.9} />);
    });
  } else {
    // pulgar pegado: una raya corta
    fingerLines.push(<InkStroke key="th" points={[toRig([0.34, -0.2]), toRig([0.58, -0.12])]} width={line * 0.55} seed={seed + 9} taperStart={3} taperEnd={4} startWidth={0.5} endWidth={0.3} pressure={0.1} opacity={0.8} />);
  }
  return (
    <g>
      <Blob polygon={ps} color={skin} opacity={0.96 * clamp01(p * 3)} seed={seed} rough={1.2} grain={grainId} />
      <InkStroke points={[...ps, ps[0], ps[1]]} width={line} progress={p} seed={seed + 1} taperStart={8} taperEnd={10} startWidth={0.6} endWidth={0.5} pressure={0.2} />
      {fingerLines}
    </g>
  );
};
