import { makeCurve, type CrayonData, type Pt } from "../illustration/index.ts";
import { getCursorAnchor } from "../chat/state.ts";
import { chatToScreen } from "./layout.ts";

/**
 * EL HILO de la portada — curvas de crayón naranja en coordenadas de PANTALLA (1080×1920).
 *
 * El TRONCO nace del cursor naranja del chat (el mismo recorrido interior que en el reel: la barra del cursor, se curva a la
 * derecha por debajo de la 1.ª línea del campo y sale por el borde derecho de la pantalla del celular) y después barre la
 * página. Las RAMAS salen de puntos del tronco y terminan junto a cada figura del reparto SIN tocarla (≥ 30 px de aire).
 */

/**
 * Offsets (px NATIVOS del chat) respecto del centro del cursor: la parte que vive DENTRO de la pantalla del celular. Sale del cursor,
 * corre por el hueco entre las dos líneas del campo (sin tapar el texto), pasa por la derecha del final de la 1.ª línea («dónde»),
 * por encima del botón de enviar, y sale por el borde derecho.
 */
const INSIDE: readonly (readonly [number, number])[] = [
  [0, 25],
  [0, 0],
  [0.5, -25],
  [18, -33],
  [52, -31],
  [130, -27],
  [230, -30],
  [330, -36],
  [400, -46],
  [445, -78],
  [500, -132],
  [560, -200],
  [620, -270],
];

export type StrokeDef = {
  readonly id: string;
  readonly points: readonly Pt[];
  /** grosor en px de pantalla */
  readonly width: number;
  readonly startWidth: number;
  readonly endWidth: number;
  readonly seed: number;
};

export const THREAD_PX = 15;
/** grosor del tramo que vive dentro de la pantalla del celular (más fino: no tapa el chat) */
const INNER_PX = 6;

/** Tronco fuera del celular (pantalla): sube junto al celular y rodea por arriba la cabeza de la protagonista hacia la izquierda. */
const TRUNK_OUT: readonly Pt[] = [
  [606, 1004],
  [632, 935],
  [630, 862],
  [602, 800],
  [552, 750],
  [490, 718],
  [415, 702],
  [348, 712],
  [298, 744],
  [272, 792],
];

/** Rama derecha: un arco que cruza el hueco junto al banco, bordea a la persona mayor y baja hasta la silla de ruedas. */
const RIGHT_BRANCH: readonly Pt[] = [
  [606, 1004],
  [650, 950],
  [714, 896],
  [768, 858],
  [800, 856],
  [815, 896],
  [813, 962],
  [805, 1032],
  [798, 1102],
  [794, 1158],
  [794, 1208],
];

export type CoverThread = {
  readonly strokes: readonly StrokeDef[];
  /** el tramo interior (nace en el cursor del chat y llega al borde de la pantalla) */
  readonly inner: StrokeDef;
  /** punto del cursor (pantalla) donde nace el trazo */
  readonly cursor: Pt;
  /** punto donde el hilo sale de la pantalla del celular */
  readonly exit: Pt;
};

export const getCoverThread = (): CoverThread => {
  const bar = getCursorAnchor();
  const inside = INSIDE.map(([dx, dy]) => chatToScreen(bar.cx + dx, bar.cy + dy));
  const exit = inside[inside.length - 1];
  const inner: StrokeDef = { id: "inner", points: inside, width: INNER_PX, startWidth: 0.3, endWidth: 1, seed: 7 };
  // el tramo exterior empieza en el borde de la pantalla (oculto un instante por el bisel y el brazo) con el mismo rumbo
  const trunk: StrokeDef = { id: "trunk", points: [inside[inside.length - 2], exit, ...TRUNK_OUT], width: THREAD_PX, startWidth: 0.55, endWidth: 0.45, seed: 8 };
  const right: StrokeDef = { id: "right", points: RIGHT_BRANCH, width: THREAD_PX, startWidth: 0.6, endWidth: 0.45, seed: 19 };
  return { strokes: [inner, trunk, right], inner, cursor: chatToScreen(bar.cx, bar.cy), exit };
};
