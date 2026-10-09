import { COMPANION_TIMING } from "../config/timeline.ts";
import { clamp01, easeInOut, lerp, mix, part, rad, rotate, smoothstep, type Pt } from "./geom.ts";
import { WHEELCHAIR, rimPoint, PHONE } from "./dims.ts";
import { lerpPose, makePose, solveSeated, type SeatedPose, type Skeleton } from "./rig.ts";

/**
 * COREOGRAFÍA de la escena de escucha (puro, sin React): a partir del fotograma ABSOLUTO del reel devuelve las poses de
 * las dos personas, la posición y el giro de las ruedas de la silla y la posición del celular. Todo continuo: ninguna postura
 * se sustituye de golpe y ningún hueso cambia de largo (solo IK/cinemática directa).
 *
 * Marco de la ESCENA (px a escala 1): origen en el suelo, centrado entre la pareja; x hacia la derecha.
 *   A (protagonista) sentada en el banco, mirando a la DERECHA (+x). Cadera en x = A_HIP_X.
 *   B (amiga) en silla de ruedas, mirando a la IZQUIERDA; entra rodando desde la derecha y se detiene en B_AXLE_FINAL.
 */
export const A_HIP_X = -205;
/** x (escena) del eje de la rueda trasera de la silla de B cuando se detiene */
export const B_AXLE_FINAL = 205;

/** Fotogramas del guion (src/config/timeline.ts → COMPANION_TIMING). */
export const LISTENING_TIMING = {
  drawFrom: COMPANION_TIMING.drawFrom,
  friendEnterFrom: COMPANION_TIMING.friendEnterFrom,
  friendArriveAt: COMPANION_TIMING.friendArriveAt,
  gestureAt: COMPANION_TIMING.gestureAt,
  /** fotogramas que tarda en dibujarse la figura (drawProgress 0→1 por defecto) */
  drawFrames: 50,
  /** el gesto (mano ofrecida) tarda esto en completarse */
  gestureFrames: 34,
} as const;

// ───────────────────────── poses de A ─────────────────────────

const A_BASE = {
  hip: [0, -132] as Pt,
  ankleN: [117, -21] as Pt,
  ankleF: [133, -21] as Pt,
};

/** Encorvada, mirando el celular. */
const A_HUNCH: SeatedPose = makePose({
  ...A_BASE,
  spine: [4, 12, 22],
  neck: 36,
  head: 30,
  shoulderDrop: 0,
});

/** Aflojada: hombros caídos, cabeza arriba (mira a B), sin euforia. */
const A_EASE: SeatedPose = makePose({
  ...A_BASE,
  spine: [3, 9, 16],
  neck: 17,
  head: -7,
  shoulderDrop: 5,
});

/** Celular en las manos frente al pecho (c, ángulo) y apoyado en el regazo. */
const PHONE_HOLD = { c: [118, -188] as Pt, angle: -26 };
const PHONE_LAP = { c: [82, -152] as Pt, angle: -84 };

export type SceneState = {
  A: { pose: SeatedPose; sk: Skeleton; phone: { c: Pt; angle: number }; open: readonly [number, number]; look: number };
  B: { pose: SeatedPose; sk: Skeleton; open: readonly [number, number]; axleX: number; roll: number; casterRoll: number; moving: number; gesture: number };
  /** x (escena) de la silla al empezar (fuera de cuadro) */
  startAxleX: number;
};

/** Perfil de avance de la silla (0..1): entra con velocidad y frena suave. */
const ROLL_EXP = 1.6;
const rollProfile = (u: number): number => 1 - Math.pow(1 - clamp01(u), ROLL_EXP);

/** Distancia (px de escena) que recorre la silla desde fuera de cuadro hasta detenerse. Con 640 el giro máximo de la rueda es ≈ 14,3° por fotograma (< 15°: sin efecto «rueda de carreta» con 12 rayos). */
export const DEFAULT_ENTER_DX = 640;

export type SceneParams = {
  /** distancia (px de escena) que recorre la silla desde fuera de cuadro hasta detenerse. Por defecto DEFAULT_ENTER_DX. */
  enterFromDx?: number;
};

const TAU = Math.PI * 2;
const breathe = (frame: number, period: number, phase = 0) => Math.sin((frame / period) * TAU + phase);

const phoneWrists = (phone: { c: Pt; angle: number }): { n: Pt; f: Pt } => {
  const r = rad(phone.angle);
  const toW = (u: number, v: number): Pt => {
    const q = rotate([u, v], r);
    return [phone.c[0] + q[0], phone.c[1] + q[1]];
  };
  // las manos abrazan la mitad inferior del celular: la muñeca queda a un lado y la mano lo cruza por delante
  return { n: toW(-11, 12), f: toW(-8, 17) };
};

/** Estado completo de la escena en el fotograma absoluto `frame`. */
export const sceneAt = (frame: number, params: SceneParams = {}): SceneState => {
  const T = LISTENING_TIMING;
  const dx0 = params.enterFromDx ?? DEFAULT_ENTER_DX;
  const startAxleX = B_AXLE_FINAL + dx0;

  // ───── B: silla que entra rodando ─────
  const u = (frame - T.friendEnterFrom) / (T.friendArriveAt - T.friendEnterFrom);
  const prog = rollProfile(u);
  const axleX = B_AXLE_FINAL + dx0 * (1 - prog);
  // giro de las ruedas: recorrido / radio (rueda trasera) y /radio del caster; sentido: rodar hacia «adelante» de la silla
  const travelled = startAxleX - axleX;
  const roll = (travelled / WHEELCHAIR.rear.r) * (180 / Math.PI);
  const casterRoll = (travelled / WHEELCHAIR.caster.r) * (180 / Math.PI);
  const speed = u <= 0 || u >= 1 ? 0 : ROLL_EXP * Math.pow(1 - clamp01(u), ROLL_EXP - 1); // velocidad relativa (derivada del perfil)
  const moving = clamp01(speed);

  // ciclo de empuje ligado al giro de la rueda: 200° por ciclo (66° de empuje con la mano pegada al aro; 134° de recobro mientras rueda por inercia)
  const CYCLE = 200;
  const PUSH = 66;
  const psi = ((roll % CYCLE) + CYCLE) % CYCLE;
  const aStart = -116;
  const aEnd = -50;
  let alpha: number;
  let lift = 0;
  let push01 = 0; // 0 = recobro/inicio, 1 = fin del empuje
  if (psi < PUSH) {
    push01 = psi / PUSH;
    alpha = lerp(aStart, aEnd, push01);
  } else {
    const r = (psi - PUSH) / (CYCLE - PUSH);
    alpha = lerp(aEnd, aStart, smoothstep(0, 1, r));
    lift = Math.sin(r * Math.PI) * 15;
    push01 = 1 - r;
  }
  const holdAlpha = -76; // manos en el aro al frenar y al detenerse
  const brake = part(u, 0.72, 0.97); // frena: las manos van al aro
  const rolling = u > 0 && u < 1.0 ? 1 : 0;
  // al arrancar, las manos pasan suavemente del aro al ciclo de empuje (sin saltos aunque el arranque se vea)
  const startBlend = easeInOut(part(u, 0, 0.12));
  const alphaCycle = lerp(alpha, holdAlpha, easeInOut(brake));
  const alphaNow = rolling ? lerp(holdAlpha, alphaCycle, startBlend) : holdAlpha;
  const liftNow = rolling ? lift * (1 - brake) * startBlend : 0;
  const rimR = WHEELCHAIR.rim + liftNow;
  const wristRim = rimPoint(alphaNow, rimR);

  // vaivén del torso: hacia adelante al empujar, hacia atrás al recobrar; se calma al frenar
  const sway = rolling ? (push01 - 0.5) * 2 * (1 - brake * 0.85) : 0;

  // gesto: gira el torso y la cabeza hacia A y ofrece la mano abierta (se sostiene hasta el final)
  const g = easeInOut(part(frame, T.gestureAt, T.gestureAt + T.gestureFrames));
  // «gira» un poco antes que la mano (la cabeza lidera)
  const gHead = easeInOut(part(frame, T.gestureAt - 10, T.gestureAt + 22));

  const hipB = WHEELCHAIR.hip;
  const B_ROLL: SeatedPose = makePose({
    hip: hipB,
    spine: [-1 + sway * 3, 1 + sway * 4.5, 3 + sway * 6],
    neck: 3 + sway * 2,
    head: 1 + sway * 2,
    wristN: wristRim,
    wristF: wristRim,
    ankleN: [hipB[0] + 134, -39],
    ankleF: [hipB[0] + 142, -39],
    footN: 4,
    footF: 4,
    handBendN: 0,
  });
  const idle = breathe(frame, 104, 0.6);
  const OFFER_WRIST: Pt = [152 + 2 * breathe(frame, 96), -214 + 2.2 * breathe(frame, 80, 1.1)];
  const B_OFFER: SeatedPose = makePose({
    hip: hipB,
    spine: [3, 11, 21],
    neck: 25,
    head: 15 + 1.2 * breathe(frame, 120, 0.3),
    shoulderDrop: 1,
    wristN: OFFER_WRIST,
    wristF: wristRim,
    ankleN: [hipB[0] + 134, -39],
    ankleF: [hipB[0] + 142, -39],
    footN: 4,
    footF: 4,
    handBendN: -6,
    breath: idle,
  });
  // cabeza antes que el resto
  const poseB0 = lerpPose(B_ROLL, B_OFFER, g);
  const poseB: SeatedPose = { ...poseB0, head: lerp(B_ROLL.head, B_OFFER.head, gHead), neck: lerp(B_ROLL.neck, B_OFFER.neck, gHead * 0.8 + g * 0.2), breath: idle * g + (1 - g) * 0.4 * idle };
  const skB = solveSeated(poseB);

  // ───── A: encorvada con el celular → levanta la mirada y se afloja ─────
  const notice = easeInOut(part(frame, T.friendArriveAt - 14, T.friendArriveAt + 24));
  const lookUp = easeInOut(part(frame, T.gestureAt + 2, T.gestureAt + 48));
  const loosen = 0.32 * notice + 0.68 * lookUp;
  const phoneT = easeInOut(part(frame, T.gestureAt + 14, T.gestureAt + 58));
  const bA = breathe(frame, 100, 0);
  const phone = {
    c: mix(PHONE_HOLD.c, PHONE_LAP.c, phoneT) as Pt,
    angle: lerp(PHONE_HOLD.angle, PHONE_LAP.angle, phoneT),
  };
  // el pulgar «scrollea»: movimiento mínimo del celular mientras lo mira
  const scroll = (1 - phoneT) * (1 - notice * 0.6);
  const phoneJ = { c: [phone.c[0] + 0.8 * scroll * breathe(frame, 23), phone.c[1] + 1.4 * scroll * breathe(frame, 31, 1)] as Pt, angle: phone.angle };
  const w = phoneWrists(phoneJ);
  const poseA0 = lerpPose(A_HUNCH, A_EASE, loosen);
  const poseA: SeatedPose = {
    ...poseA0,
    wristN: w.n,
    wristF: w.f,
    handBendN: lerp(-8, 6, phoneT),
    handBendF: lerp(-8, 6, phoneT),
    breath: bA,
    // la cabeza se mueve un poco más libre al mirar el celular
    head: poseA0.head + 0.9 * breathe(frame, 140, 2) * (1 - phoneT * 0.5),
  };
  const skA = solveSeated(poseA);

  return {
    A: { pose: poseA, sk: skA, phone: phoneJ, open: [lerp(-1, -0.25, phoneT), lerp(-1, -0.3, phoneT)], look: loosen },
    B: { pose: poseB, sk: skB, open: [lerp(-0.75, 0.95, g), -0.6], axleX, roll, casterRoll, moving, gesture: g },
    startAxleX,
  };
};
