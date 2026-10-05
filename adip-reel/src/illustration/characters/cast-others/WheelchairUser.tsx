import React from "react";
import { clamp01, deg, easeInOut, easeOut, lerp, smoothClosedPath, smoothstep, type Pt } from "../../geom.ts";
import { InkEllipse, InkStroke } from "../../ink.tsx";
import { noise1 } from "../../noise.ts";
import { WHEELCHAIR } from "../../props.tsx";
import { ScribbleFill } from "../../scribble.tsx";
import { applyIdle, wheelchairPoseRU, type PoseParams } from "./poses.ts";
import {
  GroupSvg,
  boxToWorld,
  buildMember,
  drawAt,
  localToWorld,
  memberJoint,
  memberPoint,
  useGid,
  withElbow,
  DEFAULT_DRAW_FRAMES,
  type CastAnchors,
  type CastBaseProps,
  type CastBox,
  type Member,
} from "./common.tsx";
import type { FigureSpec } from "./figure.tsx";

/**
 * (2) UNA PERSONA EN SILLA DE RUEDAS — de perfil (3/4), hacia +x. La silla tiene ruedas con rayos finos que giran
 * de verdad (la distancia recorrida = radio × ángulo: no patinan); las manos se agarran al aro, empujan despacio
 * y vuelven; entre impulsos el cuerpo queda en reposo (respira, mira alrededor). Llega rodando unos metros y se
 * detiene; al final hace un impulso mínimo, solo para mantener la vida de la imagen.
 */
export const WHEELCHAIR_USER_SPEC: FigureSpec = {
  kind: "adult",
  build: "regular",
  height: 900,
  skin: "dark",
  hair: { style: "cropped", color: "black" },
  top: { type: "jacket", color: "green", fill: "hatch", sleeves: "filled" },
  legs: { type: "trousers", color: "ink", fill: "solid" },
  shoes: "ink",
  face: "dots",
  seed: 21,
  ink: 1.0,
};

const K = 0.9; // altura/1000 de la persona
const CS = K / 1.05; // escala de la silla respecto de sus cotas (pensadas para 1,05)
const AXLE: Pt = [0, WHEELCHAIR.rearWheel.y * CS]; // eje de la rueda trasera (u locales)
const R_WHEEL = WHEELCHAIR.rearWheel.r * CS; // radio de la rueda (u)
const R_HAND = 146 * CS; // radio del aro de empuje donde agarran las manos (u)

export const WHEELCHAIR_BOX: CastBox = { x0: -178, y0: -668, x1: 368, y1: 10 };

export type PushSpec = {
  /** fotogramas desde `moveFrom` en que arranca el impulso */
  at: number;
  /** giro de la rueda en grados durante el impulso (≈ 30° = 85 u de avance) */
  deg: number;
};

export type WheelchairUserProps = CastBaseProps & {
  /** impulsos: los grados suman el recorrido total hasta el reposo */
  pushes?: readonly PushSpec[];
  /** fotograma en que da el primer impulso (por defecto: al terminar de dibujarse) */
  moveFrom?: number;
};

export const DEFAULT_PUSHES: readonly PushSpec[] = [
  { at: 8, deg: 28 },
  { at: 80, deg: 26 },
  { at: 150, deg: 18 },
  { at: 250, deg: 8 },
];

const STROKE = 20; // fotogramas de empuje
const COAST = 28; // fotogramas de inercia tras soltar
const COAST_DEG = 0.22; // fracción extra de giro por inercia

/** Giro acumulado de la rueda (grados) y estado del impulso en curso. */
const rollAt = (pushes: readonly PushSpec[], t: number): { roll: number; total: number; stroke: number; release: number; active: number; grip0: number; sinceEnd: number } => {
  let roll = 0;
  let total = 0;
  let stroke = 0;
  let release = 0;
  let active = -1;
  let sinceEnd = 999;
  for (let i = 0; i < pushes.length; i++) {
    const p = pushes[i];
    const extra = p.deg * COAST_DEG;
    total += p.deg + extra;
    const a = easeInOut(clamp01((t - p.at) / STROKE));
    const c = easeOut(clamp01((t - p.at - STROKE) / COAST));
    roll += p.deg * a + extra * c;
    if (t >= p.at && t <= p.at + STROKE + COAST + 16) {
      active = i;
      stroke = clamp01((t - p.at) / STROKE);
      release = clamp01((t - p.at - STROKE) / COAST);
    }
    if (t >= p.at + STROKE) sinceEnd = Math.min(sinceEnd, t - p.at - STROKE);
  }
  return { roll, total, stroke, release, active, grip0: 26, sinceEnd };
};

type State = { person: Member; roll: number; off: number; handsU: Pt[]; push: number; lean: number };

const compute = (p: WheelchairUserProps, frame: number): State => {
  const draw = drawAt(frame, p.appearFrom, p.drawFrames);
  const pushes = p.pushes ?? DEFAULT_PUSHES;
  const moveFrom = p.moveFrom ?? p.appearFrom + (p.drawFrames ?? DEFAULT_DRAW_FRAMES) - 8;
  const t = frame - moveFrom;
  const st = rollAt(pushes, t);
  const seed = p.seed ?? 0;
  const idle = p.idle ?? 1;
  const dist = (st.total * Math.PI) / 180 * R_WHEEL;
  const rolled = (st.roll * Math.PI) / 180 * R_WHEEL;
  const off = -(dist - rolled);

  // ángulo (desde la parte superior del aro, + hacia adelante) al que están las manos. Ciclo de cada impulso:
  // preparación (la mano va atrás, despegada del aro) → empuje (la mano viaja con el aro) → suelta y vuelve al reposo.
  const grip0 = 26;
  const WIND = 14;
  const start0 = grip0 - 12;
  let handAng = grip0;
  let handLift = 0;
  let push = 0;
  for (let i = 0; i < pushes.length; i++) {
    const q = pushes[i];
    const tEnd = q.at + STROKE + COAST;
    if (t >= q.at - WIND && t < tEnd) {
      if (t < q.at) {
        const w = easeInOut((t - (q.at - WIND)) / WIND);
        handAng = lerp(grip0, start0, w);
        handLift = Math.sin(Math.PI * w) * 20;
        push = -0.25 * w;
      } else if (t < q.at + STROKE) {
        const sP = (t - q.at) / STROKE;
        handAng = start0 + q.deg * easeInOut(sP);
        push = -0.25 * (1 - sP) + Math.sin(Math.PI * sP) * 0.9 + sP * 0.1;
      } else {
        const rP = (t - q.at - STROKE) / COAST;
        const back = easeInOut(clamp01(rP * 1.1));
        handAng = lerp(start0 + q.deg, grip0, back);
        handLift = Math.sin(Math.PI * back) * 24;
        push = (1 - back) * 0.12;
      }
    }
  }
  void seed;

  const gripPt = (angDeg: number, lift: number): Pt => {
    const a = deg(angDeg);
    const r = R_HAND + lift;
    return [AXLE[0] + r * Math.sin(a), AXLE[1] - r * Math.cos(a)];
  };
  const gU = gripPt(handAng, handLift);
  const gF = gripPt(handAng + 5, handLift);

  const base = wheelchairPoseRU();
  const breath = idle > 0 ? 1 : 0;
  let pose: PoseParams = {
    ...base,
    lean: base.lean + 2 + 5 * push,
    curl: base.curl + 0.16 + 0.12 * push,
    head: {
      tilt: Math.sin(frame / 90 + 1) * 1.2 * idle - 2 * push,
      nod: 0.05 + 0.1 * push + 0.05 * noise1(seed + 411, frame / 150),
      look: lerp(0.55, 0.9, smoothstep(-0.3, 0.6, noise1(seed + 412, frame / 210))),
    },
    // los puntos de agarre (u) → RU de la persona (origen en el suelo bajo el eje)
    handR: [(gU[0] - 8) / K, (gU[1] + 2) / K],
    handL: [(gF[0] - 18) / K, (gF[1] + 4) / K],
  };
  if (breath) pose = { ...applyIdle(pose, frame, 21 + seed, idle * 0.8), hip: pose.hip }; // la cadera no se desliza sobre el asiento
  // el movimiento de reposo no debe desplazar las manos agarradas al aro
  pose = { ...pose, handR: [(gU[0] - 8) / K, (gU[1] + 2) / K], handL: [(gF[0] - 18) / K, (gF[1] + 4) / K] };
  // brazos: el codo cuelga bajo el hombro y el antebrazo va hacia el aro (escorzo), no «hacia atrás»
  pose = withElbow(WHEELCHAIR_USER_SPEC, pose, "R", [-22 + 14 * push, 168]);
  pose = withElbow(WHEELCHAIR_USER_SPEC, pose, "L", [-34, 160]);

  const person: Member = { spec: WHEELCHAIR_USER_SPEC, pose, x: off, progress: draw, frame, seed };
  return { person, roll: st.roll, off, handsU: [[gU[0] + off, gU[1]]], push, lean: 0 };
};

const ChairArt: React.FC<{ roll: number; progress: number; seed?: number; bagSway?: number }> = ({ roll, progress: p, seed = 9, bagSway = 0 }) => {
  const R = WHEELCHAIR.rearWheel;
  const C = WHEELCHAIR.caster;
  const W = 13;
  const part = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
  const spokes: React.ReactNode[] = [];
  const nSp = 12;
  for (let i = 0; i < nSp; i++) {
    const a = deg(roll + (360 * i) / nSp);
    spokes.push(
      <InkStroke
        key={`s${i}`}
        points={[
          [R.x + Math.cos(a) * 22, R.y + Math.sin(a) * 22],
          [R.x + Math.cos(a) * (R.r - 14), R.y + Math.sin(a) * (R.r - 14)],
        ]}
        width={2.8}
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
  // valvula / marca en el neumático que gira (se ve que la rueda rueda)
  const va = deg(roll - 60);
  const valve: Pt = [R.x + Math.cos(va) * (R.r - 8), R.y + Math.sin(va) * (R.r - 8)];
  const casterSpokes = [0, 1, 2, 3, 4].map((i) => {
    const a = deg(roll * 3.9 + 72 * i);
    return <InkStroke key={`c${i}`} points={[[C.x, C.y], [C.x + Math.cos(a) * (C.r - 7), C.y + Math.sin(a) * (C.r - 7)]]} width={2.4} progress={part(p, 0.5, 0.9)} seed={seed + 40 + i} pressure={0} wobble={0.1} tremor={0.03} startWidth={1} endWidth={1} />;
  });
  const seat: Pt[] = [
    [-72, -304],
    [-72, -286],
    [172, -290],
    [176, -308],
  ];
  // bolsito colgado de la empuñadura: se balancea cuando la silla acelera
  const bag: Pt[] = [
    [-150, -552],
    [-118, -552],
    [-106, -484],
    [-120, -440],
    [-158, -444],
    [-172, -490],
  ];
  return (
    <g>
      <g transform={`rotate(${bagSway.toFixed(2)} -134 -562)`}>
        <path d={smoothClosedPath(bag)} fill="#FFF6E7" opacity={part(p, 0.6, 0.8)} />
        <ScribbleFill polygon={bag} color="#8A00B7" weight={7} density={0.9} angle={64} seed={seed + 60} progress={part(p, 0.6, 0.95)} jitter={0.3} />
        <InkStroke points={[...bag, bag[0]]} width={W * 0.8} progress={part(p, 0.55, 0.9)} seed={seed + 61} />
        <InkStroke points={[[-148, -552], [-140, -586], [-124, -552]]} width={W * 0.55} progress={part(p, 0.6, 0.9)} seed={seed + 62} />
      </g>
      {/* asiento con almohadón */}
      <ScribbleFill polygon={seat} color="#BDB8AE" weight={7} density={0.8} angle={4} seed={seed + 50} progress={part(p, 0.35, 0.65)} jitter={0.3} />
      <InkEllipse cx={R.x} cy={R.y} rx={R.r} width={W} progress={part(p, 0, 0.35)} seed={seed} />
      <InkEllipse cx={R.x} cy={R.y} rx={R.r - 26} width={W * 0.45} progress={part(p, 0.1, 0.45)} seed={seed + 1} overlap={14} />
      <InkEllipse cx={R.x} cy={R.y} rx={11} width={W * 0.8} progress={part(p, 0.2, 0.5)} seed={seed + 2} />
      {spokes}
      {p > 0.5 ? <circle cx={valve[0]} cy={valve[1]} r={5} fill="#000" /> : null}
      <InkEllipse cx={C.x} cy={C.y} rx={C.r} width={W} progress={part(p, 0.3, 0.6)} seed={seed + 3} />
      {casterSpokes}
      <InkStroke points={[[-62, -298], [62, -298], [172, -302]]} width={W} progress={part(p, 0.4, 0.7)} seed={seed + 4} />
      <InkStroke points={[[-62, -298], [-80, -420], [-94, -556], [-136, -562]]} width={W} progress={part(p, 0.45, 0.8)} seed={seed + 5} />
      <InkStroke points={[[172, -302], [232, -210], [C.x, C.y - C.r + 4]]} width={W * 0.9} progress={part(p, 0.55, 0.85)} seed={seed + 6} />
      <InkStroke points={[[232, -210], [304, -118], [WHEELCHAIR.footrest.x, WHEELCHAIR.footrest.y]]} width={W * 0.8} progress={part(p, 0.6, 0.9)} seed={seed + 7} />
      <InkStroke points={[[WHEELCHAIR.footrest.x - 30, WHEELCHAIR.footrest.y + 4], [WHEELCHAIR.footrest.x + 40, WHEELCHAIR.footrest.y + 6]]} width={W * 0.9} progress={part(p, 0.7, 0.95)} seed={seed + 8} />
      <InkStroke points={[[-62, -294], [-10, -250], [R.x, R.y]]} width={W * 0.8} progress={part(p, 0.55, 0.85)} seed={seed + 9} />
    </g>
  );
};

export const wheelchairUserAnchors = (p: WheelchairUserProps, frame: number = p.frame): CastAnchors => {
  const s = compute(p, frame);
  const w = (q: Pt): Pt => localToWorld(p, q);
  return {
    head: w(memberJoint(s.person, "headC")),
    chest: w(memberPoint(s.person, [20, -690])),
    hands: [w(s.handsU[0])],
    feet: w([s.off + 120, 0]),
    bounds: boxToWorld(p, { x0: WHEELCHAIR_BOX.x0 + s.off, y0: WHEELCHAIR_BOX.y0, x1: WHEELCHAIR_BOX.x1 + s.off, y1: WHEELCHAIR_BOX.y1 }),
  };
};

/** Recorrido total (u locales) de la silla desde la posición de salida hasta el reposo. */
export const wheelchairTravel = (pushes: readonly PushSpec[] = DEFAULT_PUSHES): number =>
  pushes.reduce((a, q) => a + q.deg * (1 + COAST_DEG), 0) * (Math.PI / 180) * R_WHEEL;

export const WheelchairUser: React.FC<WheelchairUserProps> = (props) => {
  const { frame, style } = props;
  const gid = useGid();
  const draw = drawAt(frame, props.appearFrom, props.drawFrames);
  if (draw <= 0) return null;
  const s = compute(props, frame);
  const m = buildMember(s.person, gid, "w");
  return (
    <GroupSvg placement={props} gid={gid} style={style}>
      <g transform={`translate(${s.off.toFixed(2)} 0) scale(${CS.toFixed(4)})`}>
        <ChairArt roll={s.roll} progress={draw} seed={9 + (props.seed ?? 0)} bagSway={-7 * s.push + 1.2 * Math.sin(props.frame / 50)} />
      </g>
      {m.behind}
      {m.body}
      {m.hands}
    </GroupSvg>
  );
};

void lerp;
