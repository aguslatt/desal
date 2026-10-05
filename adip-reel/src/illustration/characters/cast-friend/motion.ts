import { COMPANION_TIMING } from "../../../config/timeline.ts";
import { clamp, clamp01, deg, easeInOut, lerp, mix, smoothstep, type Pt } from "../../geom.ts";
import { noise1 } from "../../noise.ts";
import { blinkAt, bodyDims, ik2, makePose, resolvePose, type Joints, type PoseParams } from "../../rig.ts";
import { footAt, hipFromFeet, type Plant } from "./gait.ts";

/**
 * MOVIMIENTO DE LA AMIGA — función pura: `friendMotion(frame)` → pose + manos + anclas.
 *
 * Coordenadas LOCALES (u de mundo a escala 1): origen = la CADERA sentada en el banco (el ancla de `Friend`);
 * x hacia la derecha (de la protagonista hacia afuera), y hacia abajo. El suelo queda en y = `SEAT_DY`.
 * La figura mira a la izquierda (hacia la protagonista): el rig se espeja (facing −1), así que rig x = −(x − ax)/K.
 *
 * Coreografía (fotogramas absolutos, derivados de COMPANION_TIMING):
 *  · camina de perfil desde la derecha (pasos reales: pies que no patinan) y frena con un paso de cierre,
 *  · gira el cuerpo hacia el frente (de espaldas al banco), se sienta (apoya las dos manos en el tablón),
 *  · el contacto con el asiento cae en `friendSitFrom` (tela + madera del audio),
 *  · se acomoda: gira torso y cabeza hacia la protagonista, vuelve la mano al regazo,
 *  · en `friendGestureAt` ofrece la mano derecha (palma arriba, hacia ella, sin invadir) con una pequeña duda,
 *    y la sostiene respirando hasta el final.
 */
export const FRIEND_HEIGHT = 1040;
/** escala RU → u de mundo */
export const K = FRIEND_HEIGHT / 1000;
/** caderas sobre el suelo cuando está sentada (SEAT_H + 4 del banco) */
export const SEAT_DY = 300;
const SEAT_RU = SEAT_DY / K;
/** altura del tobillo sobre el suelo (RU) */
const ANKLE_Y = 36;

export type FriendTimes = {
  enter: number;
  /** último apoyo del paso de cierre */
  stepEnd: number;
  turnFrom: number;
  turnTo: number;
  sitFrom: number;
  contact: number;
  swivelFrom: number;
  swivelTo: number;
  offerFrom: number;
  offerTo: number;
};

export const friendTimes = (c: { friendEnterFrom: number; friendSitFrom: number; friendGestureAt: number } = COMPANION_TIMING): FriendTimes => ({
  enter: c.friendEnterFrom,
  stepEnd: c.friendSitFrom - 20,
  turnFrom: c.friendSitFrom - 42,
  turnTo: c.friendSitFrom - 12,
  sitFrom: c.friendSitFrom - 18,
  contact: c.friendSitFrom,
  swivelFrom: c.friendSitFrom - 2,
  swivelTo: c.friendGestureAt - 2,
  offerFrom: c.friendGestureAt,
  offerTo: c.friendGestureAt + 34,
});

// ───────────────────────── plan de pasos ─────────────────────────

const STEP = 16; // fotogramas entre dos apoyos consecutivos (≈ 1,9 pasos/s: paso tranquilo)
/** pies juntos frente al banco (u, a cada lado de la cadera) */
const FEET = 44;
/** posición (u) desde donde empieza a ser visible: fuera de cuadro con la cámara del f640 */
const X_IN = 640;
/** pies al sentarse, ya girada hacia ella (rig RU: x hacia la protagonista) */
const SEATED_FEET = { R: 98, L: 52 } as const;

type Plan = { A: Plant[]; B: Plant[] };

const planCache = new Map<string, Plan>();

/** A = pie derecho del rig (el de adelante al frenar, del lado de la protagonista); B = pie izquierdo. */
export const stepPlan = (T: FriendTimes): Plan => {
  const key = `${T.enter}|${T.stepEnd}|${T.swivelFrom}|${T.swivelTo}`;
  const hit = planCache.get(key);
  if (hit) return hit;
  const dur = Math.max(20, T.stepEnd - T.enter);
  const Ls = clamp((X_IN / dur) * STEP, 210, 340);
  const A: Plant[] = [];
  const B: Plant[] = [];
  // hacia atrás desde el último apoyo: B (cierre), A (adelante), B, A, …
  let t = T.stepEnd;
  const bs: Plant[] = [{ t, x: FEET }];
  const as: Plant[] = [];
  for (let i = 1; t > T.enter - 60 && i < 12; i++) {
    t -= STEP;
    const x = -FEET + (i - 1) * Ls;
    (i % 2 === 1 ? as : bs).push({ t, x });
  }
  as.reverse();
  bs.reverse();
  A.push(...as);
  B.push(...bs);
  // el último apoyo de cada pie: se queda hasta el giro sentada y se reacomoda con un pequeño paso
  const rA = -(SEATED_FEET.R * K);
  const rB = -(SEATED_FEET.L * K);
  const lastA = A[A.length - 1];
  const lastB = B[B.length - 1];
  lastA.stance = Math.round(T.swivelFrom + 6 - lastA.t);
  lastA.lift = 20;
  A.push({ t: T.swivelFrom + 17, x: rA });
  lastB.stance = Math.round(T.swivelFrom + 12 - lastB.t);
  lastB.lift = 20;
  B.push({ t: T.swivelFrom + 23, x: rB });
  const plan = { A, B };
  planCache.set(key, plan);
  return plan;
};

// ───────────────────────── estado ─────────────────────────

export type HandState = {
  /** 0 = relajada … 1 = abierta (palma arriba) */
  open: number;
  /** 0 = sigue la dirección del antebrazo … 1 = apunta hacia `aim` */
  aimBlend: number;
  /** dirección (grados en el rig) hacia donde apuntan los dedos cuando `aimBlend` > 0 */
  aim: number;
  /** 0 = palma hacia abajo / de lado … 1 = palma hacia arriba */
  palmUp: number;
};

export type FriendMotion = {
  /** x (u locales) del suelo bajo la cadera */
  ax: number;
  pose: PoseParams;
  hands: { L: HandState; R: HandState };
  /** 0 = de pie/caminando … 1 = sentada */
  sitting: number;
  /** 0..1 progreso de la ofrenda de la mano */
  offer: number;
  /** 0..1 cuánto camina (para el balanceo) */
  walk: number;
  /** 0 = ojos abiertos … 1 = parpadeo */
  blink: number;
  times: FriendTimes;
};

const ease = easeInOut;
const ramp = (f: number, a: number, b: number): number => ease(clamp01((f - a) / (b - a || 1)));
const lin = (f: number, a: number, b: number): number => clamp01((f - a) / (b - a || 1));

/**
 * Ofrenda con una duda real a mitad del gesto (respetuoso: no se lanza): la mano se adelanta sobre la rodilla
 * (0 → 0,64), se detiene un instante (≈ 0,2 s, casi quieta) y recién entonces se abre del todo (→ 1).
 */
export const offerProgress = (f: number, T: FriendTimes): number => {
  const u = lin(f, T.offerFrom, T.offerTo);
  if (u <= 0) return 0;
  if (u < 0.4) return 0.64 * ease(u / 0.4);
  if (u < 0.58) return 0.64 + 0.04 * ease((u - 0.4) / 0.18);
  return 0.68 + 0.32 * ease((u - 0.58) / 0.42);
};

type Opts = {
  times?: FriendTimes;
  /** muñeca de la mano ofrecida (u locales; origen = cadera sentada) */
  offerWrist?: Pt;
  /** semilla de la respiración */
  seed?: number;
  /** 0..1 intensidad de la respiración y los micro-movimientos (1 por defecto) */
  idle?: number;
};

/**
 * Giro del torso al ofrecer (0 perfil … 1 de frente): ya casi de ¾ hacia la protagonista (antes 0,72, que se leía de frente).
 * La mano ofrecida se ubica RELATIVA AL HOMBRO (`OFFER_REACH`, RU del rig: x hacia la protagonista, y hacia abajo): el codo queda doblado
 * (brazo recogido, antebrazo que sube) y la mano abierta, palma arriba, queda tendida a media distancia sin invadir ni tocar.
 */
export const SWIVEL_TURN = 0.5;
/** giro del torso al llegar al banco (antes de sentarse): ¾ en vez de plenamente de frente */
export const PIVOT_TURN = 0.86;
export const OFFER_REACH: Pt = [80, 86];
/** muñeca de la mano ofrecida por defecto (u locales, aprox.): a media altura entre ambas, delante del pecho */
export const OFFER_WRIST: Pt = [-150, -150];

const toRig = (p: Pt, ax: number): Pt => [-(p[0] - ax) / K, (p[1] - SEAT_DY) / K];

export const friendMotion = (frame: number, o: Opts = {}): FriendMotion => {
  const T = o.times ?? friendTimes();
  const seed = o.seed ?? 7;
  const f = frame;
  const plan = stepPlan(T);
  const dims = bodyDims("adult", "regular");
  const L1 = dims.thigh;
  const L2 = dims.shin;

  // ── hitos de progreso ──
  const pivot = ramp(f, T.turnFrom, T.turnTo);
  // el descenso con smoothstep (no cúbica): arranca y frena con suavidad sin caer «como una piedra» en la mitad
  const sitP = smoothstep(0, 1, lin(f, T.sitFrom, T.contact));
  const sitting = lin(f, T.sitFrom, T.contact);
  const swivel = ramp(f, T.swivelFrom, T.swivelTo);
  const offer = offerProgress(f, T);
  const walk = 1 - lin(f, T.stepEnd - STEP - 2, T.stepEnd + 2);
  const idleAmt = lin(f, T.contact - 4, T.contact + 14) * clamp01(o.idle ?? 1);

  // ── pies y cadera ──
  const fa = footAt(plan.A, f);
  const fb = footAt(plan.B, f);
  // el suelo bajo la cadera sigue a los pies mientras camina; ya sentada, la cadera está en el asiento (x = 0)
  const ax = hipFromFeet(plan.A, plan.B, f) * (1 - sitP);
  const rigX = (x: number): number => -(x - ax) / K;

  // altura de cadera (RU): sube a mitad de cada paso y baja al apoyar; nunca estira de más las piernas
  const stepPhase = ((((f - T.stepEnd) % STEP) + STEP) % STEP) / STEP;
  const bob = 8 * Math.sin(Math.PI * stepPhase) * walk;
  const reach = (foot: { x: number; lift: number }): number => {
    const dx = rigX(foot.x);
    return Math.sqrt(Math.max(1, 503 * 503 - dx * dx)) + ANKLE_Y + foot.lift / K;
  };
  const hipH = Math.min(521 + bob, reach(fa), reach(fb));
  const hipY = lerp(-hipH, -SEAT_RU, sitP);
  // la cadera se hunde un poco al apoyar y se acomoda (tela)
  const settle = f > T.contact ? 5 * Math.sin(Math.PI * lin(f, T.contact, T.contact + 14)) : 0;
  const sway = noise1(seed + 40, f / 150) * idleAmt;
  const hip: Pt = [sway * 2.4, hipY + settle];

  // ── torso y cabeza ──
  const turn = lerp(lerp(0.2, PIVOT_TURN, pivot), SWIVEL_TURN, swivel);
  const lean = lerp(lerp(3.2, 0.5, pivot), 8.5, swivel) + 7 * Math.sin(Math.PI * sitP) * (1 - 0.6 * swivel) + 2.5 * offer;
  const curl = 0.1 * Math.sin(Math.PI * sitP) + 0.04 * swivel + 0.05 * offer;
  const shoulderTilt = Math.sin(((f - T.stepEnd) / STEP) * Math.PI) * 1.2 * walk + 2 * swivel + 1 * offer + sway * 0.7;
  const headLead = ramp(f, T.swivelFrom - 4, T.swivelTo - 8);
  const headLook = lerp(lerp(0.85, 0.5, pivot), 0.8, headLead);
  const headNod = 0.05 + 0.16 * Math.sin(Math.PI * sitP) + 0.07 * swivel + 0.03 * offer + noise1(seed + 41, f / 200) * 0.045 * idleAmt;
  const headTilt = lerp(-0.5, 4.5, swivel) + 1.6 * offer + noise1(seed + 42, f / 170) * 1.1 * idleAmt;
  const tmpPose = makePose({ hip, turn, lean, curl, shoulderTilt, head: { tilt: headTilt, nod: headNod, look: headLook } });
  const j0 = resolvePose(tmpPose, dims);

  // ── piernas ──
  const footA: Pt = [rigX(fa.x), -(ANKLE_Y + fa.lift / K)];
  const footB: Pt = [rigX(fb.x), -(ANKLE_Y + fb.lift / K)];
  const rollA = fa.air ? lerp(18, -8, fa.swing) - Math.sin(Math.PI * fa.swing) * 8 : lerp(0, 16, Math.pow(fa.roll, 3));
  const rollB = fb.air ? lerp(18, -8, fb.swing) - Math.sin(Math.PI * fb.swing) * 8 : lerp(0, 16, Math.pow(fb.roll, 3));
  // de frente las puntas apuntan un poco hacia afuera (como standFront): A = pie R (−12), B = pie L (+12)
  const frontal = smoothstep(0.25, 0.95, turn) * (1 - swivel * 0.6);
  const angA = lerp(rollA * (1 - 0.5 * sitting), -12, frontal * (1 - fa.air * 0.5));
  const angB = lerp(rollB * (1 - 0.5 * sitting), 12, frontal * (1 - fb.air * 0.5));

  // rodillas: de perfil = IK 2D (rodilla hacia adelante); de frente/sentada = modelo sagital proyectado
  // (la cadera queda `b` detrás del tobillo; la rodilla sale hacia adelante en profundidad y solo se ve `fxLeg` de ella)
  const fxLeg = lerp(lerp(1, 0, pivot), 0.55, swivel);
  const bSit = lerp(0, 225, sitP);
  const wFront = smoothstep(0.2, 0.95, pivot);
  const legFor = (side: "L" | "R", ankle: Pt): { knee: Pt; ankle: Pt } => {
    const hj = side === "L" ? j0.hipL : j0.hipR;
    const prof = ik2(hj, ankle, L1, L2, [1, -0.15]);
    const H = Math.max(60, ankle[1] - hj[1]);
    const sag = ik2([-bSit, -H], [0, 0], L1, L2, [1, 0]);
    const kneeFront: Pt = [ankle[0] + fxLeg * sag.mid[0] + 52 * swivel, ankle[1] + sag.mid[1] + 14 * sitP];
    return { knee: mix(prof.mid, kneeFront, wFront), ankle: mix(prof.end, ankle, wFront) };
  };
  const legA = legFor("R", footA);
  const legB = legFor("L", footB);

  // ── brazos ──
  const sh = { L: j0.shoulderL, R: j0.shoulderR };
  // brazo colgante como péndulo: la muñeca describe un arco (largo ≈ 346 RU); al adelantarse el codo se dobla un poco
  const hang = (s: Pt, dx: number, fwd: number): Pt => {
    const Lr = 328 - 30 * Math.max(0, fwd);
    const x = clamp(dx, -Lr * 0.7, Lr * 0.7);
    return [s[0] + x, s[1] + Math.sqrt(Lr * Lr - x * x)];
  };
  // balanceo contrario a la pierna: la mano R va con la pierna B (izquierda) y viceversa
  const swingR = clamp(0.42 * footB[0], -64, 64) * walk;
  const swingL = clamp(0.42 * footA[0], -64, 64) * walk;
  const walkWristR = hang(sh.R, 6 + swingR, swingR / 64);
  const walkWristL = hang(sh.L, -6 + swingL, swingL / 64);
  const standWristR = hang(sh.R, 12, 0);
  const standWristL = hang(sh.L, -12, 0);
  // sentada: la mano izquierda apoya en el tablón mientras baja y vuelve al regazo; la derecha descansa sobre el muslo
  const plankL = toRig([72, -30], 0);
  const plankR = toRig([-72, -30], 0);
  const lapL: Pt = [24, hipY - 40];
  const restR: Pt = [72, hipY - 42];
  const offerW: Pt = o.offerWrist ? toRig(o.offerWrist, 0) : [sh.R[0] + OFFER_REACH[0], sh.R[1] + OFFER_REACH[1]];
  const lapBlend = ramp(f, T.contact + 8, T.contact + 24);
  const plankBlend = ramp(f, T.sitFrom - 6, T.contact - 4);
  const restBlend = ramp(f, T.contact + 6, T.contact + 22);

  let wristL: Pt = mix(walkWristL, standWristL, pivot);
  wristL = mix(wristL, plankL, plankBlend);
  wristL = mix(wristL, lapL, lapBlend);
  let wristR: Pt = mix(walkWristR, standWristR, pivot);
  wristR = mix(wristR, plankR, plankBlend);
  wristR = mix(wristR, restR, restBlend);
  wristR = mix(wristR, offerW, offer);

  // antebrazo escorzado al apoyarlo (se ve de 3/4, hacia nosotros)
  const foreFront = ramp(f, T.sitFrom, T.contact);
  const cfR = lerp(lerp(1, 0.55, foreFront), lerp(0.46, 0.92, offer), restBlend);
  const cfL = lerp(1, 0.55, foreFront);
  const eo = 0.22;
  // hacia dónde se dobla el codo, de −1 (hacia atrás/adentro) a +1 (hacia afuera): se interpola de forma CONTINUA
  // entre las dos soluciones de la IK (pasando por el brazo recto), así el codo nunca «salta» de lado
  const bend = (side: "L" | "R", extraBack = 0): number => clamp(4 * ((side === "R" ? 1 : -1) * eo * turn - 0.4 * (1 - turn) - extraBack), -1, 1);
  const arm = (shoulder: Pt, wrist: Pt, l2: number, b: number): { mid: Pt; end: Pt } => {
    const plus = ik2(shoulder, wrist, dims.upperArm, l2, [1, 0]);
    const minus = ik2(shoulder, wrist, dims.upperArm, l2, [-1, 0]);
    return { mid: mix(minus.mid, plus.mid, (b + 1) / 2), end: plus.end };
  };
  const armR = arm(sh.R, wristR, dims.foreArm * cfR, bend("R", 0.35 * restBlend));
  const armL = arm(sh.L, wristL, dims.foreArm * cfL, bend("L", 0.2 * sitting));

  // ── respiración y vida (suave) ──
  const breath = Math.sin((f / 118) * Math.PI * 2 + seed * 1.3) * 1.2 * idleAmt;
  const micro = noise1(seed + 43, f / 60) * 1.8 * offer;
  const pose: PoseParams = makePose({
    hip,
    turn,
    lean,
    curl,
    shoulderTilt,
    head: { tilt: headTilt, nod: headNod, look: headLook },
    handL: armL.end,
    handR: [armR.end[0], armR.end[1] + micro],
    elbowL: armL.mid,
    elbowR: armR.mid,
    kneeL: legB.knee,
    kneeR: legA.knee,
    footL: legB.ankle,
    footR: legA.ankle,
    footAngleL: angB,
    footAngleR: angA,
    elbowOut: eo,
    far: "L",
    breath,
  });

  // ── manos ──
  const handR: HandState = {
    open: lerp(lerp(lerp(0.12, 0.45, plankBlend), 0.28, restBlend), 1, ramp(offer, 0.5, 0.98)) + 0.05 * Math.sin(f / 23) * offer * (1 - ramp(offer, 0.5, 0.98) * 0.5),
    aimBlend: Math.max(plankBlend, ramp(offer, 0.05, 0.5)),
    aim: lerp(lerp(8, 14, restBlend), -10, offer),
    palmUp: ramp(offer, 0.25, 0.9),
  };
  const handL: HandState = {
    open: lerp(lerp(0.12, 0.5, plankBlend), 0.2, lapBlend),
    aimBlend: plankBlend,
    aim: lerp(160, 18, lapBlend),
    palmUp: 0,
  };

  return { ax, pose, hands: { L: handL, R: handR }, sitting: sitP, offer, walk, blink: blinkAt(f, seed + 3), times: T };
};

// ───────────────────────── manos y anclas ─────────────────────────

/** largo de la mano (RU del rig) */
export const HAND_LEN = 58;

const angleOf = (a: Pt, b: Pt): number => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
const lerpAngle = (a: number, b: number, t: number): number => {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return a + d * t;
};

/** Dirección de los dedos (grados del rig) de una mano: sigue al antebrazo o apunta hacia `aim` según `aimBlend`. */
export const handAngle = (m: FriendMotion, j: Joints, side: "L" | "R"): number => {
  const hs = m.hands[side];
  const wrist = side === "L" ? j.wristL : j.wristR;
  const elbow = side === "L" ? j.elbowL : j.elbowR;
  return lerpAngle(angleOf(elbow, wrist), hs.aim, hs.aimBlend);
};

export type FriendAnchors = {
  /** centro de la cabeza */
  head: Pt;
  /** punto más alto de la cabeza */
  headTop: Pt;
  /** centro del pecho (donde nace el hilo hacia el cuerpo) */
  chest: Pt;
  /** muñeca y punta de la mano ofrecida (la derecha de la amiga, la más cercana a la protagonista) */
  hand: Pt;
  handTip: Pt;
  /** centro de las caderas */
  hip: Pt;
  /** suelo bajo la cadera */
  ground: Pt;
  /** caja contenedora aproximada de la figura (con margen por el grosor del trazo y el pelo) */
  bounds: { x0: number; y0: number; x1: number; y1: number };
};

/** Anclas (u locales; origen = cadera sentada) a partir del movimiento y las articulaciones resueltas. */
export const anchorsFrom = (m: FriendMotion, j: Joints): FriendAnchors => {
  const w = (p: Pt): Pt => [m.ax - p[0] * K, SEAT_DY + p[1] * K];
  const head = w(j.headC);
  const top = w([j.headC[0], j.headC[1] - j.headRy * 1.1]);
  const chest = w([(j.neck[0] + j.hip[0]) / 2 + (j.neck[0] - j.hip[0]) * 0.1, j.neck[1] + (j.hip[1] - j.neck[1]) * 0.25]);
  const wrist = w(j.wristR);
  const a = deg(handAngle(m, j, "R"));
  const hl = HAND_LEN * K * lerp(0.98, 1.1, clamp01(m.hands.R.open));
  // el rig está espejado: rig x = −x local
  const tip: Pt = [wrist[0] - Math.cos(a) * hl, wrist[1] + Math.sin(a) * hl];
  const pts = [head, top, chest, wrist, tip, w(j.wristL), w(j.ankleL), w(j.ankleR), w(j.toeL), w(j.toeR), w(j.kneeL), w(j.kneeR), w(j.shoulderL), w(j.shoulderR)];
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of pts) {
    x0 = Math.min(x0, p[0]);
    y0 = Math.min(y0, p[1]);
    x1 = Math.max(x1, p[0]);
    y1 = Math.max(y1, p[1]);
  }
  return { head, headTop: top, chest, hand: wrist, handTip: tip, hip: [m.ax, SEAT_DY + j.hip[1] * K], ground: [m.ax, SEAT_DY], bounds: { x0: x0 - 70, y0: y0 - 40, x1: x1 + 70, y1: y1 + 30 } };
};
