import {Easing, interpolate} from 'remotion';

// Colores EXACTOS del Manual de identidad visual Equipo ADIP (v2, oct 2026)
export const C = {
  violet: '#8A00B7',
  pink: '#ED2995',
  orange: '#FE801C',
  yellow: '#FFCB01',
  green: '#94C920',
  gray: '#EFEFEF',
  black: '#000000',
  white: '#FFFFFF',
  tintOrange: '#FFE6D2', // tinte de la familia naranja (Programa Sociolaboral y Vida Independiente)
};
export const FONT = "'Montserrat', sans-serif";
export const GRADIENT: [number, string][] = [
  [0, C.violet],
  [0.3, C.pink],
  [0.55, C.orange],
  [0.78, C.yellow],
  [1, C.green],
];

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const easeIO = Easing.bezier(0.65, 0, 0.35, 1);
export const easeSoft = Easing.bezier(0.4, 0, 0.2, 1);
export const easeBack = Easing.bezier(0.34, 1.56, 0.64, 1);

export const prog = (t: number, t0: number, dur: number, ease: (x: number) => number = easeOut) =>
  interpolate(t, [t0, t0 + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

// keyframes: [[t, v], ...]; each segment eased with `ease`
export const kf = (t: number, pts: [number, number][], ease: (x: number) => number = easeIO) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, v0] = pts[i - 1];
      const [t1, v1] = pts[i];
      return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
    }
  }
  return pts[pts.length - 1][1];
};
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
