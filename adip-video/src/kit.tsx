import React from 'react';
import {BASE, CAP_TOP, Key, Shape, back, clamp01, easeIn, easeIO, easeOut5, fit, lerp, prog, track, tw} from './anim';
import {C, FONT, GRADIENT, PALETTE, RGB, TRAZO, css, onColor} from './theme';

export const X0 = 80; // left margin (manual: 80 px)
export const CW = 920; // content width
export const HEADER = {y: 204, h: 56};
export const TAG = {y: 290, h: 58};
export const CARD_Y = 290;

const HEADER_TXT = 'EQUIPO ADIP RESPONDE'; // la marca es siempre «Equipo ADIP», nunca «ADIP» sola
const headerTextW = () => tw(HEADER_TXT, 26, 800, 0.06);
export const headerW = () => 26 + headerTextW() + 18 + 5 * 16 + 4 * 10 + 24;
/** centre of progress dot i */
export const dot = (i: number) => ({x: X0 + 26 + headerTextW() + 18 + 8 + i * 26, y: HEADER.y + HEADER.h / 2});
export const dotShape = (i: number, col: RGB): Partial<Shape> => ({x: dot(i).x - 8, y: dot(i).y - 8, w: 16, h: 16, r: 8, col, fa: 1, bw: 0});

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

/** Section header: black capsule with the section name and the five progress dots. */
export const Header: React.FC<{t: number; show: number; current: number; contentOp: number; drawCapsule: boolean}> = ({t, show, current, contentOp, drawCapsule}) => {
  if (show <= 0) return null;
  const w = headerW();
  return (
    <>
      {drawCapsule ? <div style={{position: 'absolute', left: X0, top: HEADER.y, width: w, height: HEADER.h, borderRadius: HEADER.h / 2, background: '#000'}} /> : null}
      <div
        style={{
          position: 'absolute',
          left: X0 + 26,
          top: HEADER.y + (HEADER.h - 26) / 2,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 26,
          lineHeight: 1,
          letterSpacing: '0.06em',
          color: '#fff',
          whiteSpace: 'nowrap',
          opacity: contentOp,
        }}
      >
        {HEADER_TXT}
      </div>
      {PALETTE.map((c, i) => {
        const d = dot(i);
        const active = i <= current;
        const pulse = i === current ? 1 + 0.18 * Math.sin(t * 5) ** 2 : 1;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: d.x - 8,
              top: d.y - 8,
              width: 16,
              height: 16,
              borderRadius: 8,
              background: css(c, active ? 1 : 0.38),
              transform: `scale(${pulse})`,
              opacity: contentOp,
            }}
          />
        );
      })}
    </>
  );
};

export type BlockDef = {
  i: number;
  col: RGB;
  tq: number;
  ta: number;
  end: number;
  q: string[];
  tag: string;
  /** frames stay as outlines unless the colour is too light for that */
  keys: (g: {tagRect: Partial<Shape>}) => Key[];
  tagOut: number;
};

export const cardLayout = (q: string[]) => {
  const size = fit(q, CW - 96, 86, 800);
  const lh = size * 1.1;
  const h = 46 + q.length * lh + 34;
  return {size, lh, h};
};

/** Question card -> tag -> (custom keys) -> progress dot. Returns the live shape so blocks can hang graphics on it. */
export const useBlockShape = (t: number, b: BlockDef) => {
  const {h} = cardLayout(b.q);
  const tagW = tw(b.tag, 26, 800, 0.06) + 56;
  const tagRect: Partial<Shape> = {x: X0, y: TAG.y, w: tagW, h: TAG.h, r: TAG.h / 2, col: b.col, fa: 1, bw: 0};
  const base: Shape = {...(dotShape(b.i, b.col) as Shape), op: 0};
  const keys: Key[] = [
    {t: b.tq - 0.02, dur: 0.02, op: 1},
    {t: b.tq, dur: 0.5, ease: back, x: X0, y: CARD_Y, w: CW, h, r: 32, col: C.white},
    {t: b.ta, dur: 0.5, ...tagRect},
    ...b.keys({tagRect}),
    {t: b.end - 0.22, dur: 0.32, ...dotShape(b.i, b.col)},
    {t: b.end + 0.1, dur: 0.05, op: 0},
  ];
  return {shape: track(t, base, keys), cardH: h, tagW};
};

export const BlockChrome: React.FC<{t: number; b: BlockDef; shape: Shape}> = ({t, b, shape}) => {
  const {size, lh} = cardLayout(b.q);
  const cardness = prog(t, b.tq + 0.05, 0.3) * (1 - prog(t, b.ta, 0.3));
  const textOut = 1 - prog(t, b.ta, 0.16);
  const tagOp = prog(t, b.ta + 0.3, 0.2) * (1 - prog(t, b.tagOut, 0.14));
  const badge = prog(t, b.tq + 0.16, 0.45, back) * (1 - prog(t, b.ta, 0.22, easeIn));
  const fg = onColor(b.col);
  return (
    <>
      <ShapeDiv s={shape} border={b.col} shadow={cardness} />
      {/* question */}
      {t >= b.tq && textOut > 0 ? (
        <div style={{position: 'absolute', left: X0 + 48, top: CARD_Y + 46, opacity: textOut, fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1, color: '#000', whiteSpace: 'nowrap'}}>
          {b.q.map((l, k) => (
            <div key={k} style={{height: lh}}>
              <Rise t={t} t0={b.tq + 0.14 + k * 0.07} dur={0.42}>
                {l}
              </Rise>
            </div>
          ))}
        </div>
      ) : null}
      {badge > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: X0 + CW - 124,
            top: CARD_Y - 44,
            width: 104,
            height: 104,
            borderRadius: 52,
            background: css(b.col),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${badge}) rotate(${lerp(-18, 8, badge)}deg)`,
          }}
        >
          <QMark size={50} color={fg} />
        </div>
      ) : null}
      {/* tag */}
      {tagOp > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: shape.x + 28,
            top: shape.y + (shape.h - 26) / 2,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 26,
            lineHeight: 1,
            letterSpacing: '0.06em',
            color: fg,
            whiteSpace: 'nowrap',
            opacity: tagOp,
          }}
        >
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
