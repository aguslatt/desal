import React from "react";
import { lerp, smoothstep, type Pt } from "../../geom.ts";
import { noise1 } from "../../noise.ts";
import { applyIdle, lerpPose, standSide, walkSide, type PoseParams } from "./poses.ts";
import {
  GroupSvg,
  boxToWorld,
  buildMember,
  drawAt,
  localToWorld,
  memberJoint,
  memberPoint,
  useGid,
  DEFAULT_DRAW_FRAMES,
  type CastAnchors,
  type CastBaseProps,
  type CastBox,
  type Member,
} from "./common.tsx";
import type { FigureSpec } from "./figure.tsx";
import { gaitAt, gaitDistance, gaitFrames } from "./gait.ts";

/**
 * (4) UNA PERSONA QUE CAMINA DE PERFIL con mochila y abrigo — ciclo de caminata normal (cadencia de paseo), la mano
 * cerca de la correa de la mochila y el otro brazo balanceándose. Atraviesa un tramo corto, frena y se queda
 * mirando (respira, gira la cabeza).
 */
export const WALKER_SPEC: FigureSpec = {
  kind: "adult",
  build: "regular",
  height: 940,
  skin: "light",
  hair: { style: "short", color: "auburn" },
  top: { type: "coat", color: "ink", fill: "hatch", sleeves: "filled" },
  legs: { type: "trousers", color: "ink", fill: "solid" },
  shoes: "ink",
  face: "dots",
  accessories: [
    { type: "backpack", color: "yellow" },
    { type: "scarf", color: "pink" },
  ],
  seed: 41,
  ink: 0.95,
};

const STRIDE = 96;
export const WALKER_BOX: CastBox = { x0: -128, y0: -944, x1: 118, y1: 8 };

export type WalkerProps = CastBaseProps & {
  /** pasos hasta el reposo (medios ciclos); 3 = ≈ 560 u a escala 1 (cada paso ≈ 181 u) */
  steps?: number;
  walkFrom?: number;
  /** fotogramas por ciclo de 2 pasos a ritmo de crucero (normal tranquilo: 44) */
  cycleFrames?: number;
};

const defaults = (p: WalkerProps) => {
  const draw = p.drawFrames ?? DEFAULT_DRAW_FRAMES;
  return { steps: p.steps ?? 3, walkFrom: p.walkFrom ?? p.appearFrom + draw - 6, cycleFrames: p.cycleFrames ?? 44 };
};

export const walkerTravel = (steps = 3): number => gaitDistance(steps, STRIDE, WALKER_SPEC.height ?? 940);

type State = { person: Member; off: number; walk: number; hand: Pt };

const compute = (p: WalkerProps, frame: number): State => {
  const { steps, walkFrom, cycleFrames } = defaults(p);
  const draw = drawAt(frame, p.appearFrom, p.drawFrames);
  const g = gaitAt({ start: walkFrom, steps, frames: gaitFrames(steps, cycleFrames) }, frame);
  const D = gaitDistance(steps, STRIDE, WALKER_SPEC.height ?? 940);
  const off = -D * (1 - g.s);
  const idle = (p.idle ?? 1) * (1 - g.walk);
  const seed = p.seed ?? 0;

  const standP = standSide({ turn: 0.3, lean: 3, footL: [-32, -38], footR: [44, -38], shoulderTilt: -1, head: { tilt: 0, nod: 0, look: 0.6 } });
  const walkP = walkSide(g.phase, { stride: STRIDE, lift: 48, swing: 58, lean: 4 });
  let pose: PoseParams = lerpPose(standP, { ...walkP, turn: 0.3, head: { tilt: 0, nod: -0.04, look: 0.65 } }, g.walk);
  pose = applyIdle(pose, frame, 41 + seed, idle);
  // al detenerse, mira hacia atrás por encima del hombro un instante y vuelve al frente
  const glance = smoothstep(0.25, 0.8, noise1(seed + 341, frame / 140)) * (1 - g.walk);
  pose = { ...pose, head: { tilt: pose.head.tilt, nod: pose.head.nod + 0.04, look: lerp(pose.head.look, -0.5, glance) } };

  const personM: Member = { spec: WALKER_SPEC, pose, x: off, progress: draw, frame, seed };
  // brazos sueltos con el codo apenas doblado (en el balanceo y en reposo)
  const sw = Math.sin(g.phase * Math.PI * 2);
  const handLocal: Pt = [off + 34 - 40 * sw * g.walk, -470 - 12 * Math.abs(sw) * g.walk];
  pose = { ...pose, handR: [pose.handR[0], pose.handR[1] + 14] };
  personM.pose = pose;
  return { person: personM, off, walk: g.walk, hand: handLocal };
};


export const walkerAnchors = (p: WalkerProps, frame: number = p.frame): CastAnchors => {
  const s = compute(p, frame);
  const w = (q: Pt): Pt => localToWorld(p, q);
  return {
    head: w(memberJoint(s.person, "headC")),
    chest: w(memberPoint(s.person, [0, -690])),
    hands: [w(s.hand)],
    feet: w([s.off, 0]),
    bounds: boxToWorld(p, { x0: WALKER_BOX.x0 + s.off, y0: WALKER_BOX.y0, x1: WALKER_BOX.x1 + s.off, y1: WALKER_BOX.y1 }),
  };
};

export const Walker: React.FC<WalkerProps> = (props) => {
  const { frame, style } = props;
  const gid = useGid();
  const draw = drawAt(frame, props.appearFrom, props.drawFrames);
  if (draw <= 0) return null;
  const s = compute(props, frame);
  const m = buildMember(s.person, gid, "k");
  return (
    <GroupSvg placement={props} gid={gid} style={style}>
      {m.behind}
      {m.body}
      {m.hands}
    </GroupSvg>
  );
};
