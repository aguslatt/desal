import edl from './edl.json';

export type Pose = {cx: number; cy: number; z: number; b?: number};
export type Shot = {from: number; to: number; a: Pose; b: Pose; blend?: number};

const C = edl.offsets; // jump-cut positions (seconds on the edited timeline)
const END = edl.duration;

// Source frame is 2160x3840. cx/cy = window centre in source px, z = zoom (1 = full frame).
// Every jump cut changes the framing (alternating wide / tight) so cuts read as deliberate punch-ins.
const andy = (z0: number, z1: number, cx = 1150, cy = 1640): [Pose, Pose] => [{cx, cy, z: z0}, {cx: cx + 10, cy: cy - 10, z: z1}];
const andyQ = (z0: number, z1: number): [Pose, Pose] => [{cx: 1500, cy: 1890, z: z0}, {cx: 1500, cy: 1900, z: z1}];
const pau = (z0: number, z1: number, cx = 600, cy = 1920): [Pose, Pose] => [{cx, cy, z: z0, b: 1.12}, {cx: cx - 8, cy: cy + 5, z: z1, b: 1.12}];
const wide = (z0: number, z1: number): [Pose, Pose] => [{cx: 700, cy: 1850, z: z0, b: 1.12}, {cx: 690, cy: 1850, z: z1, b: 1.12}];
const S = (from: number, to: number, p: [Pose, Pose], blend = 0): Shot => ({from, to, a: p[0], b: p[1], blend});

export const SHOTS: Shot[] = [
  // Andy: hook
  S(0, C[1], andy(1.2, 1.22)),
  S(C[1], C[2], andy(1.38, 1.5)),
  S(C[2], C[3], andy(1.26, 1.36)),
  // Andy asks, reaction shot of Pau, back to Andy
  S(C[3], 7.28, andyQ(1.62, 1.7)),
  S(7.28, 9.14, pau(1.85, 1.93)),
  S(9.14, C[4], andyQ(1.7, 1.86)),
  // Pau answers
  S(C[4], C[5], pau(1.78, 1.9)),
  S(C[5], C[6], wide(1.5, 1.58)),
  S(C[6], C[7], pau(1.86, 1.94)),
  S(C[7], 22.45, wide(1.52, 1.66)),
  S(22.45, C[8], pau(1.95, 2.05)),
  S(C[8], 27.45, wide(1.62, 1.72)),
  S(27.45, C[9], pau(1.82, 1.92)),
  S(C[9], C[10], wide(1.55, 1.66)),
  S(C[10], C[11], pau(1.95, 2.06)),
  S(C[11], C[12], wide(1.6, 1.7)),
  // Andy closes
  S(C[12], END + 0.5, andy(1.7, 2.02, 1410, 1930)),
];

/** Quick digital punch-ins on emphasis words (settle back after ~1 s). */
export const PUNCHES: {t: number; amt: number}[] = [
  {t: 2.8, amt: 0.05},
  {t: 4.3, amt: 0.05},
  {t: 21.55, amt: 0.04},
  {t: 28.65, amt: 0.04},
  {t: 31.55, amt: 0.04},
  {t: 42.65, amt: 0.06},
  {t: 44.4, amt: 0.05},
];
