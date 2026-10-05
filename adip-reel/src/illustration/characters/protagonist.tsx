import React, { useId } from "react";
import { COLORS } from "../../config/brand.ts";
import { CAMERA_TIMING, COMPANION_TIMING, THREAD_TIMING } from "../../config/timeline.ts";
import { KEY_EVENTS } from "../../config/typing.ts";
import { clamp, clamp01, deg, easeInOut, lerp, norm, rotate, smoothClosedPath, sub, type Pt } from "../geom.ts";
import { InkStroke } from "../ink.tsx";
import { noise1 } from "../noise.ts";
import { buildFigure, type FigureSpec } from "../figure.tsx";
import { INK_WIDTH, type PersonSpec } from "../person.tsx";
import { SKIN_TONES } from "../palette.ts";
import { SEAT_H } from "../props.tsx";
import { blinkAt, makePose, type PoseParams } from "../rig.ts";
import { Blob } from "../scribble.tsx";
import { GrainDefs } from "../texture.tsx";

/**
 * LA PROTAGONISTA — persona sentada (adulta joven) que sostiene el celular con las dos manos.
 *
 * COORDENADAS: el ancla (x, y) es la CADERA, apoyada en el asiento del banco (ver `benchSeat`). Todo lo
 * «local» (PHONE_RECT, PHONE_CENTER, PROTAGONIST_HEAD_TOP…) está en u de mundo relativas a esa cadera, con
 * `scale = 1`. y negativo = arriba. La figura MIRA hacia +x (hacia la derecha: ahí llega la amiga).
 *
 * CAPAS (de atrás hacia adelante): cuerpo → palmas → bisel del celular → pantalla (`phone`) → pulgares.
 * El celular es el chat NATIVO 1080×1920 escalado por PHONE_SCALE (0,26): <Protagonist phone={<PhoneChat/>}/>.
 */
export const PHONE_SCALE = 0.26;
export const PHONE_NATIVE = { w: 1080, h: 1920 } as const;
/** tamaño de la pantalla del celular en u de mundo (a PHONE_SCALE × phoneScale 1). */
export const PHONE_SIZE = { w: PHONE_NATIVE.w * PHONE_SCALE, h: PHONE_NATIVE.h * PHONE_SCALE } as const;

/** Altura de pie de la protagonista (u): sentada ≈ 800 u. K = escala RU → u. */
export const PROTAGONIST_HEIGHT = 1100;
const K = PROTAGONIST_HEIGHT / 1000;
/** Altura de la cadera sobre el suelo en RU (el asiento es SEAT_H u). */
const HIP_RU: Pt = [0, -(SEAT_H + 4) / K];

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
const PROTAGONIST_FIGURE: FigureSpec = { ...PROTAGONIST_SPEC, headScale: 1.04, neckDrop: 8 };

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

const LOWER = { dx: 38, dy: 78, scale: 0.72, tilt: -9 } as const;

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

// ───────────────────────── manos ─────────────────────────

const SKIN = SKIN_TONES.brown;

/** Contorno de la palma (detrás del celular): un óvalo irregular en el borde del celular. */
const palmPoly = (c: Pt, side: -1 | 1, tilt: number): Pt[] => {
  const pts: Pt[] = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(rotate([c[0] + Math.cos(a) * 20, c[1] + Math.sin(a) * 31], deg(tilt + side * 8), c));
  }
  return pts;
};

const Thumb: React.FC<{ base: Pt; side: -1 | 1; st: ThumbState; tilt: number; seed: number; ink: number }> = ({ base, side, st, tilt, seed, ink }) => {
  // dirección: hacia arriba y hacia el interior de la pantalla
  const ang = deg((side < 0 ? -28 : -152) + tilt + st.wander * side * -1);
  const len = 14 + 46 * st.reach;
  const dir: Pt = [Math.cos(ang), Math.sin(ang)];
  const perp: Pt = [-dir[1], dir[0]];
  const bend = 5 * side;
  const mid: Pt = [base[0] + dir[0] * len * 0.55 + perp[0] * bend, base[1] + dir[1] * len * 0.55 + perp[1] * bend];
  const tip: Pt = [base[0] + dir[0] * len, base[1] + dir[1] * len + 0];
  const ws = [12.5, 11.2, 9.4 - st.press * 0.7];
  const pts = [base, mid, tip];
  const L: Pt[] = [];
  const R: Pt[] = [];
  pts.forEach((q, i) => {
    const t = norm(sub(pts[Math.min(2, i + 1)], pts[Math.max(0, i - 1)]));
    L.push([q[0] - t[1] * ws[i], q[1] + t[0] * ws[i]]);
    R.push([q[0] + t[1] * ws[i], q[1] - t[0] * ws[i]]);
  });
  const td = norm(sub(tip, mid));
  const tn: Pt = [-td[1], td[0]];
  const cap: Pt[] = [];
  for (let i = 1; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    cap.push([tip[0] - tn[0] * Math.cos(a) * ws[2] + td[0] * Math.sin(a) * ws[2], tip[1] - tn[1] * Math.cos(a) * ws[2] + td[1] * Math.sin(a) * ws[2]]);
  }
  const outline: Pt[] = [...L, ...cap, ...R.slice().reverse()];
  const w = INK_WIDTH * 0.46 * ink;
  // uña: arco corto cerca de la punta
  const nailC: Pt = [tip[0] - td[0] * 5, tip[1] - td[1] * 5];
  return (
    <g>
      <path d={smoothClosedPath(outline)} fill={SKIN} />
      <InkStroke points={outline} width={w} seed={seed} taperStart={4} taperEnd={6} startWidth={0.7} endWidth={0.6} pressure={0.2} />
      {len > 26 ? <InkStroke points={[[nailC[0] - tn[0] * 6, nailC[1] - tn[1] * 6], [nailC[0] + td[0] * 3, nailC[1] + td[1] * 3], [nailC[0] + tn[0] * 6, nailC[1] + tn[1] * 6]]} width={w * 0.5} seed={seed + 3} taperStart={2} taperEnd={2} startWidth={0.8} endWidth={0.8} pressure={0} /> : null}
    </g>
  );
};

// ───────────────────────── componente ─────────────────────────

export type ProtagonistProps = {
  /** fotograma ABSOLUTO del reel (respiración, parpadeo, gestos) */
  frame: number;
  /** cadera/asiento en el mundo */
  x: number;
  y: number;
  /** escala del conjunto (1 recomendado: PHONE_SCALE está calculado para 1) */
  scale?: number;
  /** el chat nativo 1080×1920; se dibuja ENTRE el cuerpo y los pulgares */
  phone?: React.ReactNode;
  /** 0..1 dibujo progresivo de la figura y el celular */
  drawProgress?: number;
  /** anula los controles derivados del cronograma (cualquiera de ellos) */
  controls?: Partial<ProtagonistControls>;
  /** intensidad de la respiración/reposo (0..1, por defecto 1) */
  idle?: number;
  style?: React.CSSProperties;
};

export const Protagonist: React.FC<ProtagonistProps> = ({ frame, x, y, scale = 1, phone, drawProgress = 1, controls, idle = 1, style }) => {
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
  const gripY = hh * 0.34;
  const palmL: Pt = toWorldLocal(-hw - 16, gripY + 14);
  const palmR: Pt = toWorldLocal(hw + 16, gripY + 14);
  const ru = (u: Pt): Pt => [HIP_RU[0] + u[0] / K, HIP_RU[1] + u[1] / K];
  const wrists = { L: ru(palmL), R: ru(palmR) };

  // respiración y reposo
  const breathe = idle > 0 ? 1 : 0;
  const pose0 = protagonistPose(c, frame, wrists);
  const pose: PoseParams = breathe
    ? {
        ...pose0,
        breath: pose0.breath + Math.sin((frame / 112) * Math.PI * 2) * 0.55 * idle,
        shoulderTilt: pose0.shoulderTilt + noise1(3, frame / 150) * 0.7 * idle,
        head: { ...pose0.head, tilt: pose0.head.tilt + noise1(4, frame / 170) * 1.1 * idle, nod: pose0.head.nod + noise1(5, frame / 210) * 0.05 * idle },
      }
    : pose0;

  const gid = `g${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const layers = buildFigure(PROTAGONIST_FIGURE, pose, { progress: drawProgress, hideHands: true, blink: idle > 0 ? blinkAt(frame, 41) : 0, grainId: gid });

  // geometría de manos (en RU; la pose ya fijó las muñecas)
  const j = layers.joints;
  const ink = PROTAGONIST_SPEC.ink ?? 1;
  const thumbBase = (g: Pt): Pt => ru([g[0], g[1]]);
  const baseL = thumbBase(toWorldLocal(-hw + 7 + 12 * thumbs.L.reach, gripY + 4 - 6 * thumbs.L.reach));
  const baseR = thumbBase(toWorldLocal(hw - 7 - 12 * thumbs.R.reach, gripY + 4 - 6 * thumbs.R.reach));
  const palmLPoly = palmPoly(j.wristL, -1, st.tilt);
  const palmRPoly = palmPoly(j.wristR, 1, st.tilt);

  // bisel del celular (negro, esquinas redondeadas, borde levemente irregular)
  const bez = 5.5;
  const bw = hw + bez;
  const bh = hh + bez;
  const rr = 24 * (st.s / PHONE_SCALE) + bez;
  const bezelPts: Pt[] = [];
  const corner = (cx0: number, cy0: number, a0: number) => {
    for (let i = 0; i <= 5; i++) {
      const a = deg(a0 + (90 * i) / 5);
      bezelPts.push([cx0 + Math.cos(a) * rr, cy0 + Math.sin(a) * rr]);
    }
  };
  corner(bw - rr, -bh + rr, -90);
  corner(bw - rr, bh - rr, 0);
  corner(-bw + rr, bh - rr, 90);
  corner(-bw + rr, -bh + rr, 180);
  const bezel = bezelPts.map((q, i) => [q[0] + noise1(61, i * 0.9) * 0.9, q[1] + noise1(62, i * 0.9) * 0.9] as Pt);
  const bezelOpacity = clamp01(drawProgress * 4);

  const k = scale;
  const phoneOp = clamp01((drawProgress - 0.05) * 4);

  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, ...style }}>
      {/* cuerpo (+ palmas detrás del celular) */}
      <svg width={1} height={1} viewBox="0 0 1 1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        <GrainDefs id={gid} />
        <g transform={`scale(${(PROTAGONIST_HEIGHT / 1000) * k}) translate(${-HIP_RU[0]} ${-HIP_RU[1]})`}>
          {layers.behind}
          {layers.body}
          <g opacity={clamp01(drawProgress * 3)}>
            <Blob polygon={palmLPoly} color={SKIN} seed={71} rough={1.4} grain={gid} />
            <Blob polygon={palmRPoly} color={SKIN} seed={72} rough={1.4} grain={gid} />
            <InkStroke points={[...palmLPoly, palmLPoly[0], palmLPoly[1]]} width={INK_WIDTH * 0.62} seed={73} taperStart={6} taperEnd={6} startWidth={0.7} endWidth={0.5} pressure={0.2} />
            <InkStroke points={[...palmRPoly, palmRPoly[0], palmRPoly[1]]} width={INK_WIDTH * 0.62} seed={74} taperStart={6} taperEnd={6} startWidth={0.7} endWidth={0.5} pressure={0.2} />
          </g>
        </g>
        {/* bisel del celular (en u de mundo) */}
        <g transform={`scale(${k}) translate(${st.cx} ${st.cy}) rotate(${st.tilt})`} opacity={bezelOpacity}>
          <path d={smoothClosedPath(bezel)} fill={COLORS.black} />
        </g>
      </svg>

      {/* pantalla: el chat nativo 1080×1920 */}
      <div
        style={{
          position: "absolute",
          left: st.cx * k - PHONE_NATIVE.w / 2,
          top: st.cy * k - PHONE_NATIVE.h / 2,
          width: PHONE_NATIVE.w,
          height: PHONE_NATIVE.h,
          scale: (st.s / 1) * k,
          rotate: `${st.tilt}deg`,
          opacity: phoneOp,
          overflow: "hidden",
          ...(phone ? null : { backgroundColor: COLORS.cream, borderRadius: 90 }),
        }}
      >
        {phone}
      </div>

      {/* pulgares */}
      <svg width={1} height={1} viewBox="0 0 1 1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", opacity: c.thumbsOpacity * clamp01(drawProgress * 3) }}>
        <g transform={`scale(${(PROTAGONIST_HEIGHT / 1000) * k}) translate(${-HIP_RU[0]} ${-HIP_RU[1]})`}>
          <Thumb base={baseL} side={-1} st={thumbs.L} tilt={st.tilt} seed={81} ink={ink} />
          <Thumb base={baseR} side={1} st={thumbs.R} tilt={st.tilt} seed={82} ink={ink} />
        </g>
      </svg>
    </div>
  );
};

