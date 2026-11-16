import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, Img, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {clamp, easeIO, easeOut, lerp, prog} from '../ui';

// Equipo ADIP · institucional: blanco, logo color, barra de paleta, trazo en degradé.
// Tono: tierno, emotivo, divertido. Relato en primera persona.
const K = {violet: '#8A00B7', pink: '#ED2995', orange: '#FE801C', yellow: '#FFCB01', green: '#94C920', gray: '#EFEFEF', ink: '#000000', white: '#FFFFFF'};
const FONT = "'Montserrat', sans-serif";
export const FPS = 30;
const W = 1080;
const H = 1920;
const TRAZO = 'M10 96 C 70 98, 120 92, 156 74 C 196 54, 204 16, 178 12 C 150 8, 146 54, 182 76 C 220 98, 300 98, 390 92';
const back = Easing.out(Easing.back(1.4));
const FX = 90; // photo frame box
const FY = 410;
const FS = 900;

const fontCss = [300, 400, 500, 600, 700, 800, 900]
  .map((w) => `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}') format('woff2');}`)
  .join('\n');

// ───────────────────────── story
type Shot = {n?: string; seq?: string[]; each?: number; loop?: boolean; pos?: string | string[]; dur: number; zoom?: [number, number]};
type Seg = string | {h: string};
type Beat = {shape: 'arch' | 'circle' | 'round'; color: string; fg?: string; lines: Seg[][]; shots: Shot[]; tag?: string; map?: boolean};

const BEATS: Beat[] = [
  {shape: 'round', color: K.orange, lines: [['Salimos de Palermo'], ['rumbo a ', {h: 'San Isidro.'}]], shots: [{dur: 4.2}], map: true},
  {shape: 'round', color: K.yellow, lines: [['Viajamos'], ['todos ', {h: 'juntos.'}]], shots: [{n: 'g64', pos: '50% 38%', dur: 1.8, zoom: [1.0, 1.06]}, {seq: ['61', '62', '63', '62'], each: 0.3, loop: true, pos: '40% 28%', dur: 1.2}]},
  {
    shape: 'round',
    color: K.green,
    lines: [['Y llegamos'], ['a la ', {h: 'chacra.'}]],
    tag: 'Chacra Educativa San Isidro Labrador',
    shots: [{seq: ['27', '26', '25'], each: 0.6, pos: ['50% 45%', '50% 42%', '45% 32%'], dur: 3.0}],
  },
  {
    shape: 'circle',
    color: K.orange,
    lines: [['Les dimos de comer'], ['a los ', {h: 'patos.'}]],
    shots: [
      {seq: ['03', '04'], each: 0.45, loop: true, pos: '50% 38%', dur: 1.8},
      {n: '01', pos: '55% 28%', dur: 1.2},
    ],
  },
  {
    shape: 'arch',
    color: K.pink,
    lines: [['Corrimos entre cabras'], ['y una llama ', {h: 'curiosa.'}]],
    shots: [{seq: ['31', '30', '29', '28'], each: 0.3, loop: true, pos: ['50% 42%', '55% 40%', '50% 36%', '38% 28%'], dur: 3.0, zoom: [1.1, 1.18]}],
  },
  {shape: 'circle', color: K.yellow, lines: [['Nos reímos'], ['con el ', {h: 'burro.'}]], shots: [{seq: ['33', '34', '35', '34'], each: 0.32, loop: true, pos: '45% 58%', dur: 3.0, zoom: [1.0, 1.08]}]},
  {
    shape: 'round',
    color: K.green,
    lines: [['Miramos las ovejas'], [{h: 'bien de cerca.'}]],
    shots: [
      {n: '44', pos: '40% 30%', dur: 1.8},
      {n: '43', pos: '45% 30%', dur: 1.2},
    ],
  },
  {
    shape: 'round',
    color: K.orange,
    lines: [['Compartimos un picnic'], ['a la ', {h: 'sombra.'}]],
    shots: [
      {n: '16', pos: '50% 48%', dur: 1.2, zoom: [1.0, 1.05]},
      {n: '12', pos: '50% 26%', dur: 0.9},
      {n: '23', pos: '50% 45%', dur: 0.9, zoom: [1.0, 1.05]},
    ],
  },
  {
    shape: 'round',
    color: K.yellow,
    lines: [['Amasamos pan'], ['con nuestras ', {h: 'manos.'}]],
    shots: [
      {n: '50', pos: '50% 62%', dur: 1.2},
      {n: '53', pos: '50% 38%', dur: 0.9, zoom: [1.0, 1.05]},
      {n: '47', pos: '50% 20%', dur: 0.9},
    ],
  },
  {shape: 'round', color: K.pink, lines: [['Y volvimos con'], ['el ', {h: 'corazón lleno.'}]], shots: [{n: 'g65', pos: '50% 38%', dur: 1.8, zoom: [1.0, 1.06]}, {n: '66', pos: '45% 30%', dur: 1.8, zoom: [1.0, 1.08]}]},
];

const OPEN = 2.4;
const OUTRO = 4.2;
const BEAT_AT: number[] = [];
const BEAT_DUR: number[] = [];
let cur = OPEN;
BEATS.forEach((b) => {
  BEAT_AT.push(cur);
  const d = b.shots.reduce((a, s) => a + s.dur, 0);
  BEAT_DUR.push(d);
  cur += d;
});
const BODY_END = cur;
export const TOTAL = BODY_END + OUTRO;

// ───────────────────────── bits
const Grad: React.FC<{id: string}> = ({id}) => (
  <defs>
    <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor={K.violet} />
      <stop offset="0.3" stopColor={K.pink} />
      <stop offset="0.55" stopColor={K.orange} />
      <stop offset="0.78" stopColor={K.yellow} />
      <stop offset="1" stopColor={K.green} />
    </linearGradient>
  </defs>
);

const Trazo: React.FC<{p: number; style?: React.CSSProperties; sw?: number; id: string}> = ({p, style, sw = 12, id}) => (
  <svg viewBox="0 0 400 120" style={{position: 'absolute', overflow: 'visible', ...style}}>
    <Grad id={id} />
    <path d={TRAZO} fill="none" stroke={`url(#${id})`} strokeWidth={sw} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(p, 0, 1)} />
  </svg>
);

const PaletteBar: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 36, display: 'flex'}}>
    {[K.violet, K.pink, K.orange, K.yellow, K.green, K.ink].map((c, i) => (
      <div key={c} style={{flex: 1, background: c, transform: `scaleY(${prog(t, 0.1 + i * 0.06, 0.4, easeOut)})`, transformOrigin: 'top'}} />
    ))}
  </div>
);

const Bubble: React.FC<{x: number; y: number; d: number; color: string; t: number; seed: number; p?: number}> = ({x, y, d, color, t, seed, p = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x - d / 2 + Math.sin(t * 0.9 + seed) * 14,
      top: y - d / 2 + Math.cos(t * 0.7 + seed * 1.7) * 18,
      width: d,
      height: d,
      borderRadius: '50%',
      background: color,
      transform: `scale(${p})`,
    }}
  />
);

const Line: React.FC<{segs: Seg[]; t: number; at: number; color: string; fg: string}> = ({segs, t, at, color, fg}) => {
  const p = prog(t, at, 0.6, easeOut);
  const hp = prog(t, at + 0.35, 0.45, easeOut);
  return (
    <div style={{overflow: 'hidden', padding: '6px 0 10px'}}>
      <div style={{transform: `translateY(${(1 - p) * 120}%)`, whiteSpace: 'nowrap'}}>
        {segs.map((s, i) =>
          typeof s === 'string' ? (
            <span key={i} style={{fontWeight: 300, whiteSpace: 'pre'}}>
              {s}
            </span>
          ) : (
            <span key={i} style={{position: 'relative', display: 'inline-block', fontWeight: 900, padding: '0 18px', margin: '0 -4px'}}>
              <span style={{position: 'absolute', left: 0, right: 0, top: 6, bottom: 2, background: color, borderRadius: 22, transform: `scaleX(${hp}) rotate(-1.5deg)`, transformOrigin: 'left center'}} />
              <span style={{position: 'relative', color: lerp(0, 1, hp) > 0.5 ? fg : K.ink}}>{s.h}</span>
            </span>
          ),
        )}
      </div>
    </div>
  );
};

const radius = (s: Beat['shape']) => (s === 'circle' ? '50%' : s === 'arch' ? `${FS / 2}px ${FS / 2}px 70px 70px` : '70px');

// ───────────────────────── map: the camera rides with the bus, the road is the ADIP trazo
const ROUTE = 'M 840 2010 C 800 1880, 880 1760, 800 1640 C 700 1500, 760 1380, 650 1260 C 540 1140, 600 1000, 500 880 C 420 790, 470 640, 400 520';
const SEGS: number[][] = [
  [840, 2010, 800, 1880, 880, 1760, 800, 1640],
  [800, 1640, 700, 1500, 760, 1380, 650, 1260],
  [650, 1260, 540, 1140, 600, 1000, 500, 880],
  [500, 880, 420, 790, 470, 640, 400, 520],
];
const PTS: [number, number][] = [];
for (const g of SEGS)
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const a = (1 - u) ** 3,
      b = 3 * (1 - u) ** 2 * u,
      c = 3 * (1 - u) * u * u,
      d = u ** 3;
    PTS.push([a * g[0] + b * g[2] + c * g[4] + d * g[6], a * g[1] + b * g[3] + c * g[5] + d * g[7]]);
  }
const routeAt = (p: number): [number, number] => {
  const f = clamp(p, 0, 1) * (PTS.length - 1);
  const i = Math.floor(f);
  const a = PTS[i];
  const b = PTS[Math.min(i + 1, PTS.length - 1)];
  return [lerp(a[0], b[0], f - i), lerp(a[1], b[1], f - i)];
};
const STOPS_ON_WAY: {p: number; name: string}[] = [
  {p: 0.24, name: 'Belgrano'},
  {p: 0.62, name: 'Vicente López'},
  {p: 0.82, name: 'Olivos'},
];
const PARKS: [number, number, number][] = [
  [560, 1930, 150],
  [470, 1820, 90],
  [330, 1500, 170],
  [460, 1410, 80],
  [250, 1060, 130],
  [150, 760, 190],
  [250, 640, 90],
  [880, 1480, 90],
  [760, 1080, 80],
];
const MiniMap: React.FC<{t: number}> = ({t}) => {
  const draw = prog(t, 0.4, 2.0, easeIO);
  const [bx, by] = routeAt(draw);
  const [ax, ay] = routeAt(draw - 0.02);
  const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
  const out = prog(t, 2.45, 0.7, easeIO);
  const z = lerp(1.05, 0.5, out);
  const cx = lerp(bx, 610, out);
  const cy = lerp(by - 60, 1215, out);
  const pin = prog(t, 2.4, 0.5, back);
  const grid: React.ReactNode[] = [];
  for (let i = -6; i < 16; i++) {
    grid.push(<line key={`a${i}`} x1={-400 + i * 190} y1={2800} x2={600 + i * 190} y2={-300} stroke={K.white} strokeWidth={i % 3 === 0 ? 14 : 6} />);
    grid.push(<line key={`b${i}`} x1={-600} y1={-200 + i * 210} x2={1800} y2={600 + i * 210} stroke={K.white} strokeWidth={i % 4 === 0 ? 14 : 6} />);
  }
  const pill: React.CSSProperties = {position: 'absolute', fontFamily: FONT, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderRadius: 999, padding: '16px 32px', fontSize: 58};
  return (
    <div style={{position: 'absolute', inset: 0, background: K.gray}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1400, height: 2400, transformOrigin: '0 0', transform: `translate(${FS / 2 - cx * z}px, ${FS / 2 - cy * z}px) scale(${z})`}}>
        <svg viewBox="0 0 1400 2400" width={1400} height={2400} style={{position: 'absolute', overflow: 'visible'}}>
          <defs>
            <linearGradient id="rg" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="2010" y2="520">
              <stop offset="0" stopColor={K.violet} />
              <stop offset="0.3" stopColor={K.pink} />
              <stop offset="0.55" stopColor={K.orange} />
              <stop offset="0.78" stopColor={K.yellow} />
              <stop offset="1" stopColor={K.green} />
            </linearGradient>
          </defs>
          {grid}
          {/* Río de la Plata */}
          <path d="M 1150 2900 C 1120 2400, 1080 2100, 1010 1800 C 930 1480, 800 1100, 700 760 C 620 480, 560 200, 520 -400 L 2600 -400 L 2600 2900 Z" fill={K.white} />
          {[0, 1, 2, 3].map((w) => (
            <path key={w} d={`M ${1090 - w * 70} ${1960 - w * 380} q 30 -24 60 0 t 60 0 t 60 0`} fill="none" stroke={K.gray} strokeWidth={10} strokeLinecap="round" />
          ))}
          {/* Av. General Paz */}
          <path d="M -300 1180 C 200 1330, 600 1420, 960 1560" fill="none" stroke={K.ink} strokeWidth={8} strokeDasharray="2 24" strokeLinecap="round" />
          {PARKS.map(([x, y, d], i) => (
            <circle key={i} cx={x} cy={y} r={(d / 2) * prog(t, 0.1 + i * 0.05, 0.5, back)} fill={K.green} />
          ))}
          {/* road: white casing + trazo in ADIP gradient */}
          <path d={ROUTE} fill="none" stroke={K.white} strokeWidth={74} strokeLinecap="round" />
          <path d={ROUTE} fill="none" stroke="url(#rg)" strokeWidth={40} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        </svg>
        <div style={{position: 'absolute', left: 1035, top: 1500, fontFamily: FONT, fontWeight: 700, fontSize: 46, letterSpacing: '0.14em', color: K.ink, whiteSpace: 'nowrap', transform: 'rotate(-74deg)', transformOrigin: 'left center'}}>RÍO DE LA PLATA</div>
        <div style={{position: 'absolute', left: 20, top: 1232, fontFamily: FONT, fontWeight: 700, fontSize: 40, letterSpacing: '0.12em', color: K.ink, whiteSpace: 'nowrap', transform: 'rotate(17deg)', transformOrigin: 'left center'}}>AV. GENERAL PAZ</div>
        {/* barrios que vamos pasando */}
        {STOPS_ON_WAY.map((w) => {
          const [x, y] = routeAt(w.p);
          const a = prog(draw, w.p - 0.03, 0.06, easeOut);
          return (
            <React.Fragment key={w.name}>
              <div style={{position: 'absolute', left: x - 24, top: y - 24, width: 48, height: 48, borderRadius: '50%', background: K.white, border: `10px solid ${K.ink}`, boxSizing: 'border-box', transform: `scale(${a})`}} />
              <div style={{...pill, right: 1400 - x + 60, top: y - 50, background: K.white, color: K.ink, opacity: a, transform: `translateX(${(1 - a) * 30}px)`}}>{w.name}</div>
            </React.Fragment>
          );
        })}
        {/* origen */}
        <div style={{position: 'absolute', left: 840 - 46, top: 2010 - 46, width: 92, height: 92, borderRadius: '50%', background: K.ink, transform: `scale(${prog(t, 0.2, 0.5, back)})`}} />
        <div style={{...pill, right: 1400 - 840 + 70, top: 1960, background: K.ink, color: K.white, transform: `scale(${prog(t, 0.3, 0.5, back)})`, transformOrigin: 'right center'}}>CET · Palermo</div>
        {/* destino: el cartel de la chacra */}
        <div style={{position: 'absolute', left: 400 - 60, top: 520 - 60, width: 120, height: 120, borderRadius: '50%', background: K.green, border: `14px solid ${K.ink}`, boxSizing: 'border-box', transform: `scale(${pin * (1 + 0.08 * Math.sin(t * 6))})`}} />
        <div style={{position: 'absolute', left: 540, top: 340, width: 400, height: 400, borderRadius: '50%', overflow: 'hidden', border: `18px solid ${K.white}`, boxSizing: 'border-box', transform: `scale(${prog(t, 2.7, 0.55, back)}) rotate(${Math.sin(t * 1.5) * 2}deg)`}}>
          <Img src={staticFile('chacra/sign.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%'}} />
        </div>
        <div style={{...pill, left: 520, top: 760, background: K.yellow, color: K.ink, transform: `scale(${prog(t, 2.85, 0.5, back)})`, transformOrigin: 'left center'}}>La chacra</div>
        {/* el micro */}
        {draw > 0 && draw < 0.995 && (
          <div style={{position: 'absolute', left: bx - 70, top: by - 42, width: 140, height: 84, transform: `rotate(${ang + 180 > 90 && ang + 180 < 270 ? ang : ang}deg)`}}>
            <div style={{position: 'absolute', inset: 0, background: K.white, border: `10px solid ${K.ink}`, borderRadius: 26, boxSizing: 'border-box'}} />
            <div style={{position: 'absolute', left: 22, top: 20, width: 28, height: 44, background: K.orange, borderRadius: 8}} />
            <div style={{position: 'absolute', left: 58, top: 20, width: 28, height: 44, background: K.orange, borderRadius: 8}} />
            <div style={{position: 'absolute', left: 94, top: 20, width: 24, height: 44, background: K.ink, borderRadius: 8}} />
          </div>
        )}
      </div>
    </div>
  );
};

// ───────────────────────── one beat
const BeatView: React.FC<{b: Beat; i: number; t: number; dur: number}> = ({b, i, t, dur}) => {
  if (t < -0.05 || t > dur + 0.05) return null;
  const p = prog(t, 0, 0.75, back);
  const q = prog(t, dur - 0.28, 0.28, easeIO);
  const side = i % 2 ? 1 : -1;
  // which shot
  let acc = 0;
  const shots = b.shots.map((s) => {
    const o = {...s, at: acc};
    acc += s.dur;
    return o;
  });
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - q}}>
      <Bubble x={side > 0 ? 960 : 120} y={470} d={520} color={b.color} t={t} seed={i} p={prog(t, 0.05, 0.7, back)} />
      <Bubble x={side > 0 ? 100 : 990} y={1190} d={220} color={[K.green, K.yellow, K.pink, K.orange][i % 4]} t={t} seed={i + 3} p={prog(t, 0.2, 0.7, back)} />
      <Bubble x={side > 0 ? 70 : 1010} y={640} d={70} color={K.violet} t={t} seed={i + 7} p={prog(t, 0.35, 0.7, back)} />
      <div
        style={{
          position: 'absolute',
          left: FX,
          top: FY,
          width: FS,
          height: FS,
          borderRadius: radius(b.shape),
          overflow: 'hidden',
          background: K.gray,
          opacity: prog(t, 0, 0.2, easeOut),
          transform: `translateY(${(1 - p) * 160 - q * 50}px) rotate(${(1 - p) * side * 6}deg) scale(${0.88 + 0.12 * p})`,
        }}
      >
        {b.map ? (
          <MiniMap t={t} />
        ) : (
          shots.map((s, k) => {
            const lt = t - s.at;
            if (lt < 0 || (k < shots.length - 1 && lt > s.dur + 0.4)) return null;
            const names = s.seq ?? [s.n as string];
            let idx = 0;
            if (s.seq) {
              const f = Math.floor(lt / (s.each ?? 0.3));
              idx = s.loop ? f % names.length : Math.min(f, names.length - 1);
            }
            const [z0, z1] = s.zoom ?? [1.03, 1.12];
            const z = lerp(z0, z1, clamp(lt / s.dur, 0, 1));
            return (
              <div key={k} style={{position: 'absolute', inset: 0, opacity: k === 0 ? 1 : prog(lt, 0, 0.35, easeIO)}}>
                {names.map((n, j) => (
                  <Img
                    key={n + j}
                    src={staticFile(`chacra/${n}.jpg`)}
                    style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', objectPosition: Array.isArray(s.pos) ? s.pos[j] : s.pos ?? '50% 40%', transform: `scale(${z})`, opacity: j === idx ? 1 : 0}}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>
      {b.tag && (
        <div
          style={{
            position: 'absolute',
            left: FX + 40,
            top: FY + FS - 120,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            background: K.white,
            color: K.ink,
            padding: '16px 28px',
            borderRadius: 999,
            transform: `scale(${prog(t, 0.9, 0.5, back)})`,
            transformOrigin: 'left center',
          }}
        >
          {b.tag}
        </div>
      )}
      <div style={{position: 'absolute', left: FX, top: 1348, fontFamily: FONT, fontSize: 72, lineHeight: 1.12, color: K.ink}}>
        {b.lines.map((l, k) => (
          <Line key={k} segs={l} t={t} at={0.25 + k * 0.14} color={b.color} fg={b.fg ?? K.ink} />
        ))}
      </div>
    </div>
  );
};

// ───────────────────────── open / outro
const Open: React.FC<{t: number}> = ({t}) => {
  if (t > OPEN + 0.05) return null;
  const q = prog(t, OPEN - 0.3, 0.3, easeIO);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - q}}>
      <Bubble x={930} y={420} d={360} color={K.yellow} t={t} seed={1} p={prog(t, 0.1, 0.7, back)} />
      <Bubble x={130} y={1250} d={460} color={K.orange} t={t} seed={2} p={prog(t, 0.2, 0.7, back)} />
      <Bubble x={900} y={1420} d={150} color={K.green} t={t} seed={3} p={prog(t, 0.3, 0.7, back)} />
      <Bubble x={200} y={520} d={90} color={K.pink} t={t} seed={4} p={prog(t, 0.4, 0.7, back)} />
      <div style={{position: 'absolute', left: 0, width: W, top: 610, textAlign: 'center', fontFamily: FONT, color: K.ink, lineHeight: 1.04}}>
        <div style={{overflow: 'hidden'}}>
          <div style={{fontWeight: 300, fontSize: 96, transform: `translateY(${(1 - prog(t, 0.3, 0.6, easeOut)) * 120}%)`}}>Día de salida</div>
        </div>
        <div style={{overflow: 'hidden', paddingBottom: 8}}>
          <div style={{fontWeight: 900, fontSize: 152, letterSpacing: '-0.03em', transform: `translateY(${(1 - prog(t, 0.42, 0.7, easeOut)) * 120}%)`}}>recreativa</div>
        </div>
        <div style={{overflow: 'hidden', paddingBottom: 20}}>
          <div style={{fontWeight: 300, fontSize: 96, transform: `translateY(${(1 - prog(t, 0.54, 0.6, easeOut)) * 120}%)`}}>en Equipo ADIP</div>
        </div>
      </div>
      <Trazo id="og" p={prog(t, 0.9, 0.9, easeIO)} sw={13} style={{left: 250, top: 985, width: 580}} />
      <div style={{position: 'absolute', left: 0, width: W, top: 1190, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 32, letterSpacing: '0.06em', color: K.ink, opacity: prog(t, 1.2, 0.5, easeOut)}}>
        CET · CHACRA EDUCATIVA SAN ISIDRO LABRADOR
      </div>
    </div>
  );
};

const Outro: React.FC<{t: number}> = ({t}) => {
  if (t < -0.05) return null;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Bubble x={950} y={1330} d={420} color={K.orange} t={t} seed={5} p={prog(t, 0.2, 0.7, back)} />
      <Bubble x={110} y={470} d={300} color={K.yellow} t={t} seed={6} p={prog(t, 0.3, 0.7, back)} />
      <Bubble x={170} y={1420} d={120} color={K.green} t={t} seed={7} p={prog(t, 0.4, 0.7, back)} />
      <div style={{position: 'absolute', left: 0, width: W, top: 660, textAlign: 'center', fontFamily: FONT, color: K.ink, lineHeight: 1.06}}>
        <div style={{overflow: 'hidden'}}>
          <div style={{fontWeight: 300, fontSize: 86, transform: `translateY(${(1 - prog(t, 0.4, 0.6, easeOut)) * 120}%)`}}>Acompañar</div>
        </div>
        <div style={{overflow: 'hidden'}}>
          <div style={{fontWeight: 900, fontSize: 132, transform: `translateY(${(1 - prog(t, 0.52, 0.6, easeOut)) * 120}%)`}}>con amor</div>
        </div>
        <div style={{overflow: 'hidden', paddingBottom: 14}}>
          <div style={{fontWeight: 300, fontSize: 86, transform: `translateY(${(1 - prog(t, 0.64, 0.6, easeOut)) * 120}%)`}}>hace la diferencia.</div>
        </div>
      </div>
      <Trazo id="eg" p={prog(t, 1.0, 0.9, easeIO)} style={{left: 250, top: 1010, width: 580}} />
      <div style={{position: 'absolute', left: 0, width: W, top: 1250, display: 'flex', justifyContent: 'center'}}>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 38, background: K.ink, color: K.white, padding: '20px 44px', borderRadius: 999, transform: `scale(${prog(t, 1.4, 0.5, back)})`}}>@equipoadip</div>
      </div>
    </div>
  );
};

// ───────────────────────── composition
export const Tierno: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const go = () => continueRender(h);
    Promise.all([300, 600, 700, 800, 900].map((w) => document.fonts.load(`${w} 40px Montserrat`))).then(go, go);
  }, [h]);
  // logo: big in the open and the outro, small at the top during the story
  const toSmall = prog(t, OPEN - 0.45, 0.6, easeIO);
  const toBig = prog(t, BODY_END - 0.1, 0.6, easeIO);
  const k = toSmall * (1 - toBig);
  const lw = lerp(400, 210, k);
  const ly = lerp(t < OPEN ? 330 : 330, 250, k);
  return (
    <AbsoluteFill style={{background: K.white}}>
      <style>{fontCss}</style>
      <Audio src={staticFile('chacra/musica.wav')} />
      <Open t={t} />
      {BEATS.map((b, i) => (
        <BeatView key={i} b={b} i={i} t={t - BEAT_AT[i]} dur={BEAT_DUR[i]} />
      ))}
      <Outro t={t - BODY_END} />
      <Img src={staticFile('brand/logo-color.png')} style={{position: 'absolute', width: lw, left: (W - lw) / 2, top: ly, opacity: prog(t, 0.05, 0.5, easeOut)}} />
      <PaletteBar t={t} />
    </AbsoluteFill>
  );
};
