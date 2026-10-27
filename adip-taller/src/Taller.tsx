import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CHUNKS, T} from './data';
import {C, FONT, GRADIENT, VIDEO_END, clamp, easeIO, easeIn, easeOut, lerp, prog} from './ui';

const fontCss = [500, 600, 700, 800, 900]
  .map((w) => `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}') format('woff2');}`)
  .join('\n');

// ---------- primitivas ----------
/** Entrada por máscara con desplazamiento corto; sale hacia arriba. */
const Mask: React.FC<{t: number; t0: number; t1?: number; children: React.ReactNode; style?: React.CSSProperties; dx?: number}> = ({t, t0, t1, children, style, dx = -34}) => {
  const p = prog(t, t0, 0.65, easeOut);
  const q = t1 ? prog(t, t1, 0.38, easeIn) : 0;
  if (p <= 0 || q >= 1) return null;
  return (
    <span style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0.12em 0.1em 0.28em', margin: '-0.12em -0.1em -0.28em'}}>
      <span style={{display: 'inline-block', transform: `translate(${(1 - p) * dx}px, ${(1 - p) * 105 - q * 105}%)`, ...style}}>{children}</span>
    </span>
  );
};

/** Banda rectangular que se abre desde la izquierda y contiene texto. */
const Band: React.FC<{t: number; t0: number; t1?: number; color: string; textColor?: string; size: number; weight?: number; padX?: number; h: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  t, t0, t1, color, textColor = C.black, size, weight = 800, padX = 30, h, children, style,
}) => {
  const p = prog(t, t0, 0.5, easeIO);
  const q = t1 ? prog(t, t1, 0.35, easeIn) : 0;
  if (p <= 0 || q >= 1) return null;
  return (
    <span style={{position: 'relative', display: 'inline-flex', alignItems: 'center', height: h, padding: `0 ${padX}px`, fontSize: size, fontWeight: weight, color: textColor, lineHeight: 1, ...style}}>
      <span style={{position: 'absolute', inset: 0, background: color, transformOrigin: q > 0 ? '100% 50%' : '0% 50%', transform: `scaleX(${q > 0 ? 1 - q : p})`}} />
      <span style={{position: 'relative'}}>
        <Mask t={t} t0={t0 + 0.08} t1={t1}>{children}</Mask>
      </span>
    </span>
  );
};

/** El trazo de la marca (línea con bucle) que se dibuja. */
const Trazo: React.FC<{t: number; t0: number; dur?: number; t1?: number; color?: string; gradient?: boolean; width: number; style?: React.CSSProperties}> = ({t, t0, dur = 0.8, t1, color = C.pink, gradient, width, style}) => {
  const p = prog(t, t0, dur, easeIO);
  const q = t1 ? prog(t, t1, 0.3, easeIn) : 0;
  if (p <= 0 || q >= 1) return null;
  const id = `g${Math.round(t0 * 100)}`;
  return (
    <svg viewBox="0 0 400 120" width={width} height={(width * 120) / 400} style={{position: 'absolute', overflow: 'visible', opacity: 1 - q, ...style}}>
      {gradient && (
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="400" y2="0">
            <stop offset="0" stopColor={C.violet} />
            <stop offset="0.3" stopColor={C.pink} />
            <stop offset="0.55" stopColor={C.orange} />
            <stop offset="0.78" stopColor={C.yellow} />
            <stop offset="1" stopColor={C.green} />
          </linearGradient>
        </defs>
      )}
      <path d="M10 96 C 70 98, 120 92, 156 74 C 196 54, 204 16, 178 12 C 150 8, 146 54, 182 76 C 220 98, 300 98, 390 92" fill="none" stroke={gradient ? `url(#${id})` : color} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1.01`} />
    </svg>
  );
};

const abs = (left: number, top: number, extra: React.CSSProperties = {}): React.CSSProperties => ({position: 'absolute', left, top, fontFamily: FONT, whiteSpace: 'nowrap', color: C.black, ...extra});

// ---------- fondo (tintes) ----------
const BgWipe: React.FC<{t: number; t0: number; t1: number; color: string; instant?: boolean}> = ({t, t0, t1, color, instant}) => {
  const inP = instant ? (t >= t0 ? 1 : 0) : prog(t, t0, 0.5, easeIO);
  const outP = prog(t, t1, 0.5, easeIO);
  if (inP <= 0 || outP >= 1) return null;
  return <AbsoluteFill style={{background: color, clipPath: `inset(0 ${(1 - inP) * 100}% 0 ${outP * 100}%)`}} />;
};

// ---------- ventana de video ----------
type G = {x: number; y: number; w: number; h: number; s: number};
const MAIN: G = {x: 60, y: 510, w: 960, h: 910, s: 0.889};
const SPLIT: G = {x: 380, y: 790, w: 640, h: 650, s: 0.593};
const STACK: G = {x: 340, y: 800, w: 680, h: 640, s: 0.63};
const TRANS: {t0: number; t1: number; from: G; to: G}[] = [
  {t0: T.switch2, t1: T.switch2, from: MAIN, to: SPLIT},
  {t0: 13.8, t1: 14.35, from: SPLIT, to: MAIN},
  {t0: 17.6, t1: 18.2, from: MAIN, to: STACK},
  {t0: 20.8, t1: 21.4, from: STACK, to: MAIN},
];
const geom = (t: number): G => {
  let g = MAIN;
  for (const tr of TRANS) {
    if (t >= tr.t1) g = tr.to;
    else if (t > tr.t0) {
      const k = prog(t, tr.t0, tr.t1 - tr.t0, easeIO);
      g = {x: lerp(tr.from.x, tr.to.x, k), y: lerp(tr.from.y, tr.to.y, k), w: lerp(tr.from.w, tr.to.w, k), h: lerp(tr.from.h, tr.to.h, k), s: lerp(tr.from.s, tr.to.s, k)};
    }
  }
  return g;
};

const VideoWindow: React.FC<{t: number}> = ({t}) => {
  const g = geom(t);
  const left = clamp(g.w / 2 - 540 * g.s, g.w - 1080 * g.s, 0);
  const top = clamp(g.h / 2 - 835 * g.s, g.h - 1908 * g.s, 0);
  return (
    <div style={{position: 'absolute', left: g.x, top: g.y, width: g.w, height: g.h, borderRadius: 32, overflow: 'hidden', background: C.gray}}>
      <div style={{position: 'absolute', left, top, width: 1080, height: 1908, transformOrigin: '0 0', transform: `scale(${g.s})`}}>
        <OffthreadVideo src={staticFile('base.mp4')} muted transparent style={{width: 1080, height: 1908}} />
      </div>
    </div>
  );
};

// ---------- marca ----------
const PaletteBar: React.FC<{t: number; t0: number; y?: number; h?: number}> = ({t, t0, y = 0, h = 16}) => {
  const cols = [C.violet, C.pink, C.orange, C.yellow, C.green, C.black];
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: 1080, height: h, display: 'flex'}}>
      {cols.map((c, i) => (
        <div key={i} style={{flex: 1, background: c, transformOrigin: '0 50%', transform: `scaleX(${prog(t, t0 + i * 0.07, 0.55, easeIO)})`}} />
      ))}
    </div>
  );
};

// ---------- bandas de transición ----------
const BandWipe: React.FC<{t: number; t0: number; tReveal: number; y0: number; y1: number; colors: string[]}> = ({t, t0, tReveal, y0, y1, colors}) => {
  const n = colors.length;
  return (
    <>
      {colors.map((col, i) => {
        const e = prog(t, t0 + i * 0.08, 0.45, easeIO);
        const r = prog(t, tReveal + (n - 1 - i) * 0.08, 0.42, easeIO);
        if (e <= 0 || r >= 1) return null;
        const top = lerp(y0, 0, e) + r * (1920 - lerp(y0, 0, e));
        const bottom = lerp(y1, 1920, e);
        return <div key={i} style={{position: 'absolute', left: 0, width: 1080, top, height: Math.max(0, bottom - top), background: col}} />;
      })}
    </>
  );
};

// ---------- subtítulos ----------
const Captions: React.FC<{t: number}> = ({t}) => {
  const c = CHUNKS.find((k) => t >= k.s - 0.04 && t < k.e);
  if (!c || t > VIDEO_END - 0.2) return null;
  const inP = prog(t, c.s - 0.04, 0.2, easeOut);
  const outP = 1 - prog(t, c.e - 0.1, 0.1, (x) => x);
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 1452, textAlign: 'center', fontFamily: FONT, fontSize: 52, lineHeight: 1.22, fontWeight: 700, color: C.black, opacity: Math.min(inP, outP), transform: `translateY(${(1 - inP) * 14}px)`}}>
      {c.parts.map(([txt, key], i) => (
        <span key={i} style={key ? {color: C.violet, fontWeight: 800} : undefined}>{txt}</span>
      ))}
    </div>
  );
};

// ---------- secuencias ----------
const Opening: React.FC<{t: number}> = ({t}) => {
  if (t > T.titleOut + 0.5) return null;
  const o = T.titleOut;
  return (
    <>
      <div style={abs(80, 256, {fontSize: 84, lineHeight: 1.04, fontWeight: 600, letterSpacing: '-0.01em'})}>
        <Mask t={t} t0={T.title} t1={o}>El arte de</Mask>
        <br />
        <Mask t={t} t0={T.title + 0.14} t1={o + 0.06}>
          <span style={{fontWeight: 900}}>poner </span>
          <span style={{fontWeight: 900, color: C.violet}}>límites</span>
        </Mask>
      </div>
      <Trazo t={t} t0={T.title + 0.7} dur={0.9} t1={o} gradient width={250} style={{left: 440, top: 424}} />
    </>
  );
};

const DateBlock: React.FC<{t: number}> = ({t}) => {
  if (t < T.d24 - 0.1 || t >= T.switch2 + 0.02) return null;
  return (
    <>
      <div style={abs(80, 262, {fontSize: 92, lineHeight: 1.04, fontWeight: 700})}>
        <Mask t={t} t0={T.d24 - 0.12}><span style={{fontWeight: 900, color: C.violet}}>24</span></Mask>{' '}
        <Mask t={t} t0={T.dDe - 0.12}>de noviembre</Mask>
      </div>
      <div style={abs(80, 376, {display: 'flex', gap: 14})}>
        <Band t={t} t0={T.d19 - 0.15} color={C.yellow} size={50} h={78}>19 h</Band>
        <Band t={t} t0={T.dOnline - 0.15} color={C.green} size={50} h={78}>online</Band>
      </div>
    </>
  );
};

const Split: React.FC<{t: number}> = ({t}) => {
  if (t < T.switch2 || t >= T.sOut + 0.6) return null;
  const o = T.sOut;
  return (
    <>
      <div style={abs(80, 300, {display: 'flex'})}>
        <Band t={t} t0={T.tag - 0.2} t1={o - 0.2} color={C.white} size={30} weight={800} h={58} padX={26} style={{letterSpacing: '0.06em'}}>TALLER · ONLINE</Band>
      </div>
      <div style={abs(80, 390, {fontSize: 118, lineHeight: 1.04, fontWeight: 800, letterSpacing: '-0.015em'})}>
        <Mask t={t} t0={T.serPadres - 0.12} t1={o}>Ser padres,</Mask>
        <br />
        <Mask t={t} t0={T.noPares - 0.15} t1={o + 0.05}><span style={{fontWeight: 900, color: C.violet}}>no pares</span></Mask>
      </div>
      <Trazo t={t} t0={T.noPares + 0.1} dur={0.85} t1={o} color={C.pink} width={360} style={{left: 76, top: 640}} />
      <div style={abs(80, 800, {width: 230 * prog(t, T.arte - 0.2, 0.5, easeIO) * (t > o ? 1 - prog(t, o, 0.3, easeIn) : 1), height: 5, background: C.black, whiteSpace: 'normal'})} />
      <div style={abs(80, 826, {fontSize: 52, lineHeight: 1.1, fontWeight: 700})}>
        <Mask t={t} t0={T.arte - 0.15} t1={o}>el arte</Mask><br />
        <Mask t={t} t0={T.de - 0.1} t1={o + 0.05}>de poner</Mask><br />
        <Mask t={t} t0={T.limites - 0.2} t1={o + 0.1}><span style={{fontWeight: 900, color: C.violet}}>límites</span></Mask>
      </div>
    </>
  );
};

const Values: React.FC<{t: number}> = ({t}) => {
  if (t < T.amor - 0.3 || t >= T.cOut + 0.5) return null;
  const o = T.cOut;
  const rows: [string, number, string, string][] = [
    ['AMOR', T.amor, C.pink, C.white],
    ['CUIDADO', T.cuidado, C.orange, C.black],
    ['PROTECCIÓN', T.proteccion, C.green, C.black],
  ];
  return (
    <div style={{position: 'absolute', left: 0, top: 290, fontFamily: FONT}}>
      {rows.map(([txt, t0, col, tc], i) => (
        <div key={txt} style={{height: 124, marginBottom: 16, paddingLeft: 80}}>
          <Band t={t} t0={t0 - 0.2} t1={o + i * 0.06} color={col} textColor={tc} size={92} weight={900} h={124} padX={36}>{txt}</Band>
        </div>
      ))}
    </div>
  );
};

const Vinculo: React.FC<{t: number}> = ({t}) => {
  if (t < T.vinculo - 0.2 || t >= T.wipeEnd + 0.7) return null;
  return (
    <>
      <div style={abs(80, 256, {fontSize: 84, lineHeight: 1.04, fontWeight: 600})}>
        <Mask t={t} t0={T.vinculo - 0.1}>vínculo</Mask><br />
        <Mask t={t} t0={T.saludable - 0.1}><span style={{fontWeight: 900}}>saludable</span></Mask>
      </div>
      <Trazo t={t} t0={T.saludable + 0.2} dur={0.95} gradient width={250} style={{left: 360, top: 424}} />
    </>
  );
};

const Closing: React.FC<{t: number}> = ({t}) => {
  const a = T.revealEnd + 0.25;
  if (t < a - 0.1) return null;
  const k = (i: number) => a + i * 0.12;
  return (
    <>
      <PaletteBar t={t} t0={a - 0.05} h={16} />
      <Img src={staticFile('brand/logo-color.png')} style={{position: 'absolute', left: 270, top: 330, width: 540, opacity: prog(t, a, 0.5, easeOut), transform: `translateY(${(1 - prog(t, a, 0.6, easeOut)) * 24}px)`}} />
      <div style={abs(80, 670, {fontSize: 30, fontWeight: 800, letterSpacing: '0.06em'})}>
        <Mask t={t} t0={k(1)}><span style={{background: C.tintPink, padding: '10px 22px', display: 'inline-block'}}>TALLER ONLINE PARA FAMILIAS</span></Mask>
      </div>
      <div style={abs(80, 760, {fontSize: 112, lineHeight: 1.03, fontWeight: 800, letterSpacing: '-0.015em'})}>
        <Mask t={t} t0={k(2)}>Ser padres,</Mask><br />
        <Mask t={t} t0={k(3)}><span style={{fontWeight: 900, color: C.violet}}>no pares</span></Mask>
      </div>
      <Trazo t={t} t0={k(4) + 0.1} dur={0.8} gradient width={330} style={{left: 76, top: 1002}} />
      <div style={abs(80, 1120, {fontSize: 52, fontWeight: 600})}>
        <Mask t={t} t0={k(5)}>el arte de poner límites</Mask>
      </div>
      <div style={abs(80, 1220, {display: 'flex', gap: 14})}>
        <Band t={t} t0={k(6)} color={C.yellow} size={42} h={74} padX={26} weight={800}>24 de noviembre</Band>
        <Band t={t} t0={k(6) + 0.1} color={C.orange} size={42} h={74} padX={26} weight={800}>19 h</Band>
        <Band t={t} t0={k(6) + 0.2} color={C.green} size={42} h={74} padX={26} weight={800}>online</Band>
      </div>
      <div style={abs(80, 1332, {fontSize: 38, fontWeight: 500, color: C.logoGray})}>
        <Mask t={t} t0={k(7)}>Con Mariela Holcman</Mask>
      </div>
      <div style={abs(80, 1430, {})}>
        <span style={{display: 'inline-block', background: C.black, color: C.white, fontSize: 44, fontWeight: 700, padding: '24px 48px', borderRadius: 22, clipPath: `inset(0 ${(1 - prog(t, k(8), 0.5, easeIO)) * 100}% 0 0)`}}>Comentá LÍMITES</span>
      </div>
    </>
  );
};

export const Taller: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const live = t < T.revealEnd + 0.1; // el video sólo se ve hasta la banda final
  return (
    <AbsoluteFill style={{background: C.white, fontFamily: FONT}}>
      <style>{fontCss}</style>
      <BgWipe t={t} t0={T.switch2} t1={T.sOut} color={C.tintYellow} instant />
      <BgWipe t={t} t0={17.9} t1={20.95} color={C.tintPink} />
      {t < T.wipeEnd + 0.8 && (
        <>
          <PaletteBar t={t} t0={0.02} />
          <Img src={staticFile('brand/logo-color.png')} style={{position: 'absolute', left: 440, top: 150, width: 200}} />
        </>
      )}
      {live && <VideoWindow t={t} />}
      <Opening t={t} />
      <DateBlock t={t} />
      <Split t={t} />
      <Values t={t} />
      <Vinculo t={t} />
      <Captions t={t} />
      <BandWipe t={t} t0={T.wipe2} tReveal={T.reveal2} y0={376} y1={454} colors={[C.green, C.orange]} />
      <BandWipe t={t} t0={T.wipeEnd} tReveal={T.revealEnd} y0={372} y1={388} colors={[C.pink, C.orange, C.yellow]} />
      <Closing t={t} />
    </AbsoluteFill>
  );
};
