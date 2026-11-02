import {clamp, easeIO, easeOut, easeSoft, lerp, prog} from '../ui';
import {K} from '../charla/kit';

export const SRC_W = 2160;
export const SRC_H = 3840;
export type Rect = {x: number; y: number; w: number; h: number};
export const STD: Rect = {x: 90, y: 740, w: 900, h: 640};
export const WIDE: Rect = {x: 90, y: 920, w: 900, h: 460};
export const SIDE: Rect = {x: 570, y: 660, w: 420, h: 720};
export const DUAL: Rect[] = [
  {x: 60, y: 650, w: 450, h: 730},
  {x: 570, y: 650, w: 450, h: 730},
];

export type BgKey = 'o' | 'c' | 'v';
export const BG: Record<BgKey, string> = {o: K.orange, c: '#FFE6D2', v: K.violet};
export type Theme = {ink: string; kw: string; a1: string; a2: string; sub: string; fill: string};
export const THEME: Record<BgKey, Theme> = {
  o: {ink: '#000', kw: '#000', a1: K.violet, a2: '#fff', sub: '#000', fill: K.violet},
  c: {ink: '#000', kw: K.violet, a1: K.orange, a2: K.violet, sub: '#000', fill: K.orange},
  v: {ink: '#fff', kw: K.yellow, a1: K.orange, a2: K.yellow, sub: '#fff', fill: K.orange},
};

type Scene = {from: number; bg: BgKey; wins: Rect[]; circle?: {cx: number; cy: number; r: number; color: string}};
export const SCENES: Scene[] = [
  {from: 0, bg: 'o', wins: [STD], circle: {cx: 960, cy: 700, r: 250, color: K.violet}},
  {from: 2.6, bg: 'c', wins: [STD], circle: {cx: 970, cy: 1100, r: 260, color: K.orange}},
  {from: 9.67, bg: 'v', wins: [STD], circle: {cx: 110, cy: 760, r: 250, color: K.orange}},
  {from: 16.37, bg: 'o', wins: [STD], circle: {cx: 960, cy: 1120, r: 240, color: K.violet}},
  {from: 18.5, bg: 'c', wins: [WIDE]},
  {from: 24.3, bg: 'o', wins: [SIDE], circle: {cx: 980, cy: 1170, r: 210, color: K.violet}},
  {from: 29.5, bg: 'v', wins: DUAL, circle: {cx: 540, cy: 700, r: 200, color: K.orange}},
  {from: 39.33, bg: 'c', wins: [STD], circle: {cx: 960, cy: 800, r: 250, color: K.orange}},
  {from: 42.87, bg: 'o', wins: [SIDE], circle: {cx: 990, cy: 1190, r: 200, color: K.violet}},
  {from: 47.3, bg: 'v', wins: [SIDE], circle: {cx: 150, cy: 1100, r: 250, color: K.orange}},
  {from: 51.83, bg: 'o', wins: [STD], circle: {cx: 960, cy: 740, r: 250, color: K.violet}},
];
export const sceneIdx = (t: number) => {
  let k = 0;
  SCENES.forEach((s, i) => {
    if (t >= s.from - 0.0001) k = i;
  });
  return k;
};
const center = (s: Scene) => ({cx: s.wins.reduce((a, r) => a + r.x + r.w / 2, 0) / s.wins.length, cy: s.wins[0].y + s.wins[0].h / 2});
export const bgLayers = (t: number) =>
  SCENES.map((s, i) => {
    const c = center(s);
    const R = i === 0 ? 2400 : 2400 * prog(t, s.from - 0.12, 0.7, easeIO);
    return {color: BG[s.bg], R, cx: c.cx, cy: c.cy, i};
  });

const lr = (a: Rect, b: Rect, k: number): Rect => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k)});
export const rectsAt = (t: number) => {
  const i = sceneIdx(t);
  const cur = SCENES[i].wins;
  if (i === 0) return cur.map((r) => ({...r, grow: prog(t, 0.0, 0.5, easeOut)}));
  const prev = SCENES[i - 1].wins;
  const m = prog(t, SCENES[i].from - 0.1, 0.7, easeIO);
  return cur.map((r, j) => (j < prev.length ? {...lr(prev[j], r, m), grow: 1} : {...r, grow: m}));
};

type Crop = {from: number; to: number; fx: number; fy: number; cw0: number; cw1: number; axf?: number; ayf?: number};
export const CROPS: Crop[][] = [
  [
    {from: 0, to: 1.0, fx: 1060, fy: 1920, cw0: 1750, cw1: 1400, ayf: 0.55},
    {from: 1.0, to: 2.77, fx: 1060, fy: 1920, cw0: 1400, cw1: 1330, ayf: 0.55},
    {from: 2.77, to: 5.7, fx: 1060, fy: 1920, cw0: 1560, cw1: 1470, ayf: 0.55},
    {from: 5.7, to: 6.57, fx: 1060, fy: 1920, cw0: 1380, cw1: 1340, ayf: 0.55},
    {from: 6.57, to: 9.67, fx: 1060, fy: 1920, cw0: 1560, cw1: 1420, ayf: 0.55},
    {from: 9.67, to: 16.37, fx: 1070, fy: 1760, cw0: 1950, cw1: 1880, ayf: 0.55},
    {from: 16.37, to: 18.55, fx: 1690, fy: 2000, cw0: 1400, cw1: 1330, ayf: 0.55},
    {from: 18.55, to: 23.6, fx: 1690, fy: 2000, cw0: 1260, cw1: 1210, ayf: 0.5},
    {from: 23.6, to: 24.4, fx: 1720, fy: 2030, cw0: 1230, cw1: 1210, ayf: 0.5},
    {from: 24.4, to: 29.5, fx: 1720, fy: 2030, cw0: 820, cw1: 780, axf: 0.55, ayf: 0.45},
    {from: 29.5, to: 33.07, fx: 430, fy: 2000, cw0: 830, cw1: 800, ayf: 0.45},
    {from: 33.07, to: 37.47, fx: 330, fy: 2000, cw0: 830, cw1: 800, ayf: 0.45},
    {from: 37.47, to: 39.33, fx: 430, fy: 2020, cw0: 830, cw1: 810, ayf: 0.45},
    {from: 39.33, to: 42.87, fx: 480, fy: 2070, cw0: 1450, cw1: 1350, axf: 0.42, ayf: 0.55},
    {from: 42.87, to: 47.3, fx: 1470, fy: 2110, cw0: 840, cw1: 790, ayf: 0.45},
    {from: 47.3, to: 51.83, fx: 1470, fy: 2110, cw0: 790, cw1: 700, ayf: 0.45},
    {from: 51.83, to: 60, fx: 1004, fy: 2120, cw0: 1750, cw1: 1650, ayf: 0.55},
  ],
  [
    {from: 29.5, to: 33.07, fx: 1660, fy: 2110, cw0: 830, cw1: 800, ayf: 0.45},
    {from: 33.07, to: 37.47, fx: 1620, fy: 2070, cw0: 830, cw1: 800, ayf: 0.45},
    {from: 37.47, to: 39.33, fx: 1670, fy: 2110, cw0: 830, cw1: 810, ayf: 0.45},
  ],
];
export const cropTransform = (win: number, t: number, w: number, h: number) => {
  const list = CROPS[win];
  let c = list.find((x) => t >= x.from && t < x.to);
  if (!c) c = t < list[0].from ? list[0] : list[list.length - 1];
  const p = clamp((t - c.from) / (c.to - c.from), 0, 1);
  const cw = lerp(c.cw0, c.cw1, easeSoft(p));
  const s = w / cw;
  const tx = clamp(w * (c.axf ?? 0.5) - c.fx * s, w - SRC_W * s, 0);
  const ty = clamp(h * (c.ayf ?? 0.5) - c.fy * s, h - SRC_H * s, 0);
  return {tx, ty, s};
};
