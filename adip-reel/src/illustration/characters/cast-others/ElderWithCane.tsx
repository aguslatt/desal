import React from "react";
import { clamp01, easeInOut, lerp, smoothstep, type Pt } from "../../geom.ts";
import { InkStroke } from "../../ink.tsx";
import { noise1 } from "../../noise.ts";
import { applyIdle, lerpPose, standSide, walkSide, type PoseParams } from "./poses.ts";
import {
  GroupSvg,
  boxToWorld,
  buildMember,
  drawAt,
  localToRig,
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
import { gaitAt, gaitDistance, gaitFrames } from "./gait.ts";

/**
 * (3) UNA PERSONA MAYOR CON BASTÓN — de perfil (3/4), hacia +x. Andar pausado: pasos cortos, el bastón avanza una
 * vez por ciclo (se levanta y se vuelve a apoyar delante, nunca patina), postura erguida pero suave (espalda
 * apenas redondeada), pelo canoso recogido, anteojos. Llega, se detiene sobre el bastón y mira alrededor.
 */
export const ELDER_SPEC: FigureSpec = {
  kind: "elder",
  build: "regular",
  height: 870,
  skin: "porcelain",
  hair: { style: "bun", color: "silver" },
  top: { type: "coat", color: "violet", fill: "hatch", sleeves: "filled" },
  legs: { type: "bare" },
  shoes: "ink",
  face: "dots",
  accessories: [{ type: "glasses" }],
  seed: 31,
  ink: 1.05,
};

const STRIDE = 50;
const K = 0.87;
export const ELDER_BOX: CastBox = { x0: -98, y0: -880, x1: 128, y1: 10 };

export type ElderWithCaneProps = CastBaseProps & {
  /** pasos hasta el reposo (medios ciclos, siempre PAR: el bastón avanza una vez por ciclo); 2 = ≈ 180 u a escala 1 */
  steps?: number;
  /** fotograma en que da el primer paso */
  walkFrom?: number;
  /** fotogramas por ciclo de 2 pasos a ritmo de crucero (muy pausado: 88) */
  cycleFrames?: number;
};

const defaults = (p: ElderWithCaneProps) => {
  const draw = p.drawFrames ?? DEFAULT_DRAW_FRAMES;
  return { steps: Math.max(2, Math.round((p.steps ?? 2) / 2) * 2), walkFrom: p.walkFrom ?? p.appearFrom + draw - 4, cycleFrames: p.cycleFrames ?? 88 };
};

export const elderTravel = (steps = 2): number => gaitDistance(Math.max(2, Math.round(steps / 2) * 2), STRIDE, ELDER_SPEC.height ?? 870);

type State = { elder: Member; off: number; tip: Pt; grip: Pt; walk: number };

const compute = (p: ElderWithCaneProps, frame: number): State => {
  const { steps, walkFrom, cycleFrames } = defaults(p);
  const draw = drawAt(frame, p.appearFrom, p.drawFrames);
  const g = gaitAt({ start: walkFrom, steps, frames: gaitFrames(steps, cycleFrames) }, frame);
  const D = gaitDistance(steps, STRIDE, ELDER_SPEC.height ?? 870);
  const off = -D * (1 - g.s);
  const idle = (p.idle ?? 1) * (1 - g.walk);
  const seed = p.seed ?? 0;

  // pies de reposo coherentes con la marcha (sin patinar al arrancar/frenar): el pie izquierdo apoya SIEMPRE bajo la cadera (como en la fase
  // inicial del ciclo, p0 = 0,25) y el derecho (que da el primer paso) sale desde atrás y termina el último paso adelante
  const standP = standSide({ turn: 0.34, lean: 3, curl: 0.2, footL: [0, -38], footR: [g.t < 0.5 ? -40 : 40, -38], shoulderTilt: -1, head: { tilt: 2, nod: 0.12, look: 0.55 } });
  const walkP = walkSide(g.phase, { stride: STRIDE, lift: 26, swing: 12, lean: 5 });
  let pose: PoseParams = lerpPose(standP, { ...walkP, turn: 0.34, curl: 0.2, head: { tilt: 2, nod: 0.14, look: 0.55 } }, g.walk);
  pose = applyIdle(pose, frame, 31 + seed, idle * 0.9);

  // mira alrededor con calma: la cabeza gira un poco hacia atrás y vuelve
  const around = smoothstep(0.1, 0.7, noise1(seed + 331, frame / 170));
  pose = { ...pose, head: { tilt: pose.head.tilt + lerp(0, 3, around), nod: lerp(0.1, 0.18, around), look: lerp(0.62, 0.15, around * (1 - g.walk)) } };

  // bastón: la mano derecha lo sostiene a la altura de la cadera; la punta se apoya y avanza una vez por ciclo
  const cycleU = 4 * STRIDE * K;
  const X = (c: number): number => -D + c * cycleU;
  const aheadStand = 112; // u: la punta, delante de la figura en reposo
  const A = aheadStand - 0.25 * cycleU;
  const c = g.cycles;
  const m = Math.floor(c - 0.25);
  const u = (c - 0.25 - m) / 0.5;
  const P = (n: number): number => X(n + 0.25) + A;
  let tipX: number;
  let tipLift = 0;
  if (c < 0.25) tipX = P(0);
  else if (u >= 1) tipX = P(m + 1);
  else {
    const e = easeInOut(u);
    tipX = lerp(P(m), P(m + 1), e);
    tipLift = Math.sin(Math.PI * u) * 34;
  }
  tipX = Math.min(tipX, P(Math.floor(steps / 2 - 0.25) + 1));
  const elderM: Member = { spec: ELDER_SPEC, pose, x: off, progress: draw, frame, seed };
  const bob = 4 * Math.sin(g.phase * Math.PI * 4) * g.walk;
  const gripU: Pt = [off + 62, -446 - bob];
  pose = { ...pose, handR: localToRig(elderM, [gripU[0] + 4, gripU[1] + 26]), elbowR: null };
  pose = withElbow(ELDER_SPEC, pose, "R", [-14, 162]);
  // el brazo lejano queda detrás del torso (no asoma el codo por la espalda)
  pose = withElbow(ELDER_SPEC, { ...pose, handL: [pose.handL[0] * 0.2 - 4, -560] }, "L", [-4, 150]);
  elderM.pose = pose;
  return { elder: elderM, off, tip: [tipX, -tipLift], grip: gripU, walk: g.walk };
};

export const elderAnchors = (p: ElderWithCaneProps, frame: number = p.frame): CastAnchors => {
  const s = compute(p, frame);
  const w = (q: Pt): Pt => localToWorld(p, q);
  return {
    head: w(memberJoint(s.elder, "headC")),
    chest: w(memberPoint(s.elder, [0, -680])),
    hands: [w(s.grip)],
    feet: w([s.off, 0]),
    bounds: boxToWorld(p, { x0: ELDER_BOX.x0 + s.off, y0: ELDER_BOX.y0, x1: ELDER_BOX.x1 + s.off, y1: ELDER_BOX.y1 }),
  };
};

/** Bastón: empuñadura curva sobre la mano y caña hasta la punta (RU de la figura). */
const caneLayer = (j: { wristR: Pt }, tipRU: Pt, progress: number, seed: number): React.ReactNode => {
  const h: Pt = [j.wristR[0] + 6, j.wristR[1] + 20];
  const pp = clamp01((progress - 0.7) / 0.28);
  if (pp <= 0) return null;
  const crook: Pt[] = [
    [h[0] - 26, h[1] - 6],
    [h[0] - 22, h[1] - 30],
    [h[0] - 2, h[1] - 40],
    [h[0] + 16, h[1] - 28],
    [h[0] + 14, h[1] - 6],
  ];
  const shaft: Pt[] = [
    [h[0] + 14, h[1] - 6],
    [h[0] + 14 + (tipRU[0] - h[0] - 14) * 0.5, (h[1] + tipRU[1]) / 2],
    tipRU,
  ];
  return (
    <g key="cane">
      <InkStroke points={crook} width={11} progress={pp} seed={seed + 3} taperStart={5} taperEnd={2} startWidth={0.8} endWidth={1} />
      <InkStroke points={shaft} width={10.5} progress={pp} seed={seed + 4} taperStart={2} taperEnd={6} startWidth={1} endWidth={0.8} pressure={0.15} wobble={0.2} />
      <InkStroke points={[[tipRU[0] - 7, tipRU[1] - 22], [tipRU[0] + 1, tipRU[1]]]} width={13} progress={pp} seed={seed + 5} taperStart={2} taperEnd={1} startWidth={1} endWidth={1} pressure={0} />
    </g>
  );
};

export const ElderWithCane: React.FC<ElderWithCaneProps> = (props) => {
  const { frame, style } = props;
  const gid = useGid();
  const draw = drawAt(frame, props.appearFrom, props.drawFrames);
  if (draw <= 0) return null;
  const s = compute(props, frame);
  const tipRU = localToRig(s.elder, s.tip);
  const m = buildMember({ ...s.elder, extras: (j, ctx) => ({ front: caneLayer(j, tipRU, ctx.progress, 31) }) }, gid, "e");
  return (
    <GroupSvg placement={props} gid={gid} style={style}>
      {m.behind}
      {m.body}
      {m.hands}
    </GroupSvg>
  );
};

void smoothstep;
