import { COMPANION_TIMING, CAMERA_TIMING, THREAD_TIMING } from "../../config/timeline.ts";
import { KEY_EVENTS } from "../../config/typing.ts";
import { clamp, clamp01, deg, easeInOut, lerp, mix, norm, rotate, sub, type Pt } from "../geom.ts";
import { noise1 } from "../noise.ts";
import type { FigureSpec } from "../figure.tsx";
import type { PersonSpec } from "../person.tsx";
import { SEAT_H } from "../seat.ts";
import { blinkAt, bodyDims, makePose, resolvePose, type PoseParams } from "../rig.ts";

/**
 * LA PROTAGONISTA — movimiento y geometría PUROS (sin JSX): controles derivados del cronograma, celular, pulgares, pose y brazos.
 * Los dibuja `protagonist.tsx`. Al ser funciones puras del fotograma se pueden probar en node con una sonda privada.
 *
 * COORDENADAS: el ancla (x, y) es la CADERA, apoyada en el asiento del banco (ver `benchSeat`). Todo lo
 * «local» (PHONE_RECT, PHONE_CENTER, PROTAGONIST_HEAD_TOP…) está en u de mundo relativas a esa cadera, con
 * `scale = 1`. y negativo = arriba. La figura MIRA hacia +x (hacia la derecha: ahí llega la amiga).
 */
export const PHONE_SCALE = 0.26;
export const PHONE_NATIVE = { w: 1080, h: 1920 } as const;
/** tamaño de la pantalla del celular en u de mundo (a PHONE_SCALE × phoneScale 1). */
export const PHONE_SIZE = { w: PHONE_NATIVE.w * PHONE_SCALE, h: PHONE_NATIVE.h * PHONE_SCALE } as const;

/** Altura de pie de la protagonista (u): sentada ≈ 800 u. K = escala RU → u. */
export const PROTAGONIST_HEIGHT = 1100;
export const K = PROTAGONIST_HEIGHT / 1000;
/** Altura de la cadera sobre el suelo en RU (el asiento es SEAT_H u). */
export const HIP_RU: Pt = [0, -(SEAT_H + 4) / K];

/** Centro de la pantalla del celular, local (u), con el celular en la posición inicial (phoneLower = 0). */
export const PHONE_CENTER = { x: 44, y: -14 } as const;
/** Rectángulo de la pantalla (local, u) en la posición inicial. */
export const PHONE_RECT = {
  x: PHONE_CENTER.x - PHONE_SIZE.w / 2,
  y: PHONE_CENTER.y - PHONE_SIZE.h / 2,
  w: PHONE_SIZE.w,
  h: PHONE_SIZE.h,
} as const;
/** Parte superior de la cabeza (local, u, medida con la cabeza hacia abajo): con la cadera en S1_HIP_Y la cabeza empieza en y ≈ 698. */
export const PROTAGONIST_HEAD_TOP = -494;
/** Cadera del encuadre de la escena 1 (mundo) para que la cabeza arranque en y ≥ 700 con la cámara en scale 1. */
export const S1_HIP_Y = 1192;

// ───────────────────────── aspecto ─────────────────────────

/** Adulta joven; pelo rizado oscuro y voluminoso, abrigo/buzo verde oscuro del manual, pantalón negro. */
export const PROTAGONIST_SPEC: PersonSpec = {
  kind: "adult",
  height: PROTAGONIST_HEIGHT,
  skin: "brown",
  hair: { style: "curly", color: "black" },
  top: { type: "top", color: "inkGreen", fill: "hatch", sleeves: "filled" },
  legs: { type: "trousers", color: "ink", fill: "solid" },
  shoes: "ink",
  face: "dots",
  seed: 41,
  ink: 0.84,
};

/** Mismo aspecto con el renderizador natural de figuras (cabeza apenas más grande, cuello más corto). */
export const PROTAGONIST_FIGURE: FigureSpec = { ...PROTAGONIST_SPEC, headScale: 1.04, neckDrop: 8 };

// ───────────────────────── controles de animación (derivados del cronograma) ─────────────────────────

const ramp = (f: number, a: number, b: number): number => easeInOut(clamp01((f - a) / (b - a || 1)));

export type ProtagonistControls = {
  /** 0 = encorvada sobre el celular … 1 = se acomoda (cambio de postura de fin de escena 3) */
  posture: number;
  /** 0 = mira el celular … 1 = levanta la mirada hacia la persona que llega */
  attention: number;
  /** 0..1 afloja los hombros tras la llegada */
  relax: number;
  /** 0 = celular a la altura del pecho … 1 = lo baja hacia el regazo */
  phoneLower: number;
  /** multiplicador del tamaño del celular (1 por defecto; ver nota en el README) */
  phoneScale: number;
  /** 0..1 suspiro (inhala y suelta; se superpone a la respiración) */
  sigh: number;
  /** opacidad de los pulgares (se ocultan mientras el chat llena el encuadre) */
  thumbsOpacity: number;
  /** inclinación extra del celular en grados (se suma a la de la bajada). Por defecto: −4° que se enderezan al llegar el zoom */
  phoneTilt: number;
  /** 0..1 la mano derecha suelta el celular y descansa sobre el muslo (queda libre para responder) */
  handFree: number;
  /** 0..1 la mano libre se acerca apenas hacia la persona que ofrece la suya (un milímetro de duda) y se abre un poco */
  reach: number;
};

/**
 * Controles por defecto a partir del cronograma (timeline.ts):
 *  · suspiro al nacer el hilo (≈ f 440), cambio de postura al final de la escena 3 (f 548–600),
 *  · atención/mirada y celular bajando cuando llega la amiga (COMPANION_TIMING), hombros que se aflojan después.
 */
export const defaultControls = (frame: number): ProtagonistControls => {
  const sighA = THREAD_TIMING.bornFrom + 24;
  const sigh = Math.sin(Math.PI * clamp01((frame - sighA) / 52));
  return {
    posture: ramp(frame, 548, 604),
    attention: ramp(frame, COMPANION_TIMING.friendEnterFrom - 14, COMPANION_TIMING.friendSitFrom),
    relax: ramp(frame, COMPANION_TIMING.friendSitFrom, COMPANION_TIMING.friendGestureAt + 24),
    phoneLower: ramp(frame, COMPANION_TIMING.friendEnterFrom + 8, COMPANION_TIMING.friendGestureAt),
    phoneScale: 1,
    handFree: ramp(frame, COMPANION_TIMING.friendGestureAt - 24, COMPANION_TIMING.friendGestureAt + 12),
    reach: ramp(frame, COMPANION_TIMING.friendGestureAt + 34, COMPANION_TIMING.friendGestureAt + 80),
    phoneTilt: -4 * (1 - ramp(frame, CAMERA_TIMING.zoomInFrom + 10, CAMERA_TIMING.zoomInTo)) - 2.5 * ramp(frame, CAMERA_TIMING.pullOutFrom + 8, CAMERA_TIMING.pullOutTo + 20),
    sigh: sigh * sigh,
    thumbsOpacity:
      1 -
      ramp(frame, CAMERA_TIMING.zoomInFrom + 46, CAMERA_TIMING.zoomInTo + 6) +
      ramp(frame, CAMERA_TIMING.pullOutFrom - 8, CAMERA_TIMING.pullOutFrom + 34) * ramp(frame, CAMERA_TIMING.pullOutFrom - 8, CAMERA_TIMING.pullOutFrom + 34),
  };
};

// ───────────────────────── celular ─────────────────────────

export type PhoneState = {
  /** centro del celular, local (u) */
  cx: number;
  cy: number;
  /** escala nativa→u (PHONE_SCALE × phoneScale × factor de bajada) */
  s: number;
  /** inclinación (grados) */
  tilt: number;
};

/**
 * Celular bajado (phoneLower = 1): cuelga de la mano izquierda a un costado de la cadera, más chico, con la pantalla casi de frente.
 * Deja libre todo el hueco del lado de la persona que llega (la mano derecha queda libre, ver `handFree`).
 */
const LOWER = { dx: -52, dy: 40, scale: 0.4, tilt: -5 } as const;
/** Mano derecha libre: reposo sobre el muslo (u locales a la cadera) y cuánto se adelanta (`reach`, u) hacia quien le ofrece la mano. */
const REST_R = { x: 104, y: -42 } as const;
const REACH_R = { dx: 16, dy: -6 } as const;
/** Altura del agarre sobre la pantalla (fracción de la media altura): al bajar el celular la mano lo toma por la mitad, no por abajo. */
const gripFrac = (l: number): number => lerp(0.34, -0.12, l);

export const phoneState = (c: Pick<ProtagonistControls, "phoneLower" | "phoneScale"> & Partial<Pick<ProtagonistControls, "phoneTilt">>): PhoneState => {
  const l = c.phoneLower;
  return {
    cx: PHONE_CENTER.x + LOWER.dx * l,
    cy: PHONE_CENTER.y + LOWER.dy * l,
    s: PHONE_SCALE * c.phoneScale * lerp(1, LOWER.scale, l),
    tilt: LOWER.tilt * l + (c.phoneTilt ?? 0),
  };
};

/** Coordenada NATIVA del chat (0..1080 × 0..1920) → local (u) relativa a la cadera, para un estado del celular. */
export const phoneNativeToLocal = (nx: number, ny: number, st: PhoneState): Pt => {
  const dx = (nx - PHONE_NATIVE.w / 2) * st.s;
  const dy = (ny - PHONE_NATIVE.h / 2) * st.s;
  const r = rotate([dx, dy], deg(st.tilt));
  return [st.cx + r[0], st.cy + r[1]];
};

type Place = {
  x: number;
  y: number;
  scale?: number;
  /** fotograma absoluto: usa el estado real del celular (bajada) en ese instante */
  frame?: number;
  controls?: Partial<ProtagonistControls>;
};

/**
 * Coordenada nativa del chat → coordenada de MUNDO. Ej.: la posición del cursor del chat en el mundo
 * (para nacer el hilo): `phoneToWorld(cursorX, cursorY, { x, y })`. Si pasás `frame`, usa el estado real del
 * celular en ese fotograma (bajada/escala); sin `frame` usa la posición inicial.
 */
export const phoneToWorld = (nx: number, ny: number, place: Place): Pt => {
  const k = place.scale ?? 1;
  const base = place.frame !== undefined ? defaultControls(place.frame) : { phoneLower: 0, phoneScale: 1, phoneTilt: 0 };
  const st = phoneState({ ...base, ...place.controls });
  const [lx, ly] = phoneNativeToLocal(nx, ny, st);
  return [place.x + lx * k, place.y + ly * k];
};

/** Centro de la pantalla del celular en el MUNDO (objetivo de la cámara de la escena 1→2). */
export const phoneCenterWorld = (place: { x: number; y: number; scale?: number }): Pt => [place.x + PHONE_CENTER.x * (place.scale ?? 1), place.y + PHONE_CENTER.y * (place.scale ?? 1)];

// ───────────────────────── pulgares que dudan ─────────────────────────

export type ThumbState = {
  /** 0 = reposo en el borde … 1 = estirado sobre el teclado */
  reach: number;
  /** 0..1 apoyo (toque) */
  press: number;
  /** variación angular (grados) */
  wander: number;
};

const LEFT_KEYS = "qwertasdfgzxcvb";

const engagement = (frame: number, side: "L" | "R"): { e: number; press: number } => {
  let e = 0;
  let press = 0;
  for (const ev of KEY_EVENTS) {
    if (ev.frame > frame + 12) break;
    const isLeft = ev.kind === "key" && LEFT_KEYS.includes(ev.char.toLowerCase());
    const mine = ev.kind === "backspace" ? side === "R" : ev.kind === "space" ? side === "R" : isLeft ? side === "L" : side === "R";
    if (!mine) continue;
    const d = frame - ev.frame;
    let v = 0;
    if (d < 0) v = easeInOut(clamp01(1 + d / 12));
    else if (d <= 5) v = 1 - 0.1 * Math.sin((d / 5) * Math.PI);
    else v = Math.exp(-(d - 5) / 10);
    if (ev.kind === "backspace") v = Math.max(v, 0.9 * clamp01(1 - Math.abs(d - 2) / 20));
    e = Math.max(e, v);
    if (d >= 0 && d < 5) press = Math.max(press, Math.sin((d / 5) * Math.PI));
  }
  return { e, press };
};

/**
 * Pulgares del fotograma `frame`: durante el tipeo se acercan al teclado y tocan con cada letra (izquierdo
 * para las letras de la izquierda, derecho para el resto y para borrar); en las pausas DUDAN (se acercan y se
 * retiran despacio); tras el último mensaje se retiran al borde.
 */
export const thumbsAt = (frame: number): { L: ThumbState; R: ThumbState } => {
  const settle = 1 - ramp(frame, 392, 446); // el vaivén de duda se apaga al final
  const calm = ramp(frame, 404, 450);
  const mk = (side: "L" | "R"): ThumbState => {
    const { e, press } = engagement(frame, side);
    const ph = side === "L" ? 1.3 : 0;
    const hover =
      0.36 + 0.2 * Math.sin((frame / 44) * Math.PI * 2 + ph) + 0.05 * Math.sin((frame / 17) * Math.PI * 2 + ph * 2) + (side === "R" ? 0.07 : 0) * Math.sin((frame / 71) * Math.PI * 2);
    const rest = 0.12 + 0.03 * Math.sin((frame / 90) * Math.PI * 2 + ph);
    const base = lerp(rest, hover, settle);
    const reach = lerp(base, 0.74, e) * (1 - 0.0 * calm);
    return { reach: clamp(reach, 0.05, 0.9), press, wander: 10 * noise1(side === "L" ? 5 : 9, frame / 26) * (1 - calm * 0.6) };
  };
  return { L: mk("L"), R: mk("R") };
};

// ───────────────────────── pose ─────────────────────────

const SEAT_RU = (SEAT_H + 4) / K;

/** Pose completa de la protagonista (coordenadas del rig, suelo = y 0). */
export const protagonistPose = (c: ProtagonistControls, frame: number, wrists: { L: Pt; R: Pt }): PoseParams => {
  const a = c.attention;
  const p = c.posture;
  const r = c.relax;
  const sigh = c.sigh;
  const curl = lerp(lerp(0.56, 0.34, p), 0.3, r) + sigh * -0.08;
  const lean = lerp(lerp(3.5, 1.5, p), 6.5, a);
  const hipX = 0;
  const foot = (dx: number, dy = 0): Pt => [hipX + dx, -30 + dy];
  // peso: al acomodarse (posture) el pie derecho se retrae un poco
  const shift = 16 * p;
  return makePose({
    hip: [hipX, -SEAT_RU],
    turn: lerp(0.78, 0.62, a),
    lean,
    curl,
    shoulderTilt: lerp(-1.5, 2.2, r) + sigh * -0.6,
    shoulderDrop: 10 * r + 4 * a + sigh * 4,
    head: {
      tilt: lerp(-3.5, 6.5, a),
      nod: lerp(lerp(0.66, 0.5, p), 0.1, a),
      look: lerp(0.08, 0.72, a),
    },
    handL: wrists.L,
    handR: wrists.R,
    elbowOut: lerp(0.8, 0.9, r),
    kneeL: [hipX + 56, -SEAT_RU + 8],
    kneeR: [hipX + 150, -SEAT_RU + 16],
    footL: foot(84),
    footR: foot(176 - shift, 0),
    footAngleL: 8,
    footAngleR: lerp(0, -6, a),
    breath: sigh * 0.9,
  });
};


// ───────────────────────── rig completo de un fotograma ─────────────────────────

export type ProtagonistRig = {
  /** controles efectivos (cronograma + los que pisa quien llama) */
  c: ProtagonistControls;
  st: PhoneState;
  thumbs: { L: ThumbState; R: ThumbState };
  /** media anchura y media altura del celular (u) en su estado actual */
  hw: number;
  hh: number;
  /** altura del agarre sobre la pantalla (u, local al celular) */
  gripY: number;
  /** pose final (con respiración y brazos relajados) */
  pose: PoseParams;
  /** 0..1 la mano derecha ya soltó el celular (con easing) */
  eFree: number;
  /** celular (local al celular, u) → local a la cadera (u) */
  toWorldLocal: (lx: number, ly: number) => Pt;
  /** local a la cadera (u) → rig (RU) */
  ru: (u: Pt) => Pt;
};

/**
 * Todo lo que depende del fotograma para dibujar a la protagonista: controles, estado del celular, pulgares y la POSE final.
 * Es función pura (se prueba en node). Las manos que sostienen el celular siguen sus bordes; con el celular bajado los brazos
 * se relajan (codo con una leve curva, escorzado: con IK pura quedarían tubos estirados) y la mano derecha, ya libre, descansa
 * sobre el muslo y se adelanta apenas (`reach`).
 */
export const protagonistRig = (frame: number, controls?: Partial<ProtagonistControls>, idle = 1): ProtagonistRig => {
  const c: ProtagonistControls = { ...defaultControls(frame), ...controls };
  const st = phoneState(c);
  const thumbs = thumbsAt(frame);

  // posiciones del celular en RU (relativas a la cadera) para las manos
  const hw = (PHONE_SIZE.w / 2) * (st.s / PHONE_SCALE);
  const hh = (PHONE_SIZE.h / 2) * (st.s / PHONE_SCALE);
  const toWorldLocal = (lx: number, ly: number): Pt => {
    const r = rotate([lx, ly], deg(st.tilt));
    return [st.cx + r[0], st.cy + r[1]];
  };
  const gripY = hh * gripFrac(c.phoneLower);
  const palmL: Pt = toWorldLocal(-hw - 16, gripY + 14);
  const palmR: Pt = toWorldLocal(hw + 16, gripY + 14);
  const ru = (u: Pt): Pt => [HIP_RU[0] + u[0] / K, HIP_RU[1] + u[1] / K];
  const wrists = { L: ru(palmL), R: ru(palmR) };

  // respiración y reposo
  const pose0 = protagonistPose(c, frame, wrists);
  const poseIdle: PoseParams =
    idle > 0
      ? {
          ...pose0,
          breath: pose0.breath + Math.sin((frame / 112) * Math.PI * 2) * 0.55 * idle,
          shoulderTilt: pose0.shoulderTilt + noise1(3, frame / 150) * 0.7 * idle,
          head: { ...pose0.head, tilt: pose0.head.tilt + noise1(4, frame / 170) * 1.1 * idle, nod: pose0.head.nod + noise1(5, frame / 210) * 0.05 * idle },
        }
      : pose0;

  const dims = bodyDims(PROTAGONIST_SPEC.kind, PROTAGONIST_SPEC.build);
  // `handFree` y `phoneLower` ya llegan suavizados por el cronograma: no se vuelve a aplicar easing (doble easing = pico de velocidad)
  const eFree = clamp01(c.handFree);
  const eLow = clamp01(c.phoneLower);
  let pose = poseIdle;
  if (eFree > 0 || eLow > 0) {
    const j1 = resolvePose(poseIdle, dims);
    const restRU = ru([REST_R.x + REACH_R.dx * c.reach, REST_R.y + REACH_R.dy * c.reach]);
    const relaxed = (sh: Pt, wr: Pt, sign: number, bowRU: number): Pt => {
      const d = norm(sub(wr, sh));
      const m = mix(sh, wr, 0.5);
      return [m[0] + -d[1] * sign * bowRU, m[1] + d[0] * sign * bowRU];
    };
    const wristR: Pt = mix(j1.wristR, restRU, eFree);
    const elbowL: Pt = mix(j1.elbowL, relaxed(j1.shoulderL, j1.wristL, 1, 16), eLow);
    const elbowR: Pt = mix(j1.elbowR, relaxed(j1.shoulderR, wristR, -1, 24), Math.max(eFree, eLow));
    pose = { ...poseIdle, handL: j1.wristL, handR: wristR, elbowL: eLow > 0 ? elbowL : null, elbowR: eFree > 0 || eLow > 0 ? elbowR : null };
  }
  return { c, st, thumbs, hw, hh, gripY, pose, eFree, toWorldLocal, ru };
};

/** Parpadeo de la protagonista en el fotograma (semilla propia). */
export const protagonistBlink = (frame: number): number => blinkAt(frame, 41);
