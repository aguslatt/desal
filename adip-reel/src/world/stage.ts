import { BENCH_SLOTS, PHONE_SCALE, benchSeat, phoneCenterWorld, phoneToWorld, S1_HIP_Y, type Pt } from "../illustration/index.ts";
import { getCursorAnchor } from "../chat/state.ts";
import type { CastId } from "../illustration/characters/cast-others.tsx";
import { COMPANION_TIMING } from "../config/timeline.ts";

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
//  abajo) y se convierte al mundo con `finalToWorld`. En S4 la cámara NO se aleja tanto (0,575× → 0,625×, ver WIDE_VIEW/HOLD_VIEW): muestra
//  a la protagonista, el banco y la amiga que llega, grandes y hacia el centro vertical; el resto del reparto se descubre al abrirse la
//  cámara al encuadre final (S5).
//  Restricciones que fijan estos números (medidas en los PNG con un script privado no versionado):
//   · con las cámaras de S4 nada ilustrado (ni el hilo sobre la cabeza ni las cabezas de la fila de atrás) queda a menos de 40 px de la tinta
//     del texto de arriba (tinta de «No tenés que pasar…» y de la firma: hasta y ≈ 425);
//   · desde f772 (aparece el logo, y ≥ 1120) el dibujo que queda sobre su columna (x 220–860) termina en y ≤ 1076: ≥ 40 px de aire al logo.
//     Por eso el hilo pasa a 60–82 u bajo el banco (y 1552–1574, ver thread/path.ts) y la cámara del gesto (HOLD_VIEW) mide el grupo ≈ 610 px.

/** Encuadre FINAL (S5–S6). */
export const FINAL_VIEW = { scale: 0.3, cx: 760, cy: 1559 } as const;
/**
 * Encuadres de S4 (el gesto). Mismo centro horizontal que el final (cx 760) para que la apertura a S5 sea solo zoom + un leve ascenso.
 * y de pantalla del suelo del banco: WIDE ≈ 1100 (el grupo hacia el centro vertical), HOLD ≈ 1012: con 0,625× el grupo (del hilo sobre la cabeza
 * al hilo bajo el banco) mide ≈ 600 px y entra justo entre la franja de texto (tinta hasta y 425 + 40) y el logo (que aparece en f772 en y ≥ 1120, − 40).
 */
export const WIDE_VIEW = { scale: 0.575, cx: 760, cy: 1249 } as const;
export const HOLD_VIEW = { scale: 0.625, cx: 760, cy: 1409 } as const;

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
  /** fotograma en que empieza a caminar/rodar hacia su reposo (por defecto: al terminar de dibujarse) */
  moveFrom?: number;
};

const { othersFrom, othersStagger } = COMPANION_TIMING;

/**
 * Reparto: dónde queda cada grupo (mundo, u) y cuándo aparece. Dos planos de profundidad (fila de atrás más chica y más alta, fila de
 * adelante), en DIAGONAL espejada: a la izquierda la pareja (atrás) y la silla de ruedas (adelante); a la derecha la madre con el niño
 * (atrás) y la mayor con bastón (adelante). Sobre el eje del banco queda el gesto.
 *
 * Cómo se revelan (cámaras: ver camera.ts):
 *  · la MAYOR (fila de adelante, junto al banco) es la única que se ve en S4: camina hacia el grupo desde el borde derecho (se dibuja
 *    justo en el borde, cuando la amiga ya pasó) con la cabeza a ≥ 40 px bajo el texto;
 *  · la pareja, la silla de ruedas y la madre con el niño están FUERA de cuadro con la cámara del gesto: se dibujan antes de entrar
 *    (f 742–796) y la cámara los va descubriendo al abrirse al encuadre final; la silla sale rodando desde el borde y los dos de la
 *    derecha dan sus pasos al entrar. Ninguna cabeza pasa por detrás del texto (la fila de atrás entra con y ≥ 465).
 */
export const CAST_AT: Partial<Record<CastId, CastSlot>> = {
  elder: { x: 1425, y: 1492, scale: 0.8, facing: -1, appear: othersFrom + othersStagger * 3 },
  parentChild: { x: 1990, y: 987, scale: 0.75, facing: -1, appear: 764, moveFrom: 798 },
  wheelchair: { x: -340, y: 1576, scale: 1, facing: 1, appear: 744, moveFrom: 796 },
  pair: { x: -607, y: 987, scale: 0.72, facing: 1, appear: 752 },
};

