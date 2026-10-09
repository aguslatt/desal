import { fwd, ik2, lerp, mix, up, type Pt } from "./geom.ts";

/**
 * RIG DE PERSONA SENTADA (de perfil) — una pose se describe con unos pocos parámetros y se resuelve a articulaciones 2D.
 * Cabeza/torso por cinemática directa (columna en 3 tramos); brazos y piernas por IK de 2 huesos: los huesos conservan SIEMPRE
 * su largo al interpolar poses → la figura nunca cambia de tamaño ni de proporciones (solo de postura).
 *
 * CONVENCIONES (px de escena a escala 1: un adulto de pie mide 440 px)
 *  · Marco local de la figura: el origen está en el SUELO; la figura MIRA hacia +x; y hacia abajo (y negativo = arriba).
 *    Para mirar a la izquierda se espeja el grupo SVG completo (scale(−1, 1)).
 *  · Ángulos «desde la vertical»: positivo = inclinado hacia adelante (+x). up(a) = (sin a, −cos a).
 */
export const BODY = {
  /** altura de un adulto de pie (referencia de proporciones) */
  H: 440,
  /** columna: pelvis→cintura, cintura→pecho, pecho→base del cuello */
  spine: [40, 44, 48] as const,
  neck: 20,
  /** cabeza (óvalo): semiejes y posición del centro respecto de la base del cuello, sobre el eje de la cabeza */
  head: { rx: 22.5, ry: 29.5, cUp: 22, cFwd: 5 },
  upperArm: 80,
  foreArm: 64,
  /** muñeca → punta de los dedos */
  hand: 47,
  thigh: 108,
  shin: 106,
  /** pie: talón atrás del tobillo, punta adelante; altura tobillo → suela */
  foot: { back: 13, front: 49, drop: 21 },
} as const;

export type SeatedPose = {
  /** articulación de la cadera */
  hip: Pt;
  /** ángulos de los 3 tramos de la columna (° desde la vertical, + hacia adelante) */
  spine: readonly [number, number, number];
  /** ángulo del cuello (°) */
  neck: number;
  /** ángulo del eje de la cabeza (°): + = cabeza inclinada hacia adelante/abajo (mira al suelo), − = mirada alta */
  head: number;
  /** cuánto cae el hombro (px): hombros aflojados */
  shoulderDrop: number;
  /** objetivos IK de las muñecas */
  wristN: Pt;
  wristF: Pt;
  /** objetivos IK de los tobillos */
  ankleN: Pt;
  ankleF: Pt;
  /** ángulo del pie (° bajo la horizontal; + = punta hacia abajo) */
  footN: number;
  footF: number;
  /** respiración −1..1 (pecho/hombros) */
  breath: number;
  /** ángulo de la mano respecto del antebrazo (°, + = hacia abajo/adentro) */
  handBendN: number;
  handBendF: number;
};

export type Skeleton = {
  hip: Pt;
  waist: Pt;
  chest: Pt;
  neckBase: Pt;
  /** ángulos locales de la columna en pelvis, cintura, pecho y base del cuello */
  spineAngles: readonly [number, number, number, number];
  shoulder: Pt;
  headBase: Pt;
  headC: Pt;
  headAngle: number;
  elbowN: Pt;
  wristN: Pt;
  /** ángulo de pantalla (°) de la mano (muñeca → dedos) */
  handAngleN: number;
  elbowF: Pt;
  wristF: Pt;
  handAngleF: number;
  kneeN: Pt;
  ankleN: Pt;
  footAngleN: number;
  kneeF: Pt;
  ankleF: Pt;
  footAngleF: number;
};

export const makePose = (p: Partial<SeatedPose> = {}): SeatedPose => ({
  hip: [0, -132],
  spine: [4, 8, 12],
  neck: 10,
  head: 4,
  shoulderDrop: 0,
  wristN: [90, -170],
  wristF: [84, -168],
  ankleN: [117, -21],
  ankleF: [135, -21],
  footN: 0,
  footF: 0,
  breath: 0,
  handBendN: 0,
  handBendF: 0,
  ...p,
});

const lerpPt = (a: Pt, b: Pt, t: number): Pt => mix(a, b, t);

/** Interpola dos poses (t 0..1). Los huesos conservan su largo porque la IK se resuelve DESPUÉS. */
export const lerpPose = (a: SeatedPose, b: SeatedPose, t: number): SeatedPose => ({
  hip: lerpPt(a.hip, b.hip, t),
  spine: [lerp(a.spine[0], b.spine[0], t), lerp(a.spine[1], b.spine[1], t), lerp(a.spine[2], b.spine[2], t)],
  neck: lerp(a.neck, b.neck, t),
  head: lerp(a.head, b.head, t),
  shoulderDrop: lerp(a.shoulderDrop, b.shoulderDrop, t),
  wristN: lerpPt(a.wristN, b.wristN, t),
  wristF: lerpPt(a.wristF, b.wristF, t),
  ankleN: lerpPt(a.ankleN, b.ankleN, t),
  ankleF: lerpPt(a.ankleF, b.ankleF, t),
  footN: lerp(a.footN, b.footN, t),
  footF: lerp(a.footF, b.footF, t),
  breath: lerp(a.breath, b.breath, t),
  handBendN: lerp(a.handBendN, b.handBendN, t),
  handBendF: lerp(a.handBendF, b.handBendF, t),
});

const angleOf = (from: Pt, to: Pt): number => (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;

/** Resuelve la pose a articulaciones (cinemática directa de la columna + IK de brazos y piernas). */
export const solveSeated = (p: SeatedPose): Skeleton => {
  const [l0, l1, l2] = BODY.spine;
  // la respiración se aplica como un leve giro de pecho y hombros (los huesos conservan su largo)
  const a0 = p.spine[0];
  const a1 = p.spine[1] + 0.5 * p.breath;
  const a2 = p.spine[2] + 0.9 * p.breath;
  const hip = p.hip;
  const wv = up(a0);
  const waistP: Pt = [hip[0] + wv[0] * l0, hip[1] + wv[1] * l0];
  const cv = up(a1);
  const chest: Pt = [waistP[0] + cv[0] * l1, waistP[1] + cv[1] * l1];
  const nv = up(a2);
  const neckBase: Pt = [chest[0] + nv[0] * l2, chest[1] + nv[1] * l2];

  // hombro: apenas atrás y debajo de la base del cuello (sobre el marco del pecho)
  const sUp = up(a2);
  const sFwd = fwd(a2);
  const drop = 13 + p.shoulderDrop;
  const shoulder: Pt = [neckBase[0] - sUp[0] * drop + sFwd[0] * 1, neckBase[1] - sUp[1] * drop + sFwd[1] * 1];

  // cabeza
  const nk = up(p.neck);
  const headBase: Pt = [neckBase[0] + nk[0] * BODY.neck, neckBase[1] + nk[1] * BODY.neck];
  const hu = up(p.head);
  const hf = fwd(p.head);
  const headC: Pt = [headBase[0] + hu[0] * BODY.head.cUp + hf[0] * BODY.head.cFwd, headBase[1] + hu[1] * BODY.head.cUp + hf[1] * BODY.head.cFwd];

  // brazos (el codo se dobla hacia abajo/atrás)
  const aN = ik2(shoulder, p.wristN, BODY.upperArm, BODY.foreArm, 1);
  const aF = ik2([shoulder[0] - 3, shoulder[1] - 1], p.wristF, BODY.upperArm, BODY.foreArm, 1);
  // piernas (la rodilla va hacia adelante/arriba)
  const lN = ik2(hip, p.ankleN, BODY.thigh, BODY.shin, -1);
  const lF = ik2([hip[0] + 2, hip[1] - 1], p.ankleF, BODY.thigh, BODY.shin, -1);

  return {
    hip,
    waist: waistP,
    chest,
    neckBase,
    spineAngles: [a0, (a0 + a1) / 2, (a1 + a2) / 2, a2],
    shoulder,
    headBase,
    headC,
    headAngle: p.head,
    elbowN: aN.mid,
    wristN: aN.end,
    handAngleN: angleOf(aN.mid, aN.end) + p.handBendN,
    elbowF: aF.mid,
    wristF: aF.end,
    handAngleF: angleOf(aF.mid, aF.end) + p.handBendF,
    kneeN: lN.mid,
    ankleN: lN.end,
    footAngleN: p.footN,
    kneeF: lF.mid,
    ankleF: lF.end,
    footAngleF: p.footF,
  };
};
