import { clamp, clamp01, deg, easeInOut, lerp, mix, norm, sub, type Pt } from "./geom.ts";
import { noise1 } from "./noise.ts";

/**
 * RIG DE FIGURAS — una persona se describe con UNA pose (`PoseParams`) y se resuelve a articulaciones 2D
 * (`Joints`). Cabeza/torso por cinemática directa; brazos y piernas por IK de 2 huesos (la longitud de los
 * huesos se conserva siempre, aunque interpolés poses). Se anima interpolando poses (`lerpPose`, `poseAt`).
 *
 * CONVENCIONES
 *  · Unidades RU (rig units): un adulto de pie mide 1000 RU. `Person` escala todo por `height/1000`.
 *  · Origen = punto del suelo entre los pies; x hacia donde MIRA la figura (+x), y hacia abajo
 *    (y negativo = hacia arriba). Para mirar a la izquierda se usa `facing: -1` en <Person> (espejo).
 *  · `L` y `R` son los lados de la PANTALLA (sin espejar): L = izquierda, R = derecha.
 *  · `turn`: 0 = perfil, 1 = de frente (controla el ancho de hombros/caderas).
 *  · `far`: lado cuyo brazo/pierna queda DETRÁS del torso (en perfil o 3/4).
 */
export type Side = "L" | "R";

export type HeadPose = {
  /** inclinación de la cabeza en grados (+ = hacia el lado derecho de la pantalla, sentido horario) */
  tilt: number;
  /** −1 mira arriba … +1 mira abajo */
  nod: number;
  /** −1 mira hacia atrás (opuesto a la dirección de la figura) … 0 de frente … +1 mira hacia adelante (+x) */
  look: number;
};

export type PoseParams = {
  /** pelvis (centro), relativo al suelo bajo la figura */
  hip: Pt;
  /** inclinación del torso respecto de la vertical en grados (+ hacia adelante, +x) */
  lean: number;
  /** encorvado −1..1 (+ = hombros adelante, pecho hundido) */
  curl: number;
  /** 0 perfil … 1 de frente */
  turn: number;
  /** inclinación de la línea de hombros en grados (+ = hombro derecho de pantalla más bajo) */
  shoulderTilt: number;
  head: HeadPose;
  /** objetivos IK de las muñecas */
  handL: Pt;
  handR: Pt;
  /** objetivos IK de los tobillos */
  footL: Pt;
  footR: Pt;
  /** codos/rodillas fijados a mano (anulan la IK; útil para vistas escorzadas). null = IK */
  elbowL: Pt | null;
  elbowR: Pt | null;
  kneeL: Pt | null;
  kneeR: Pt | null;
  /** hacia dónde se dobla el codo (0 = hacia atrás, 1 = hacia afuera) */
  elbowOut: number;
  /** dirección del pie en grados (0 = punta hacia adelante, + = punta hacia abajo/afuera) */
  footAngleL: number;
  footAngleR: number;
  /** lado que se dibuja detrás del torso */
  far: Side | null;
  /** respiración −1..1 (elevación del pecho/hombros). Lo aplica `applyIdle`. */
  breath: number;
  /** RU que caen los dos hombros (hombros caídos / aflojados); 0 = postura base */
  shoulderDrop?: number;
};

export const DEFAULT_POSE: PoseParams = {
  hip: [0, -545],
  lean: 0,
  curl: 0,
  turn: 1,
  shoulderTilt: 0,
  head: { tilt: 0, nod: 0, look: 0 },
  handL: [-120, -470],
  handR: [120, -470],
  footL: [-52, -38],
  footR: [52, -38],
  elbowL: null,
  elbowR: null,
  kneeL: null,
  kneeR: null,
  elbowOut: 0.22,
  footAngleL: 0,
  footAngleR: 0,
  far: null,
  breath: 0,
};

export const makePose = (p: Partial<PoseParams> = {}): PoseParams => ({
  ...DEFAULT_POSE,
  ...p,
  head: { ...DEFAULT_POSE.head, ...(p.head ?? {}) },
});

// ───────────────────────── interpolación y animación ─────────────────────────

const lerpPt = (a: Pt, b: Pt, t: number): Pt => mix(a, b, t);
/**
 * Interpola dos poses (t 0..1). Los huesos mantienen su longitud porque la IK se resuelve DESPUÉS.
 * Si una pose fija codo/rodilla a mano y la otra usa IK (null), la articulación IK se resuelve con proporciones
 * de adulto y se interpola igual: el paso de «de pie» a «sentada» es continuo (sin saltos).
 */
export const lerpPose = (a: PoseParams, b: PoseParams, t: number): PoseParams => {
  const mixed = (a.elbowL === null) !== (b.elbowL === null) || (a.elbowR === null) !== (b.elbowR === null) || (a.kneeL === null) !== (b.kneeL === null) || (a.kneeR === null) !== (b.kneeR === null);
  const ja = mixed ? resolvePose(a, bodyDims()) : null;
  const jb = mixed ? resolvePose(b, bodyDims()) : null;
  const joint = (pa: Pt | null, pb: Pt | null, fa: Pt | undefined, fb: Pt | undefined): Pt | null => {
    if (pa === null && pb === null) return null;
    const x = pa ?? fa ?? pb!;
    const y = pb ?? fb ?? pa!;
    return mix(x, y, t);
  };
  return {
    hip: lerpPt(a.hip, b.hip, t),
    lean: lerp(a.lean, b.lean, t),
    curl: lerp(a.curl, b.curl, t),
    turn: lerp(a.turn, b.turn, t),
    shoulderTilt: lerp(a.shoulderTilt, b.shoulderTilt, t),
    head: { tilt: lerp(a.head.tilt, b.head.tilt, t), nod: lerp(a.head.nod, b.head.nod, t), look: lerp(a.head.look, b.head.look, t) },
    handL: lerpPt(a.handL, b.handL, t),
    handR: lerpPt(a.handR, b.handR, t),
    footL: lerpPt(a.footL, b.footL, t),
    footR: lerpPt(a.footR, b.footR, t),
    elbowL: joint(a.elbowL, b.elbowL, ja?.elbowL, jb?.elbowL),
    elbowR: joint(a.elbowR, b.elbowR, ja?.elbowR, jb?.elbowR),
    kneeL: joint(a.kneeL, b.kneeL, ja?.kneeL, jb?.kneeL),
    kneeR: joint(a.kneeR, b.kneeR, ja?.kneeR, jb?.kneeR),
    elbowOut: lerp(a.elbowOut, b.elbowOut, t),
    footAngleL: lerp(a.footAngleL, b.footAngleL, t),
    footAngleR: lerp(a.footAngleR, b.footAngleR, t),
    far: t < 0.5 ? a.far : b.far,
    breath: lerp(a.breath, b.breath, t),
    shoulderDrop: lerp(a.shoulderDrop ?? 0, b.shoulderDrop ?? 0, t),
  };
};

export type PoseKey = {
  /** fotograma (absoluto o relativo: el que uses para `frame` en poseAt) */
  f: number;
  pose: PoseParams;
  /** easing del tramo que ARRANCA en esta clave (por defecto easeInOut) */
  ease?: (t: number) => number;
};

/**
 * Pose en el fotograma `frame` según claves ordenadas por `f`: antes de la primera = primera pose;
 * después de la última = última pose. Easing suave por defecto (sin rebotes).
 */
export const poseAt = (keys: readonly PoseKey[], frame: number): PoseParams => {
  if (keys.length === 0) return DEFAULT_POSE;
  if (frame <= keys[0].f) return keys[0].pose;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.f) {
      const t = (frame - a.f) / (b.f - a.f || 1);
      return lerpPose(a.pose, b.pose, (a.ease ?? easeInOut)(clamp01(t)));
    }
  }
  return keys[keys.length - 1].pose;
};

// ───────────────────────── cuerpo (dimensiones) ─────────────────────────

export type BodyKind = "adult" | "child" | "elder";
export type Build = "slim" | "regular" | "broad";

export type BodyDims = {
  torso: number;
  neck: number;
  headRx: number;
  headRy: number;
  upperArm: number;
  foreArm: number;
  hand: number;
  thigh: number;
  shin: number;
  foot: number;
  /** semiancho de hombros de frente */
  shoulderHalf: number;
  hipHalf: number;
  /** altura de pie de referencia (RU) */
  stand: number;
};

export const bodyDims = (kind: BodyKind = "adult", build: Build = "regular"): BodyDims => {
  const b = build === "slim" ? 0.92 : build === "broad" ? 1.14 : 1;
  const base: BodyDims = {
    torso: 292,
    neck: 34,
    headRx: 48,
    headRy: 60,
    upperArm: 186,
    foreArm: 170,
    hand: 52,
    thigh: 258,
    shin: 252,
    foot: 86,
    shoulderHalf: 96 * b,
    hipHalf: 52 * b,
    stand: 1000,
  };
  if (kind === "child") return { ...base, headRx: 60, headRy: 72, torso: 280, shoulderHalf: 84 * b, hipHalf: 48 * b, hand: 56 };
  if (kind === "elder") return { ...base, torso: 280, neck: 30, headRx: 47, headRy: 58, shoulderHalf: 90 * b };
  return base;
};

// ───────────────────────── IK ─────────────────────────

/** IK de 2 huesos en 2D. `pole` indica hacia qué lado se dobla la articulación media (codo/rodilla). */
export const ik2 = (root: Pt, target: Pt, l1: number, l2: number, pole: Pt): { mid: Pt; end: Pt } => {
  const dx = target[0] - root[0];
  const dy = target[1] - root[1];
  const raw = Math.hypot(dx, dy) || 1e-3;
  const d = clamp(raw, Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.5);
  const ux = dx / raw;
  const uy = dy / raw;
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let px = -uy;
  let py = ux;
  if (px * pole[0] + py * pole[1] < 0) {
    px = -px;
    py = -py;
  }
  return {
    mid: [root[0] + ux * a + px * h, root[1] + uy * a + py * h],
    end: [root[0] + ux * d, root[1] + uy * d],
  };
};

// ───────────────────────── resolución de la pose ─────────────────────────

export type Joints = {
  hip: Pt;
  hipL: Pt;
  hipR: Pt;
  /** punto medio de la columna (curva el torso) */
  spine: Pt;
  /** base del cuello (entre hombros) */
  neck: Pt;
  /** unión cuello–cabeza (bajo el mentón) */
  chin: Pt;
  headC: Pt;
  headRx: number;
  headRy: number;
  /** inclinación total de la cabeza en grados */
  headAngle: number;
  /** centro del rostro (para los dos puntos de los ojos), en coordenadas de la figura */
  face: Pt;
  shoulderL: Pt;
  shoulderR: Pt;
  elbowL: Pt;
  elbowR: Pt;
  wristL: Pt;
  wristR: Pt;
  kneeL: Pt;
  kneeR: Pt;
  ankleL: Pt;
  ankleR: Pt;
  toeL: Pt;
  toeR: Pt;
  /** dirección unitaria del torso (de la cadera al cuello) */
  up: Pt;
  turn: number;
  far: Side | null;
  dims: BodyDims;
  /** punto más bajo de los pies (para apoyar en el suelo) */
  groundY: number;
};

export const resolvePose = (pose: PoseParams, dims: BodyDims): Joints => {
  const { hip, turn } = pose;
  const lean = deg(pose.lean);
  const upX = Math.sin(lean);
  const upY = -Math.cos(lean);
  const spineLen = dims.torso;
  // columna con curvatura: el cuello se desplaza hacia adelante/abajo al encorvarse
  const curlX = pose.curl * 42 * (1 - 0.4 * turn);
  const curlY = pose.curl * 26;
  const breathY = -pose.breath * 4;
  const neck: Pt = [hip[0] + upX * spineLen + curlX, hip[1] + upY * spineLen + curlY + breathY];
  const spine: Pt = [hip[0] + upX * spineLen * 0.5 + curlX * 0.35, hip[1] + upY * spineLen * 0.5 + curlY * 0.2];

  // hombros y caderas
  const sh = lerp(13, dims.shoulderHalf, turn);
  const hh = lerp(9, dims.hipHalf, turn);
  const tilt = deg(pose.shoulderTilt);
  const shDir: Pt = [Math.cos(tilt), Math.sin(tilt)];
  const slope = 14 * turn + 4 + (pose.shoulderDrop ?? 0); // los hombros caen respecto de la base del cuello
  const shoulderL: Pt = [neck[0] - shDir[0] * sh, neck[1] - shDir[1] * sh + slope];
  const shoulderR: Pt = [neck[0] + shDir[0] * sh, neck[1] + shDir[1] * sh + slope];
  const hipL: Pt = [hip[0] - hh, hip[1]];
  const hipR: Pt = [hip[0] + hh, hip[1]];

  // brazos
  const outL = -pose.elbowOut * turn - 0.4 * (1 - turn);
  const outR = pose.elbowOut * turn - 0.4 * (1 - turn);
  const armL = ik2(shoulderL, pose.handL, dims.upperArm, dims.foreArm, [outL, 1]);
  const armR = ik2(shoulderR, pose.handR, dims.upperArm, dims.foreArm, [outR, 1]);
  const elbowL = pose.elbowL ?? armL.mid;
  const elbowR = pose.elbowR ?? armR.mid;
  const wristL = pose.elbowL ? pose.handL : armL.end;
  const wristR = pose.elbowR ? pose.handR : armR.end;

  // piernas
  const knOutL = -0.25 * turn;
  const knOutR = 0.25 * turn;
  const legL = ik2(hipL, pose.footL, dims.thigh, dims.shin, [(1 - turn) * 1 + knOutL, -0.15]);
  const legR = ik2(hipR, pose.footR, dims.thigh, dims.shin, [(1 - turn) * 1 + knOutR, -0.15]);
  const kneeL = pose.kneeL ?? legL.mid;
  const kneeR = pose.kneeR ?? legR.mid;
  const ankleL = pose.kneeL ? pose.footL : legL.end;
  const ankleR = pose.kneeR ? pose.footR : legR.end;
  const footVec = (ang: number, len: number): Pt => [Math.cos(deg(ang)) * len, Math.sin(deg(ang)) * len];
  const toeL: Pt = [ankleL[0] + footVec(pose.footAngleL, dims.foot)[0], ankleL[1] + footVec(pose.footAngleL, dims.foot)[1] + 26];
  const toeR: Pt = [ankleR[0] + footVec(pose.footAngleR, dims.foot)[0], ankleR[1] + footVec(pose.footAngleR, dims.foot)[1] + 26];

  // cabeza
  const nod = pose.head.nod;
  const headAngle = pose.head.tilt + pose.lean * 0.35 + pose.curl * 6 + nod * 6;
  const ha = deg(headAngle);
  const neckLen = dims.neck;
  const chin: Pt = [neck[0] + Math.sin(ha) * neckLen + nod * 4, neck[1] - Math.cos(ha) * neckLen + nod * 4];
  const headC: Pt = [chin[0] + Math.sin(ha) * dims.headRy * 0.9 + nod * 6, chin[1] - Math.cos(ha) * dims.headRy * 0.9 + nod * 7];
  // rostro: se desplaza hacia donde mira
  const look = pose.head.look;
  const face: Pt = [headC[0] + look * dims.headRx * 0.46, headC[1] + (nod * 0.34 + 0.06) * dims.headRy];

  const groundY = Math.max(ankleL[1], ankleR[1], toeL[1] - 4, toeR[1] - 4) + 14;

  return {
    hip,
    hipL,
    hipR,
    spine,
    neck,
    chin,
    headC,
    headRx: dims.headRx,
    headRy: dims.headRy,
    headAngle,
    face,
    shoulderL,
    shoulderR,
    elbowL,
    elbowR,
    wristL,
    wristR,
    kneeL,
    kneeR,
    ankleL,
    ankleR,
    toeL,
    toeR,
    up: norm(sub(neck, hip)),
    turn,
    far: pose.far,
    dims,
    groundY,
  };
};

// ───────────────────────── movimiento de reposo (idle) ─────────────────────────

/**
 * Respiración y leves cambios de peso, deterministas. `frame` = fotograma absoluto; `amount` 0..1.
 * Devuelve una pose nueva con la respiración, un micro-balanceo de cabeza y de cadera.
 */
export const applyIdle = (pose: PoseParams, frame: number, seed = 1, amount = 1): PoseParams => {
  if (amount <= 0) return pose;
  const period = 108 + (seed % 5) * 9; // ≈ 3,6–4,2 s por respiración
  const ph = (frame / period) * Math.PI * 2 + seed * 1.7;
  const breath = Math.sin(ph) * 0.5 + 0.5; // 0..1
  const sway = noise1(seed + 40, frame / 140);
  const nodN = noise1(seed + 41, frame / 190);
  const tiltN = noise1(seed + 42, frame / 160);
  const a = amount;
  return {
    ...pose,
    hip: [pose.hip[0] + sway * 3.2 * a, pose.hip[1]],
    breath: pose.breath + (breath * 2 - 1) * a,
    shoulderTilt: pose.shoulderTilt + sway * 0.8 * a,
    head: { tilt: pose.head.tilt + tiltN * 1.3 * a, nod: pose.head.nod + nodN * 0.06 * a, look: pose.head.look },
    handL: [pose.handL[0], pose.handL[1] + (breath * 2 - 1) * 2 * a],
    handR: [pose.handR[0], pose.handR[1] + (breath * 2 - 1) * 2 * a],
  };
};

/**
 * Parpadeo determinista: 0 = ojos abiertos … 1 = cerrados. Un parpadeo de 5 fotogramas cada ≈ 3–5 s.
 * Lo usa <Person> (con `idle`) y <Protagonist>; pasale `buildPerson(..., { blink })` si lo armás a mano.
 */
export const blinkAt = (frame: number, seed = 1): number => {
  const period = 104;
  const k = Math.floor(frame / period);
  const t0 = k * period + 24 + Math.floor(((noise1(seed + 77, k * 1.37) + 1) / 2) * 48);
  const d = frame - t0;
  if (d < 0 || d > 4) return 0;
  return [0.55, 1, 1, 0.7, 0.25][d];
};

// ───────────────────────── biblioteca de poses ─────────────────────────

/** De pie, de frente, relajada. */
export const standFront = (o: Partial<PoseParams> = {}): PoseParams =>
  makePose({
    hip: [0, -545],
    turn: 1,
    handL: [-112, -472],
    handR: [112, -472],
    footL: [-46, -38],
    footR: [46, -38],
    footAngleL: 12,
    footAngleR: -12,
    ...o,
  });

/** De pie, de perfil (mira hacia +x). */
export const standSide = (o: Partial<PoseParams> = {}): PoseParams =>
  makePose({
    hip: [0, -545],
    turn: 0.12,
    handL: [-10, -470],
    handR: [28, -475],
    footL: [-24, -38],
    footR: [34, -38],
    far: "L",
    elbowOut: 0,
    ...o,
  });

/**
 * Ciclo de caminata de perfil. `phase` 0..1 (una zancada completa = dos pasos). Los pies siguen el suelo
 * en el apoyo y se levantan en el balanceo; los brazos se balancean a contrafase.
 * `speed` no se usa acá: la traslación en x la pone quien coloca la figura en el mundo
 * (avance recomendado por ciclo = 4 × stride = 520 RU; en el mundo × (height/1000)).
 */
export const walkSide = (phase: number, o: { stride?: number; lift?: number; swing?: number; lean?: number } = {}): PoseParams => {
  const stride = o.stride ?? 130;
  const lift = o.lift ?? 58;
  const swing = o.swing ?? 70;
  const tau = Math.PI * 2;
  const foot = (ph: number): { p: Pt; ang: number } => {
    const u = ((ph % 1) + 1) % 1;
    if (u < 0.5) {
      // apoyo: el pie retrocede en el suelo
      const t = u / 0.5;
      return { p: [lerp(stride, -stride, t), -38], ang: lerp(0, 20, t) };
    }
    const t = (u - 0.5) / 0.5;
    const arc = Math.sin(Math.PI * t);
    return { p: [lerp(-stride, stride, easeInOut(t)), -38 - lift * arc], ang: lerp(22, -4, t) - arc * 12 };
  };
  const fL = foot(phase);
  const fR = foot(phase + 0.5);
  const bob = Math.abs(Math.cos(phase * tau)) * 16;
  const sw = Math.sin(phase * tau);
  return makePose({
    hip: [0, -552 + bob * 0.0 - (1 - Math.abs(Math.cos(phase * tau))) * 10],
    turn: 0.15,
    lean: o.lean ?? 4,
    footL: fL.p,
    footR: fR.p,
    footAngleL: fL.ang,
    footAngleR: fR.ang,
    handL: [swing * sw * 0.9 - 6, -478 + Math.abs(sw) * -8],
    handR: [-swing * sw * 0.9 + 10, -478 + Math.abs(sw) * -8],
    elbowOut: 0,
    far: "L",
    head: { tilt: 0, nod: 0, look: 0.85 },
  });
};

/** Ciclo de caminata de frente (la figura camina hacia el espectador). */
export const walkFront = (phase: number, o: { lift?: number } = {}): PoseParams => {
  const lift = o.lift ?? 40;
  const tau = Math.PI * 2;
  const sL = Math.sin(phase * tau);
  const sR = Math.sin((phase + 0.5) * tau);
  const up = (s: number) => Math.max(0, s);
  return makePose({
    hip: [Math.sin(phase * tau) * 7, -548 - Math.abs(Math.cos(phase * tau)) * 8],
    turn: 1,
    shoulderTilt: sL * 1.8,
    footL: [-48, -38 - up(sL) * lift],
    footR: [48, -38 - up(sR) * lift],
    footAngleL: 10 - up(sL) * 8,
    footAngleR: -10 + up(sR) * 8,
    handL: [-108 + sL * 8, -486 - sL * 16],
    handR: [108 + sR * 8, -486 - sR * 16],
    head: { tilt: sL * 1.2, nod: 0, look: 0 },
  });
};

/**
 * Sentada de ¾ sobre un asiento de altura `seat` RU sobre el suelo (banco ≈ 280). Caderas apoyadas, muslos
 * escorzados hacia adelante (+x), pies en el suelo. `knee` = cuánto avanzan las rodillas (RU).
 */
export const seated = (o: { seat?: number; hipX?: number; knee?: number; turn?: number } & Partial<PoseParams> = {}): PoseParams => {
  const seat = o.seat ?? 280;
  const hx = o.hipX ?? 0;
  const knee = o.knee ?? 100;
  const turn = o.turn ?? 0.7;
  const { seat: _s, hipX: _h, knee: _k, turn: _t, ...rest } = o;
  const hipY = -(seat + 8);
  return makePose({
    hip: [hx, hipY],
    turn,
    lean: 2,
    kneeL: [hx - 34 + knee, hipY + 6],
    kneeR: [hx + 34 + knee, hipY + 14],
    footL: [hx - 24 + knee + 14, -30],
    footR: [hx + 46 + knee + 14, -30],
    footAngleL: 8,
    footAngleR: 0,
    handL: [hx + 52, hipY - 8],
    handR: [hx + 128, hipY - 2],
    elbowOut: 0.15,
    ...rest,
  });
};


