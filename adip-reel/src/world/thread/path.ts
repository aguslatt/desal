import { makeCurve, type CrayonData, type Pt } from "../../illustration/index.ts";
import { CURSOR_HANDOFF, THREAD_TIMING } from "../../config/timeline.ts";
import { chatToWorld, cursorBar } from "../stage.ts";
import { THREAD_EXTENSION } from "./extension.ts";

/**
 * EL HILO — definición COMO DATOS (coordenadas de MUNDO) de la curva naranja completa.
 *
 * Una sola curva continua (Catmull-Rom centrípeta por los puntos `ThreadAnchor.p`), de la que se dibuja la fracción
 * que corresponde a cada fotograma:
 *
 *   PARTE A (escena 3, esta archivo)   nace del cursor del chat → se estira hasta salir del encuadre de la pantalla
 *                                        (borde derecho) → rodea a la protagonista por arriba y por la izquierda →
 *                                        pasa por debajo del banco y sale del encuadre hacia la derecha.
 *   EXTENSIÓN (escenas 4–6, ./extension.ts, de WORLD-B)   continúa desde el último punto de la parte A hacia las demás
 *                                        personas y el logo.
 *
 * Cada ancla puede llevar `frame`: el fotograma en que la PUNTA del trazo llega a ese punto. El avance entre anclas con
 * `frame` es una interpolación monótona suave (sin frenar en cada ancla; arranca y termina quieto). Las anclas sin `frame`
 * solo dan forma a la curva.
 */
export type ThreadAnchor = {
  readonly p: Pt;
  /** fotograma ABSOLUTO en que la punta llega a este punto */
  readonly frame?: number;
  /** nombre (solo para depurar/documentar) */
  readonly name?: string;
};

/** Offsets (px NATIVOS del chat) respecto del centro del cursor naranja: la parte interior a la pantalla del celular. */
const INSIDE: readonly (readonly [number, number, string?])[] = [
  [0, 25, "barra: abajo"], // el cursor: barra vertical de 6×56 (centro del cursor = (0, 0)); el trazo la ocupa con su punta redonda
  [0, 0, "barra: centro"],
  [0.5, -25, "barra: arriba"],
  [18, -35, "se curva hacia la derecha, debajo de la 1.ª línea del campo"],
  [52, -33],
  [130, -25],
  [220, -42],
  [306, -105],
  [386, -195],
  [466, -305],
  [546, -415],
  [616, -500, "sale por el borde derecho de la pantalla"],
];

/** Parte A fuera de la pantalla (mundo, u). Empieza al salir del encuadre del chat (por el borde derecho del celular). */
const OUTSIDE: readonly (readonly [number, number, string?])[] = [
  [730, 1010],
  [762, 908],
  [748, 790],
  [684, 690],
  [572, 634, "sobre la cabeza de la protagonista"],
  [442, 640],
  [330, 710],
  [255, 840],
  [215, 1010],
  [200, 1200],
  [225, 1390],
  [330, 1530, "por debajo del banco"],
  [500, 1600],
  [780, 1625],
  [1100, 1590],
  [1400, 1500],
  [1650, 1380, "sale del encuadre hacia la derecha (fin de la parte A; aquí continúa WORLD-B)"],
];

export type ThreadStop = { readonly s: number; readonly frame: number };

export type ThreadDef = {
  readonly anchors: readonly ThreadAnchor[];
  readonly curve: CrayonData;
  readonly length: number;
  /** (fotograma → longitud de la punta) por las anclas con `frame` */
  readonly stops: readonly ThreadStop[];
  /** longitud (u) del tramo de la barra del cursor (de abajo a arriba) */
  readonly barLength: number;
  /** longitud (u) en que el trazo sale por el borde de la pantalla del celular */
  readonly leavesScreenAt: number;
  /** longitud (u) del final de la parte A */
  readonly endOfA: number;
};

const cache = new Map<string, ThreadDef>();

/** Arco de longitud acumulada hasta el vértice de la curva más cercano a `p` (las anclas están sobre la curva). */
const lengthAt = (curve: CrayonData, p: Pt): number => {
  const pts = curve.curve.pts;
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const d = (pts[i][0] - p[0]) ** 2 + (pts[i][1] - p[1]) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return curve.curve.cum[best];
};

/**
 * Hilo completo. Se llama en cada render (lee el ancla del cursor del chat, que depende de la fuente cargada); el resultado
 * se memoiza por posición del cursor.
 */
export const getThread = (): ThreadDef => {
  const bar = cursorBar();
  const key = `${bar.cx.toFixed(2)}|${bar.cy.toFixed(2)}|${THREAD_EXTENSION.length}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const anchors: ThreadAnchor[] = [];
  INSIDE.forEach(([dx, dy, name], i) => {
    const p = chatToWorld(bar.cx + dx, bar.cy + dy);
    const frame = i === 2 ? CURSOR_HANDOFF : i === INSIDE.length - 1 ? THREAD_TIMING.leavesChatBy : undefined;
    anchors.push({ p, frame, name });
  });
  OUTSIDE.forEach(([x, y, name], i) => {
    const frame = i === 4 ? 498 : i === 11 ? 526 : i === OUTSIDE.length - 1 ? THREAD_TIMING.loopTo : undefined;
    anchors.push({ p: [x, y], frame, name });
  });
  anchors.push(...THREAD_EXTENSION);

  const curve = makeCurve({ points: anchors.map((a) => a.p) });
  const stops: ThreadStop[] = [];
  anchors.forEach((a) => {
    if (a.frame === undefined) return;
    const s = lengthAt(curve, a.p);
    const last = stops[stops.length - 1];
    if (last && (a.frame <= last.frame || s < last.s)) return;
    stops.push({ s, frame: a.frame });
  });

  const def: ThreadDef = {
    anchors,
    curve,
    length: curve.length,
    stops,
    barLength: lengthAt(curve, anchors[2].p),
    leavesScreenAt: lengthAt(curve, anchors[INSIDE.length - 1].p),
    endOfA: lengthAt(curve, anchors[INSIDE.length + OUTSIDE.length - 1].p),
  };
  if (cache.size > 8) cache.clear();
  cache.set(key, def);
  return def;
};
