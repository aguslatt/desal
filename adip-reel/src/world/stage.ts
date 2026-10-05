import { BENCH_SLOTS, PHONE_SCALE, benchSeat, phoneCenterWorld, phoneToWorld, S1_HIP_Y, type Pt } from "../illustration/index.ts";
import { getCursorAnchor } from "../chat/state.ts";
import type { CastId } from "../illustration/characters/cast-others.tsx";

/**
 * ESCENARIO — dónde está cada cosa en el MUNDO (unidades de mundo u; 1 u = 1 px con la cámara en scale 1;
 * y hacia abajo). Una sola fuente de verdad para World, cámara, hilo y reparto.
 *
 *   · El banco (800 u de largo, sin respaldo) apoya en el suelo y = GROUND_Y.
 *   · La protagonista se sienta en el extremo izquierdo (BENCH_SLOTS.protagonist); la amiga llegará a su derecha
 *     (BENCH_SLOTS.friend). Cadera de la protagonista = (496, S1_HIP_Y) → el celular queda centrado en x = 540.
 */
export const GROUND_Y = S1_HIP_Y + 300;
const PROTAGONIST_SEAT_X = 496;
export const BENCH_AT = { x: PROTAGONIST_SEAT_X + 215, y: GROUND_Y } as const;

/** Cadera (ancla) de la protagonista y de la amiga sentadas en el banco. */
export const PROTAGONIST_SEAT = benchSeat(BENCH_AT, BENCH_SLOTS.protagonist);
export const FRIEND_SEAT = benchSeat(BENCH_AT, BENCH_SLOTS.friend);

/** Centro de la pantalla del celular en el mundo (con el celular en reposo): objetivo de la cámara del chat. */
export const PHONE_AT: Pt = phoneCenterWorld(PROTAGONIST_SEAT);

/** Escala de cámara con la que la pantalla del celular llena EXACTAMENTE el encuadre (1080×1920). */
export const CHAT_SCALE = 1 / PHONE_SCALE;

/**
 * Coordenada NATIVA del chat (1080×1920) → mundo, con el celular en REPOSO (sin inclinación ni bajada).
 * El hilo nace con el celular quieto (la inclinación vale 0 desde f96 hasta que el hilo ya salió).
 */
export const chatToWorld = (nx: number, ny: number): Pt => phoneToWorld(nx, ny, { ...PROTAGONIST_SEAT, controls: { phoneLower: 0, phoneScale: 1, phoneTilt: 0 } });

/** Cursor del chat (coordenadas nativas) tal como lo deja el mensaje 3: de ahí nace el hilo. Se llama en cada render. */
export const cursorBar = () => {
  const a = getCursorAnchor();
  return { left: a.left, top: a.top, cx: a.cx, cy: a.cy, w: a.w, h: a.h, bottom: a.top + a.h };
};


// ───────────────────────── composición S4–S6 (WORLD-B) ─────────────────────────

/** Encuadre FINAL (S5–S6): se define aquí para que la cámara y el reparto salgan de la misma fuente. */
export const FINAL_VIEW = { scale: 0.3, cx: 760, cy: 1392 } as const;
/** Encuadre de S4 (se amplía, aparecen los demás). */
export const WIDE_VIEW = { scale: 0.4, cx: 760, cy: 1430 } as const;

/** Pantalla del encuadre final (px) → mundo (u). Las posiciones del reparto se piensan en la pantalla del cierre. */
export const finalToWorld = (sx: number, sy: number): Pt => [FINAL_VIEW.cx + (sx - 540) / FINAL_VIEW.scale, FINAL_VIEW.cy + (sy - 960) / FINAL_VIEW.scale];
/** Mundo (u) → pantalla del encuadre final (px). */
export const worldToFinal = (x: number, y: number): Pt => [(x - FINAL_VIEW.cx) * FINAL_VIEW.scale + 540, (y - FINAL_VIEW.cy) * FINAL_VIEW.scale + 960];

export type CastSlot = {
  /** punto del suelo en la PANTALLA del encuadre final (px) */
  sx: number;
  sy: number;
  scale: number;
  facing: 1 | -1;
  /** orden de aparición (0 = primero) */
  order: number;
};

/** Reparto: dónde queda cada grupo en el encuadre FINAL (pantalla, px). Asimétrico, con aire y a distintas profundidades. */
export const CAST_SCREEN: Record<CastId, CastSlot> = {
  parentChild: { sx: 160, sy: 850, scale: 0.9, facing: 1, order: 0 },
  walker: { sx: 900, sy: 840, scale: 0.85, facing: -1, order: 3 },
  elder: { sx: 110, sy: 1020, scale: 1, facing: 1, order: 2 },
  wheelchair: { sx: 930, sy: 1020, scale: 1, facing: -1, order: 1 },
  pair: { sx: 760, sy: 930, scale: 0.85, facing: 1, order: 4 },
};

/** Colocación en el MUNDO de cada grupo del reparto (a partir de CAST_SCREEN). */
export const castPlacement = (id: CastId): { x: number; y: number; scale: number; facing: 1 | -1 } => {
  const s = CAST_SCREEN[id];
  const [x, y] = finalToWorld(s.sx, s.sy);
  return { x, y, scale: s.scale / 1, facing: s.facing };
};
