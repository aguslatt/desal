import { BENCH_SLOTS, PHONE_SCALE, benchSeat, phoneCenterWorld, phoneToWorld, S1_HIP_Y, type Pt } from "../illustration/index.ts";
import { getCursorAnchor } from "../chat/state.ts";
import type { CastId } from "../illustration/characters/cast-others.tsx";
import { CAMERA_TIMING, COMPANION_TIMING } from "../config/timeline.ts";

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
/**
 * La amiga se sienta un poco más a la derecha que el slot del banco (FRIEND_DX): deja ≈ 25 px (a cámara 0,3) de aire entre su cabeza
 * y el hilo que rodea a la protagonista, y más hueco para la mano ofrecida. El banco (800 u) la sostiene igual.
 */
export const FRIEND_DX = 50;
export const FRIEND_SEAT = { x: benchSeat(BENCH_AT, BENCH_SLOTS.friend).x + FRIEND_DX, y: benchSeat(BENCH_AT, BENCH_SLOTS.friend).y };

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

// ───────────────────────── composición S4–S6 ─────────────────────────
//
//  La composición se PIENSA en la pantalla del encuadre final (scale 0,3: personas de 220–280 px, banda y 500–1080, texto arriba, logo
//  abajo) y se convierte al mundo con `finalToWorld`. El encuadre de S4 (`WIDE_VIEW`, scale 0,45) muestra solo lo de la derecha del
//  banco (la amiga, la mayor con bastón, la madre con el niño): el grupo de la izquierda aparece al abrirse la cámara al encuadre final.
//  Restricciones que fijan estos números (medidas en los PNG):
//   · con la cámara de S4 las cabezas de la fila de atrás quedan a ≥ 62 px del texto (y ≥ 464 de pantalla);
//   · la línea del suelo y el hilo bajo el banco (mundo y = 1630) quedan sobre y = 1080 de pantalla cuando aparece el logo (f772).

/** Encuadre FINAL (S5–S6). */
export const FINAL_VIEW = { scale: 0.3, cx: 760, cy: 1559 } as const;
/** Encuadre de S4. */
export const WIDE_VIEW = { scale: 0.45, cx: 1060, cy: 1403 } as const;

/** Pantalla del encuadre final (px) → mundo (u). */
export const finalToWorld = (sx: number, sy: number): Pt => [FINAL_VIEW.cx + (sx - 540) / FINAL_VIEW.scale, FINAL_VIEW.cy + (sy - 960) / FINAL_VIEW.scale];
/** Mundo (u) → pantalla del encuadre final (px). */
export const worldToFinal = (x: number, y: number): Pt => [(x - FINAL_VIEW.cx) * FINAL_VIEW.scale + 540, (y - FINAL_VIEW.cy) * FINAL_VIEW.scale + 960];

export type CastSlot = {
  /** punto del suelo en MUNDO (u) donde la figura queda en reposo */
  x: number;
  y: number;
  scale: number;
  facing: 1 | -1;
  /** fotograma ABSOLUTO en que empieza a dibujarse */
  appear: number;
};

const { othersFrom, othersStagger } = COMPANION_TIMING;

/**
 * Reparto: dónde queda cada grupo (mundo, u) y cuándo aparece. Dos planos de profundidad (la fila de atrás más chica y más alta,
 * la de adelante a escala 1), asimétrico, con aire. Los de la derecha se dibujan en S4 (escalonados desde COMPANION_TIMING.othersFrom,
 * después de que la amiga entra); los de la izquierda al abrirse la cámara al encuadre final (S5).
 */
export const CAST_AT: Partial<Record<CastId, CastSlot>> = {
  elder: { x: 1450, y: 987, scale: 0.78, facing: -1, appear: othersFrom + othersStagger * 2 },
  parentChild: { x: 1800, y: 1509, scale: 1, facing: -1, appear: othersFrom + othersStagger * 4 },
  wheelchair: { x: -257, y: 1576, scale: 1, facing: 1, appear: CAMERA_TIMING.finalFrom + 10 },
  pair: { x: -607, y: 987, scale: 0.72, facing: 1, appear: CAMERA_TIMING.finalFrom + 20 },
};
