import React from 'react';
import {Img, OffthreadVideo, delayRender, continueRender, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, GRADIENT, easeOut, prog} from './ui';
import {CAPS, E, FPS} from './timeline';

export const useT = () => useCurrentFrame() / FPS;

// ── Montserrat (archivos locales) ──
const WEIGHTS = [300, 400, 500, 600, 700, 800, 900];
export const Fonts: React.FC = () => {
  const [h] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => {
    Promise.all(WEIGHTS.map((w) => document.fonts.load(`${w} 40px Montserrat`))).then(() => continueRender(h));
  }, [h]);
  return (
    <style>{WEIGHTS.map((w) => `@font-face{font-family:'Montserrat';font-weight:${w};src:url(${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}) format('woff2');}`).join('')}</style>
  );
};

// ── medios ──
export type MediaDef = {kind: 'img' | 'vid'; src: string; nw: number; nh: number};
export const M = {
  speaker: {kind: 'vid', src: 'media/speaker.mp4', nw: 1620, nh: 2880} as MediaDef,
  f1: {kind: 'img', src: 'fotos/foto1_x2.png', nw: 2560, nh: 1440} as MediaDef,
  f2: {kind: 'img', src: 'fotos/foto2_x2.png', nw: 1920, nh: 2560} as MediaDef,
  f3: {kind: 'img', src: 'fotos/foto3_x2.png', nw: 1920, nh: 2560} as MediaDef,
  f5: {kind: 'img', src: 'fotos/foto5_x2.png', nw: 1920, nh: 2560} as MediaDef,
  org: {kind: 'img', src: 'fotos/organigrama_x2.png', nw: 1800, nh: 892} as MediaDef,
};

// Cam: el punto (px,py) del medio (0..1) queda en (X,Y) del contenedor, con zoom z sobre "cover".
export const Cam: React.FC<{m: MediaDef; w: number; h: number; px: number; py: number; X?: number; Y?: number; z: number}> = ({
  m, w, h, px, py, X = w / 2, Y = h / 2, z,
}) => {
  const s = Math.max(w / m.nw, h / m.nh) * z;
  const dw = m.nw * s, dh = m.nh * s;
  const left = Math.min(0, Math.max(w - dw, X - px * dw));
  const top = Math.min(0, Math.max(h - dh, Y - py * dh));
  const st: React.CSSProperties = {position: 'absolute', left, top, width: dw, height: dh, maxWidth: 'none'};
  return m.kind === 'img' ? <Img src={staticFile(m.src)} style={st} /> : <OffthreadVideo src={staticFile(m.src)} muted style={st} />;
};

// caja rectangular recortada (sin bordes ni radios)
export const Box: React.FC<{x: number; y: number; w: number; h: number; clip?: string; children: React.ReactNode; style?: React.CSSProperties}> = ({x, y, w, h, clip, children, style}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', clipPath: clip, ...style}}>{children}</div>
);

// ── banda de color: entra por máscara, sale por máscara ──
export const Band: React.FC<{y: number; h: number; color: string; p: number; q?: number; from?: 'left' | 'right'; children?: React.ReactNode}> = ({
  y, h, color, p, q = 0, from = 'left', children,
}) => {
  if (p <= 0 || q >= 1) return null;
  const clip = from === 'left' ? `inset(0 ${(1 - p) * 100}% 0 ${q * 100}%)` : `inset(0 ${q * 100}% 0 ${(1 - p) * 100}%)`;
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: 1080, height: h, background: color, clipPath: clip}}>{children}</div>
  );
};

// línea de texto que sube dentro de una máscara
export const Rise: React.FC<{p: number; out?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({p, out = 0, children, style}) => (
  <div style={{overflow: 'hidden', paddingTop: '0.14em', marginTop: '-0.14em', paddingBottom: '0.3em', marginBottom: '-0.3em', ...style}}>
    <div style={{transform: `translateY(${(1 - p) * 112 - out * 112}%)`}}>{children}</div>
  </div>
);

export const T1: React.FC<{size: number; weight?: number; color?: string; children: React.ReactNode; ls?: number}> = ({size, weight = 900, color = C.ink, children, ls = -0.03}) => (
  <span style={{fontFamily: FONT, fontWeight: weight, fontSize: size, color, letterSpacing: `${ls}em`, lineHeight: 1.08, whiteSpace: 'pre'}}>{children}</span>
);

// etiqueta de nombre: rectángulo amarillo, texto negro (≥32 px)
export const NameTag: React.FC<{text: string; p: number}> = ({text, p}) => {
  if (p <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, top: 282, clipPath: `inset(0 ${(1 - Math.min(1, p * 1.4)) * 100}% 0 0)`}}>
      <div style={{background: C.yellow, color: C.ink, fontFamily: FONT, fontWeight: 800, fontSize: 34, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '14px 30px 14px 80px', whiteSpace: 'nowrap'}}>{text}</div>
    </div>
  );
};

// ── subtítulos: rectángulo blanco, 54 px, legibles en celular ──
export const Captions: React.FC<{bottom?: number}> = ({bottom = 380}) => {
  const t = useT();
  const idx = CAPS.findIndex((c, i) => {
    const s = E(c.a) - 0.04;
    const nextS = i + 1 < CAPS.length ? E(CAPS[i + 1].a) - 0.04 : 99;
    return t >= s && t < Math.min(E(c.b) + 0.16, nextS);
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
        <span key={i} style={{fontWeight: 800, background: C.orange, padding: '0 10px', margin: '0 -4px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{part}</span>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      ),
    );
  };
  return (
    <div style={{position: 'absolute', left: 60, right: 60, bottom, display: 'flex', justifyContent: 'center', opacity: k, transform: `translateY(${(1 - k) * 16}px)`}}>
      <div style={{background: C.white, color: C.ink, padding: '18px 34px 22px', fontFamily: FONT, fontWeight: 600, fontSize: 54, lineHeight: 1.22, textAlign: 'center', whiteSpace: 'pre-line', letterSpacing: '-0.01em'}}>
        {c.text.split('\n').map((l, i) => <div key={i}>{render(l)}</div>)}
      </div>
    </div>
  );
};

export const PaletteBar: React.FC<{y?: number; h?: number; p?: number}> = ({y = 0, h = 24, p = 1}) => (
  <div style={{position: 'absolute', left: 0, top: y, width: 1080, height: h, display: 'flex', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}}>
    {[C.violet, C.pink, C.orange, C.yellow, C.green].map((c) => <div key={c} style={{flex: 1, background: c}} />)}
  </div>
);

export const Logo: React.FC<{x: number; y: number; w: number; opacity?: number}> = ({x, y, w, opacity = 1}) => (
  <Img src={staticFile('brand/logo_adip_color.png')} style={{position: 'absolute', left: x, top: y, width: w, height: (w * 1016) / 2182, opacity}} />
);

// ── el trazo del isotipo (solo en el cierre) ──
const LOOP = 'M 8 104 C 140 106, 220 100, 268 70 C 312 40, 338 8, 316 -14 C 296 -34, 262 -22, 262 6 C 262 40, 300 88, 370 100 C 440 110, 520 104, 592 102';
export const Trazo: React.FC<{x: number; y: number; w: number; p: number; sw?: number}> = ({x, y, w, p, sw = 15}) => {
  if (p <= 0) return null;
  const sc = w / 600;
  return (
    <svg width={w} height={170 * sc} viewBox="0 -40 600 170" style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
      <defs>
        <linearGradient id="tz" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="600" y2="0">
          {GRADIENT.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
        </linearGradient>
      </defs>
      <path d={LOOP} pathLength={1} fill="none" stroke="url(#tz)" strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${p} 1.01`} />
    </svg>
  );
};

// cortina rectangular: cubre de izquierda a derecha y se retira; el corte ocurre en el centro
export const Curtain: React.FC<{color: string; t0: number; d?: number}> = ({color, t0, d = 0.32}) => {
  const t = useT();
  if (t < t0 || t > t0 + 2 * d) return null;
  const a = prog(t, t0, d, easeOut), b = prog(t, t0 + d, d, easeOut);
  return <div style={{position: 'absolute', inset: 0, background: color, clipPath: `inset(0 ${(1 - a) * 100}% 0 ${b * 100}%)`}} />;
};

// ───────── collage: tarjetas y chips con inclinación leve ─────────
const SHADOW = '0 28px 60px rgba(0,0,0,0.20), 0 6px 14px rgba(0,0,0,0.10)';

// tarjeta rectangular (foto o gráfico) que flota sobre el plano; rot en grados
export const Card: React.FC<{x: number; y: number; w: number; h: number; rot?: number; shadow?: boolean; clip?: string; z?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  x, y, w, h, rot = 0, shadow = true, clip, children, style,
}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg)`, transformOrigin: 'center', boxShadow: shadow ? SHADOW : undefined, background: C.white, ...style}}>
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', clipPath: clip}}>{children}</div>
  </div>
);

// chip de texto con fondo de color (se escalona y se inclina como en un collage)
export const Chip: React.FC<{x: number; y: number; text: string; size: number; bg: string; color?: string; weight?: number; rot?: number; p: number; out?: number; from?: 'left' | 'right'}> = ({
  x, y, text, size, bg, color = C.ink, weight = 900, rot = 0, p, out = 0, from = 'left',
}) => {
  if (p <= 0 || out >= 1) return null;
  const dir = from === 'left' ? -1 : 1;
  const tx = (1 - p) * 520 * dir + out * 700 * dir;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translateX(${tx}px) rotate(${rot * (0.4 + 0.6 * p)}deg)`, transformOrigin: 'left center', opacity: Math.min(1, p * 3) * (1 - out)}}>
      <div style={{background: bg, color, fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.05, letterSpacing: '-0.025em', padding: `${size * 0.16}px ${size * 0.3}px ${size * 0.22}px`, whiteSpace: 'pre', boxShadow: '0 14px 30px rgba(0,0,0,0.14)'}}>
        {text}
      </div>
    </div>
  );
};

// información: 10 barras, una de color
export const TenBars: React.FC<{x: number; y: number; p: number; boost: number}> = ({x, y, p, boost}) => (
  <div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'flex-end', gap: 12}}>
    {Array.from({length: 10}, (_, i) => {
      const k = Math.min(1, Math.max(0, p * 12 - i * 0.9) );
      const first = i === 0;
      const h = (first ? 118 + 110 * boost : 118) * k;
      return <div key={i} style={{width: 44, height: h, background: first ? C.orange : C.white, boxShadow: '0 10px 22px rgba(0,0,0,0.16)'}} />;
    })}
  </div>
);
