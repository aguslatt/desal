import React from 'react';
import {easeIO, easeIn, easeOut, lerp, prog} from '../ui';

// Equipo ADIP · manual v2 palette (no other colours)
export const K = {
  violet: '#8A00B7',
  pink: '#ED2995',
  orange: '#FE801C',
  yellow: '#FFCB01',
  green: '#94C920',
  gray: '#EFEFEF',
  ink: '#000000',
  white: '#FFFFFF',
  tintPink: '#FBD4EA',
  tintYellow: '#FFF0B8',
};
export const FONT = "'Montserrat', sans-serif";
export const GRADIENT = [
  [0, K.violet],
  [0.3, K.pink],
  [0.55, K.orange],
  [0.78, K.yellow],
  [1, K.green],
] as const;

export const abs = (left: number, top: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute',
  left,
  top,
  fontFamily: FONT,
  whiteSpace: 'nowrap',
  ...extra,
});

/** Text that rises out of an invisible mask at t0 and (optionally) leaves upward at t1. */
export const Rise: React.FC<{
  t: number;
  t0: number;
  t1?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  dur?: number;
  outDur?: number;
}> = ({t, t0, t1, children, style, dur = 0.6, outDur = 0.36}) => {
  const p = prog(t, t0, dur, easeOut);
  const q = t1 !== undefined ? prog(t, t1, outDur, easeIn) : 0;
  if (p <= 0 || q >= 1) return null;
  const y = (1 - p) * 110 - q * 110;
  return (
    <span
      style={{
        display: 'inline-block',
        overflow: 'hidden',
        verticalAlign: 'top',
        padding: '0.1em 0.06em 0.26em',
        margin: '-0.1em -0.06em -0.26em',
      }}
    >
      <span style={{display: 'inline-block', transform: `translateY(${y}%)`, ...style}}>{children}</span>
    </span>
  );
};

/** Left-to-right mask wipe (editorial reveal). */
export const Wipe: React.FC<{t: number; t0: number; t1?: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  t,
  t0,
  t1,
  dur = 0.55,
  children,
  style,
}) => {
  const p = prog(t, t0, dur, easeIO);
  const q = t1 !== undefined ? prog(t, t1, 0.35, easeIO) : 0;
  if (p <= 0 || q >= 1) return null;
  const left = q * 100;
  const right = (1 - p) * 100;
  return (
    <span style={{display: 'inline-block', clipPath: `inset(-0.2em ${right}% -0.3em ${left}%)`, ...style}}>
      {children}
    </span>
  );
};

/** Colour block that wipes in behind a word (used sparingly, as a highlighter). */
export const Marker: React.FC<{
  t: number;
  t0: number;
  t1?: number;
  color: string;
  textColor?: string;
  pad?: [number, number];
  children: React.ReactNode;
}> = ({t, t0, t1, color, textColor = K.ink, pad = [20, 4], children}) => {
  const p = prog(t, t0 - 0.1, 0.5, easeIO);
  const q = t1 !== undefined ? prog(t, t1, 0.32, easeIn) : 0;
  if (p <= 0 || q >= 1) return null;
  return (
    <span style={{position: 'relative', display: 'inline-block', padding: `${pad[1]}px ${pad[0]}px`, color: textColor}}>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background: color,
          transformOrigin: q > 0 ? '100% 50%' : '0% 50%',
          transform: `scaleX(${q > 0 ? 1 - q : p})`,
        }}
      />
      <span style={{position: 'relative'}}>
        <Rise t={t} t0={t0} t1={t1}>
          {children}
        </Rise>
      </span>
    </span>
  );
};

/** The ADIP "trazo": one continuous stroke with a loop. Drawn progressively. */
export const TRAZO = 'M10 96 C 70 98, 120 92, 156 74 C 196 54, 204 16, 178 12 C 150 8, 146 54, 182 76 C 220 98, 300 98, 390 92';
export const Trazo: React.FC<{
  t: number;
  t0: number;
  t1?: number;
  left: number;
  top: number;
  w: number;
  color?: string;
  gradient?: boolean;
  dur?: number;
  id?: string;
}> = ({t, t0, t1, left, top, w, color = K.pink, gradient, dur = 0.9, id = 'tz'}) => {
  const p = prog(t, t0, dur, easeIO);
  const q = t1 !== undefined ? prog(t, t1, 0.45, easeIO) : 0;
  if (p <= 0 || q >= 1) return null;
  const h = (w * 120) / 400;
  return (
    <svg viewBox="0 0 400 120" width={w} height={h} style={{position: 'absolute', left, top, overflow: 'visible'}}>
      {gradient && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            {GRADIENT.map(([o, c]) => (
              <stop key={o} offset={o} stopColor={c} />
            ))}
          </linearGradient>
        </defs>
      )}
      <path
        d={TRAZO}
        pathLength={1}
        fill="none"
        stroke={gradient ? `url(#${id})` : color}
        strokeWidth={13}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${Math.max(0, p - q)} 2`}
        strokeDashoffset={-q}
      />
    </svg>
  );
};

/** Six-stripe palette bar (violet, pink, orange, yellow, green, black). */
export const PaletteBar: React.FC<{t: number; t0: number; t1?: number; left: number; top: number; width: number; height?: number}> = ({
  t,
  t0,
  t1,
  left,
  top,
  width,
  height = 12,
}) => {
  const cols = [K.violet, K.pink, K.orange, K.yellow, K.green, K.ink];
  const seg = width / cols.length;
  const q = t1 !== undefined ? prog(t, t1, 0.4, easeIn) : 0;
  if (prog(t, t0, 0.1, (x) => x) <= 0 || q >= 1) return null;
  return (
    <div style={{position: 'absolute', left, top, width, height, display: 'flex', opacity: 1 - q}}>
      {cols.map((c, i) => {
        const k = prog(t, t0 + i * 0.06, 0.55, easeOut);
        return <div key={i} style={{width: seg, height, background: c, transformOrigin: '0 50%', transform: `scaleX(${k})`}} />;
      })}
    </div>
  );
};

/** Small label: uppercase, tracked, with a short rule. */
export const Label: React.FC<{
  t: number;
  t0: number;
  t1?: number;
  left: number;
  top: number;
  text: string;
  color?: string;
  rule?: string;
  size?: number;
}> = ({t, t0, t1, left, top, text, color = K.ink, rule = K.pink, size = 30}) => {
  const p = prog(t, t0, 0.5, easeOut);
  const q = t1 !== undefined ? prog(t, t1, 0.3, easeIn) : 0;
  if (p <= 0 || q >= 1) return null;
  return (
    <div style={abs(left, top, {display: 'flex', alignItems: 'center', gap: 18, opacity: 1 - q})}>
      <div style={{height: 6, width: 56 * easeOut(p), background: rule, borderRadius: 6}} />
      <Rise t={t} t0={t0 + 0.05} t1={t1} style={{fontSize: size, fontWeight: 800, letterSpacing: '0.2em', color}}>
        {text}
      </Rise>
    </div>
  );
};

// ---------- duotone icons: black stroke + one filled detail in the area colour ----------
export const Icon: React.FC<{kind: 'calendar' | 'clock' | 'screen'; color: string; size?: number; p?: number}> = ({kind, color, size = 96, p = 1}) => {
  const s = {fill: 'none', stroke: K.ink, strokeWidth: 3.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} style={{transform: `scale(${lerp(0.6, 1, easeOut(p))})`, opacity: p}}>
      {kind === 'calendar' && (
        <>
          <rect x="9" y="12" width="30" height="27" rx="4" {...s} />
          <rect x="9" y="12" width="30" height="9" rx="4" fill={color} stroke={K.ink} strokeWidth={3.2} />
          <path d="M16 8v7M32 8v7" {...s} />
          <path d="M16 28h4M24 28h4M16 34h4" {...s} />
        </>
      )}
      {kind === 'clock' && (
        <>
          <circle cx="24" cy="24" r="16" fill={color} stroke={K.ink} strokeWidth={3.2} />
          <path d="M24 14v10l7 4" {...s} />
        </>
      )}
      {kind === 'screen' && (
        <>
          <rect x="7" y="10" width="34" height="23" rx="4" {...s} />
          <path d="M7 25h34v4a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4z" fill={color} stroke={K.ink} strokeWidth={3.2} strokeLinejoin="round" />
          <path d="M18 40h12M24 33v7" {...s} />
        </>
      )}
    </svg>
  );
};
