import {Easing, interpolate} from 'remotion';

// Paleta institucional (manual de identidad v2) y tintes permitidos.
export const C = {
  violet: '#8A00B7',
  pink: '#ED2995',
  orange: '#FE801C',
  yellow: '#FFCB01',
  green: '#94C920',
  gray: '#EFEFEF',
  logoGray: '#626161',
  black: '#000000',
  white: '#FFFFFF',
  tintOrange: '#FFE6D2',
  tintPink: '#FBD4EA',
  tintYellow: '#FFF0B8',
};
export const GRADIENT = `linear-gradient(90deg, ${C.violet} 0%, ${C.pink} 30%, ${C.orange} 55%, ${C.yellow} 78%, ${C.green} 100%)`;
export const FONT = "'Montserrat', sans-serif";

export const FPS = 25;
export const TOTAL = 30.4;
export const VIDEO_END = 26.3; // el clip termina en 26.32 s

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const easeIO = Easing.bezier(0.65, 0, 0.35, 1);

export const prog = (t: number, t0: number, dur: number, ease: (x: number) => number = easeOut) =>
  interpolate(t, [t0, t0 + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
