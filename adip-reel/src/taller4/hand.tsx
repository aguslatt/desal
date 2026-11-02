import React from 'react';
import {easeIO, easeIn, easeOut, prog} from '../ui';

/** Everything drawn here is wobbled by one SVG turbulence filter whose seed changes every few frames:
 *  the line "boils" like a hand-drawn animation. */
export const Boil: React.FC<{frame: number; children: React.ReactNode}> = ({frame, children}) => {
  const seed = (Math.floor(frame / 3) % 7) + 1;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible'}}>
      <defs>
        <filter id="boil" filterUnits="userSpaceOnUse" x={-50} y={-50} width={1180} height={2020}>
          <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={5.5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter="url(#boil)">{children}</g>
    </svg>
  );
};

type S = {t: number; t0: number; t1?: number; color?: string; w?: number; dur?: number};
/** a path that is drawn on (and can be rubbed out) */
export const Ink: React.FC<S & {d: string; dash?: string; fill?: string; fillAt?: number; cap?: 'round' | 'butt'}> = ({t, t0, t1, d, color = '#000', w = 8, dur = 0.7, dash, fill, fillAt, cap = 'round'}) => {
  const p = prog(t, t0, dur, easeIO);
  const q = t1 !== undefined ? prog(t, t1, 0.35, easeIn) : 0;
  if (p <= 0 || q >= 1) return null;
  const f = fill && fillAt !== undefined ? prog(t, fillAt, 0.45, easeOut) : 0;
  return (
    <g opacity={1 - q}>
      {fill && <path d={d} fill={fill} opacity={f} stroke="none" />}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={w}
        strokeLinecap={cap}
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={dash ? undefined : `${p} 2`}
        style={dash ? {strokeDasharray: dash, strokeDashoffset: 0, clipPath: undefined} : undefined}
        opacity={dash ? p : 1}
      />
    </g>
  );
};

/** closed smooth path through points */
export const smooth = (pts: [number, number][], close = false) => {
  const n = pts.length;
  const g = (i: number) => pts[(i + n) % n];
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  const last = close ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = close || i > 0 ? g(i - 1) : pts[i];
    const p1 = pts[i];
    const p2 = g(i + 1);
    const p3 = close || i + 2 < n ? g(i + 2) : p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};

/** a hand-drawn loop around a word (overshoots, like a marker) */
export const loopAround = (cx: number, cy: number, rw: number, rh: number, turns = 1.12) => {
  const pts: [number, number][] = [];
  const N = 26;
  for (let i = 0; i <= N; i++) {
    const a = -2.4 + (i / N) * Math.PI * 2 * turns;
    const k = 1 + 0.05 * Math.sin(a * 2.3) + 0.08 * (i / N);
    pts.push([cx + Math.cos(a) * rw * k, cy + Math.sin(a) * rh * (k + 0.02)]);
  }
  return smooth(pts);
};
export const squiggle = (x: number, y: number, w: number, amp = 7, waves = 5) => {
  const pts: [number, number][] = [];
  const N = waves * 4;
  for (let i = 0; i <= N; i++) pts.push([x + (i / N) * w, y + Math.sin((i / N) * waves * Math.PI * 2) * amp + (i % 2 ? 1.5 : -1.5)]);
  return smooth(pts);
};
export const spiral = (cx: number, cy: number, r0: number, r1: number, turns: number) => {
  const pts: [number, number][] = [];
  const N = Math.round(turns * 14);
  for (let i = 0; i <= N; i++) {
    const k = i / N;
    const a = k * turns * Math.PI * 2;
    const r = r0 + (r1 - r0) * k;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return smooth(pts);
};
export const arrowHead = (x: number, y: number, ang: number, len = 34) => {
  const a1 = ang + Math.PI * 0.82;
  const a2 = ang - Math.PI * 0.82;
  return `M${x + Math.cos(a1) * len} ${y + Math.sin(a1) * len} L${x} ${y} L${x + Math.cos(a2) * len} ${y + Math.sin(a2) * len}`;
};

// ─────────────────────── drawings (all local coordinates, placed with <g transform>) ───────────────────────
const G: React.FC<{x: number; y: number; s?: number; children: React.ReactNode}> = ({x, y, s = 1, children}) => <g transform={`translate(${x} ${y}) scale(${s})`}>{children}</g>;

/** hook: a key, a trail of dots that wanders off and a question mark */
export const KeyTrail: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; ink: string; accent: string; trail?: string; s?: number}> = ({t, t0, t1, x, y, ink, accent, trail, s = 1}) => (
  <G x={x} y={y} s={s}>
    <Ink t={t} t0={t0} t1={t1} color={ink} w={8} d="M60 40 a26 26 0 1 0 -0.1 0" fill={accent} fillAt={t0 + 0.4} dur={0.5} />
    <Ink t={t} t0={t0 + 0.3} t1={t1} color={ink} w={8} d="M86 40 L214 40 M168 40 L168 68 M192 40 L192 60 M214 40 L214 72" dur={0.6} />
    <Ink t={t} t0={t0 + 0.7} t1={t1} color={trail ?? accent} w={12} dash="1 22" d="M240 52 C 330 120, 290 -10, 420 40 S 520 120, 600 50" dur={1.2} />
    <Ink t={t} t0={t0 + 1.55} t1={t1} color={ink} w={9} d="M640 22 C 640 -30, 720 -30, 720 18 C 720 52, 686 54, 686 92" dur={0.55} />
    <Ink t={t} t0={t0 + 2.0} t1={t1} color={ink} w={11} d="M686 122 L686 123" dur={0.2} />
  </G>
);
export const SpiralDraw: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; ink: string; accent: string; s?: number}> = ({t, t0, t1, x, y, ink, accent, s = 1}) => (
  <G x={x} y={y} s={s}>
    <Ink t={t} t0={t0} t1={t1} color={ink} w={8} d={spiral(0, 0, 4, 92, 3.1)} dur={1.0} />
    <Ink t={t} t0={t0 + 0.9} t1={t1} color={accent} w={9} d="M0 0 L0.1 0.1" dur={0.2} />
    <Ink t={t} t0={t0 + 0.9} t1={t1} color={accent} w={7} d={loopAround(0, 0, 118, 112, 1.1)} dur={0.7} />
  </G>
);
/** the world speeds up: stairs that rise fast and a slower one that tries to follow */
export const StepsDraw: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; ink: string; accent: string; s?: number}> = ({t, t0, t1, x, y, ink, accent, s = 1}) => (
  <G x={x} y={y} s={s}>
    <Ink t={t} t0={t0} t1={t1} color={ink} w={8} d="M0 190 H50 V145 H100 V100 H150 V55 H200 V10" dur={0.9} />
    <Ink t={t} t0={t0 + 0.8} t1={t1} color={ink} w={8} d={arrowHead(200, 4, -Math.PI / 2, 30)} dur={0.3} />
    <Ink t={t} t0={t0 + 0.55} t1={t1} color={accent} w={8} dash="2 16" d="M0 205 H90 V180 H170 V158 H250" dur={0.9} />
    <Ink t={t} t0={t0 + 1.2} t1={t1} color={accent} w={11} d="M258 158 L259 158" dur={0.2} />
  </G>
);
export const PathDraw: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; ink: string; accent: string; s?: number}> = ({t, t0, t1, x, y, ink, accent, s = 1}) => (
  <G x={x} y={y} s={s}>
    <Ink t={t} t0={t0} t1={t1} color={ink} w={8} d="M0 150 C 40 40, 90 30, 120 100 S 190 190, 230 100 S 290 20, 330 60" dur={1.1} />
    <Ink t={t} t0={t0 + 1.0} t1={t1} color={ink} w={8} d={arrowHead(332, 62, -0.5, 32)} dur={0.3} />
    {[[30, 128], [118, 92], [236, 104]].map(([cx, cy], i) => (
      <Ink key={i} t={t} t0={t0 + 0.3 + i * 0.25} t1={t1} color={ink} w={6} d={`M${cx - 15} ${cy} a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0`} fill={accent} fillAt={t0 + 0.5 + i * 0.25} dur={0.4} />
    ))}
  </G>
);
/** two heads and a stroke that joins them (the logo's idea) */
export const HeadsLink: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; ink: string; a: string; b: string; s?: number}> = ({t, t0, t1, x, y, ink, a, b, s = 1}) => (
  <G x={x} y={y} s={s}>
    <Ink t={t} t0={t0} t1={t1} color={ink} w={8} d="M50 120 C 120 120, 150 40, 190 70 C 220 100, 160 120, 150 80 C 190 30, 240 120, 330 100" dur={1.0} />
    <Ink t={t} t0={t0 + 0.1} t1={t1} color={ink} w={7} d="M20 46 a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0" fill={a} fillAt={t0 + 0.4} dur={0.5} />
    <Ink t={t} t0={t0 + 0.7} t1={t1} color={ink} w={7} d="M330 52 a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0" fill={b} fillAt={t0 + 1.0} dur={0.5} />
  </G>
);
/** four heads on one stroke: the team */
export const TeamDraw: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; ink: string; c1: string; c2: string; s?: number}> = ({t, t0, t1, x, y, ink, c1, c2, s = 1}) => (
  <G x={x} y={y} s={s}>
    <Ink t={t} t0={t0} t1={t1} color={ink} w={8} d="M0 110 C 60 40, 110 160, 170 100 S 280 30, 340 100 S 450 160, 510 90" dur={1.3} />
    {[60, 180, 330, 470].map((cx, i) => (
      <Ink key={i} t={t} t0={t0 + 0.3 + i * 0.28} t1={t1} color={ink} w={7} d={`M${cx - 30} ${44 + (i % 2) * 6} a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0`} fill={i % 2 ? c2 : c1} fillAt={t0 + 0.55 + i * 0.28} dur={0.4} />
    ))}
  </G>
);
// pictograms for the four areas
export const PictoMemory: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; ink: string; accent: string; s?: number}> = ({t, t0, t1, x, y, ink, accent, s = 1}) => (
  <G x={x} y={y} s={s}>
    {Array.from({length: 9}).map((_, i) => {
      const cx = (i % 3) * 78;
      const cy = Math.floor(i / 3) * 78;
      const hot = [0, 4, 8, 5].includes(i);
      return (
        <Ink key={i} t={t} t0={t0 + i * 0.07} t1={t1} color={ink} w={6} d={`M${cx + 8} ${cy} h46 a8 8 0 0 1 8 8 v46 a8 8 0 0 1 -8 8 h-46 a8 8 0 0 1 -8 -8 v-46 a8 8 0 0 1 8 -8 z`} fill={hot ? accent : undefined} fillAt={t0 + 0.7 + [0, 4, 8, 5].indexOf(i) * 0.25} dur={0.35} />
      );
    })}
    <Ink t={t} t0={t0 + 1.3} t1={t1} color={ink} w={7} d="M-8 -8 C 60 -40, 150 -40, 236 -8" dur={0.5} />
  </G>
);
export const PictoFocus: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; ink: string; accent: string; s?: number}> = ({t, t0, t1, x, y, ink, accent, s = 1}) => (
  <G x={x} y={y} s={s}>
    {[100, 66, 34].map((r, i) => (
      <Ink key={r} t={t} t0={t0 + i * 0.15} t1={t1} color={ink} w={6} d={loopAround(0, 0, r, r, 1.08)} dur={0.55} />
    ))}
    <Ink t={t} t0={t0 + 0.55} t1={t1} color={ink} w={6} d="M0 0 L0.1 0.1" dur={0.2} fill={accent} fillAt={t0 + 0.6} />
    <Ink t={t} t0={t0 + 0.5} t1={t1} color={accent} w={16} d="M0 0 L0.1 0.1" dur={0.3} />
    <Ink t={t} t0={t0 + 0.8} t1={t1} color={ink} w={6} d="M0 -120 V-84 M0 84 V120 M-120 0 H-84 M84 0 H120" dur={0.4} />
  </G>
);
export const PictoMove: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; ink: string; accent: string; s?: number}> = ({t, t0, t1, x, y, ink, accent, s = 1}) => (
  <G x={x} y={y} s={s}>
    <Ink t={t} t0={t0} t1={t1} color={ink} w={7} d="M0 120 C 40 20, 100 20, 120 90 S 190 150, 240 40" dur={0.9} />
    <Ink t={t} t0={t0 + 0.8} t1={t1} color={ink} w={7} d={arrowHead(242, 36, -1.0, 30)} dur={0.3} />
    {[[16, 80], [118, 82], [196, 112]].map(([cx, cy], i) => (
      <Ink key={i} t={t} t0={t0 + 0.4 + i * 0.2} t1={t1} color={ink} w={5} d={`M${cx - 13} ${cy} a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0`} fill={accent} fillAt={t0 + 0.6 + i * 0.2} dur={0.35} />
    ))}
  </G>
);
export const PictoApple: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; ink: string; accent: string; leaf: string; s?: number}> = ({t, t0, t1, x, y, ink, accent, leaf, s = 1}) => (
  <G x={x} y={y} s={s}>
    <Ink t={t} t0={t0} t1={t1} color={ink} w={7} d="M110 50 C 72 26, 26 58, 38 112 C 48 158, 84 186, 110 172 C 136 186, 172 158, 182 112 C 194 58, 148 26, 110 50 Z" fill={accent} fillAt={t0 + 0.8} dur={0.9} />
    <Ink t={t} t0={t0 + 0.7} t1={t1} color={ink} w={7} d="M112 48 C 112 20, 132 2, 160 4 C 160 32, 142 48, 112 48 Z" fill={leaf} fillAt={t0 + 1.1} dur={0.5} />
    <Ink t={t} t0={t0 + 0.9} t1={t1} color={ink} w={7} d="M110 48 L106 20" dur={0.25} />
  </G>
);
export const PhoneDraw: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; ink: string; accent: string; s?: number}> = ({t, t0, t1, x, y, ink, accent, s = 1}) => (
  <G x={x} y={y} s={s}>
    <Ink t={t} t0={t0} t1={t1} color={ink} w={8} d="M30 0 h110 a26 26 0 0 1 26 26 v200 a26 26 0 0 1 -26 26 h-110 a26 26 0 0 1 -26 -26 v-200 a26 26 0 0 1 26 -26 z" dur={0.9} fill={accent} fillAt={t0 + 0.9} />
    <Ink t={t} t0={t0 + 0.8} t1={t1} color={ink} w={7} d="M64 24 h42 M70 214 h30" dur={0.4} />
  </G>
);
export const TabletDraw: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; ink: string; accent: string; s?: number}> = ({t, t0, t1, x, y, ink, accent, s = 1}) => (
  <G x={x} y={y} s={s}>
    <Ink t={t} t0={t0} t1={t1} color={ink} w={8} d="M30 0 h230 a28 28 0 0 1 28 28 v150 a28 28 0 0 1 -28 28 h-230 a28 28 0 0 1 -28 -28 v-150 a28 28 0 0 1 28 -28 z" dur={0.9} fill={accent} fillAt={t0 + 0.9} />
    <Ink t={t} t0={t0 + 0.8} t1={t1} color={ink} w={7} d="M262 90 L263 90" dur={0.2} />
  </G>
);
export const QuestionDraw: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; ink: string; s?: number; w?: number}> = ({t, t0, t1, x, y, ink, s = 1, w = 26}) => (
  <G x={x} y={y} s={s}>
    <Ink t={t} t0={t0} t1={t1} color={ink} w={w} d="M0 90 C -8 -30, 150 -50, 160 40 C 168 120, 70 130, 76 230" dur={0.9} />
    <Ink t={t} t0={t0 + 0.85} t1={t1} color={ink} w={w * 1.25} d="M76 300 L76.5 300.5" dur={0.2} />
  </G>
);
export const WeekDraw: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; ink: string; accent: string}> = ({t, t0, t1, x, y, ink, accent}) => (
  <G x={x} y={y}>
    {Array.from({length: 7}).map((_, i) => (
      <Ink key={i} t={t} t0={t0 + i * 0.06} t1={t1} color={ink} w={5} d={`M${i * 82 + 10} 0 h52 a10 10 0 0 1 10 10 v52 a10 10 0 0 1 -10 10 h-52 a10 10 0 0 1 -10 -10 v-52 a10 10 0 0 1 10 -10 z`} dur={0.4} />
    ))}
    {[0, 1, 2].map((r) => (
      <Ink key={r} t={t} t0={t0 + 0.8 + r * 0.55} t1={t1} color={accent} w={9} d={`M${3 * 82 + 18} 36 L${3 * 82 + 34} 54 L${3 * 82 + 62} 14`} dur={0.4} />
    ))}
  </G>
);
export const Underline: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; w: number; color: string; sw?: number}> = ({t, t0, t1, x, y, w, color, sw = 9}) => (
  <Ink t={t} t0={t0} t1={t1} color={color} w={sw} d={squiggle(x, y, w, 6, Math.max(3, Math.round(w / 90)))} dur={0.6} />
);
export const ArrowTo: React.FC<{t: number; t0: number; t1?: number; d: string; head: [number, number, number]; color: string}> = ({t, t0, t1, d, head, color}) => (
  <>
    <Ink t={t} t0={t0} t1={t1} color={color} w={8} d={d} dur={0.7} />
    <Ink t={t} t0={t0 + 0.6} t1={t1} color={color} w={8} d={arrowHead(head[0], head[1], head[2], 32)} dur={0.3} />
  </>
);
