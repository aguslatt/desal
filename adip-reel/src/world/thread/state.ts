import { CAMERA_TIMING, CURSOR_HANDOFF, THREAD_TIMING } from "../../config/timeline.ts";
import { Easing } from "remotion";
import { getThread, type ThreadDef, type ThreadStop } from "./path.ts";

/**
 * ESTADO del hilo por fotograma (puro): cuánto está dibujado, con qué grosor, y el cursor-barra que hace de arranque.
 *
 *  · f < CURSOR_HANDOFF (410): el hilo no existe (el cursor lo dibuja el chat).
 *  · f = 410: el hilo dibuja EXACTAMENTE el cursor (misma barra de 6×56 px nativos, opacidad 1).
 *  · 410 → leavesChatBy (456): la barra se estira por arriba, se curva hacia la derecha y se vuelve un trazo de crayón
 *    que sale por el borde de la pantalla; el grosor pasa de ≈ 6 px (el ancho del cursor) a ≈ 14 px de pantalla.
 *  · 456 → loopTo (548): sigue dibujándose en el mundo (rodea a la persona y sale del encuadre).
 */
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const START_SLOPE = 0.5;

/** Longitud de la punta (u) en `frame`: Hermite cúbico monótono por las paradas, arrancando y terminando quieta. */
export const tipLength = (stops: readonly ThreadStop[], frame: number): number => {
  const n = stops.length;
  if (n === 0) return 0;
  if (frame <= stops[0].frame) return stops[0].s;
  if (frame >= stops[n - 1].frame) return stops[n - 1].s;
  let i = 0;
  while (i < n - 2 && frame >= stops[i + 1].frame) i++;
  const d = (k: number): number => (stops[k + 1].s - stops[k].s) / (stops[k + 1].frame - stops[k].frame);
  const slope = (k: number): number => {
    if (k <= 0) return START_SLOPE * d(0); // la barra del cursor arranca con ímpetu (no desde el reposo absoluto)
    if (k >= n - 1) return 0;
    const a = d(k - 1);
    const b = d(k);
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  };
  const f0 = stops[i].frame;
  const f1 = stops[i + 1].frame;
  const h = f1 - f0;
  const t = (frame - f0) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  const m0 = slope(i) * h;
  const m1 = slope(i + 1) * h;
  return (2 * t3 - 3 * t2 + 1) * stops[i].s + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * stops[i + 1].s + (t3 - t2) * m1;
};

/** Grosor del trazo en px de PANTALLA (parámetro `width` del CrayonCurve) por fotograma: de la barra del cursor al crayón. */
const WIDTH_FROM = 3.4;
const WIDTH_TO = 14;
const WIDEN_END = 452;
const easeWiden = Easing.bezier(0.35, 0, 0.2, 1);

export type ThreadState = {
  /** ¿el hilo ya existe (lo dibuja el hilo y no el chat)? */
  readonly alive: boolean;
  /** longitud (u) de la punta */
  readonly s: number;
  /** fracción 0..1 de la curva dibujada */
  readonly progress: number;
  /** fracción donde empieza lo visible (para el tramo del mundo) */
  readonly from: number;
  /** grosor en px de pantalla */
  readonly width: number;
  /** opacidad del rectángulo-cursor idéntico al del chat (arranque exacto del traspaso) */
  readonly barOpacity: number;
  /** tramo de la parte interior a la pantalla del celular que ya se borró (fracción 0..1) */
  readonly innerFrom: number;
  /** opacidad de la capa interior a la pantalla */
  readonly innerOpacity: number;
};

export const threadAt = (frame: number, def: ThreadDef = getThread()): ThreadState => {
  if (frame < THREAD_TIMING.bornFrom) return { alive: false, s: 0, progress: 0, from: 0, width: WIDTH_FROM, barOpacity: 0, innerFrom: 0, innerOpacity: 0 };
  const s = tipLength(def.stops, frame);
  const wt = easeWiden(clamp01((frame - CURSOR_HANDOFF) / (WIDEN_END - CURSOR_HANDOFF)));
  // el rectángulo del cursor queda debajo del trazo hasta que éste lo engloba; después se desvanece sin que se note
  const barOpacity = 1 - clamp01((frame - (CURSOR_HANDOFF + 8)) / 14);
  // en f410 solo se ve el rectángulo-cursor (idéntico al del chat); el trazo de crayón nace en f411 por debajo de él
  const crayon = frame > CURSOR_HANDOFF;
  // cuando el hilo ya es del mundo, la parte que quedó DENTRO de la pantalla se borra desde el origen (el hilo «se suelta» del celular)
  const wipe = clamp01((frame - WIPE.from) / (WIPE.to - WIPE.from));
  const e = wipe * wipe * (3 - 2 * wipe);
  return {
    alive: true,
    s,
    progress: crayon ? clamp01(s / def.length) : 0,
    from: 0,
    width: lerp(WIDTH_FROM, WIDTH_TO, wt),
    barOpacity,
    innerFrom: (def.leavesScreenAt * e) / def.length,
    innerOpacity: 1,
  };
};

/** Cuándo el tramo interior se borra: la cámara ya aterrizó en el encuadre de la persona y el hilo «se suelta» del celular. */
export const WIPE = { from: CAMERA_TIMING.pullOutTo + 6, to: CAMERA_TIMING.pullOutTo + 46 } as const;

/** Punta del trazo en el mundo en `frame` ({x, y} en u, tangente tx/ty, ángulo en °): para anclar gestos u objetos al hilo. */
export const threadTipAt = (frame: number, def: ThreadDef = getThread()) => def.curve.tip(threadAt(frame, def).progress);
