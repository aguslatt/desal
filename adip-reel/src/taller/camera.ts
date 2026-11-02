import {clamp, easeIO, easeOut, easeSoft, lerp, prog} from '../ui';

// Source (graded proxy) is 2160x3840. A "shot" is a 9:16-agnostic crop: the source point (fx, fy) is placed
// at (ax, af*containerHeight) and the crop is `cw` source pixels wide (scale = 1080 / cw).
export const SRC_W = 2160;
export const SRC_H = 3840;

type Shot = {from: number; to: number; fx: number; fy: number; cw0: number; cw1: number; af: number; ax?: number; ease?: (x: number) => number};
// faces measured on the original: blonde (host) ~ (.20-.50, .50); redhead ~ (.68-.80, .52-.55)
export const SHOTS: Shot[] = [
  // --- host alone ---
  {from: 0, to: 1.0, fx: 1060, fy: 1920, cw0: 1700, cw1: 1250, af: 0.47, ease: easeOut}, // hook: push-in on the first words
  {from: 1.0, to: 2.77, fx: 1060, fy: 1920, cw0: 1250, cw1: 1180, af: 0.47, ease: easeSoft},
  {from: 2.77, to: 5.7, fx: 1060, fy: 1920, cw0: 1520, cw1: 1430, af: 0.46, ease: easeSoft}, // looser: breath
  {from: 5.7, to: 6.57, fx: 1060, fy: 1920, cw0: 1250, cw1: 1210, af: 0.47, ease: easeSoft},
  {from: 6.57, to: 9.67, fx: 1060, fy: 1920, cw0: 1520, cw1: 1330, af: 0.46, ease: easeSoft},
  // --- both, host introduces the workshop (split layout, wide) ---
  {from: 9.67, to: 16.37, fx: 1070, fy: 1760, cw0: 2000, cw1: 1900, af: 0.5, ease: easeSoft},
  // --- guest explains ---
  {from: 16.37, to: 18.55, fx: 1690, fy: 2000, cw0: 1300, cw1: 1200, af: 0.47, ease: easeSoft},
  {from: 18.55, to: 23.6, fx: 1690, fy: 2000, cw0: 1200, cw1: 1150, af: 0.45, ease: easeSoft},
  {from: 23.6, to: 24.4, fx: 1720, fy: 2030, cw0: 1200, cw1: 1180, af: 0.45, ease: easeSoft},
  {from: 24.4, to: 29.5, fx: 1720, fy: 2030, cw0: 1200, cw1: 1120, af: 0.47, ease: easeSoft},
  // --- conversation: open framing, the two of them looking at each other ---
  {from: 29.5, to: 33.07, fx: 1045, fy: 2090, cw0: 2000, cw1: 1930, af: 0.5, ease: easeSoft},
  {from: 33.07, to: 37.47, fx: 972, fy: 2070, cw0: 2000, cw1: 1930, af: 0.5, ease: easeSoft},
  {from: 37.47, to: 39.33, fx: 1045, fy: 2100, cw0: 2000, cw1: 1950, af: 0.5, ease: easeSoft},
  // --- host asks ---
  {from: 39.33, to: 42.87, fx: 480, fy: 2070, cw0: 1300, cw1: 1220, af: 0.47, ease: easeSoft},
  // --- guest answers + call to action ---
  {from: 42.87, to: 47.3, fx: 1470, fy: 2110, cw0: 1320, cw1: 1220, af: 0.5, ax: 700, ease: easeSoft},
  {from: 47.3, to: 51.83, fx: 1470, fy: 2110, cw0: 1050, cw1: 980, af: 0.52, ax: 700, ease: easeSoft},
  // --- both laugh: open frame ---
  {from: 51.83, to: 60, fx: 1004, fy: 2120, cw0: 1600, cw1: 1480, af: 0.47, ease: easeSoft},
];

// ---- layout of the footage window ----
export type Win = {y: number; h: number; rb: number};
const FULL: Win = {y: 0, h: 1920, rb: 0};
const TOP: Win = {y: 0, h: 800, rb: 0};
const BOT: Win = {y: 640, h: 1280, rb: 0};
type Lay = {from: number; win: Win; morph: number; kind: 'full' | 'top' | 'bot'};
export const LAYOUTS: Lay[] = [
  {from: 9.67, win: TOP, morph: 0.01, kind: 'top'}, // covered by the violet block
  {from: 16.37, win: FULL, morph: 0.01, kind: 'full'}, // covered by the orange block
  {from: 18.5, win: BOT, morph: 0.65, kind: 'bot'},
  {from: 24.25, win: FULL, morph: 0.6, kind: 'full'},
  {from: 29.2, win: TOP, morph: 0.65, kind: 'top'},
  {from: 39.15, win: FULL, morph: 0.5, kind: 'full'},
];
export const layoutAt = (t: number) => {
  let win = FULL;
  const w = {top: 0, bot: 0};
  for (const l of LAYOUTS) {
    if (t < l.from) break;
    const k = prog(t, l.from, l.morph, easeIO);
    win = {y: lerp(win.y, l.win.y, k), h: lerp(win.h, l.win.h, k), rb: 0};
    w.top = lerp(w.top, l.kind === 'top' ? 1 : 0, k);
    w.bot = lerp(w.bot, l.kind === 'bot' ? 1 : 0, k);
    if (k < 1) break;
  }
  return {win, ...w};
};

export const videoTransform = (t: number, h: number) => {
  let i = SHOTS.findIndex((x) => t >= x.from && t < x.to);
  if (i < 0) i = SHOTS.length - 1;
  const sh = SHOTS[i];
  const p = clamp((t - sh.from) / (sh.to - sh.from), 0, 1);
  const cw = lerp(sh.cw0, sh.cw1, (sh.ease ?? easeSoft)(p));
  const s = 1080 / cw;
  const ax = sh.ax ?? 540;
  const ay = sh.af * h;
  const tx = clamp(ax - sh.fx * s, 1080 - SRC_W * s, 0);
  const ty = clamp(ay - sh.fy * s, h - SRC_H * s, 0);
  return {tx, ty, s};
};
