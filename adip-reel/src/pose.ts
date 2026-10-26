import {MICRO_CUTS, Pose, PUNCHES, SHOTS} from './shots';
import {clamp, easeIO, easeOut, easeSoft, lerp} from './ui';

const mix = (a: Pose, b: Pose, k: number): Pose => ({
  cx: lerp(a.cx, b.cx, k),
  cy: lerp(a.cy, b.cy, k),
  z: lerp(a.z, b.z, k),
  b: lerp(a.b ?? 1, b.b ?? 1, k),
});

/** Quick digital punch-in that settles back: used on emphasis words. */
const punch = (t: number) => {
  let s = 0;
  for (const p of PUNCHES) {
    const d = t - p.t;
    if (d < 0 || d > 1.1) continue;
    s += p.amt * (d < 0.16 ? easeOut(d / 0.16) : 1 - easeIO(clamp((d - 0.16) / 0.9, 0, 1)));
  }
  return s;
};

export const poseAt = (t: number): Pose => {
  let i = SHOTS.findIndex((s) => t >= s.from && t < s.to);
  if (i < 0) i = SHOTS.length - 1;
  const s = SHOTS[i];
  const p = clamp((t - s.from) / (s.to - s.from), 0, 1);
  let cur = mix(s.a, s.b, easeSoft(p));
  if (s.blend && i > 0 && t - s.from < s.blend) {
    cur = mix(SHOTS[i - 1].b, cur, easeIO(clamp((t - s.from) / s.blend, 0, 1)));
  }
  // alternate a small scale step on every micro jump-cut inside the shot
  const steps = MICRO_CUTS.filter((m) => m > s.from + 0.1 && m <= t).length;
  const step = steps % 2 === 1 ? 1.055 : 1;
  return {...cur, z: cur.z * step * (1 + punch(t))};
};

export const windowAt = (t: number) => {
  const p = poseAt(t);
  const W = 2160 / p.z;
  const H = 3840 / p.z;
  const left = clamp(p.cx - W / 2, 0, 2160 - W);
  const top = clamp(p.cy - H / 2, 0, 3840 - H);
  return {left, top, W, H, b: p.b ?? 1};
};
