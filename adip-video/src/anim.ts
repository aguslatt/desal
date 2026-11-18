import type {RGB} from './theme';
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeOut5 = (x: number) => 1 - Math.pow(1 - x, 5);
export const easeIn = (x: number) => x * x * x;
export const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const back = (x: number) => {
  const c1 = 1.35;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
export const prog = (t: number, t0: number, dur: number, ease: (x: number) => number = easeOut) => ease(clamp01((t - t0) / dur));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** One state of the shape that carries each block: card -> tag -> underline -> frame. */
export type Shape = {x: number; y: number; w: number; h: number; r: number; col: RGB; fa: number; bw: number; op: number};
export type Key = Partial<Shape> & {t: number; dur?: number; ease?: (x: number) => number};

export const track = (t: number, base: Shape, keys: Key[]): Shape => {
  let cur: Shape = {...base};
  for (const k of keys) {
    const p = prog(t, k.t, k.dur ?? 0.45, k.ease ?? easeIO);
    if (p <= 0) break;
    const next: Shape = {...cur, ...k} as Shape;
    cur = {
      x: lerp(cur.x, next.x, p),
      y: lerp(cur.y, next.y, p),
      w: lerp(cur.w, next.w, p),
      h: lerp(cur.h, next.h, p),
      r: lerp(cur.r, next.r, p),
      fa: lerp(cur.fa, next.fa, p),
      bw: lerp(cur.bw, next.bw, p),
      op: lerp(cur.op, next.op, p),
      col: [lerp(cur.col[0], next.col[0], p), lerp(cur.col[1], next.col[1], p), lerp(cur.col[2], next.col[2], p)],
    };
  }
  return cur;
};

let ctx: CanvasRenderingContext2D | null = null;
/** Text width in px (Montserrat must be loaded). tracking in em. */
export const tw = (text: string, size: number, weight: number, tracking = 0) => {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  ctx!.font = `${weight} ${size}px Montserrat`;
  return ctx!.measureText(text).width + tracking * size * text.length;
};
/** Largest size (<= max) at which every line fits maxW. */
export const fit = (lines: string[], maxW: number, max: number, weight: number) => {
  const widest = Math.max(...lines.map((l) => tw(l, 100, weight)));
  return Math.min(max, Math.floor((100 * maxW) / widest));
};
// Montserrat vertical metrics for a line box with line-height 1
export const CAP_TOP = 0.158;
export const BASE = 0.858;
