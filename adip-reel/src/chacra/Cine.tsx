import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Img, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {clamp, easeIO, easeOut, lerp, prog} from '../ui';

// Equipo ADIP · rumbo "Cine": la foto manda, franja negra, texto blanco, acento naranja (CET).
const K = {violet: '#8A00B7', pink: '#ED2995', orange: '#FE801C', yellow: '#FFCB01', green: '#94C920', ink: '#000000', white: '#FFFFFF'};
const FONT = "'Montserrat', sans-serif";
export const FPS = 30;
const W = 1080;
const H = 1920;
const BAND = 1250; // top of the black band
const GRAD = `linear-gradient(90deg, ${K.violet} 0%, ${K.pink} 30%, ${K.orange} 55%, ${K.yellow} 78%, ${K.green} 100%)`;
const TRAZO = 'M10 96 C 70 98, 120 92, 156 74 C 196 54, 204 16, 178 12 C 150 8, 146 54, 182 76 C 220 98, 300 98, 390 92';

const fontCss = [300, 400, 500, 600, 700, 800, 900]
  .map((w) => `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}') format('woff2');}`)
  .join('\n');

// ───────────────────────── edit list
type Shot = {n?: string; seq?: string[]; each?: number; loop?: boolean; pos?: string | string[]; dur: number; zoom?: [number, number]};
type Chapter = {label: string; title: [string, string]; size?: number; shots: Shot[]; map?: boolean};

const CH: Chapter[] = [
  {
    label: 'CET · Salida educativa',
    title: ['Un día', 'en la chacra.'],
    size: 92,
    shots: [{seq: ['31', '30', '29', '28'], each: 0.3, loop: true, pos: ['50% 42%', '55% 40%', '50% 36%', '35% 28%'], dur: 3.2, zoom: [1.12, 1.2]}],
  },
  {label: 'El viaje', title: ['De Palermo', 'a San Isidro.'], shots: [{dur: 4.0}], map: true},
  {
    label: 'El viaje',
    title: ['Todos', 'arriba.'],
    shots: [
      {seq: ['61', '62', '63', '62'], each: 0.32, loop: true, pos: '40% 30%', dur: 2.0},
      {n: '66', pos: '45% 32%', dur: 1.4},
    ],
  },
  {
    label: 'La llegada',
    title: ['Chacra Educativa', 'San Isidro Labrador.'],
    size: 62,
    shots: [
      {n: 'sign', pos: '50% 40%', dur: 1.0, zoom: [1.0, 1.06]},
      {seq: ['27', '26', '25'], each: 0.42, pos: ['50% 45%', '50% 42%', '45% 35%'], dur: 2.4},
    ],
  },
  {
    label: '01 · La laguna',
    title: ['Patos y gansos', 'en la laguna.'],
    shots: [
      {seq: ['03', '04'], each: 0.42, loop: true, pos: '50% 40%', dur: 1.7},
      {n: '01', pos: '55% 30%', dur: 0.8},
      {n: '37', pos: '45% 35%', dur: 0.9},
    ],
  },
  {
    label: '02 · El corral',
    title: ['Cabras y una', 'llama curiosa.'],
    shots: [
      {n: '29', pos: '50% 34%', dur: 1.1, zoom: [1.25, 1.4]},
      {n: '38', pos: '55% 38%', dur: 1.0},
      {n: '32', pos: '55% 30%', dur: 1.0},
    ],
  },
  {label: '03 · El burro', title: ['Cara a cara', 'con el burro.'], shots: [{seq: ['33', '34', '35', '34'], each: 0.3, loop: true, pos: '50% 58%', dur: 3.0, zoom: [1.0, 1.1]}]},
  {
    label: '04 · Las ovejas',
    title: ['Las ovejas,', 'bien de cerca.'],
    shots: [
      {n: '44', pos: '40% 30%', dur: 1.6},
      {n: '43', pos: '45% 32%', dur: 1.4},
    ],
  },
  {
    label: '05 · El picnic',
    title: ['Picnic', 'a la sombra.'],
    shots: [
      {n: '15', pos: '50% 62%', dur: 0.9},
      {n: '10', pos: '50% 42%', dur: 0.8},
      {n: '12', pos: '50% 28%', dur: 0.8},
      {n: '23', pos: '50% 38%', dur: 0.8},
    ],
  },
  {
    label: '06 · El pan',
    title: ['Manos', 'en la masa.'],
    shots: [
      {n: '50', pos: '50% 62%', dur: 0.9},
      {n: '53', pos: '55% 40%', dur: 0.8},
      {n: '47', pos: '50% 22%', dur: 0.8},
      {n: '52', pos: '45% 38%', dur: 0.8},
    ],
  },
  {
    label: 'CET · Equipo ADIP',
    title: ['Aprender jugando,', 'al aire libre.'],
    size: 70,
    shots: [
      {n: '36', pos: '45% 35%', dur: 0.6},
      {n: '17', pos: '50% 40%', dur: 0.6},
      {n: '62', pos: '40% 30%', dur: 0.6},
      {n: '26', pos: '50% 42%', dur: 0.6},
      {n: '66', pos: '45% 32%', dur: 1.0},
    ],
  },
];

const OPEN = 1.5;
const OUTRO = 3.8;
type Placed = Shot & {at: number; ci: number; first: boolean; k: number};
const PLACED: Placed[] = [];
const CH_AT: number[] = [];
let cursor = OPEN;
let k = 0;
CH.forEach((c, ci) => {
  CH_AT.push(cursor);
  c.shots.forEach((s, i) => {
    PLACED.push({...s, at: cursor, ci, first: i === 0, k: k++});
    cursor += s.dur;
  });
});
const BODY_END = cursor;
export const TOTAL = BODY_END + OUTRO;

// ───────────────────────── pieces
const Photo: React.FC<{s: Placed; t: number}> = ({s, t}) => {
  const lt = t - s.at;
  if (lt < 0 || lt > s.dur + 0.3) return null;
  const names = s.seq ?? [s.n as string];
  let i = 0;
  if (s.seq) {
    const f = Math.floor(lt / (s.each ?? 0.3));
    i = s.loop ? f % names.length : Math.min(f, names.length - 1);
  }
  const [z0, z1] = s.zoom ?? [1.04, 1.12];
  const u = clamp(lt / s.dur, 0, 1);
  const z = s.k % 2 ? lerp(z1, z0, u) : lerp(z0, z1, u);
  const dx = (s.k % 2 ? 1 : -1) * lerp(-10, 10, u);
  const fade = s.first ? prog(lt, 0, 0.3, easeIO) : 1;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: BAND + 2, overflow: 'hidden', opacity: fade}}>
      {names.map((n, j) => (
        <Img
          key={n + j}
          src={staticFile(`chacra/${n}.jpg`)}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: Array.isArray(s.pos) ? s.pos[j] : s.pos ?? '50% 40%',
            transform: `translateX(${dx}px) scale(${z})`,
            opacity: j === i ? 1 : 0,
          }}
        />
      ))}
    </div>
  );
};

const Rise: React.FC<{t: number; at: number; out?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({t, at, out, children, style}) => {
  const p = prog(t, at, 0.55, easeOut);
  const q = out !== undefined ? prog(t, out - 0.22, 0.22, easeIO) : 0;
  return (
    <div style={{overflow: 'hidden', padding: '0.08em 0.1em 0.22em', margin: '-0.08em -0.1em -0.22em'}}>
      <div style={{transform: `translateY(${(1 - p) * 115 - q * 115}%)`, ...style}}>{children}</div>
    </div>
  );
};

const BandText: React.FC<{c: Chapter; t: number; at: number; end: number; same?: boolean}> = ({c, t, at, end, same}) => {
  if (t < at - 0.05 || t > end + 0.05) return null;
  const size = c.size ?? 78;
  return (
    <div style={{position: 'absolute', left: 80, top: BAND + 54, fontFamily: FONT, color: K.white}}>
      <Rise t={t} at={at + 0.05} out={end} style={{fontWeight: 800, fontSize: 32, letterSpacing: '0.14em', textTransform: 'uppercase', color: K.orange, marginBottom: 18}}>
        {c.label}
      </Rise>
      <Rise t={t} at={at + 0.14} out={end} style={{fontWeight: 300, fontSize: size, lineHeight: 1.05}}>
        {c.title[0]}
      </Rise>
      <Rise t={t} at={at + 0.24} out={end} style={{fontWeight: 900, fontSize: size, lineHeight: 1.05}}>
        {c.title[1]}
      </Rise>
    </div>
  );
};

// ───────────────────────── route map (dark, abstract, north up)
const ROUTE = 'M 840 2010 C 800 1880, 880 1760, 800 1640 C 700 1500, 760 1380, 650 1260 C 540 1140, 600 1000, 500 880 C 420 790, 470 640, 400 520';
const SEGS: number[][] = [
  [840, 2010, 800, 1880, 880, 1760, 800, 1640],
  [800, 1640, 700, 1500, 760, 1380, 650, 1260],
  [650, 1260, 540, 1140, 600, 1000, 500, 880],
  [500, 880, 420, 790, 470, 640, 400, 520],
];
const PTS: [number, number][] = [];
for (const s of SEGS)
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const a = (1 - u) ** 3,
      b = 3 * (1 - u) ** 2 * u,
      c = 3 * (1 - u) * u * u,
      d = u ** 3;
    PTS.push([a * s[0] + b * s[2] + c * s[4] + d * s[6], a * s[1] + b * s[3] + c * s[5] + d * s[7]]);
  }
const routeAt = (p: number): [number, number] => {
  const f = clamp(p, 0, 1) * (PTS.length - 1);
  const i = Math.floor(f);
  const a = PTS[i];
  const b = PTS[Math.min(i + 1, PTS.length - 1)];
  return [lerp(a[0], b[0], f - i), lerp(a[1], b[1], f - i)];
};
const MapLabel: React.FC<{x: number; y: number; children: React.ReactNode; rot?: number; size?: number; color?: string; o?: number}> = ({x, y, children, rot = 0, size = 34, color = K.white, o = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, fontFamily: FONT, fontWeight: 700, fontSize: size, letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap', color, opacity: o, transform: `rotate(${rot}deg)`, transformOrigin: 'left center'}}>
    {children}
  </div>
);

const RouteMap: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  if (t < 0 || t > dur + 0.3) return null;
  const draw = prog(t, 0.4, 2.3, easeIO);
  const [bx, by] = routeAt(draw);
  const out = prog(t, 2.6, 1.0, easeIO);
  const z = lerp(lerp(1.35, 1.0, prog(t, 0.3, 2.4, easeIO)), 0.6, out);
  const cx = lerp(bx, 600, out);
  const cy = lerp(by, 1265, out);
  const pin = prog(t, 2.7, 0.5, easeOut);
  const grid: React.ReactNode[] = [];
  for (let i = -6; i < 16; i++) {
    grid.push(<line key={`a${i}`} x1={-400 + i * 190} y1={2800} x2={600 + i * 190} y2={-300} stroke="#1E1E1E" strokeWidth={i % 3 === 0 ? 10 : 4} />);
    grid.push(<line key={`b${i}`} x1={-600} y1={-200 + i * 210} x2={1800} y2={600 + i * 210} stroke="#1E1E1E" strokeWidth={i % 4 === 0 ? 10 : 4} />);
  }
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: BAND + 2, overflow: 'hidden', background: '#0B0B0B', opacity: prog(t, 0, 0.3, easeIO)}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1400, height: 2400, transformOrigin: '0 0', transform: `translate(${W / 2 - cx * z}px, ${BAND * 0.5 - cy * z}px) scale(${z})`}}>
        <svg viewBox="0 0 1400 2400" width={1400} height={2400} style={{position: 'absolute', overflow: 'visible'}}>
          {grid}
          <path d="M 1150 2900 C 1120 2400, 1080 2100, 1010 1800 C 930 1480, 800 1100, 700 760 C 620 480, 560 200, 520 -400 L 2600 -400 L 2600 2900 Z" fill="#161616" />
          <path d="M 1150 2900 C 1120 2400, 1080 2100, 1010 1800 C 930 1480, 800 1100, 700 760 C 620 480, 560 200, 520 -400" fill="none" stroke="#3A3A3A" strokeWidth={4} />
          <path d="M -300 1180 C 200 1330, 600 1420, 960 1560" fill="none" stroke="#5A5A5A" strokeWidth={6} strokeDasharray="4 22" strokeLinecap="round" />
          <path d={ROUTE} fill="none" stroke={K.orange} strokeWidth={22} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        </svg>
        <MapLabel x={1010} y={1500} rot={-74} size={34} color="#8A8A8A">
          Río de la Plata
        </MapLabel>
        <MapLabel x={60} y={1215} rot={17} size={28} color="#8A8A8A">
          Av. General Paz
        </MapLabel>
        <div style={{position: 'absolute', left: 840 - 22, top: 2010 - 22, width: 44, height: 44, borderRadius: '50%', background: K.white}} />
        <MapLabel x={420} y={1990} size={44}>
          CET · Palermo
        </MapLabel>
        <div style={{position: 'absolute', left: 400 - 70, top: 520 - 70, width: 140, height: 140, borderRadius: '50%', background: K.orange, opacity: 0.3 * pin, transform: `scale(${1 + 0.25 * Math.sin(t * 5)})`}} />
        <div style={{position: 'absolute', left: 400 - 30, top: 520 - 30, width: 60, height: 60, borderRadius: '50%', background: K.orange, transform: `scale(${pin})`}} />
        <MapLabel x={480} y={492} size={48} color={K.orange} o={pin}>
          San Isidro
        </MapLabel>
        {draw > 0 && draw < 1 && <div style={{position: 'absolute', left: bx - 24, top: by - 24, width: 48, height: 48, borderRadius: '50%', background: K.white}} />}
      </div>
    </div>
  );
};

// ───────────────────────── open / outro
const Open: React.FC<{t: number}> = ({t}) => {
  if (t > OPEN + 0.3) return null;
  const o = prog(t, 0.15, 0.5, easeOut) * (1 - prog(t, OPEN - 0.3, 0.3, easeIO));
  return (
    <AbsoluteFill style={{background: K.ink, alignItems: 'center', justifyContent: 'center', opacity: 1 - prog(t, OPEN, 0.3, easeIO)}}>
      <Img src={staticFile('brand/logo-white.png')} style={{width: 380, opacity: o, transform: `scale(${lerp(0.96, 1.02, clamp(t / OPEN, 0, 1))})`}} />
    </AbsoluteFill>
  );
};

const Outro: React.FC<{t: number}> = ({t}) => {
  if (t < -0.05) return null;
  return (
    <AbsoluteFill style={{background: K.ink, opacity: prog(t, 0, 0.35, easeIO)}}>
      <Img src={staticFile('brand/logo-white.png')} style={{position: 'absolute', width: 340, left: (W - 340) / 2, top: 400, opacity: prog(t, 0.4, 0.6, easeOut)}} />
      <div style={{position: 'absolute', left: 0, width: W, top: 720, textAlign: 'center', fontFamily: FONT, color: K.white, lineHeight: 1.06}}>
        <Rise t={t} at={0.6} style={{fontWeight: 300, fontSize: 84}}>
          Acompañar
        </Rise>
        <Rise t={t} at={0.72} style={{fontWeight: 900, fontSize: 128}}>
          con amor
        </Rise>
        <Rise t={t} at={0.84} style={{fontWeight: 300, fontSize: 84}}>
          hace la diferencia.
        </Rise>
      </div>
      <svg viewBox="0 0 400 120" style={{position: 'absolute', left: 260, top: 1070, width: 560, overflow: 'visible'}}>
        <defs>
          <linearGradient id="cg" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={K.violet} />
            <stop offset="0.3" stopColor={K.pink} />
            <stop offset="0.55" stopColor={K.orange} />
            <stop offset="0.78" stopColor={K.yellow} />
            <stop offset="1" stopColor={K.green} />
          </linearGradient>
        </defs>
        <path d={TRAZO} fill="none" stroke="url(#cg)" strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - prog(t, 1.2, 0.9, easeIO)} />
      </svg>
      <div style={{position: 'absolute', left: 0, width: W, top: 1340, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 36, letterSpacing: '0.08em', color: K.white, opacity: prog(t, 1.7, 0.5, easeOut)}}>
        @equipoadip
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── composition
export const Cine: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const go = () => continueRender(h);
    Promise.all([300, 600, 700, 800, 900].map((w) => document.fonts.load(`${w} 40px Montserrat`))).then(go, go);
  }, [h]);
  return (
    <AbsoluteFill style={{background: K.ink}}>
      <style>{fontCss}</style>
      {PLACED.map((s) => (CH[s.ci].map ? <RouteMap key={s.k} t={t - s.at} dur={s.dur} /> : <Photo key={s.k} s={s} t={t} />))}
      <div style={{position: 'absolute', left: 0, top: BAND, width: W, height: H - BAND, background: K.ink}} />
      {CH.map((c, i) => (
        <BandText key={i} c={c} t={t} at={CH_AT[i]} end={i + 1 < CH.length ? CH_AT[i + 1] : BODY_END} />
      ))}
      <Outro t={t - BODY_END} />
      <Open t={t} />
      {/* barra de avance en degradé ADIP */}
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 12, overflow: 'hidden'}}>
        <div style={{width: W, height: 12, background: GRAD, clipPath: `inset(0 ${(1 - clamp(t / TOTAL, 0, 1)) * 100}% 0 0)`}} />
      </div>
    </AbsoluteFill>
  );
};
