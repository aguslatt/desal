import edl from './edl.json';
import {T, TE} from './data';

export type Pose = {cx: number; cy: number; z: number; b?: number};
export type Shot = {from: number; to: number; a: Pose; b: Pose; blend?: number};

/** Position on the edited timeline where the source segment starting at `srcStart` begins. */
export const cutAtSrc = (srcStart: number) => {
  const i = edl.segments.findIndex(([a]) => Math.abs(a - srcStart) < 0.02);
  if (i < 0) throw new Error('no segment at src ' + srcStart);
  return edl.offsets[i];
};
export const END = edl.duration;
export const CUT_HOOK_Q = cutAtSrc(11.05); // hook -> question
export const CUT_Q_A = cutAtSrc(18.26); // question -> answer (Andy -> Paola)
export const CUT_A_CLOSE = cutAtSrc(53.0); // answer -> closing (Paola -> Andy)

// Source frame is 2160x3840. cx/cy = window centre in source px, z = zoom (1 = full frame).
// Faces sit high enough (eyes ~y1000) to leave the captions below the chin.
const lift = (z: number, px: number) => px / (0.5 * z);
const andy = (z0: number, z1: number, cx = 1150, cy = 1640, up = 0): [Pose, Pose] => [
  {cx, cy: cy + lift(z0, up), z: z0},
  {cx: cx + 10, cy: cy - 10 + lift(z1, up), z: z1},
];
const andyQ = (z0: number, z1: number): [Pose, Pose] => [
  {cx: 1500, cy: 1890 + lift(z0, 200), z: z0},
  {cx: 1500, cy: 1900 + lift(z1, 200), z: z1},
];
const pau = (z0: number, z1: number, cx = 600, cy = 1920): [Pose, Pose] => [
  {cx, cy: cy + lift(z0, 260), z: z0, b: 1.12},
  {cx: cx - 8, cy: cy + 5 + lift(z1, 260), z: z1, b: 1.12},
];
const wide = (z0: number, z1: number): [Pose, Pose] => [
  {cx: 700, cy: 1850 + lift(z0, 260), z: z0, b: 1.12},
  {cx: 690, cy: 1850 + lift(z1, 260), z: z1, b: 1.12},
];
const S = (from: number, to: number, p: [Pose, Pose], blend = 0): Shot => ({from, to, a: p[0], b: p[1], blend});

const tReact0 = T('familia') - 0.06;
const tReact1 = TE('prestación') + 0.1;
const cuts = {
  nosotros: T('nosotros') - 0.06,
  donde: T('donde') - 0.05,
  admisiones: TE('admisiones') + 0.1,
  caba0: T('caba', 0) - 0.12,
  y: T('y', 0) - 0.06,
  queda2: T('queda', 2) - 0.12,
  los: T('los') - 0.05,
  nuestros: T('nuestros') - 0.05,
  e: T('e') - 0.06,
};

export const SHOTS: Shot[] = [
  // Andy: hook
  S(0, edl.offsets[1], andy(1.2, 1.22, 1150, 1640, 100)),
  S(edl.offsets[1], edl.offsets[2], andy(1.38, 1.5, 1150, 1640, 100)),
  S(edl.offsets[2], CUT_HOOK_Q, andy(1.26, 1.36, 1150, 1640, 100)),
  // Andy asks, reaction shot of Paola, back to Andy
  S(CUT_HOOK_Q, tReact0, andyQ(1.62, 1.7)),
  S(tReact0, tReact1, pau(1.85, 1.93)),
  S(tReact1, CUT_Q_A, andyQ(1.7, 1.86)),
  // Paola answers: alternate wide / tight on sentence beats
  S(CUT_Q_A, cuts.nosotros, pau(1.78, 1.9)),
  S(cuts.nosotros, cuts.donde, wide(1.5, 1.58)),
  S(cuts.donde, cuts.admisiones, pau(1.86, 1.94)),
  S(cuts.admisiones, cuts.caba0, wide(1.52, 1.66)),
  S(cuts.caba0, cuts.y, pau(1.95, 2.05)),
  S(cuts.y, cuts.queda2, wide(1.62, 1.72)),
  S(cuts.queda2, cuts.los, pau(1.82, 1.92)),
  S(cuts.los, cuts.nuestros, wide(1.55, 1.66)),
  S(cuts.nuestros, cuts.e, pau(1.95, 2.06)),
  S(cuts.e, CUT_A_CLOSE, wide(1.6, 1.7)),
  // Andy closes
  S(CUT_A_CLOSE, END + 0.5, andy(1.7, 2.02, 1410, 1930, 140)),
];

/** Quick digital punch-ins on emphasis words (settle back after ~1 s). */
export const PUNCHES: {t: number; amt: number}[] = [
  {t: T('escolar') - 0.02, amt: 0.05},
  {t: T('momento') - 0.02, amt: 0.05},
  {t: T('930') - 0.05, amt: 0.04},
  {t: T('5140') - 0.05, amt: 0.04},
  {t: T('amplios') - 0.05, amt: 0.04},
  {t: T('2027') - 0.05, amt: 0.06},
  {t: T('contactarnos') - 0.05, amt: 0.05},
];

/** Jump cuts that do not coincide with a framing change get a small scale step so they read as punch-ins. */
export const MICRO_CUTS: number[] = edl.offsets
  .slice(1)
  .filter((o) => !SHOTS.some((s) => Math.abs(s.from - o) < 0.12));
