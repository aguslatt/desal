import {Easing, interpolate} from 'remotion';

export const C = {
  orange: '#FE801C',
  green: '#94C920',
  violet: '#8A00B7',
  pink: '#ED2995',
  yellow: '#FFCB01',
  ink: '#16111D',
  white: '#FFFFFF',
  cream: '#FFF6EC',
};
export const FONT = "'Montserrat', sans-serif";

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const easeIO = Easing.bezier(0.65, 0, 0.35, 1);
export const easeSoft = Easing.bezier(0.4, 0, 0.2, 1);

export const prog = (t: number, t0: number, dur: number, ease: (x: number) => number = easeOut) =>
  interpolate(t, [t0, t0 + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

// Safe areas for Instagram Reels (1080x1920)
export const SAFE = {left: 72, right: 72, top: 250, bottom: 380};
