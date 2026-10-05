import React from "react";
import { clamp01, lerp, smoothstep, type Pt } from "../../geom.ts";
import { noise1 } from "../../noise.ts";
import type { FigureSpec } from "./figure.tsx";
import { applyIdle, lerpPose, makePose, standSide, walkSide, type PoseParams } from "../../rig.ts";
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
  DEFAULT_DRAW_FRAMES,
  type CastAnchors,
  type CastBaseProps,
  type CastBox,
  type Member,
} from "./common.tsx";
import { gaitAt, gaitDistance, gaitFrames } from "./gait.ts";

/**
 * (1) UNA ADULTA CAMINANDO DE LA MANO CON UN NIÑO — de perfil (3/4), hacia +x. Los dos dan los mismos pasos (misma
 * cadencia, el largo de paso de cada uno compensa su altura para que avancen a la misma velocidad); las manos
 * unidas quedan a la altura del hombro del niño. Se dibujan de pie en la posición de salida, dan unos pasos lentos
 * hasta el reposo y se quedan: respiran, se miran, el niño balancea el brazo libre.
 */
export const PARENT_SPEC: FigureSpec = {
  kind: "adult",
  build: "regular",
  height: 930,
  skin: "olive",
  hair: { style: "ponytail", color: "darkBrown" },
  top: { type: "dress", color: "pink", fill: "hatch", sleeves: "skin", belt: "ink" },
  legs: { type: "bare" },
  shoes: "ink",
  face: "dots",
  seed: 11,
  ink: 0.92,
};

export const CHILD_SPEC: FigureSpec = {
  kind: "child",
  build: "regular",
  height: 620,
  skin: "tan",
  hair: { style: "short", color: "darkBrown" },
  top: { type: "top", color: "yellow", fill: "hatch", sleeves: "filled" },
  legs: { type: "trousers", color: "ink", fill: "solid" },
  shoes: "ink",
  face: "dots",
  accessories: [{ type: "backpack", color: "ink" }],
  seed: 12,
  ink: 1.2,
};

/** Posiciones de reposo (u locales): adulta y niño; el niño va un poco adelante. */
const ADULT_X = -128;
const CHILD_X = 128;
const STRIDE_A = 84;
const STRIDE_C = 126;

export const PARENT_CHILD_BOX: CastBox = { x0: -252, y0: -930, x1: 208, y1: 10 };

export type WalkingParentChildProps = CastBaseProps & {
  /** pasos que da hasta el reposo (medios ciclos); 3 = ≈ 470 u de recorrido a escala 1 (cada paso ≈ 156 u) */
  steps?: number;
  /** fotograma en que da el primer paso (por defecto: cuando termina de dibujarse) */
  walkFrom?: number;
  /** fotogramas por ciclo de 2 pasos a ritmo de crucero (lento: 60) */
  cycleFrames?: number;
};

const defaults = (p: Pick<WalkingParentChildProps, "steps" | "walkFrom" | "cycleFrames" | "appearFrom" | "drawFrames">) => {
  const steps = p.steps ?? 3;
  const draw = p.drawFrames ?? DEFAULT_DRAW_FRAMES;
  return {
    steps,
    walkFrom: p.walkFrom ?? p.appearFrom + draw - 6,
    cycleFrames: p.cycleFrames ?? 60,
  };
};

/** Recorrido total (u locales) desde la posición de salida hasta el reposo. */
export const parentChildTravel = (steps = 3): number => gaitDistance(steps, STRIDE_A, PARENT_SPEC.height ?? 930);

type State = { adult: Member; child: Member; walk: number; off: number; join: Pt };

const compute = (p: WalkingParentChildProps, frame: number): State => {
  const { steps, walkFrom, cycleFrames } = defaults(p);
  const draw = drawAt(frame, p.appearFrom, p.drawFrames);
  const g = gaitAt({ start: walkFrom, steps, frames: gaitFrames(steps, cycleFrames) }, frame);
  const dist = gaitDistance(steps, STRIDE_A, PARENT_SPEC.height ?? 930);
  const off = -dist * (1 - g.s);
  const idle = (p.idle ?? 1) * (1 - g.walk);
  const seed = p.seed ?? 0;

  // pies de reposo coherentes con la marcha (sin patinar al arrancar y al frenar): ver ElderWithCane. Al salir, apoya el izquierdo bajo la cadera y el
  // derecho sale desde atrás; al llegar (nº impar de pasos) apoya el derecho bajo la cadera y el izquierdo cierra adelante.
  const oddEnd = steps % 2 === 1;
  const startStance = g.t < 0.5;
  const footsL = (k: number): [number, number] => [startStance ? 0 : oddEnd ? k : 0, -38];
  const footsR = (k: number): [number, number] => [startStance ? -k : oddEnd ? 0 : k, -38];
  const mkAdult = (ph: number): PoseParams => lerpPose(standSide({ turn: 0.36, lean: 2, footL: footsL(40), footR: footsR(40), shoulderTilt: -1, head: { tilt: 3, nod: 0.3, look: 0.5 } }), walkSide(ph, { stride: STRIDE_A, lift: 44, swing: 26, lean: 3 }), g.walk);
  const mkChild = (ph: number): PoseParams => lerpPose(standSide({ turn: 0.36, lean: 0, footL: footsL(36), footR: footsR(36) }), walkSide(ph + 0.0, { stride: STRIDE_C, lift: 52, swing: 50, lean: 2 }), g.walk);

  let aPose = mkAdult(g.phase);
  let cPose = mkChild(g.phase);

  // movimiento de reposo: respiración + gestos (el niño mira a la adulta y vuelve a mirar al frente)
  const look = smoothstep(-0.2, 0.5, noise1(seed + 301, frame / 150));
  aPose = applyIdle(aPose, frame, 11 + seed, idle);
  cPose = applyIdle(cPose, frame, 12 + seed, idle * 1.2);
  aPose = {
    ...aPose,
    head: { tilt: lerp(aPose.head.tilt, 4, 1), nod: lerp(0.18, 0.34, look), look: lerp(0.5, 0.7, look) },
    turn: 0.36,
  };
  cPose = {
    ...cPose,
    head: { tilt: lerp(-4, -7, look), nod: lerp(-0.18, -0.3, look), look: lerp(-0.2, -0.65, look) },
    turn: 0.4,
  };

  const aX = ADULT_X + off;
  const cX = CHILD_X + off;
  const joinY = -462;
  // las manos unidas: en la marcha acompañan el paso; en reposo se balancean suavemente (como hacen los chicos)
  const rest = (1 - g.walk) * (p.idle ?? 1);
  const join: Pt = [
    aX + 150 + 5 * Math.sin(g.phase * Math.PI * 2) * g.walk + 4 * Math.sin(frame / 43) * rest,
    joinY - 6 * Math.abs(Math.cos(g.phase * Math.PI * 2)) * g.walk + 3 * Math.sin(frame / 43 + 0.9) * rest,
  ];

  const adultM: Member = { spec: PARENT_SPEC, pose: aPose, x: aX, progress: draw, frame, seed };
  const childM: Member = { spec: CHILD_SPEC, pose: cPose, x: cX, progress: draw, frame, seed };

  // manos unidas: las dos muñecas apuntan al mismo punto de agarre
  aPose = { ...aPose, handR: localToRig(adultM, [join[0] - 10, join[1] - 24]), elbowR: null };
  const childWrist: Pt = [join[0] + 20, join[1] - 4];
  // brazo libre del niño (R): se balancea a contrafase
  const swing = Math.sin(g.phase * Math.PI * 2);
  cPose = {
    ...cPose,
    handL: localToRig(childM, childWrist),
    elbowL: null,
    handR: [cPose.handR[0] + 7 * Math.sin(frame / 57 + 1) * rest, cPose.handR[1] + 4 * Math.sin(frame / 41) * rest],
  };
  void swing;
  adultM.pose = aPose;
  childM.pose = cPose;
  return { adult: adultM, child: childM, walk: g.walk, off, join };
};

export const walkingParentChildAnchors = (p: WalkingParentChildProps, frame: number = p.frame): CastAnchors => {
  const s = compute(p, frame);
  const w = (q: Pt): Pt => localToWorld(p, q);
  const head = memberJoint(s.adult, "headC");
  const chest = memberPoint(s.adult, [0, -690]);
  return {
    head: w(head),
    chest: w(chest),
    hands: [w(s.join)],
    feet: w([s.off, 0]),
    bounds: boxToWorld(p, { x0: PARENT_CHILD_BOX.x0 + s.off, y0: PARENT_CHILD_BOX.y0, x1: PARENT_CHILD_BOX.x1 + s.off, y1: PARENT_CHILD_BOX.y1 }),
  };
};

export const WalkingParentChild: React.FC<WalkingParentChildProps> = (props) => {
  const { frame, style } = props;
  const gid = useGid();
  const draw = drawAt(frame, props.appearFrom, props.drawFrames);
  if (draw <= 0) return null;
  const s = compute(props, frame);
  const a = buildMember(s.adult, gid, "a");
  const c = buildMember(s.child, gid, "c");
  return (
    <GroupSvg placement={props} gid={gid} style={style}>
      {c.behind}
      {a.behind}
      {c.body}
      {a.body}
      {c.hands}
      {a.hands}
    </GroupSvg>
  );
};

void clamp01;
void makePose;
