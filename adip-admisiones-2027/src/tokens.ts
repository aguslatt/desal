// Equipo ADIP · manual v2 (octubre 2026). No hay otros colores.
export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const K = {
  violet: '#8A00B7',
  pink: '#ED2995',
  orange: '#FE801C',
  yellow: '#FFCB01',
  green: '#94C920',
  gray: '#EFEFEF',
  ink: '#000000',
  white: '#FFFFFF',
};
export const FONT = "'Montserrat', sans-serif";
// degradé ADIP, siempre en este orden (solo en recursos: el trazo)
export const GRAD: [number, string][] = [
  [0, K.violet],
  [0.3, K.pink],
  [0.55, K.orange],
  [0.78, K.yellow],
  [1, K.green],
];

// zona segura de Instagram para 1080×1920 (manual: contenido entre 260 y 1580)
export const SAFE = {top: 262, bottom: 1580, left: 80, right: 1000};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
export const easeInCubic = (t: number) => t * t * t;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const lin = (t: number) => t;
/** progreso 0..1 de una animación que arranca en t0 y dura dur (s) */
export const prog = (t: number, t0: number, dur: number, ease: (x: number) => number = easeOutCubic) =>
  ease(clamp((t - t0) / dur));
