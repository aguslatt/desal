import {clamp, easeOut, easeSoft, lerp} from '../ui';

export const SRC_W = 2160;
export const SRC_H = 3840;
// Footage is full-bleed. Faces sit low (text lives on the white veil above), wide shots live in a window
// that starts at y=320 (hidden under the veil).
type Shot = {from: number; to: number; fx: number; fy: number; cw0: number; cw1: number; ay: number; ax?: number; win?: 'two'; ease?: (x: number) => number};
export const SHOTS: Shot[] = [
  {from: 0, to: 1.0, fx: 1060, fy: 1920, cw0: 1700, cw1: 1330, ay: 1060, ease: easeOut}, // hook: push-in on the first words
  {from: 1.0, to: 2.77, fx: 1060, fy: 1920, cw0: 1330, cw1: 1260, ay: 1060},
  {from: 2.77, to: 5.7, fx: 1060, fy: 1920, cw0: 1520, cw1: 1430, ay: 1060},
  {from: 5.7, to: 6.57, fx: 1060, fy: 1920, cw0: 1300, cw1: 1260, ay: 1060},
  {from: 6.57, to: 9.67, fx: 1060, fy: 1920, cw0: 1520, cw1: 1360, ay: 1060},
  // both: host introduces the workshop
  {from: 9.67, to: 16.37, fx: 1070, fy: 1760, cw0: 1850, cw1: 1800, ay: 1200, win: 'two'},
  // guest explains
  {from: 16.37, to: 18.55, fx: 1690, fy: 2000, cw0: 1300, cw1: 1250, ay: 1060, ax: 690},
  {from: 18.55, to: 23.6, fx: 1690, fy: 2000, cw0: 1250, cw1: 1200, ay: 1060, ax: 690},
  {from: 23.6, to: 24.4, fx: 1720, fy: 2030, cw0: 1200, cw1: 1180, ay: 1060, ax: 690},
  {from: 24.4, to: 29.5, fx: 1720, fy: 2030, cw0: 1180, cw1: 1120, ay: 1060, ax: 690},
  // conversation: both, looking at each other
  {from: 29.5, to: 33.07, fx: 1045, fy: 2090, cw0: 1850, cw1: 1800, ay: 1200, win: 'two'},
  {from: 33.07, to: 37.47, fx: 972, fy: 2070, cw0: 1850, cw1: 1800, ay: 1200, win: 'two'},
  {from: 37.47, to: 39.33, fx: 1045, fy: 2100, cw0: 1850, cw1: 1810, ay: 1200, win: 'two'},
  // host asks
  {from: 39.33, to: 42.87, fx: 480, fy: 2070, cw0: 1330, cw1: 1250, ay: 1060, ax: 400},
  // guest answers + call to action
  {from: 42.87, to: 47.3, fx: 1470, fy: 2110, cw0: 1330, cw1: 1260, ay: 1060, ax: 690},
  {from: 47.3, to: 51.83, fx: 1470, fy: 2110, cw0: 1260, cw1: 1180, ay: 1060, ax: 690},
  // both laugh
  {from: 51.83, to: 60, fx: 1004, fy: 2120, cw0: 1700, cw1: 1600, ay: 1200, win: 'two'},
];

export const TWO_Y = 560;
export const videoLayer = (t: number) => {
  let i = SHOTS.findIndex((x) => t >= x.from && t < x.to);
  if (i < 0) i = SHOTS.length - 1;
  const sh = SHOTS[i];
  const y0 = sh.win === 'two' ? TWO_Y : 0;
  const h = 1920 - y0;
  const p = clamp((t - sh.from) / (sh.to - sh.from), 0, 1);
  const cw = lerp(sh.cw0, sh.cw1, (sh.ease ?? easeSoft)(p));
  const s = 1080 / cw;
  const ay = sh.ay - y0;
  const tx = clamp((sh.ax ?? 540) - sh.fx * s, 1080 - SRC_W * s, 0);
  const ty = clamp(ay - sh.fy * s, h - SRC_H * s, 0);
  return {y0, h, tx, ty, s};
};
