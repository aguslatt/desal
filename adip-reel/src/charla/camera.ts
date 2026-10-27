import {CUTS, T, TE, H} from './data';
import {clamp, easeIO, easeOut, easeSoft, lerp, prog} from '../ui';

// Source clip is 1080x1920 (graded + tone-mapped proxy). Face centre ≈ (585, 830), head top ≈ y610.
export type Rect = {x: number; y: number; w: number; h: number; rt: number; rb: number};
export const FULL: Rect = {x: 0, y: 0, w: 1080, h: 1920, rt: 0, rb: 0};
export const ARC: Rect = {x: 200, y: 580, w: 680, h: 800, rt: 340, rb: 0};
export const PANEL: Rect = {x: 0, y: 660, w: 1080, h: 1260, rt: 0, rb: 0};
export const INFO: Rect = {x: 0, y: 0, w: 1080, h: 790, rt: 0, rb: 56};
export const PANEL_Y = PANEL.y;

export type Pose = {s: number; fx: number; fy: number; ax?: number; ay?: number};
export type Shot = {from: number; to: number; a: Pose; b: Pose};

const face = (s0: number, s1: number, ay = 940, fx = 585): [Pose, Pose] => [
  {s: s0, fx, fy: 830, ay},
  {s: s1, fx: fx + 6, fy: 826, ay: ay - 6},
];
const S = (from: number, to: number, p: [Pose, Pose]): Shot => ({from, to, a: p[0], b: p[1]});

// ---- layout schedule (container that holds the footage) ----
export const ARC_IN = T('para') - 0.5;
export const ARC_OUT = TE('adolescentes') + 0.12;
export const INFO_SWAP = T('el', 2) - 0.2; // behind the ribbon wipe
export const INFO_OUT = TE('online') + 0.18;
export const PANEL_IN = T('sin') - 0.45;
export const PANEL_OUT = TE('situaciones') + 0.3;

type Lay = {from: number; rect: Rect; morph: number; kind: 'arc' | 'info' | 'panel' | 'full'};
const LAYOUTS: Lay[] = [
  {from: ARC_IN, rect: ARC, morph: 0.7, kind: 'arc'},
  {from: ARC_OUT, rect: FULL, morph: 0.6, kind: 'full'},
  {from: PANEL_IN, rect: PANEL, morph: 0.55, kind: 'panel'},
  {from: PANEL_OUT, rect: FULL, morph: 0.6, kind: 'full'},
  {from: INFO_SWAP, rect: INFO, morph: 0.01, kind: 'info'},
  {from: INFO_OUT, rect: FULL, morph: 0.65, kind: 'full'},
];
const lr = (a: Rect, b: Rect, k: number): Rect => ({
  x: lerp(a.x, b.x, k),
  y: lerp(a.y, b.y, k),
  w: lerp(a.w, b.w, k),
  h: lerp(a.h, b.h, k),
  rt: lerp(a.rt, b.rt, k),
  rb: lerp(a.rb, b.rb, k),
});
export const layoutAt = (t: number) => {
  let rect = FULL;
  const wgt = {arc: 0, info: 0, panel: 0};
  for (const l of LAYOUTS) {
    if (t < l.from) break;
    const k = prog(t, l.from, l.morph, easeIO);
    rect = lr(rect, l.rect, k);
    wgt.arc = lerp(wgt.arc, l.kind === 'arc' ? 1 : 0, k);
    wgt.info = lerp(wgt.info, l.kind === 'info' ? 1 : 0, k);
    wgt.panel = lerp(wgt.panel, l.kind === 'panel' ? 1 : 0, k);
    if (k < 1) break;
  }
  return {rect, ...wgt};
};

// ---- camera inside the container ----
const tPara = T('para');
export const SHOTS: Shot[] = [
  // hook: quick push on the speaker
  S(0, 3.56, face(1.04, 1.16, 950)),
  // intro: date + invitation
  S(3.56, T('taller') + 0.4, face(1.0, 1.1, 940)),
  S(T('taller') + 0.4, tPara - 0.1, face(1.12, 1.2, 940)),
  // arc: tight on the face inside the window (s is relative to container)
  S(tPara - 0.1, ARC_OUT + 0.3, [
    {s: 1.14, fx: 585, fy: 905, ax: 340, ay: 400},
    {s: 1.22, fx: 585, fy: 905, ax: 340, ay: 400},
  ]),
  // story: turbulent stage -> without tools
  S(ARC_OUT + 0.3, T('esa') - 0.1, face(1.0, 1.08, 960)),
  S(T('esa') - 0.1, PANEL_IN, face(1.14, 1.24, 930)),
  // colour panel on top, footage below
  S(PANEL_IN, PANEL_OUT, [
    {s: 1.1, fx: 585, fy: 830, ax: 540, ay: 400},
    {s: 1.2, fx: 585, fy: 830, ax: 540, ay: 400},
  ]),
  S(PANEL_OUT, T('que', 2) - 0.1, face(1.16, 1.24, 940)),
  S(T('que', 2) - 0.1, INFO_SWAP, face(1.04, 1.12, 960)),
  // info layout (container 1080x790): face centred in the window
  S(INFO_SWAP, INFO_OUT, [
    {s: 1.05, fx: 585, fy: 830, ax: 540, ay: 430},
    {s: 1.12, fx: 585, fy: 830, ax: 540, ay: 430},
  ]),
  // CTA
  S(INFO_OUT, 55.9, face(1.1, 1.22, 950)),
];

const mix = (a: Pose, b: Pose, k: number): Pose => ({
  s: lerp(a.s, b.s, k),
  fx: lerp(a.fx, b.fx, k),
  fy: lerp(a.fy, b.fy, k),
  ax: a.ax === undefined ? undefined : lerp(a.ax, b.ax ?? a.ax, k),
  ay: a.ay === undefined ? undefined : lerp(a.ay, b.ay ?? a.ay, k),
});

/** Small digital punch on emphasis words: quickly in, slowly settles. */
const PUNCH_AT: [number, number][] = [
  [T('24'), 0.045],
  [T('taller'), 0.04],
  [T('herramientas'), 0.05],
  [T('límites'), 0.045],
  [T('conductuales'), 0.04],
  [T('19'), 0.04],
  [T('online'), 0.045],
  [T('info'), 0.05],
];
const punch = (t: number) => {
  let s = 0;
  for (const [t0, amt] of PUNCH_AT) {
    const d = t - (t0 - 0.04);
    if (d < 0 || d > 1.1) continue;
    s += amt * (d < 0.14 ? easeOut(d / 0.14) : 1 - easeIO(clamp((d - 0.14) / 0.95, 0, 1)));
  }
  return s;
};

export const poseAt = (t: number): Pose => {
  let i = SHOTS.findIndex((x) => t >= x.from && t < x.to);
  if (i < 0) i = t < SHOTS[0].from ? 0 : SHOTS.length - 1;
  const sh = SHOTS[i];
  const p = clamp((t - sh.from) / (sh.to - sh.from), 0, 1);
  const cur = mix(sh.a, sh.b, easeSoft(p));
  // alternate a +5% scale step on each jump cut inside the shot, so cuts read as punch-ins
  const steps = CUTS.filter((c) => c > sh.from + 0.12 && c <= t && c > 3.7).length;
  const step = steps % 2 === 1 ? 1.05 : 1;
  return {...cur, s: cur.s * step * (1 + punch(t))};
};

/** CSS transform for the footage inside a container of size (cw, ch). */
export const videoTransform = (pose: Pose, cw: number, ch: number) => {
  const ax = pose.ax ?? cw / 2;
  const ay = pose.ay ?? ch / 2;
  let tx = ax - pose.fx * pose.s;
  let ty = ay - pose.fy * pose.s;
  tx = clamp(tx, Math.min(0, cw - 1080 * pose.s), 0);
  ty = clamp(ty, Math.min(0, ch - 1920 * pose.s), 0);
  return {tx, ty, s: pose.s};
};

// Hook shots: a subtle weave so the very first second already moves
export const HOOK_END = H('adolescencia') + 0.75;
