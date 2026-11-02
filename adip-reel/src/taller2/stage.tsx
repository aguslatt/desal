import React, {useEffect} from 'react';
import {OffthreadVideo, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {clamp, easeIO, easeIn, easeOut, easeSoft, lerp, prog} from '../ui';
import {K} from '../charla/kit';

export const SRC_W = 2160;
export const SRC_H = 3840;
const pad = (n: number) => String(n).padStart(4, '0');

type Pose = {
  from: number;
  to: number;
  fx: number;
  fy: number;
  cw0: number;
  cw1: number;
  ax: number;
  ay: number;
  table?: number; // source y of the table edge (to keep the cut-off edge out of frame)
  nc?: boolean; // no clamp (two-shot windows are clipped instead)
  ease?: (x: number) => number;
};
export const POSES: Pose[] = [
  // host alone
  {from: 0, to: 0.7, fx: 1060, fy: 1920, cw0: 1380, cw1: 1250, ax: 540, ay: 1020, table: 3000, ease: easeOut},
  {from: 0.7, to: 2.77, fx: 1060, fy: 1920, cw0: 1250, cw1: 1190, ax: 540, ay: 1020, table: 3000},
  {from: 2.77, to: 5.7, fx: 1060, fy: 1920, cw0: 1420, cw1: 1330, ax: 540, ay: 1030, table: 3000},
  {from: 5.7, to: 6.57, fx: 1060, fy: 1920, cw0: 1250, cw1: 1220, ax: 540, ay: 1020, table: 3000},
  {from: 6.57, to: 9.67, fx: 1060, fy: 1920, cw0: 1420, cw1: 1300, ax: 540, ay: 1030, table: 3000},
  // both (arches, clipped by the window)
  {from: 9.67, to: 16.37, fx: 1070, fy: 1760, cw0: 2000, cw1: 1930, ax: 540, ay: 540, nc: true},
  // guest
  {from: 16.37, to: 18.55, fx: 1690, fy: 2000, cw0: 1300, cw1: 1250, ax: 700, ay: 1090, table: 2850},
  {from: 18.55, to: 23.6, fx: 1690, fy: 2000, cw0: 1200, cw1: 1150, ax: 700, ay: 1170, table: 2850},
  {from: 23.6, to: 24.3, fx: 1720, fy: 2030, cw0: 1180, cw1: 1160, ax: 700, ay: 1170, table: 2850},
  {from: 24.3, to: 29.5, fx: 1720, fy: 2030, cw0: 1130, cw1: 1080, ax: 700, ay: 1160, table: 2850},
  // conversation (arches)
  {from: 29.5, to: 33.07, fx: 1045, fy: 2090, cw0: 2000, cw1: 1950, ax: 540, ay: 540, nc: true},
  {from: 33.07, to: 37.47, fx: 972, fy: 2070, cw0: 2000, cw1: 1950, ax: 540, ay: 540, nc: true},
  {from: 37.47, to: 39.33, fx: 1045, fy: 2100, cw0: 2000, cw1: 1960, ax: 540, ay: 540, nc: true},
  // host asks
  {from: 39.33, to: 42.87, fx: 480, fy: 2070, cw0: 1300, cw1: 1240, ax: 470, ay: 1190, table: 2950},
  // guest answers + CTA
  {from: 42.87, to: 47.3, fx: 1470, fy: 2110, cw0: 1320, cw1: 1250, ax: 700, ay: 1240, table: 2900},
  {from: 47.3, to: 51.83, fx: 1470, fy: 2110, cw0: 1050, cw1: 980, ax: 700, ay: 1070, table: 2900},
  // both laugh
  {from: 51.83, to: 60, fx: 1004, fy: 2120, cw0: 1600, cw1: 1520, ax: 540, ay: 1180, table: 2850},
];

export const poseAt = (t: number) => {
  let i = POSES.findIndex((x) => t >= x.from && t < x.to);
  if (i < 0) i = POSES.length - 1;
  const p = POSES[i];
  const k = clamp((t - p.from) / (p.to - p.from), 0, 1);
  const cw = lerp(p.cw0, p.cw1, (p.ease ?? easeSoft)(k));
  const s = 1080 / cw;
  let ay = p.ay;
  if (!p.nc) ay = Math.max(ay, 1830 - ((p.table ?? 2900) - p.fy) * s);
  const tx0 = p.ax - p.fx * s;
  const ty0 = ay - p.fy * s;
  const tx = p.nc ? tx0 : clamp(tx0, 1080 - SRC_W * s, 0);
  const ty = p.nc ? ty0 : clamp(ty0, 1920 - SRC_H * s, 0);
  return {s, tx, ty, face: {x: p.fx * s + tx, y: p.fy * s + ty}, nc: !!p.nc};
};

/** Person cut-out: the graded footage masked with a per-frame matte (so shapes and type can sit behind). */
export const Person: React.FC<{t: number; clipBottom?: number; scale?: number; fixed?: {fx: number; fy: number; ax: number; ay: number; s: number}; clipX?: [number, number]}> = ({t, clipBottom, scale = 1, fixed, clipX}) => {
  const frame = useCurrentFrame();
  const pose = fixed ? {s: fixed.s, tx: fixed.ax - fixed.fx * fixed.s, ty: fixed.ay - fixed.fy * fixed.s, face: {x: fixed.ax, y: fixed.ay}, nc: true} : poseAt(t);
  const url = staticFile(`taller/matte/m${pad(Math.min(frame, 1604))}.png`);
  useEffect(() => {
    const h = delayRender('matte');
    const im = new window.Image();
    im.onload = () => continueRender(h);
    im.onerror = () => continueRender(h);
    im.src = url;
  }, [url]);
  const ox = pose.face.x;
  const oy = pose.face.y;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', clipPath: clipBottom || clipX ? `inset(0 ${clipX ? 1080 - clipX[1] : 0}px ${clipBottom ? 1920 - clipBottom : 0}px ${clipX ? clipX[0] : 0}px)` : undefined}}>
      <div style={{position: 'absolute', inset: 0, transform: scale !== 1 ? `translate(${ox * (1 - scale)}px, ${oy * (1 - scale)}px) scale(${scale})` : undefined}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: SRC_W,
            height: SRC_H,
            transformOrigin: '0 0',
            transform: `translate(${pose.tx}px, ${pose.ty}px) scale(${pose.s})`,
            WebkitMaskImage: `url(${url})`,
            WebkitMaskSize: `${SRC_W}px ${SRC_H}px`,
            WebkitMaskRepeat: 'no-repeat',
          }}
        >
          <OffthreadVideo src={staticFile('taller/lu_4k.mp4')} muted style={{width: SRC_W, height: SRC_H}} />
        </div>
      </div>
    </div>
  );
};

/** Circle (a "head" of the brand): pops from its centre, drifts slightly. */
export const Circle: React.FC<{t: number; t0: number; t1?: number; cx: number; cy: number; r: number; color: string; drift?: number; dur?: number}> = ({
  t,
  t0,
  t1,
  cx,
  cy,
  r,
  color,
  drift = 0,
  dur = 0.7,
}) => {
  const a = prog(t, t0, dur, easeOut);
  const b = t1 !== undefined ? prog(t, t1, 0.4, easeIn) : 0;
  if (a <= 0 || b >= 1) return null;
  const sc = a * (1 - b);
  const dx = drift * Math.sin(t * 0.9 + cx);
  const dy = drift * Math.cos(t * 0.7 + cy);
  return <div style={{position: 'absolute', left: cx - r + dx, top: cy - r + dy, width: 2 * r, height: 2 * r, borderRadius: r, background: color, transform: `scale(${sc})`}} />;
};

/** Brand arch (top rounded), grows from the bottom edge. */
export const Arch: React.FC<{t: number; t0: number; t1?: number; x: number; w: number; bottom: number; h: number; color: string}> = ({t, t0, t1, x, w, bottom, h, color}) => {
  const a = prog(t, t0, 0.8, easeOut);
  const b = t1 !== undefined ? prog(t, t1, 0.4, easeIn) : 0;
  if (a <= 0 || b >= 1) return null;
  const hh = h * a * (1 - b);
  return <div style={{position: 'absolute', left: x, top: bottom - hh, width: w, height: hh, background: color, borderRadius: `${w / 2}px ${w / 2}px 0 0`}} />;
};

/** circle-wipe transition: colour expands from (cx, cy) and then contracts, a word can bridge the two scenes */
export const CircleWipe: React.FC<{t: number; tIn: number; tOut: number; cx: number; cy: number; color: string; word?: string; textColor?: string; outCx?: number; outCy?: number}> = ({
  t,
  tIn,
  tOut,
  cx,
  cy,
  color,
  word,
  textColor = K.white,
  outCx,
  outCy,
}) => {
  const a = prog(t, tIn, 0.32, easeIO);
  const b = prog(t, tOut, 0.34, easeIO);
  if (a <= 0 || b >= 1) return null;
  const R = 1700 * a * (1 - b) + 0.01;
  const c = b > 0 && outCx !== undefined ? {x: outCx, y: outCy ?? cy} : {x: cx, y: cy};
  return (
    <div style={{position: 'absolute', inset: 0, background: color, clipPath: `circle(${R}px at ${c.x}px ${c.y}px)`}}>
      {word && (
        <div style={{position: 'absolute', left: 80, right: 80, top: 860, fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: word.length > 9 ? 90 : 200, letterSpacing: '-0.02em', color: textColor, lineHeight: 1}}>{word}</div>
      )}
    </div>
  );
};

/** Two portraits (host in the left arch, guest in the right one) at 1:1 of the 4K source */
const TWO: [number, number, [number, number], [number, number]][] = [
  [9.67, 16.37, [425, 1800], [1700, 1810]],
  [29.5, 33.07, [430, 2000], [1660, 2110]],
  [33.07, 37.47, [330, 2000], [1620, 2070]],
  [37.47, 39.33, [430, 2020], [1670, 2110]],
];
export const TwoUp: React.FC<{t: number}> = ({t}) => {
  const seg = TWO.find((x) => t >= x[0] && t < x[1]) ?? TWO[TWO.length - 1];
  const k = prog(t, seg[0], 0.9, easeOut);
  const drift = 1 + 0.02 * prog(t, seg[0], seg[1] - seg[0], easeSoft);
  const base = {s: 0.72 * drift};
  return (
    <>
      <Person t={t} clipBottom={800} clipX={[0, 540]} fixed={{fx: seg[2][0], fy: seg[2][1], ax: 280, ay: 600 + (1 - k) * 60, ...base}} />
      <Person t={t} clipBottom={800} clipX={[540, 1080]} fixed={{fx: seg[3][0], fy: seg[3][1], ax: 800, ay: 600 + (1 - k) * 60, ...base}} />
    </>
  );
};

/** Closing laugh: the two portraits, tall arches */
export const TwoUpFinal: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, 51.9, 0.9, easeOut);
  const s = 0.88 * (1 + 0.02 * prog(t, 51.9, 1.5, easeSoft));
  return (
    <>
      <Person t={t} clipBottom={1830} clipX={[0, 540]} fixed={{fx: 610, fy: 2110, ax: 280, ay: 1330 + (1 - k) * 80, s}} />
      <Person t={t} clipBottom={1830} clipX={[540, 1080]} fixed={{fx: 1400, fy: 2110, ax: 800, ay: 1330 + (1 - k) * 80, s}} />
    </>
  );
};
