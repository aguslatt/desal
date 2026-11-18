import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BASE, CAP_TOP, Key, Shape, back, clamp01, easeIn, easeIO, easeOut5, fit, lerp, prog, track, tw} from './anim';
import {C, FONT, GRADIENT, PALETTE, RGB, TRAZO, css, onColor} from './theme';

// Instagram safe area: the feed shows reels cropped to 4:5 (y 285-1635) and tall phones trim the sides,
// so everything is laid out 110 px in from the sides and pushed DY px down from the top.
export const X0 = 110;
export const DY = 150;
export const CW = 860; // content width
export const TAG = {y: 290, h: 58};
export const CARD_Y = 290;

// Top chrome: story-style progress bar + official logo on a white pill + "RESPONDE" capsule.
// (La marca es siempre «Equipo ADIP»: el nombre lo pone el logo oficial, nunca texto suelto.)
export const BAR = {x: X0, y: 148, w: CW, h: 24};
const SEG_W = (CW - 12 - 4 * 8) / 5;
export const seg = (i: number) => ({x: BAR.x + 6 + i * (SEG_W + 8), y: BAR.y + 7, w: SEG_W, h: 10});
export const dot = (i: number) => ({x: seg(i).x + SEG_W / 2, y: seg(i).y + 5});
export const dotShape = (i: number, col: RGB): Partial<Shape> => ({...seg(i), r: 5, col, fa: 1, bw: 0});
export const LOGO = {x: X0, y: 184, w: 200, h: 86};

/** Text that rises out of a mask at t0 and (optionally) leaves upward at t1. */
export const Rise: React.FC<{t: number; t0: number; t1?: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  t,
  t0,
  t1,
  dur = 0.5,
  children,
  style,
}) => {
  const p = prog(t, t0, dur, easeOut5);
  const q = t1 !== undefined ? prog(t, t1, 0.28, easeIn) : 0;
  if (p <= 0 || q >= 1) return null;
  return (
    <span style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0.16em 0.06em 0.26em', margin: '-0.16em -0.06em -0.26em'}}>
      <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 118 - q * 118}%)`, ...style}}>{children}</span>
    </span>
  );
};

/** Absolutely placed single line of text (line-height 1), revealed with Rise. */
export const T: React.FC<{
  t: number;
  t0: number;
  t1?: number;
  x: number;
  y: number;
  size: number;
  weight?: number;
  color?: string;
  tracking?: number;
  right?: boolean;
  dur?: number;
  children: React.ReactNode;
}> = ({t, t0, t1, x, y, size, weight = 800, color = '#000', tracking = 0, right, dur, children}) => (
  <div
    style={{
      position: 'absolute',
      top: y,
      ...(right ? {right: 1080 - x} : {left: x}),
      fontFamily: FONT,
      fontSize: size,
      fontWeight: weight,
      lineHeight: 1,
      letterSpacing: `${tracking}em`,
      color,
      whiteSpace: 'nowrap',
    }}
  >
    <Rise t={t} t0={t0} t1={t1} dur={dur}>
      {children}
    </Rise>
  </div>
);

/** The block's travelling shape. */
export const ShapeDiv: React.FC<{s: Shape; border?: RGB; shadow?: number; children?: React.ReactNode}> = ({s, border, shadow = 0, children}) =>
  s.op <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: s.x,
        top: s.y,
        width: Math.max(0, s.w),
        height: Math.max(0, s.h),
        borderRadius: s.r,
        background: css(s.col, s.fa),
        border: s.bw > 0.2 ? `${s.bw}px solid ${css(border ?? s.col)}` : undefined,
        boxSizing: 'border-box',
        opacity: s.op,
        boxShadow: shadow > 0.01 ? `0 14px 44px rgba(0,0,0,${0.13 * shadow})` : undefined,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );

/** Own question mark: a round-capped hook over a "cabeza" (circle). */
export const QMark: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 60 75">
    <path d="M17 24 C17 9, 43 8, 43 24 C43 36, 30 35, 30 48" fill="none" stroke={color} strokeWidth={9.5} strokeLinecap="round" />
    <circle cx={30} cy={65} r={6.6} fill={color} />
  </svg>
);

export const Trazo: React.FC<{t: number; t0: number; dur?: number; x: number; y: number; w: number; color?: string; sw?: number}> = ({
  t,
  t0,
  dur = 0.8,
  x,
  y,
  w,
  color,
  sw = 13,
}) => {
  const p = prog(t, t0, dur, easeIO);
  if (p <= 0) return null;
  const id = `g${Math.round(x)}_${Math.round(y)}`;
  return (
    <svg style={{position: 'absolute', left: x, top: y, overflow: 'visible'}} width={w} height={w * 0.3} viewBox="0 0 400 120">
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          {GRADIENT.map(([o, c]) => (
            <stop key={o} offset={o} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <path d={TRAZO} fill="none" stroke={color ?? `url(#${id})`} strokeWidth={sw} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
    </svg>
  );
};

/** Persistent top chrome. fills[i] in 0..1 = how much of segment i is played; loaded[i] = segment already "charged". */
export const Header: React.FC<{t: number; fills: number[]; loaded: number[]; logoOp: number; inP: number}> = ({t, fills, loaded, logoOp, inP}) => {
  const y = (1 - inP) * -140;
  return (
    <div style={{position: 'absolute', left: 0, top: y, opacity: clamp01(inP * 2)}}>
      <div style={{position: 'absolute', left: BAR.x, top: BAR.y, width: BAR.w, height: BAR.h, borderRadius: BAR.h / 2, background: '#fff', boxShadow: '0 6px 22px rgba(0,0,0,0.10)'}} />
      {PALETTE.map((c, i) => {
        const g = seg(i);
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: g.x, top: g.y, width: g.w, height: g.h, borderRadius: 5, background: loaded[i] > 0 ? css(c, 0.3 * loaded[i]) : 'rgba(0,0,0,0.10)'}} />
            {fills[i] > 0 ? <div style={{position: 'absolute', left: g.x, top: g.y, width: Math.max(10, g.w * fills[i]), height: g.h, borderRadius: 5, background: css(c)}} /> : null}
          </React.Fragment>
        );
      })}
      <div style={{position: 'absolute', left: LOGO.x, top: LOGO.y, width: LOGO.w, height: LOGO.h, borderRadius: LOGO.h / 2, background: '#fff', boxShadow: '0 6px 22px rgba(0,0,0,0.10)', opacity: logoOp, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Img src={staticFile('brand/logo-color.png')} style={{height: 66}} />
      </div>
      <div
        style={{position: 'absolute', left: LOGO.x + LOGO.w + 12, top: LOGO.y + 12, height: 62, padding: '0 30px', borderRadius: 31, background: '#000', color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 28, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', opacity: logoOp}}
      >
        RESPONDE
      </div>
    </div>
  );
};

/** Tap feedback: a ring that opens from the point that was "touched". */
export const Ripple: React.FC<{t: number; t0: number; x: number; y: number; color: string; size?: number}> = ({t, t0, x, y, color, size = 150}) => {
  const p = prog(t, t0, 0.55, easeOut5);
  if (p <= 0 || p >= 1) return null;
  const d = lerp(30, size, p);
  return <div style={{position: 'absolute', left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: d / 2, border: `${lerp(10, 2, p)}px solid ${color}`, boxSizing: 'border-box', opacity: 1 - p}} />;
};

export type QWord = [string, number];
export type BlockDef = {
  i: number;
  col: RGB;
  tq: number;
  ta: number;
  end: number;
  /** the question, by lines, each word with the time it is spoken */
  q: QWord[][];
  tag: string;
  keys: (g: {tagRect: Partial<Shape>}) => Key[];
  tagOut: number;
  /** the question follows a reading pause: it is already full screen when the pause lifts */
  instant?: boolean;
};

/** Full-screen question -> tag -> (custom keys) -> its segment of the progress bar. */
export const useBlockShape = (t: number, b: BlockDef) => {
  const tagW = tw(b.tag, 26, 800, 0.06) + 56;
  const tagRect: Partial<Shape> = {x: X0, y: TAG.y, w: tagW, h: TAG.h, r: TAG.h / 2, col: b.col, fa: 1, bw: 0};
  const base: Shape = {...(dotShape(b.i, b.col) as Shape), op: 0};
  const keys: Key[] = [
    {t: b.tq - (b.instant ? 0.03 : 0.26), dur: 0.02, op: 1},
    // the bar segment opens into the whole screen: the question takes over, the footage waits behind
    {t: b.tq - (b.instant ? 0.02 : 0.24), dur: b.instant ? 0.01 : 0.22, x: 0, y: -DY, w: 1080, h: 1920 + DY, r: 0},
    // ...and the whole screen folds into the tag when the answer starts
    {t: b.ta, dur: 0.55, ...tagRect},
    ...b.keys({tagRect}),
    {t: b.end - 0.38, dur: 0.16, ...dotShape(b.i, b.col)},
    {t: b.end - 0.2, dur: 0.05, op: 0},
  ];
  return {shape: track(t, base, keys), tagW};
};

export const BlockChrome: React.FC<{t: number; b: BlockDef; shape: Shape}> = ({t, b, shape}) => {
  const fg = onColor(b.col);
  const lines = b.q.map((l) => l.map((w) => w[0]).join(' '));
  const size = fit(lines, CW, 168, 900);
  const lh = size * 1.04;
  const qOp = prog(t, b.tq - 0.1, 0.1) * (1 - prog(t, b.ta, 0.14));
  const tagOp = prog(t, b.ta + 0.36, 0.2) * (1 - prog(t, b.tagOut, 0.14));
  const y0 = 560;
  const last = b.q[b.q.length - 1];
  const tLast = last[last.length - 1][1];
  const mark = prog(t, b.tq - 0.1, 0.6, back);
  return (
    <>
      <ShapeDiv s={shape} border={b.col} />
      {qOp > 0 ? (
        <AbsoluteFill style={{opacity: qOp}}>
          {/* big own question mark, half out of frame */}
          <div style={{position: 'absolute', left: 560, top: 1010, opacity: 0.16, transform: `scale(${mark}) rotate(${lerp(-14, 10, clamp01((t - b.tq) / (b.ta - b.tq)))}deg)`, transformOrigin: '50% 60%'}}>
            <QMark size={620} color={fg} />
          </div>
          <div style={{position: 'absolute', left: X0, top: 436, height: 64, padding: '0 28px', borderRadius: 32, border: `4px solid ${fg}`, color: fg, fontFamily: FONT, fontWeight: 800, fontSize: 28, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', boxSizing: 'border-box', transform: `translateX(${(1 - prog(t, b.tq - 0.12, 0.4, easeOut5)) * -60}px)`}}>
            PREGUNTA {b.i + 1} DE 5
          </div>
          <div style={{position: 'absolute', left: X0, top: y0, fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1, color: fg, whiteSpace: 'nowrap'}}>
            {b.q.map((l, k) => (
              <div key={k} style={{height: lh}}>
                {l.map(([w, tw0], j) => (
                  <React.Fragment key={j}>
                    <Rise t={t} t0={tw0 - 0.12} dur={0.32}>
                      {w}
                    </Rise>
                    {j < l.length - 1 ? ' ' : null}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
          <Trazo t={t} t0={tLast + 0.05} dur={0.5} x={X0} y={y0 + b.q.length * lh + 6} w={420} color={fg} sw={12} />
        </AbsoluteFill>
      ) : null}
      {tagOp > 0 ? (
        <div style={{position: 'absolute', left: shape.x + 28, top: shape.y + (shape.h - 26) / 2, fontFamily: FONT, fontWeight: 800, fontSize: 26, lineHeight: 1, letterSpacing: '0.06em', color: fg, whiteSpace: 'nowrap', opacity: tagOp}}>
          {b.tag}
        </div>
      ) : null}
    </>
  );
};

/** underline rect for a line of text placed at (x,y) with a given size and width */
export const under = (x: number, y: number, size: number, w: number, h = 14): Partial<Shape> => ({x, y: y + BASE * size + 13, w, h, r: h / 2, fa: 1, bw: 0});
/** frame rect around caps text lines starting at y (first line) to the last line */
export const frame = (x: number, y: number, size: number, w: number, lines = 1, gap = 0, bw = 8): Partial<Shape> => ({
  x: x - 24,
  y: y + CAP_TOP * size - 20,
  w: w + 48,
  h: (lines - 1) * gap + 0.7 * size + 40,
  r: 22,
  fa: 0,
  bw,
});

export const Pop: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; origin?: string; children: React.ReactNode}> = ({t, t0, t1, x, y, origin = '50% 50%', children}) => {
  const p = prog(t, t0, 0.42, back);
  const q = t1 !== undefined ? prog(t, t1, 0.22, easeIn) : 0;
  if (p <= 0 || q >= 1) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${p * (1 - q)})`, transformOrigin: origin, opacity: clamp01(p * 3) * (1 - q)}}>{children}</div>
  );
};
