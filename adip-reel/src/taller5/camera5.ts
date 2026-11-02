import {clamp, easeOut, easeSoft, lerp} from '../ui';
export const SRC_W = 2160;
export const SRC_H = 3840;
// Full-bleed footage. Faces sit low so a flat colour block can own the top of the frame.
type Shot = {from: number; to: number; fx: number; fy: number; cw0: number; cw1: number; ay: number; ax?: number; two?: boolean; ease?: (x: number) => number};
export const SHOTS: Shot[] = [
  {from: 0, to: 1.0, fx: 1060, fy: 1920, cw0: 1750, cw1: 1400, ay: 1130, ease: easeOut},
  {from: 1.0, to: 2.77, fx: 1060, fy: 1920, cw0: 1400, cw1: 1330, ay: 1130},
  {from: 2.77, to: 5.7, fx: 1060, fy: 1920, cw0: 1560, cw1: 1470, ay: 1130},
  {from: 5.7, to: 6.57, fx: 1060, fy: 1920, cw0: 1380, cw1: 1340, ay: 1130},
  {from: 6.57, to: 9.67, fx: 1060, fy: 1920, cw0: 1560, cw1: 1420, ay: 1130},
  {from: 9.67, to: 16.37, fx: 1070, fy: 1760, cw0: 1950, cw1: 1880, ay: 1180, two: true},
  {from: 16.37, to: 18.55, fx: 1690, fy: 2000, cw0: 1400, cw1: 1330, ay: 1130, ax: 640},
  {from: 18.55, to: 23.6, fx: 1690, fy: 2000, cw0: 1520, cw1: 1450, ay: 1200, ax: 640},
  {from: 23.6, to: 24.4, fx: 1720, fy: 2030, cw0: 1450, cw1: 1430, ay: 1200, ax: 640},
  {from: 24.4, to: 29.5, fx: 1720, fy: 2030, cw0: 1420, cw1: 1350, ay: 1170, ax: 640},
  {from: 29.5, to: 33.07, fx: 1045, fy: 2090, cw0: 1950, cw1: 1900, ay: 1180, two: true},
  {from: 33.07, to: 37.47, fx: 972, fy: 2070, cw0: 1950, cw1: 1900, ay: 1180, two: true},
  {from: 37.47, to: 39.33, fx: 1045, fy: 2100, cw0: 1950, cw1: 1910, ay: 1180, two: true},
  {from: 39.33, to: 42.87, fx: 480, fy: 2070, cw0: 1450, cw1: 1360, ay: 1130, ax: 440},
  {from: 42.87, to: 47.3, fx: 1470, fy: 2110, cw0: 1450, cw1: 1370, ay: 1130, ax: 640},
  {from: 47.3, to: 51.83, fx: 1470, fy: 2110, cw0: 1370, cw1: 1260, ay: 1130, ax: 640},
  {from: 51.83, to: 60, fx: 1004, fy: 2120, cw0: 1750, cw1: 1650, ay: 1180},
];
export const TWO_Y = 600;
export const videoLayer = (t: number) => {
  let i = SHOTS.findIndex((x) => t >= x.from && t < x.to);
  if (i < 0) i = SHOTS.length - 1;
  const sh = SHOTS[i];
  const y0 = sh.two ? TWO_Y : 0;
  const h = 1920 - y0;
  const p = clamp((t - sh.from) / (sh.to - sh.from), 0, 1);
  const cw = lerp(sh.cw0, sh.cw1, (sh.ease ?? easeSoft)(p));
  const s = 1080 / cw;
  const tx = clamp((sh.ax ?? 540) - sh.fx * s, 1080 - SRC_W * s, 0);
  const ty = clamp(sh.ay - y0 - sh.fy * s, h - SRC_H * s, 0);
  return {y0, h, tx, ty, s};
};
