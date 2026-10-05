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

// 34 vértices con la misma topología en las dos formas, para poder mezclarlas (ver el esquema en el README):
// 0–1 muñeca/palma · 2–6 meñique · 7 hueco · 8–11 anular · 12 hueco · 13–16 mayor · 17 hueco · 18–22 índice · 23–24 membrana · 25–30 pulgar · 31–33 muñeca
const RELAXED: Poly = [
  [0, 0.2], [0.3, 0.26], [0.58, 0.25], [0.76, 0.22], [0.88, 0.17], [0.94, 0.1], [0.9, 0.05],
  [0.8, 0.06],
  [0.9, 0.04], [0.97, 0.0], [0.98, -0.04], [0.93, -0.07],
  [0.84, -0.065],
  [0.92, -0.085], [0.98, -0.11], [0.99, -0.15], [0.94, -0.18],
  [0.86, -0.175],
  [0.9, -0.19], [0.93, -0.22], [0.93, -0.25], [0.88, -0.27], [0.78, -0.26],
  [0.64, -0.23], [0.58, -0.25],
  [0.64, -0.3], [0.66, -0.34], [0.62, -0.38], [0.55, -0.37], [0.48, -0.33], [0.38, -0.3],
  [0.24, -0.25], [0.08, -0.22], [0, -0.18],
];
const OPEN: Poly = [
  [0, 0.2], [0.3, 0.25], [0.56, 0.24], [0.74, 0.225], [0.88, 0.2], [0.95, 0.15], [0.89, 0.1],
  [0.78, 0.105],
  [0.9, 0.085], [0.99, 0.06], [1.01, 0.01], [0.95, -0.03],
  [0.84, -0.03],
  [0.96, -0.05], [1.05, -0.075], [1.08, -0.12], [1.02, -0.17],
  [0.88, -0.17],
  [0.95, -0.19], [1.0, -0.23], [1.0, -0.28], [0.93, -0.3], [0.8, -0.27],
  [0.64, -0.23], [0.58, -0.27],
  [0.72, -0.38], [0.8, -0.5], [0.76, -0.57], [0.66, -0.55], [0.52, -0.42], [0.38, -0.32],
  [0.24, -0.26], [0.08, -0.22], [0, -0.18],
];
/** rayas entre dedos: del hueco (vértice) hacia los nudillos */
const GAPS: readonly [number, number][] = [
  [7, 0.62],
  [12, 0.66],
  [17, 0.7],
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
  const line = ink * 0.74 * 0.62;
  const p = clamp01(progress);
  // dedos: rayas desde cada hueco hacia los nudillos (más marcadas al abrirse) y una raya del pulgar
  const fingerLines: React.ReactNode[] = GAPS.map(([vi, endX], i) => {
    const p0 = toRig(local[vi]);
    const p1 = toRig([endX, local[vi][1] * 0.92]);
    return <InkStroke key={`f${i}`} points={[p0, p1]} width={line * 0.55} seed={seed + 7 + i} taperStart={2} taperEnd={5} startWidth={0.7} endWidth={0.2} pressure={0.1} opacity={0.55 + 0.4 * o} />;
  });
  fingerLines.push(<InkStroke key="th" points={[toRig(local[24]), toRig([0.4, lerp(-0.2, -0.24, o)]), toRig([0.3, -0.16])]} width={line * 0.5} seed={seed + 9} taperStart={2} taperEnd={4} startWidth={0.6} endWidth={0.25} pressure={0.1} opacity={0.7} />);
  return (
    <g>
      <Blob polygon={ps} color={skin} opacity={0.96 * clamp01(p * 3)} seed={seed} rough={1.2} grain={grainId} />
      <InkStroke points={[...ps, ps[0], ps[1]]} width={line} progress={p} seed={seed + 1} taperStart={8} taperEnd={10} startWidth={0.6} endWidth={0.5} pressure={0.2} />
      {fingerLines}
    </g>
  );
};
