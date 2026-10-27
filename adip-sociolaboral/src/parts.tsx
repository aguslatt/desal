import React from 'react';
import {Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, GRADIENT, easeOut, prog} from './ui';
import {CAPS, E, FPS} from './timeline';

export const useT = () => useCurrentFrame() / FPS;

// ───────────────────────── medios con encuadre ─────────────────────────
export type MediaDef = {kind: 'img' | 'vid'; src: string; nw: number; nh: number};
export const M = {
  speaker: {kind: 'vid', src: 'media/speaker.mp4', nw: 1620, nh: 2880} as MediaDef,
  f1: {kind: 'img', src: 'fotos/foto1.png', nw: 1280, nh: 720} as MediaDef,
  f2: {kind: 'img', src: 'fotos/foto2.png', nw: 960, nh: 1280} as MediaDef,
  f3: {kind: 'img', src: 'fotos/foto3.png', nw: 960, nh: 1280} as MediaDef,
  f5: {kind: 'img', src: 'fotos/foto5.png', nw: 960, nh: 1280} as MediaDef,
  org: {kind: 'img', src: 'fotos/organigrama.png', nw: 900, nh: 446} as MediaDef,
};

// fx/fy: punto de la imagen (0..1) que queda al centro. z: zoom sobre el "cover".
export const Media: React.FC<{m: MediaDef; w: number; h: number; fx: number; fy: number; z: number}> = ({
  m, w, h, fx, fy, z,
}) => {
  const s = Math.max(w / m.nw, h / m.nh) * z;
  const dw = m.nw * s;
  const dh = m.nh * s;
  const left = Math.min(0, Math.max(w - dw, w / 2 - fx * dw));
  const top = Math.min(0, Math.max(h - dh, h / 2 - fy * dh));
  const st: React.CSSProperties = {position: 'absolute', left, top, width: dw, height: dh};
  return m.kind === 'img' ? (
    <Img src={staticFile(m.src)} style={st} />
  ) : (
    <OffthreadVideo src={staticFile(m.src)} muted style={st} />
  );
};

// ───────────────────────── ventana / arco ─────────────────────────
export const Win: React.FC<{
  x: number; y: number; w: number; h: number;
  rt?: number; rb?: number;
  reveal?: number; // 0..1 desde abajo hacia arriba
  circle?: number; // radio de revelado circular (px) -> reemplaza reveal
  opacity?: number;
  children: (w: number, h: number) => React.ReactNode;
}> = ({x, y, w, h, rt, rb = 0, reveal = 1, circle, opacity = 1, children}) => {
  const r = rt ?? w / 2;
  const clip =
    circle !== undefined
      ? `circle(${circle}px at ${w / 2}px ${h / 2}px)`
      : `inset(${(1 - reveal) * 100}% 0 0 0)`;
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', opacity,
        borderRadius: `${Math.min(r, w / 2)}px ${Math.min(r, w / 2)}px ${rb}px ${rb}px`,
        clipPath: clip,
      }}
    >
      {children(w, h)}
    </div>
  );
};

// contorno trazado alrededor de la ventana (el trazo "dibuja" la ventana)
export const WinStroke: React.FC<{
  x: number; y: number; w: number; h: number; rt?: number; p: number; color?: string; sw?: number; gap?: number; opacity?: number;
}> = ({x, y, w, h, rt, p, color = C.black, sw = 9, gap = 18, opacity = 1}) => {
  if (p <= 0 || opacity <= 0) return null;
  const X = x - gap, Y = y - gap, W = w + gap * 2, H = h + gap * 2;
  const r = Math.min(rt === undefined ? w / 2 : rt + gap, W / 2);
  const d = `M ${X} ${Y + H} L ${X} ${Y + r} A ${r} ${r} 0 0 1 ${X + r} ${Y} L ${X + W - r} ${Y} A ${r} ${r} 0 0 1 ${X + W} ${Y + r} L ${X + W} ${Y + H} Z`;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity}}>
      <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${p} 1.01`} />
    </svg>
  );
};

// ───────────────────────── el trazo del isotipo ─────────────────────────
const LOOP = 'M 8 104 C 140 106, 220 100, 268 70 C 312 40, 338 8, 316 -14 C 296 -34, 262 -22, 262 6 C 262 40, 300 88, 370 100 C 440 110, 520 104, 592 102';
let gid = 0;
export const Trazo: React.FC<{x: number; y: number; w: number; p?: number; q?: number; color?: string | 'gradient'; sw?: number; opacity?: number}> = ({
  x, y, w, p = 1, q = 0, color = C.orange, sw = 15, opacity = 1,
}) => {
  const id = React.useMemo(() => `g${gid++}`, []);
  if (p <= 0 || opacity <= 0) return null;
  const sc = w / 600;
  const head = Math.max(0, p - q);
  return (
    <svg width={w} height={170 * sc} viewBox="0 -40 600 170" style={{position: 'absolute', left: x, top: y, overflow: 'visible', opacity}}>
      {color === 'gradient' && (
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="600" y2="0">
            {GRADIENT.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
          </linearGradient>
        </defs>
      )}
      <path d={LOOP} pathLength={1} fill="none" stroke={color === 'gradient' ? `url(#${id})` : color} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={`${head} 1.01`} strokeDashoffset={-q} />
    </svg>
  );
};

// ───────────────────────── cabezas ─────────────────────────
export const Head: React.FC<{cx: number; cy: number; d: number; color: string; s?: number; opacity?: number}> = ({cx, cy, d, color, s = 1, opacity = 1}) => (
  <div style={{position: 'absolute', left: cx - d / 2, top: cy - d / 2, width: d, height: d, borderRadius: '50%', background: color, transform: `scale(${s})`, opacity}} />
);

// ───────────────────────── textos ─────────────────────────
export const Pill: React.FC<{x: number; y: number; text: string; bg?: string; color?: string; size?: number; p?: number; dot?: string}> = ({
  x, y, text, bg = C.white, color = C.black, size = 28, p = 1, dot,
}) => {
  if (p <= 0) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 14, padding: `${size * 0.5}px ${size * 0.9}px`, borderRadius: 999,
      background: bg, color, fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: 1,
      opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 18}px) scale(${0.92 + 0.08 * p})`, transformOrigin: 'left center',
    }}>
      {dot && <span style={{width: size * 0.62, height: size * 0.62, borderRadius: '50%', background: dot}} />}
      {text}
    </div>
  );
};

// línea con máscara que sube (entrada) y sube (salida)
export const Rise: React.FC<{p: number; out?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({p, out = 0, children, style}) => (
  <div style={{overflow: 'hidden', paddingBottom: '0.16em', marginBottom: '-0.16em', ...style}}>
    <div style={{transform: `translateY(${(1 - p) * 112 - out * 112}%)`}}>{children}</div>
  </div>
);

// bloque de color con texto (el texto sobre foto va siempre en un bloque)
export const Block: React.FC<{x: number; y: number; text: string; size: number; bg?: string; p: number; w?: number; align?: 'left' | 'center'}> = ({
  x, y, text, size, bg = C.orange, p, w, align = 'left',
}) => {
  if (p <= 0) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, padding: `${size * 0.28}px ${size * 0.5}px ${size * 0.34}px`, borderRadius: 32, background: bg, color: C.black,
      fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.04, letterSpacing: '-0.01em', textAlign: align, whiteSpace: 'pre',
      transform: `translateY(${(1 - p) * 40}px) scale(${0.94 + 0.06 * p})`, opacity: Math.min(1, p * 2.5), transformOrigin: 'left bottom',
    }}>
      {text}
    </div>
  );
};

// ───────────────────────── subtítulos ─────────────────────────
const CAP_BOTTOM = 380; // zona segura inferior (Instagram)
export const Captions: React.FC<{dark?: boolean}> = ({dark}) => {
  const t = useT();
  const idx = CAPS.findIndex((c, i) => {
    const s = E(c.a) - 0.04;
    const nextS = i + 1 < CAPS.length ? E(CAPS[i + 1].a) - 0.04 : 99;
    const e = Math.min(E(c.b) + 0.16, nextS);
    return t >= s && t < e;
  });
  if (idx < 0) return null;
  const c = CAPS[idx];
  const k = prog(t, E(c.a) - 0.04, 0.16);
  const kws = c.kw ?? [];
  const render = (line: string) => {
    if (!kws.length) return line;
    const re = new RegExp(`(${kws.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    return line.split(re).map((part, i) =>
      kws.includes(part) ? (
        <span key={i} style={{fontWeight: 800, background: C.orange, color: C.black, padding: '0 10px', margin: '0 -2px', borderRadius: 12, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{part}</span>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      ),
    );
  };
  return (
    <div style={{position: 'absolute', left: 80, right: 80, bottom: CAP_BOTTOM, display: 'flex', justifyContent: 'center', opacity: k, transform: `translateY(${(1 - k) * 16}px)`}}>
      <div style={{
        background: dark ? C.black : C.white, color: dark ? C.white : C.black, borderRadius: 32, padding: '22px 36px 26px', fontFamily: FONT, fontWeight: 600, fontSize: 46,
        lineHeight: 1.28, textAlign: 'center', whiteSpace: 'pre-line',
      }}>
        {c.text.split('\n').map((l, i) => <div key={i}>{render(l)}</div>)}
      </div>
    </div>
  );
};

export const PaletteBar: React.FC<{y?: number; h?: number; p?: number}> = ({y = 0, h = 24, p = 1}) => (
  <div style={{position: 'absolute', left: 0, top: y, width: 1080, height: h, display: 'flex', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}}>
    {[C.violet, C.pink, C.orange, C.yellow, C.green, C.black].map((c) => <div key={c} style={{flex: 1, background: c}} />)}
  </div>
);

export const Logo: React.FC<{file: string; x: number; y: number; w: number; opacity?: number}> = ({file, x, y, w, opacity = 1}) => (
  <Img src={staticFile(`brand/${file}.png`)} style={{position: 'absolute', left: x, top: y, width: w, height: (w * 1016) / 2182, opacity}} />
);
