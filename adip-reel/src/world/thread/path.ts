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

/**
 * Parte A fuera de la pantalla (mundo, u). Empieza al salir del encuadre del chat (por el borde derecho del celular).
 * El 4.º elemento (opcional) es el fotograma en que la punta llega a ese punto.
 *
 * Forma pensada para que el GRUPO (del hilo sobre la cabeza al hilo bajo el banco) mida ≈ 600 px con la cámara del gesto (0,63×):
 *  · sobre la cabeza de la protagonista (coronilla en y 698): a 59 u del borde de la tinta → a cámara 0,3 quedan ≈ 18 px de aire;
 *  · el tramo que sube entre la protagonista y la amiga (del celular al punto más alto del arco) se BORRA al llegar la amiga (ARC_WIPE en
 *    state.ts): ahí va a sentarse y a ofrecer la mano, y la mano no puede cruzar la línea; el arco queda como una mitad de corazón que se
 *    cierra con el abrazo (branches.ts);
 *  · por debajo del banco (patas en y 1492): 1552–1574, es decir 60–82 u → ≈ 18–24 px a cámara 0,3 y ≥ 40 px de aire al logo (f772)
 *    mientras la cámara del gesto lo encuadra; recién después de x ≈ 1330 el hilo baja hasta la línea que sigue (extension.ts).
 */
const OUTSIDE: readonly (readonly [number, number, string?, number?])[] = [
  [730, 1010],
  [762, 908],
  [748, 790],
  [692, 690],
  [572, 632, "@arco: sobre la cabeza de la protagonista (a ≈ 59 u de ella); desde aquí queda dibujado el hilo en S4 (ver ARC_WIPE)", 498],
  [440, 640],
  [326, 712],
  [255, 850],
  [215, 1015],
  [200, 1200],
  [222, 1385],
  [296, 1490],
  [400, 1536],
  [560, 1558, "por debajo del banco (a ≥ 60 u de las patas)", 526],
  [800, 1568],
  [1100, 1572],
  [1330, 1590],
  [1480, 1618, "fin de la parte A: ya fuera del encuadre de S3 (borde derecho x ≈ 1335); aquí continúa la extensión", THREAD_TIMING.loopTo],
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
  /** longitud (u) del punto más alto del arco sobre la cabeza («@arco»): hasta ahí se borra el tramo que sube junto a la amiga (ARC_WIPE) */
  readonly arcStart: number;
  /** tramo (longitudes en u) donde el trazo pasa del ancho pleno al ancho fino (anclas «@fino:0» y «@fino:1») */
  readonly taper: { readonly s0: number; readonly s1: number };
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
  OUTSIDE.forEach(([x, y, name, frame]) => {
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
    arcStart: (() => {
      const a = anchors.find((q) => q.name?.startsWith("@arco"));
      return a ? lengthAt(curve, a.p) : 0;
    })(),
    taper: (() => {
      const a = anchors.find((q) => q.name === "@fino:0");
      const b = anchors.find((q) => q.name === "@fino:1");
      return a && b ? { s0: lengthAt(curve, a.p), s1: lengthAt(curve, b.p) } : { s0: curve.length, s1: curve.length };
    })(),
  };
  if (cache.size > 8) cache.clear();
  cache.set(key, def);
  return def;
};
