import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Easing, Img, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import CUTS from './cuts.json';
import {clamp, easeIO, easeIn, easeOut, lerp, prog} from '../ui';

// Equipo ADIP · manual v2. CET = naranja pleno, texto negro, logo negro.
const K = {
  violet: '#8A00B7',
  pink: '#ED2995',
  orange: '#FE801C',
  yellow: '#FFCB01',
  green: '#94C920',
  gray: '#EFEFEF',
  ink: '#000000',
  white: '#FFFFFF',
  tint: '#FFE6D2',
};
const FONT = "'Montserrat', sans-serif";
export const FPS = 30;
const W = 1080;
const H = 1920;
const TRAZO = 'M10 96 C 70 98, 120 92, 156 74 C 196 54, 204 16, 178 12 C 150 8, 146 54, 182 76 C 220 98, 300 98, 390 92';
const back = Easing.out(Easing.back(1.7));

const fontCss = [300, 400, 500, 600, 700, 800, 900]
  .map(
    (w) =>
      `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(
        `fonts/montserrat-latin-${w}-normal.woff2`,
      )}') format('woff2');}`,
  )
  .join('\n');

// ───────────────────────── timeline (seconds)
const T = {
  intro: 0,
  map: 2.8,
  arrive: 6.8,
  trail: 9.9,
  stops: 13.1,
  stopDur: 2.9,
  close: 13.1 + 6 * 2.9, // 30.5
  outro: 34.1,
  end: 37.6,
};
export const TOTAL = T.end;

// ───────────────────────── primitives
const Ph: React.FC<{n: string; pos?: string; k?: number; from?: number; to?: number; style?: React.CSSProperties}> = ({
  n,
  pos = '50% 50%',
  k = 0,
  from = 1.14,
  to = 1.02,
  style,
}) => (
  <div style={{position: 'absolute', overflow: 'hidden', ...style}}>
    <Img
      src={staticFile(`chacra/${n}.jpg`)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: pos,
        transform: `scale(${lerp(from, to, clamp(k, 0, 1))})`,
      }}
    />
  </div>
);

const Trazo: React.FC<{p: number; color?: string; grad?: boolean; style?: React.CSSProperties; sw?: number}> = ({p, color = K.ink, grad, style, sw = 13}) => (
  <svg viewBox="0 0 400 120" style={{position: 'absolute', overflow: 'visible', ...style}}>
    {grad && (
      <defs>
        <linearGradient id="adipg" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={K.violet} />
          <stop offset="0.3" stopColor={K.pink} />
          <stop offset="0.55" stopColor={K.orange} />
          <stop offset="0.78" stopColor={K.yellow} />
          <stop offset="1" stopColor={K.green} />
        </linearGradient>
      </defs>
    )}
    <path
      d={TRAZO}
      fill="none"
      stroke={grad ? 'url(#adipg)' : color}
      strokeWidth={sw}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - clamp(p, 0, 1)}
    />
  </svg>
);

/** Line of text rising out of a mask. */
const Rise: React.FC<{t: number; at: number; children: React.ReactNode; style?: React.CSSProperties; dur?: number}> = ({t, at, children, style, dur = 0.6}) => {
  const p = prog(t, at, dur, easeOut);
  return (
    <div style={{overflow: 'hidden', padding: '0.08em 0.1em 0.22em', margin: '-0.08em -0.1em -0.22em'}}>
      <div style={{transform: `translateY(${(1 - p) * 115}%)`, ...style}}>{children}</div>
    </div>
  );
};

const Pill: React.FC<{t: number; at: number; children: React.ReactNode; bg?: string; fg?: string; style?: React.CSSProperties}> = ({
  t,
  at,
  children,
  bg = K.white,
  fg = K.ink,
  style,
}) => {
  const p = prog(t, at, 0.5, back);
  return (
    <div
      style={{
        position: 'absolute',
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 30,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        background: bg,
        color: fg,
        padding: '16px 30px',
        borderRadius: 999,
        transform: `scale(${p})`,
        transformOrigin: 'left center',
        opacity: p > 0 ? 1 : 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Head: React.FC<{x: number; y: number; d: number; color: string; p?: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({
  x,
  y,
  d,
  color,
  p = 1,
  children,
  style,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - d / 2,
      top: y - d / 2,
      width: d,
      height: d,
      borderRadius: '50%',
      background: color,
      transform: `scale(${p})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Scene revealed by a growing "head" (circle) from an origin point. */
const Scene: React.FC<{t: number; at: number; until: number; origin?: [number, number]; bg: string; children: (lt: number) => React.ReactNode; first?: boolean}> = ({
  t,
  at,
  until,
  origin = [W / 2, H / 2],
  bg,
  children,
  first,
}) => {
  if (t < at || t > until + 0.8) return null;
  const p = first ? 1 : prog(t, at, 0.7, easeIO);
  return (
    <AbsoluteFill style={{background: bg, clipPath: `circle(${p * 2400}px at ${origin[0]}px ${origin[1]}px)`, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${1 + 0.05 * clamp((t - at) / (until - at + 0.8), 0, 1)})`}}>{children(t - at)}</AbsoluteFill>
    </AbsoluteFill>
  );
};

const Logo: React.FC<{v: 'black' | 'color' | 'white'; w: number; x?: number; y: number; p?: number}> = ({v, w, x, y, p = 1}) => (
  <Img
    src={staticFile(`brand/logo-${v}.png`)}
    style={{position: 'absolute', width: w, left: x ?? (W - w) / 2, top: y, opacity: p, transform: `translateY(${(1 - p) * -30}px)`}}
  />
);

// ───────────────────────── cut-outs, stop-motion, ticker
const Cut: React.FC<{n: string; h: number; x: number; bottom: number; p?: number; rot?: number; style?: React.CSSProperties}> = ({n, h, x, bottom, p = 1, rot = 0, style}) => {
  const [w0, h0] = (CUTS as Record<string, number[]>)[n];
  const w = (h * w0) / h0;
  return (
    <Img
      src={staticFile(`chacra/cut/${n}.png`)}
      style={{position: 'absolute', left: x - w / 2, top: bottom - h, width: w, height: h, transformOrigin: '50% 100%', transform: `scale(${p}) rotate(${rot}deg)`, ...style}}
    />
  );
};

/** which frame of a burst is showing (holds the last one unless loop) */
const step = (t: number, at: number, each: number, n: number, loop = false) => {
  const i = Math.floor((t - at) / each);
  if (i < 0) return -1;
  return loop ? i % n : Math.min(i, n - 1);
};

const Ticker: React.FC<{t: number; text: string; y: number; rot?: number; bg?: string; fg?: string; speed?: number; size?: number}> = ({t, text, y, rot = -4, bg = K.ink, fg = K.white, speed = 160, size = 44}) => {
  const unit = `${text}  ·  `;
  return (
    <div style={{position: 'absolute', left: -200, width: W + 400, top: y, background: bg, transform: `rotate(${rot}deg) scaleY(${prog(t, 0.2, 0.5, easeOut)})`, overflow: 'hidden', padding: '16px 0'}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: '0.08em', textTransform: 'uppercase', color: fg, whiteSpace: 'pre', transform: `translateX(${-((t * speed) % 2000)}px)`}}>
        {unit.repeat(14)}
      </div>
    </div>
  );
};

const float = (t: number, seed: number, amp = 1) => Math.sin(t * 1.7 + seed * 2.1) * amp;

const CutStack: React.FC<{t: number; dur: number; shots: [string, string][]}> = ({t, dur, shots}) => {
  const each = dur / shots.length;
  return (
    <>
      {shots.map(([n, pos], i) => {
        const lt = t - i * each;
        if (lt < 0 || lt > each + 1.2) return null;
        const p = i === 0 ? 1 : prog(lt, 0, 0.36, easeIO);
        const dir = i % 2 ? 1 : -1;
        const clip = i % 2 ? `inset(0 0 0 ${(1 - p) * 100}%)` : `inset(0 ${(1 - p) * 100}% 0 0)`;
        return (
          <div key={n} style={{position: 'absolute', inset: 0, clipPath: clip}}>
            <Ph n={n} pos={pos} k={lt / (each + 0.6)} from={1.2} to={1.04} style={{inset: 0, transform: `translateX(${(1 - p) * dir * 80}px)`}} />
          </div>
        );
      })}
    </>
  );
};


// ───────────────────────── 1 · intro
const Intro: React.FC<{t: number}> = ({t}) => {
  const up = prog(t, 0.75, 0.7, back);
  return (
    <>
      <Head x={560} y={1640} d={1240 * prog(t, 0.05, 0.9, easeOut)} color={K.white} />
      <Head x={1010} y={300} d={300} color={K.yellow} p={prog(t, 0.4, 0.7, back)} />
      <Head x={70} y={1080} d={170} color={K.green} p={prog(t, 0.55, 0.7, back)} />
      <Logo v="black" w={250} x={80} y={262} p={prog(t, 0.1, 0.5, easeOut)} />
      <Pill t={t} at={0.3} style={{left: 80, top: 440}}>
        CET · Salida educativa
      </Pill>
      <div style={{position: 'absolute', left: 74, top: 540, fontFamily: FONT, color: K.ink, lineHeight: 0.98}}>
        <Rise t={t} at={0.35} style={{fontWeight: 300, fontSize: 118}}>
          Un día en la
        </Rise>
        <Rise t={t} at={0.5} dur={0.7} style={{fontWeight: 900, fontSize: 236, letterSpacing: '-0.035em', marginLeft: -8}}>
          chacra.
        </Rise>
      </div>
      <Trazo p={prog(t, 1.1, 0.8, easeIO)} color={K.ink} sw={14} style={{left: 70, top: 840, width: 520}} />
      <Cut n={Math.floor(t / 0.45) % 2 ? '36' : '37'} h={790} x={560} bottom={1940 + (1 - up) * 1000} />
      <Pill t={t} at={1.5} bg={K.ink} fg={K.white} style={{left: 80, top: 1045, fontSize: 30}}>
        Chacra Educativa San Isidro Labrador
      </Pill>
    </>
  );
};

// ───────────────────────── 2 · route map (abstract, north up)
const ROUTE = 'M 840 2010 C 800 1880, 880 1760, 800 1640 C 700 1500, 760 1380, 650 1260 C 540 1140, 600 1000, 500 880 C 420 790, 470 640, 400 520';
const ROUTE_PTS = (() => {
  // sample the cubic chain for camera + bus position
  const segs: number[][] = [
    [840, 2010, 800, 1880, 880, 1760, 800, 1640],
    [800, 1640, 700, 1500, 760, 1380, 650, 1260],
    [650, 1260, 540, 1140, 600, 1000, 500, 880],
    [500, 880, 420, 790, 470, 640, 400, 520],
  ];
  const pts: [number, number][] = [];
  for (const s of segs)
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      const a = (1 - u) ** 3,
        b = 3 * (1 - u) ** 2 * u,
        c = 3 * (1 - u) * u * u,
        d = u ** 3;
      pts.push([a * s[0] + b * s[2] + c * s[4] + d * s[6], a * s[1] + b * s[3] + c * s[5] + d * s[7]]);
    }
  return pts;
})();
const routeAt = (p: number): [number, number] => {
  const f = clamp(p, 0, 1) * (ROUTE_PTS.length - 1);
  const i = Math.floor(f);
  const a = ROUTE_PTS[i];
  const b = ROUTE_PTS[Math.min(i + 1, ROUTE_PTS.length - 1)];
  return [lerp(a[0], b[0], f - i), lerp(a[1], b[1], f - i)];
};

const MapLabel: React.FC<{x: number; y: number; children: React.ReactNode; rot?: number; size?: number; weight?: number; color?: string}> = ({
  x,
  y,
  children,
  rot = 0,
  size = 34,
  weight = 800,
  color = K.ink,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      fontFamily: FONT,
      fontWeight: weight,
      fontSize: size,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      color,
      transform: `rotate(${rot}deg)`,
      transformOrigin: 'left center',
    }}
  >
    {children}
  </div>
);

const RouteMap: React.FC<{t: number}> = ({t}) => {
  const draw = prog(t, 0.45, 2.0, easeIO);
  const [bx, by] = routeAt(draw);
  // camera: start tight on Palermo, follow the bus, end pulled back
  const zoom = lerp(1.5, 0.98, prog(t, 0.4, 2.0, easeIO));
  const out = prog(t, 2.3, 0.8, easeIO);
  const cx = lerp(bx, 560, out);
  const cy = lerp(by, 1140, out);
  const z = lerp(zoom, 0.72, out);
  const pin2 = prog(t, 2.4, 0.5, back);
  const grid: React.ReactNode[] = [];
  for (let i = -6; i < 16; i++) {
    grid.push(<line key={`a${i}`} x1={-400 + i * 190} y1={2800} x2={600 + i * 190} y2={-300} stroke={K.white} strokeWidth={i % 3 === 0 ? 12 : 5} />);
    grid.push(<line key={`b${i}`} x1={-600} y1={-200 + i * 210} x2={1800} y2={600 + i * 210} stroke={K.white} strokeWidth={i % 4 === 0 ? 12 : 5} />);
  }
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1400, height: 2400, transformOrigin: '0 0', transform: `translate(${W / 2 - cx * z}px, ${H * 0.52 - cy * z}px) scale(${z})`}}>
        <svg viewBox="0 0 1400 2400" width={1400} height={2400} style={{position: 'absolute', overflow: 'visible'}}>
          {grid}
          {/* Río de la Plata */}
          <path d="M 1150 2900 C 1120 2400, 1080 2100, 1010 1800 C 930 1480, 800 1100, 700 760 C 620 480, 560 200, 520 -400 L 2600 -400 L 2600 2900 Z" fill={K.white} />
          <path d="M 1150 2900 C 1120 2400, 1080 2100, 1010 1800 C 930 1480, 800 1100, 700 760 C 620 480, 560 200, 520 -400" fill="none" stroke={K.ink} strokeWidth={5} />
          {/* Av. General Paz */}
          <path d="M -300 1180 C 200 1330, 600 1420, 960 1560" fill="none" stroke={K.ink} strokeWidth={7} strokeDasharray="4 22" strokeLinecap="round" />
          {/* route */}
          <path d={ROUTE} fill="none" stroke={K.ink} strokeWidth={46} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
          <path d={ROUTE} fill="none" stroke={K.orange} strokeWidth={30} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        </svg>
        <MapLabel x={1010} y={1500} rot={-74} size={38} weight={700}>
          Río de la Plata
        </MapLabel>
        <MapLabel x={60} y={1215} rot={17} size={30} weight={800}>
          Av. General Paz
        </MapLabel>
        <MapLabel x={-60} y={640} size={56} weight={900}>
          Zona Norte
        </MapLabel>
        {/* origin pin */}
        <Head x={840} y={2010} d={92} color={K.ink} p={prog(t, 0.25, 0.5, back)}>
          <div style={{width: 34, height: 34, borderRadius: '50%', background: K.white}} />
        </Head>
        <Pill t={t} at={0.4} bg={K.ink} fg={K.white} style={{left: 400, top: 1850, fontSize: 36}}>
          CET · Palermo
        </Pill>
        {/* destination pin */}
        <Head x={400} y={520} d={150 + 26 * Math.sin(t * 5) * pin2} color={K.orange} p={pin2} style={{opacity: 0.35}} />
        <Head x={400} y={520} d={104} color={K.orange} p={pin2} style={{border: `10px solid ${K.ink}`}} />
        <Pill t={t} at={2.55} bg={K.orange} fg={K.ink} style={{left: 480, top: 478, fontSize: 38}}>
          Chacra · San Isidro
        </Pill>
        {/* the micro */}
        {draw > 0 && draw < 1 && (
          <Head x={bx} y={by} d={84} color={K.white} style={{border: `12px solid ${K.ink}`}} />
        )}
      </div>
      {/* the ride: burst of three photos playing as a loop */}
      <div style={{position: 'absolute', left: 50, top: 900, width: 430, height: 430, transform: `scale(${prog(t, 1.0, 0.55, back)}) rotate(${-6 + float(t, 1, 1.5)}deg)`}}>
        {['61', '62', '63'].map((n, k) => (
          <Ph key={n} n={n} pos="40% 30%" from={1.05} to={1.05} style={{inset: 0, borderRadius: '50%', border: `16px solid ${K.white}`, boxSizing: 'border-box', opacity: [0, 1, 2, 1][Math.max(0, step(t, 0, 0.32, 4, true))] === k ? 1 : 0}} />
        ))}
      </div>
      <Pill t={t} at={1.3} bg={K.yellow} fg={K.ink} style={{left: 120, top: 1300, fontSize: 34}}>
        Todos arriba
      </Pill>
      {/* title block */}
      <div style={{position: 'absolute', left: 0, top: 250, background: K.ink, padding: '34px 56px 38px 80px', borderRadius: '0 40px 40px 0', transform: `translateX(${(1 - prog(t, 0.2, 0.7, easeOut)) * -900}px)`}}>
        <div style={{fontFamily: FONT, color: K.white, fontWeight: 300, fontSize: 60, lineHeight: 1.05}}>De Palermo</div>
        <div style={{fontFamily: FONT, color: K.orange, fontWeight: 900, fontSize: 84, lineHeight: 1.05}}>a San Isidro</div>
      </div>
    </>
  );
};

// ───────────────────────── 3 · arrival: they walk towards us
const WALK: {n: string; h: number; x: number}[] = [
  {n: '27', h: 470, x: 560},
  {n: '26', h: 780, x: 470},
  {n: '25', h: 1060, x: 400},
];
const Arrive: React.FC<{t: number}> = ({t}) => {
  const i = step(t, 0.7, 0.4, 3);
  const card = prog(t, 0.45, 0.6, back);
  return (
    <>
      <Head x={60} y={380} d={520} color={K.white} p={prog(t, 0.1, 0.8, back)} />
      <Head x={1000} y={1250} d={520} color={K.yellow} p={prog(t, 0.3, 0.8, back)} />
      <div style={{position: 'absolute', left: 80, top: 268, fontFamily: FONT, fontWeight: 900, fontSize: 152, letterSpacing: '-0.02em', color: K.ink, lineHeight: 1}}>
        <Rise t={t} at={0.3}>¡Llegamos!</Rise>
      </div>
      <Trazo p={prog(t, 0.9, 0.7, easeIO)} color={K.white} sw={15} style={{left: 80, top: 430, width: 500}} />
      <div style={{position: 'absolute', left: 560, top: 470, width: 460, height: 522, transform: `scale(${card}) rotate(${5 + float(t, 2, 0.8)}deg)`, background: K.white, borderRadius: 32, padding: 14, boxSizing: 'border-box'}}>
        <Ph n="sign" k={t / 3.4} from={1.1} to={1.0} style={{left: 14, top: 14, right: 14, bottom: 14, borderRadius: 22}} />
      </div>
      <Pill t={t} at={0.7} bg={K.ink} fg={K.white} style={{left: 80, top: 520, fontSize: 32}}>
        Chacra Educativa
      </Pill>
      <Pill t={t} at={0.82} bg={K.white} fg={K.ink} style={{left: 80, top: 602, fontSize: 32}}>
        San Isidro
      </Pill>
      <Pill t={t} at={0.94} bg={K.white} fg={K.ink} style={{left: 80, top: 684, fontSize: 32}}>
        Labrador
      </Pill>
      {i >= 0 && <Cut key={i} n={WALK[i].n} h={WALK[i].h} x={WALK[i].x} bottom={1930} p={lerp(0.94, 1, prog(t, 0.7 + i * 0.4, 0.25, back))} />}
    </>
  );
};

// ───────────────────────── 4 · illustrated map of the day
const STOPS = [
  {name: 'La laguna', title: ['Patos y gansos', 'en la laguna.'], c: K.green},
  {name: 'El corral', title: ['Cabras y una', 'llama curiosa.'], c: K.yellow},
  {name: 'El burro', title: ['Cara a cara', 'con el burro.'], c: K.pink},
  {name: 'Las ovejas', title: ['Las ovejas,', 'bien de cerca.'], c: K.green},
  {name: 'El picnic', title: ['Picnic', 'a la sombra.'], c: K.yellow},
  {name: 'El pan', title: ['Manos', 'en la masa.'], c: K.orange},
];
const TRAIL = 'M 250 560 C 620 520, 900 640, 800 800 C 700 960, 260 880, 240 1060 C 220 1240, 860 1140, 830 1320 C 800 1500, 300 1400, 290 1560';
const TRAIL_N: [number, number][] = [
  [250, 560],
  [812, 760],
  [300, 960],
  [800, 1220],
  [552, 1447],
  [290, 1560],
];
const TREES: [number, number, number][] = [
  [980, 560, 150],
  [1040, 680, 110],
  [70, 800, 130],
  [40, 1250, 170],
  [150, 1340, 110],
  [1010, 1500, 190],
  [900, 1600, 120],
  [560, 1010, 90],
];

const Trail: React.FC<{t: number}> = ({t}) => {
  const draw = prog(t, 0.4, 1.7, easeIO);
  return (
    <>
      <Head x={1010} y={250} d={420} color={K.yellow} p={prog(t, 0, 0.8, back)} />
      <div style={{position: 'absolute', left: 80, top: 262, fontFamily: FONT, color: K.ink, lineHeight: 1}}>
        <Rise t={t} at={0.15} style={{fontWeight: 300, fontSize: 76}}>El recorrido</Rise>
        <Rise t={t} at={0.28} style={{fontWeight: 900, fontSize: 120}}>6 paradas.</Rise>
      </div>
      <div style={{position: 'absolute', inset: 0, transform: 'translateY(50px)'}}>
        {/* laguna */}
        <div style={{position: 'absolute', left: -60, top: 420, width: 520, height: 300, borderRadius: '50%', background: K.white, transform: `scale(${prog(t, 0.2, 0.7, back)})`}} />
        {TREES.map(([x, y, d], i) => (
          <Head key={i} x={x} y={y} d={d} color={K.green} p={prog(t, 0.25 + i * 0.07, 0.6, back) * (1 + float(t, i, 0.02))} />
        ))}
        <svg viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
          <path d={TRAIL} fill="none" stroke={K.orange} strokeWidth={64} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
          <path d={TRAIL} fill="none" stroke={K.white} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray="0.012 0.02" opacity={draw} />
        </svg>
        <Cut n="llama" h={330} x={960} bottom={1010} p={prog(t, 1.2, 0.5, back)} rot={float(t, 3, 2)} />
        <Cut n="ovejas" h={230} x={900} bottom={1480} p={prog(t, 1.6, 0.5, back)} rot={float(t, 5, 2)} />
        {TRAIL_N.map(([x, y], i) => {
          const p = prog(t, 0.5 + i * 0.28, 0.45, back);
          const right = x > W / 2;
          return (
            <React.Fragment key={i}>
              <Head x={x} y={y} d={112} color={K.ink} p={p}>
                <span style={{fontWeight: 900, fontSize: 54, color: K.white}}>{i + 1}</span>
              </Head>
              <div
                style={{
                  position: 'absolute',
                  top: y - 40,
                  ...(right ? {right: W - x + 70} : {left: x + 70}),
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: 42,
                  lineHeight: '80px',
                  padding: '0 30px',
                  borderRadius: 40,
                  background: K.white,
                  color: K.ink,
                  whiteSpace: 'nowrap',
                  opacity: p,
                  transform: `translateX(${(1 - p) * (right ? 30 : -30)}px)`,
                }}
              >
                {STOPS[i].name}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
};

// ───────────────────────── 5 · stops
const Dots: React.FC<{i: number; t: number; dark?: boolean}> = ({i, t, dark}) => (
  <div style={{position: 'absolute', left: 80, top: 262, display: 'flex', gap: 14, alignItems: 'center'}}>
    {STOPS.map((_, k) => {
      const on = k === i;
      const w = on ? lerp(26, 120, prog(t, 0.1, 0.5, easeOut)) : 26;
      return (
        <div key={k} style={{width: w, height: 26, borderRadius: 13, background: k < i ? (dark ? K.white : K.ink) : on ? (dark ? 'rgba(255,255,255,0.45)' : K.white) : dark ? 'rgba(255,255,255,0.45)' : K.white, overflow: 'hidden'}}>
          {on && <div style={{width: `${clamp(t / T.stopDur, 0, 1) * 100}%`, height: '100%', background: dark ? K.white : K.ink}} />}
        </div>
      );
    })}
  </div>
);

const Title: React.FC<{t: number; at: number; lines: string[]; size?: number; color?: string}> = ({t, at, lines, size = 84, color = K.ink}) => (
  <div style={{fontFamily: FONT, color, lineHeight: 1.04}}>
    <Rise t={t} at={at} style={{fontWeight: 300, fontSize: size}}>
      {lines[0]}
    </Rise>
    <Rise t={t} at={at + 0.12} style={{fontWeight: 900, fontSize: size}}>
      {lines[1]}
    </Rise>
  </div>
);

const Num: React.FC<{t: number; i: number; x: number; y: number; d?: number; at?: number}> = ({t, i, x, y, d = 140, at = 0.5}) => (
  <Head x={x} y={y} d={d} color={K.ink} p={prog(t, at, 0.5, back)}>
    <span style={{fontWeight: 900, fontSize: d * 0.48, color: K.white}}>{i + 1}</span>
  </Head>
);

/** 01 · laguna — arch, tilted ticker, circle */
const StopLaguna: React.FC<{t: number}> = ({t}) => {
  const a = prog(t, 0.25, 0.85, easeOut);
  return (
    <>
      <Dots i={0} t={t} />
      <Head x={770} y={760} d={840} color={K.green} p={prog(t, 0.1, 0.8, back)} />
      <Ticker t={t} text="Patos · Gansos · Laguna" y={1150} rot={-5} />
      <div style={{position: 'absolute', left: 64, top: 330, fontFamily: FONT, fontWeight: 900, fontSize: 250, color: K.orange, letterSpacing: '-0.04em', lineHeight: 1}}>
        <Rise t={t} at={0.2}>01</Rise>
      </div>
      <div style={{position: 'absolute', left: 390, top: 400, width: 620, height: 860, transform: `translateY(${(1 - a) * 1700}px) rotate(${float(t, 1, 0.6)}deg)`}}>
        {['03', '04'].map((n, k) => (
          <Ph key={n} n={n} pos="50% 40%" k={t / T.stopDur} style={{inset: 0, borderRadius: '310px 310px 32px 32px', opacity: Math.floor(t / 0.4) % 2 === k ? 1 : 0}} />
        ))}
      </div>
      <Head x={1000} y={1800} d={460} color={K.orange} p={prog(t, 0.5, 0.8, back)} />
      <div style={{position: 'absolute', left: 50, top: 800, width: 410, height: 410, transform: `scale(${prog(t, 0.75, 0.55, back)}) rotate(${float(t, 4, 2)}deg)`}}>
        <Ph n="01" pos="60% 22%" k={t / T.stopDur} from={1.5} to={1.35} style={{inset: 0, borderRadius: '50%', border: `14px solid ${K.white}`, boxSizing: 'border-box'}} />
      </div>
      <div style={{position: 'absolute', left: 80, top: 1330}}>
        <Title t={t} at={0.55} lines={STOPS[0].title} />
      </div>
    </>
  );
};

/** 02 · corral — the run towards camera, as stop-motion cut-outs */
const StopCorral: React.FC<{t: number}> = ({t}) => {
  const seq = ['31', '30', '29', '28'];
  const i = Math.max(0, step(t, 0, 0.26, 4, true));
  const pos = ['50% 45%', '55% 40%', '50% 38%', '35% 30%'];
  return (
    <>
      {seq.map((n, k) => (
        <Ph key={n} n={n} pos={pos[k]} from={1.2 + k * 0.03} to={1.2 + k * 0.03} style={{inset: 0, opacity: k === i ? 1 : 0}} />
      ))}
      <Dots i={1} t={t} dark />
      <Ticker t={t} text="Cabras · Llama · Corral" y={1110} rot={-4} bg={K.ink} fg={K.yellow} speed={220} />
      <div style={{position: 'absolute', left: 0, top: 1250, background: K.yellow, padding: '64px 64px 40px 80px', borderRadius: '0 40px 40px 0', transform: `translateX(${(1 - prog(t, 0.25, 0.7, easeOut)) * -1000}px)`}}>
        <Title t={t} at={0.45} lines={STOPS[1].title} size={80} />
      </div>
      <Num t={t} i={1} x={150} y={1250} at={0.55} />
    </>
  );
};

/** 03 · burro — a living photo: the burst plays as a loop */
const StopBurro: React.FC<{t: number}> = ({t}) => {
  const i = [0, 1, 2, 1][Math.max(0, step(t, 0, 0.28, 4, true))];
  const p = prog(t, 0.15, 0.7, back);
  return (
    <>
      <Dots i={2} t={t} />
      <Head x={1010} y={1760} d={520} color={K.pink} p={prog(t, 0.3, 0.8, back)} />
      <div style={{position: 'absolute', right: 64, top: 300, fontFamily: FONT, fontWeight: 900, fontSize: 230, color: K.orange, letterSpacing: '-0.04em', lineHeight: 1}}>
        <Rise t={t} at={0.2}>03</Rise>
      </div>
      <div style={{position: 'absolute', left: 30, top: 380, width: 900, height: 900, transform: `scale(${p}) rotate(${float(t, 2, 0.8)}deg)`}}>
        {['33', '34', '35'].map((n, k) => (
          <Ph key={n} n={n} pos="50% 62%" from={1.0} to={1.0} style={{inset: 0, borderRadius: '50%', border: `18px solid ${K.white}`, boxSizing: 'border-box', opacity: k === i ? 1 : 0}} />
        ))}
      </div>
      <Ticker t={t} text="Cara a cara con el burro" y={1250} rot={4} bg={K.pink} fg={K.white} speed={220} />
      <div style={{position: 'absolute', left: 80, top: 1370}}>
        <Title t={t} at={0.5} lines={STOPS[2].title} />
      </div>
    </>
  );
};

/** 04 · ovejas — cut-out kid in front of the arch, sheep walking through */
const StopOvejas: React.FC<{t: number}> = ({t}) => {
  const a = prog(t, 0.25, 0.85, easeOut);
  const sx = lerp(-260, 1340, clamp((t - 0.5) / 2.6, 0, 1));
  return (
    <>
      <Dots i={3} t={t} />
      <Head x={360} y={800} d={900} color={K.green} p={prog(t, 0.1, 0.8, back)} />
      <div style={{position: 'absolute', right: 64, top: 300, fontFamily: FONT, fontWeight: 900, fontSize: 230, color: K.orange, letterSpacing: '-0.04em', lineHeight: 1}}>
        <Rise t={t} at={0.2}>04</Rise>
      </div>
      <Ph n="44" pos="35% 30%" k={t / T.stopDur} style={{left: 70, top: 400, width: 700, height: 860, borderRadius: '350px 350px 32px 32px', transform: `translateY(${(1 - a) * 1700}px)`}} />
      <Ticker t={t} text="Ovejas · Lana · Corral" y={1560} rot={-3} bg={K.green} fg={K.ink} />
      <Cut n="ovejas" h={260} x={sx} bottom={1310 + Math.abs(Math.sin(t * 9)) * -14} style={{transform: 'scaleX(-1)'}} />
      <div style={{position: 'absolute', left: 80, top: 1330}}>
        <Title t={t} at={0.55} lines={STOPS[3].title} />
      </div>
    </>
  );
};

/** 05 · picnic — fast full-bleed cuts + yellow block */
const StopPicnic: React.FC<{t: number}> = ({t}) => (
  <>
    <CutStack
      t={t}
      dur={T.stopDur}
      shots={[
        ['15', '50% 60%'],
        ['10', '50% 40%'],
        ['12', '50% 30%'],
        ['23', '50% 35%'],
      ]}
    />
    <Dots i={4} t={t} dark />
    <div style={{position: 'absolute', left: 0, top: 1200, background: K.yellow, padding: '70px 64px 44px 80px', borderRadius: '0 40px 40px 0', transform: `translateX(${(1 - prog(t, 0.25, 0.7, easeOut)) * -1000}px)`}}>
      <Title t={t} at={0.5} lines={STOPS[4].title} size={80} />
    </div>
    <Num t={t} i={4} x={150} y={1200} at={0.6} />
  </>
);

/** 06 · pan — tilted cards thrown on the table */
const PAN: {n: string; pos: string; x: number; y: number; w: number; h: number; r: number}[] = [
  {n: '50', pos: '50% 60%', x: 50, y: 330, w: 620, h: 600, r: -5},
  {n: '53', pos: '55% 40%', x: 440, y: 640, w: 590, h: 600, r: 5},
  {n: '47', pos: '50% 20%', x: 60, y: 960, w: 470, h: 420, r: -3},
];
const StopPan: React.FC<{t: number}> = ({t}) => (
  <>
    <Dots i={5} t={t} />
    <Head x={1040} y={380} d={420} color={K.yellow} p={prog(t, 0.1, 0.8, back)} />
    {PAN.map((c, i) => {
      const p = prog(t, 0.15 + i * 0.24, 0.5, easeOut);
      return (
        <div key={c.n} style={{position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, background: K.white, borderRadius: 32, opacity: p > 0 ? 1 : 0, transform: `translate(${(1 - p) * (i % 2 ? 900 : -900)}px, ${(1 - p) * 300}px) rotate(${c.r + (1 - p) * (i % 2 ? 25 : -25) + float(t, i, 0.6)}deg)`}}>
          <Ph n={c.n} pos={c.pos} k={t / T.stopDur} from={1.12} to={1.02} style={{left: 12, top: 12, right: 12, bottom: 12, borderRadius: 22}} />
        </div>
      );
    })}
    <div style={{position: 'absolute', left: 0, top: 1270, background: K.orange, padding: '60px 64px 40px 80px', borderRadius: '0 40px 40px 0', transform: `translateX(${(1 - prog(t, 0.9, 0.7, easeOut)) * -1000}px)`}}>
      <Title t={t} at={1.05} lines={STOPS[5].title} size={84} />
    </div>
    <Num t={t} i={5} x={150} y={1270} at={1.15} />
  </>
);

// ───────────────────────── 6 · close: everyone on the same trazo, like the logo
const LINE: {n: string; h: number; x: number}[] = [
  {n: '66', h: 760, x: 230},
  {n: '12', h: 700, x: 580},
  {n: '17', h: 640, x: 880},
];
const Close: React.FC<{t: number}> = ({t}) => (
  <>
    <div style={{position: 'absolute', left: 80, top: 300, fontFamily: FONT, color: K.ink, lineHeight: 1.02}}>
      <Rise t={t} at={0.2} style={{fontWeight: 300, fontSize: 124}}>Juntos</Rise>
      <Rise t={t} at={0.34} style={{fontWeight: 900, fontSize: 124}}>lo hacemos</Rise>
      <Rise t={t} at={0.48} style={{fontWeight: 900, fontSize: 124}}>posible.</Rise>
    </div>
    <Trazo grad p={prog(t, 0.6, 1.2, easeIO)} sw={10} style={{left: 30, top: 1392, width: 1020}} />
    {LINE.map((c, i) => (
      <Cut key={c.n} n={c.n} h={c.h} x={c.x} bottom={1622} p={prog(t, 0.75 + i * 0.2, 0.5, back)} rot={float(t, i, 0.8)} />
    ))}
  </>
);

const Outro: React.FC<{t: number}> = ({t}) => {
  const bar = [K.violet, K.pink, K.orange, K.yellow, K.green, K.ink];
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 44, display: 'flex'}}>
        {bar.map((c, i) => (
          <div key={c} style={{flex: 1, background: c, transform: `scaleY(${prog(t, 0.3 + i * 0.06, 0.4, easeOut)})`, transformOrigin: 'top'}} />
        ))}
      </div>
      <Logo v="color" w={420} y={330} p={prog(t, 0.45, 0.6, easeOut)} />
      <div style={{position: 'absolute', left: 0, width: W, top: 680, textAlign: 'center', fontFamily: FONT, color: K.ink, lineHeight: 1.06}}>
        <Rise t={t} at={0.7} style={{fontWeight: 300, fontSize: 88}}>Acompañar</Rise>
        <Rise t={t} at={0.82} style={{fontWeight: 900, fontSize: 132}}>con amor</Rise>
        <Rise t={t} at={0.94} style={{fontWeight: 300, fontSize: 88}}>hace la diferencia.</Rise>
      </div>
      <Trazo grad p={prog(t, 1.3, 0.9, easeIO)} sw={12} style={{left: 250, top: 1030, width: 580}} />
      <div style={{position: 'absolute', left: 0, width: W, top: 1300, display: 'flex', justifyContent: 'center'}}>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 38, background: K.ink, color: K.white, padding: '20px 44px', borderRadius: 999, transform: `scale(${prog(t, 1.6, 0.5, back)})`}}>@equipoadip</div>
      </div>
      <div style={{position: 'absolute', left: 0, width: W, top: 1420, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 32, letterSpacing: '0.06em', color: K.ink, opacity: prog(t, 1.9, 0.5, easeOut)}}>
        CET · EQUIPO ADIP
      </div>
    </>
  );
};

// ───────────────────────── composition
export const Chacra: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const go = () => continueRender(h);
    Promise.all([300, 500, 600, 700, 800, 900].map((w) => document.fonts.load(`${w} 40px Montserrat`))).then(go, go);
  }, [h]);
  const s = (i: number) => T.stops + i * T.stopDur;
  const stops: {bg: string; origin: [number, number]; el: (lt: number) => React.ReactNode}[] = [
    {bg: K.tint, origin: [140, 275], el: (lt) => <StopLaguna t={lt} />},
    {bg: K.orange, origin: [W, H], el: (lt) => <StopCorral t={lt} />},
    {bg: K.tint, origin: [0, 960], el: (lt) => <StopBurro t={lt} />},
    {bg: K.tint, origin: [W, 300], el: (lt) => <StopOvejas t={lt} />},
    {bg: K.ink, origin: [540, H], el: (lt) => <StopPicnic t={lt} />},
    {bg: K.tint, origin: [0, 0], el: (lt) => <StopPan t={lt} />},
  ];
  return (
    <AbsoluteFill style={{background: K.orange}}>
      <style>{fontCss}</style>
      <Scene t={t} at={T.intro} until={T.map} bg={K.orange} first>
        {(lt) => <Intro t={lt} />}
      </Scene>
      <Scene t={t} at={T.map} until={T.arrive} bg={K.gray} origin={[740, 1500]}>
        {(lt) => <RouteMap t={lt} />}
      </Scene>
      <Scene t={t} at={T.arrive} until={T.trail} bg={K.orange} origin={[0, 1400]}>
        {(lt) => <Arrive t={lt} />}
      </Scene>
      <Scene t={t} at={T.trail} until={T.stops} bg={K.tint} origin={[W, 300]}>
        {(lt) => <Trail t={lt} />}
      </Scene>
      {stops.map((st, i) => (
        <Scene key={i} t={t} at={s(i)} until={s(i + 1)} bg={st.bg} origin={st.origin}>
          {st.el}
        </Scene>
      ))}
      <Scene t={t} at={T.close} until={T.outro} bg={K.gray} origin={[W / 2, H / 2]}>
        {(lt) => <Close t={lt} />}
      </Scene>
      <Scene t={t} at={T.outro} until={T.end} bg={K.white} origin={[W / 2, 1500]}>
        {(lt) => <Outro t={lt} />}
      </Scene>
    </AbsoluteFill>
  );
};
