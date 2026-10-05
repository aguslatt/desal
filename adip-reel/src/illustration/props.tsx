import React from "react";
import { COLORS } from "../config/brand.ts";
import { deg, ellipsePoly, mix, smoothClosedPath, type Pt } from "./geom.ts";
import { InkEllipse, InkStroke, handEllipsePoints } from "./ink.tsx";
import { ACCENTS, resolveColor } from "./palette.ts";
import { ScribbleFill } from "./scribble.tsx";
import { makePose, type PoseParams } from "./rig.ts";

/**
 * PROPS dibujados a mano: banco, silla de ruedas, bastón. Cada uno es un <svg> autónomo (overflow visible)
 * posicionado en el MUNDO. Convención: (x, y) = punto del SUELO bajo el centro del objeto; `scale` 1 = tamaño
 * de una persona adulta de 1050 u; `facing` −1 espeja. `drawProgress` 0..1 dibuja el objeto trazo a trazo.
 */

/** Altura del asiento del banco sobre el suelo (u de mundo a escala 1). */
export const SEAT_H = 296;
/** Geometría del banco (u de mundo a escala 1, relativa al punto del suelo bajo su centro). */
export const BENCH = {
  /** largo total del asiento */
  length: 800,
  /** y de la cara superior del asiento (negativo = arriba del suelo) */
  seatTop: -SEAT_H,
  /** grosor del tablón */
  thickness: 26,
} as const;

/** Posición (mundo) de la cadera sentada en el banco: `slot` en −1 (izquierda) … 1 (derecha) del largo útil. */
export const benchSeat = (bench: { x: number; y: number; scale?: number }, slot: number): { x: number; y: number } => {
  const k = bench.scale ?? 1;
  return { x: bench.x + slot * 215 * k, y: bench.y - (SEAT_H + 4) * k };
};
/** Anclas de asiento predefinidas: la protagonista a la izquierda, la amiga a su lado. */
export const BENCH_SLOTS = { protagonist: -1, friend: 0.92 } as const;

const part = (p: number, a: number, b: number): number => Math.max(0, Math.min(1, (p - a) / (b - a)));

type PropBase = {
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
  drawProgress?: number;
  seed?: number;
  style?: React.CSSProperties;
};

const Wrap: React.FC<PropBase & { children: React.ReactNode }> = ({ x, y, scale = 1, facing = 1, style, children }) => (
  <svg width={1} height={1} viewBox="0 0 1 1" style={{ position: "absolute", left: x, top: y, overflow: "visible", pointerEvents: "none", ...style }}>
    <g transform={`scale(${(scale * facing).toFixed(4)} ${scale.toFixed(4)})`}>{children}</g>
  </svg>
);

/** Banco (sin respaldo): tablón de asiento y dos patas, trazo de tinta con relleno de lápiz. */
export const Bench: React.FC<PropBase & { color?: string }> = (props) => {
  const { drawProgress: p = 1, seed = 5, color = "grey" } = props;
  const col = resolveColor(color, ACCENTS);
  const W = 14;
  const L = BENCH.length / 2;
  const top = BENCH.seatTop;
  const bot = top + BENCH.thickness;
  const plank: Pt[] = [
    [-L, top + 2],
    [-L * 0.5, top - 2],
    [L * 0.5, top - 1],
    [L, top + 3],
    [L - 6, bot + 2],
    [L * 0.5, bot - 1],
    [-L * 0.5, bot + 1],
    [-L + 5, bot - 2],
  ];
  const leg = (cx: number, s: number): React.ReactNode => (
    <g key={`leg${cx}`}>
      <InkStroke points={[[cx - 26, bot], [cx - 36, bot * 0.45], [cx - 34, 0]]} width={W} progress={part(p, 0.5 + s * 0.06, 0.82)} seed={seed + 3 + s} taperStart={4} endWidth={0.7} />
      <InkStroke points={[[cx + 26, bot], [cx + 34, bot * 0.45], [cx + 34, 0]]} width={W} progress={part(p, 0.55 + s * 0.06, 0.88)} seed={seed + 4 + s} taperStart={4} endWidth={0.7} />
      <InkStroke points={[[cx - 31, bot * 0.5], [cx + 31, bot * 0.5 + 4]]} width={W * 0.8} progress={part(p, 0.7, 0.95)} seed={seed + 5 + s} />
    </g>
  );
  return (
    <Wrap {...props}>
      {p > 0 ? (
        <>
          <path d={smoothClosedPath(plank)} fill={COLORS.cream} opacity={part(p, 0, 0.1) * 3} />
          <ScribbleFill polygon={plank} color={col} weight={7} density={0.85} angle={4} jitter={0.35} seed={seed} progress={part(p, 0.1, 0.5)} />
          <InkStroke points={plank.slice(0, 5)} width={W} progress={part(p, 0, 0.35)} seed={seed + 1} />
          <InkStroke points={[plank[4], plank[5], plank[6], plank[7], plank[0]]} width={W} progress={part(p, 0.05, 0.4)} seed={seed + 2} />
          {leg(-L * 0.72, 0)}
          {leg(L * 0.72, 1)}
        </>
      ) : null}
    </Wrap>
  );
};

/** Cotas de la silla de ruedas (u de mundo a escala 1, relativas al suelo bajo el eje trasero, mirando a +x). */
export const WHEELCHAIR = {
  rearWheel: { x: 0, y: -190, r: 190 },
  caster: { x: 250, y: -46, r: 46 },
  /** donde se apoya la cadera de quien se sienta (cara superior del asiento) */
  seat: { x: -8, y: -300 },
  /** donde apoyan los pies */
  footrest: { x: 330, y: -62 },
  /** aro de empuje donde apoyan las manos */
  handRim: { x: 20, y: -290 },
} as const;

/**
 * Silla de ruedas (de perfil, mira a +x). `roll` = giro de las ruedas en grados (deterministas: sumalo según
 * la distancia recorrida: roll = distancia / radio · 180/π). Las ruedas llevan rayos finos.
 */
export const Wheelchair: React.FC<PropBase & { roll?: number }> = (props) => {
  const { drawProgress: p = 1, seed = 9, roll = 0 } = props;
  const W = 13;
  const R = WHEELCHAIR.rearWheel;
  const C = WHEELCHAIR.caster;
  const spokes: React.ReactNode[] = [];
  const nSp = 14;
  for (let i = 0; i < nSp; i++) {
    const a = deg(roll + (360 * i) / nSp);
    spokes.push(
      <InkStroke
        key={`s${i}`}
        points={[
          [R.x + Math.cos(a) * 24, R.y + Math.sin(a) * 24],
          [R.x + Math.cos(a) * (R.r - 12), R.y + Math.sin(a) * (R.r - 12)],
        ]}
        width={2.6}
        progress={part(p, 0.3 + (i / nSp) * 0.3, 0.7 + (i / nSp) * 0.25)}
        seed={seed + 20 + i}
        taperStart={2}
        taperEnd={2}
        startWidth={0.8}
        endWidth={0.8}
        pressure={0.1}
        wobble={0.2}
        tremor={0.05}
      />,
    );
  }
  const casterSpokes = [0, 1, 2, 3, 4, 5].map((i) => {
    const a = deg(roll * 2.2 + 60 * i);
    return (
      <InkStroke key={`c${i}`} points={[[C.x, C.y], [C.x + Math.cos(a) * (C.r - 6), C.y + Math.sin(a) * (C.r - 6)]]} width={2.4} progress={part(p, 0.5, 0.9)} seed={seed + 40 + i} pressure={0} wobble={0.1} tremor={0.03} startWidth={1} endWidth={1} />
    );
  });
  return (
    <Wrap {...props}>
      {p > 0 ? (
        <>
          <InkEllipse cx={R.x} cy={R.y} rx={R.r} width={W} progress={part(p, 0, 0.35)} seed={seed} />
          <InkEllipse cx={R.x} cy={R.y} rx={R.r - 26} width={W * 0.45} progress={part(p, 0.1, 0.45)} seed={seed + 1} overlap={14} />
          <InkEllipse cx={R.x} cy={R.y} rx={11} width={W * 0.8} progress={part(p, 0.2, 0.5)} seed={seed + 2} />
          {spokes}
          <InkEllipse cx={C.x} cy={C.y} rx={C.r} width={W} progress={part(p, 0.3, 0.6)} seed={seed + 3} />
          {casterSpokes}
          {/* asiento + respaldo + empuñadura */}
          <InkStroke points={[[-60, -300], [60, -300], [170, -304]]} width={W} progress={part(p, 0.4, 0.7)} seed={seed + 4} />
          <InkStroke points={[[-60, -300], [-78, -420], [-92, -560], [-132, -566]]} width={W} progress={part(p, 0.45, 0.8)} seed={seed + 5} />
          {/* tubo del apoyapiés y horquilla del caster */}
          <InkStroke points={[[170, -304], [230, -210], [C.x, C.y - C.r + 4]]} width={W * 0.9} progress={part(p, 0.55, 0.85)} seed={seed + 6} />
          <InkStroke points={[[230, -210], [300, -120], [WHEELCHAIR.footrest.x, WHEELCHAIR.footrest.y]]} width={W * 0.8} progress={part(p, 0.6, 0.9)} seed={seed + 7} />
          <InkStroke points={[[WHEELCHAIR.footrest.x - 30, WHEELCHAIR.footrest.y + 4], [WHEELCHAIR.footrest.x + 40, WHEELCHAIR.footrest.y + 6]]} width={W * 0.9} progress={part(p, 0.7, 0.95)} seed={seed + 8} />
          <InkStroke points={[[-60, -296], [-10, -250], [R.x, R.y]]} width={W * 0.8} progress={part(p, 0.55, 0.85)} seed={seed + 9} />
        </>
      ) : null}
    </Wrap>
  );
};

/**
 * Pose de una persona sentada en la silla de ruedas (de perfil, mira a +x). Colocá la persona en el MISMO
 * (x, y) y `facing` que la silla. `k` = escala de la persona (altura/1000, p. ej. 1,05 para 1050 u).
 * Las manos apoyan en el aro de empuje; los pies en el apoyapiés.
 */
export const wheelchairPose = (k = 1.05, o: Partial<PoseParams> = {}): PoseParams =>
  makePose({
    hip: [WHEELCHAIR.seat.x / k, (WHEELCHAIR.seat.y - 4) / k],
    turn: 0.16,
    lean: 3,
    curl: 0.1,
    far: "L",
    footL: [(WHEELCHAIR.footrest.x - 14) / k, (WHEELCHAIR.footrest.y - 20) / k],
    footR: [(WHEELCHAIR.footrest.x + 14) / k, (WHEELCHAIR.footrest.y - 20) / k],
    footAngleL: 6,
    footAngleR: 6,
    handL: [(WHEELCHAIR.handRim.x - 6) / k, (WHEELCHAIR.handRim.y + 10) / k],
    handR: [(WHEELCHAIR.handRim.x + 22) / k, (WHEELCHAIR.handRim.y + 4) / k],
    elbowOut: 0,
    head: { tilt: 0, nod: 0, look: 0.6 },
    ...o,
  });

/** Bastón suelto (el de <Person accessories> sale de la mano de la figura; este es para ubicarlo a mano). */
export const Cane: React.FC<PropBase & { height?: number }> = (props) => {
  const { drawProgress: p = 1, seed = 13, height = 640 } = props;
  const hx = 0;
  const hy = -height;
  return (
    <Wrap {...props}>
      <InkStroke
        points={[[hx - 22, hy + 16], [hx - 12, hy - 2], [hx + 8, hy], [hx + 12, hy + 20], [hx + 8, hy + 44], mix([hx + 8, hy + 44], [hx + 14, 0], 0.5), [hx + 14, 0]]}
        width={12}
        progress={p}
        seed={seed}
        taperStart={6}
        endWidth={0.8}
        taperEnd={10}
      />
    </Wrap>
  );
};

export { handEllipsePoints, ellipsePoly };
