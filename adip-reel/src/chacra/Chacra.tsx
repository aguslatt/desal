import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Easing, Img, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
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
  map: 3.4,
  bus: 8.4,
  arrive: 12.0,
  trail: 15.4,
  stops: 19.4,
  stopDur: 3.6,
  close: 19.4 + 6 * 3.6, // 41.0
  outro: 45.2,
  end: 49.6,
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
      {children(t - at)}
    </AbsoluteFill>
  );
};

const Logo: React.FC<{v: 'black' | 'color' | 'white'; w: number; x?: number; y: number; p?: number}> = ({v, w, x, y, p = 1}) => (
  <Img
    src={staticFile(`brand/logo-${v}.png`)}
    style={{position: 'absolute', width: w, left: x ?? (W - w) / 2, top: y, opacity: p, transform: `translateY(${(1 - p) * -30}px)`}}
  />
);

// ───────────────────────── 1 · intro
const Intro: React.FC<{t: number}> = ({t}) => {
  const arch = prog(t, 0.55, 0.9, easeOut);
  return (
    <>
      <Head x={1010} y={150} d={720} color={K.white} p={prog(t, 0, 0.8, back)} />
      <Head x={-20} y={1700} d={420} color={K.ink} p={prog(t, 0.3, 0.8, back)} />
      <Logo v="black" w={250} x={80} y={262} p={prog(t, 0.1, 0.5, easeOut)} />
      <Pill t={t} at={0.35} style={{left: 80, top: 470}}>
        CET · Salida educativa
      </Pill>
      <div style={{position: 'absolute', left: 80, top: 580, fontFamily: FONT, color: K.ink, lineHeight: 1}}>
        <Rise t={t} at={0.5} style={{fontWeight: 300, fontSize: 124}}>
          Un día
        </Rise>
        <Rise t={t} at={0.62} style={{fontWeight: 300, fontSize: 124}}>
          en la
        </Rise>
        <Rise t={t} at={0.76} style={{fontWeight: 900, fontSize: 196, letterSpacing: '-0.02em', marginTop: 6}}>
          chacra.
        </Rise>
      </div>
      <Trazo p={prog(t, 1.15, 0.8, easeIO)} color={K.white} sw={15} style={{left: 70, top: 995, width: 620}} />
      {/* arch photo with head behind */}
      <div style={{position: 'absolute', left: 470, top: 1130, transform: `translateY(${(1 - arch) * 900}px)`}}>
        <Head x={300} y={250} d={640} color={K.white} />
        <Ph n="55" pos="40% 55%" k={t / 3.4} style={{left: 0, top: 0, width: 540, height: 800, borderRadius: '270px 270px 0 0'}} />
      </div>
      <div style={{position: 'absolute', left: 80, top: 1235, fontFamily: FONT, color: K.ink, fontSize: 38, lineHeight: 1.25}}>
        <Rise t={t} at={1.3} style={{fontWeight: 500}}>
          Chacra Educativa
        </Rise>
        <Rise t={t} at={1.4} style={{fontWeight: 800}}>
          San Isidro
        </Rise>
        <Rise t={t} at={1.5} style={{fontWeight: 800}}>
          Labrador
        </Rise>
      </div>
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
  const draw = prog(t, 0.7, 2.6, easeIO);
  const [bx, by] = routeAt(draw);
  // camera: start tight on Palermo, follow the bus, end pulled back
  const zoom = lerp(1.5, 0.98, prog(t, 0.5, 3.0, easeIO));
  const out = prog(t, 3.0, 0.9, easeIO);
  const cx = lerp(bx, 560, out);
  const cy = lerp(by, 1140, out);
  const z = lerp(zoom, 0.72, out);
  const pin2 = prog(t, 3.1, 0.5, back);
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
        <MapLabel x={150} y={1660} size={56} weight={900}>
          CABA
        </MapLabel>
        <MapLabel x={-40} y={900} size={56} weight={900}>
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
        <Pill t={t} at={3.25} bg={K.orange} fg={K.ink} style={{left: 480, top: 478, fontSize: 38}}>
          Chacra · San Isidro
        </Pill>
        {/* the micro */}
        {draw > 0 && draw < 1 && (
          <Head x={bx} y={by} d={84} color={K.white} style={{border: `12px solid ${K.ink}`}} />
        )}
      </div>
      {/* title block */}
      <div style={{position: 'absolute', left: 0, top: 250, background: K.ink, padding: '34px 56px 38px 80px', borderRadius: '0 40px 40px 0', transform: `translateX(${(1 - prog(t, 0.2, 0.7, easeOut)) * -900}px)`}}>
        <div style={{fontFamily: FONT, color: K.white, fontWeight: 300, fontSize: 60, lineHeight: 1.05}}>De Palermo</div>
        <div style={{fontFamily: FONT, color: K.orange, fontWeight: 900, fontSize: 84, lineHeight: 1.05}}>a San Isidro</div>
      </div>
    </>
  );
};

// ───────────────────────── 3 · on the bus (fast cuts)
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

const Bus: React.FC<{t: number}> = ({t}) => (
  <>
    <CutStack
      t={t}
      dur={3.6}
      shots={[
        ['60', '50% 40%'],
        ['62', '45% 30%'],
        ['66', '50% 35%'],
        ['64', '50% 55%'],
      ]}
    />
    <Pill t={t} at={0.3} bg={K.white} style={{left: 80, top: 270}}>
      Primera parada: el micro
    </Pill>
    <div style={{position: 'absolute', left: 0, top: 1210, background: K.orange, padding: '36px 60px 44px 80px', borderRadius: '0 40px 40px 0', transform: `translateX(${(1 - prog(t, 0.25, 0.7, easeOut)) * -900}px)`, fontFamily: FONT, color: K.ink, lineHeight: 1.02}}>
      <div style={{fontWeight: 300, fontSize: 84}}>Todos</div>
      <div style={{fontWeight: 900, fontSize: 124}}>arriba.</div>
    </div>
  </>
);

// ───────────────────────── 4 · arrival
const Arrive: React.FC<{t: number}> = ({t}) => {
  const a = prog(t, 0.3, 0.9, easeOut);
  return (
    <>
      <Head x={60} y={380} d={520} color={K.white} p={prog(t, 0.1, 0.8, back)} />
      <Head x={1040} y={1560} d={360} color={K.ink} p={prog(t, 0.3, 0.8, back)} />
      <div style={{position: 'absolute', left: 80, top: 268, fontFamily: FONT, fontWeight: 900, fontSize: 152, letterSpacing: '-0.02em', color: K.ink, lineHeight: 1}}>
        <Rise t={t} at={0.35}>¡Llegamos!</Rise>
      </div>
      <Trazo p={prog(t, 0.9, 0.7, easeIO)} color={K.white} sw={15} style={{left: 80, top: 440, width: 520}} />
      <Ph n="56" pos="50% 50%" k={t / 3.6} from={1.12} to={1.0} style={{left: 130, top: 600, width: 820, height: 1010, borderRadius: '410px 410px 32px 32px', transform: `translateY(${(1 - a) * 1500}px)`, border: `14px solid ${K.white}`, boxSizing: 'border-box'}} />
      <Pill t={t} at={1.0} bg={K.ink} fg={K.white} style={{left: 80, top: 1440, fontSize: 32}}>
        Chacra Educativa
      </Pill>
      <Pill t={t} at={1.15} bg={K.white} fg={K.ink} style={{left: 80, top: 1522, fontSize: 32}}>
        San Isidro Labrador
      </Pill>
    </>
  );
};

// ───────────────────────── 5 · trail map of the day
const STOPS = [
  {name: 'La laguna', title: ['Patos y gansos', 'en la laguna.']},
  {name: 'El corral', title: ['Cabras y una', 'llama curiosa.']},
  {name: 'El burro', title: ['Cara a cara', 'con el burro.']},
  {name: 'Las ovejas', title: ['Las ovejas,', 'bien de cerca.']},
  {name: 'El picnic', title: ['Picnic', 'a la sombra.']},
  {name: 'El pan', title: ['Manos', 'en la masa.']},
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

const Trail: React.FC<{t: number}> = ({t}) => {
  const draw = prog(t, 0.5, 2.3, easeIO);
  return (
    <>
      <Head x={1060} y={220} d={560} color={K.orange} p={prog(t, 0, 0.8, back)} />
      <div style={{position: 'absolute', left: 80, top: 262, fontFamily: FONT, color: K.ink, lineHeight: 1}}>
        <Rise t={t} at={0.15} style={{fontWeight: 300, fontSize: 76}}>El recorrido</Rise>
        <Rise t={t} at={0.28} style={{fontWeight: 900, fontSize: 120}}>6 paradas.</Rise>
      </div>
      <div style={{position: 'absolute', inset: 0, transform: 'translateY(50px)'}}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
        <path d={TRAIL} fill="none" stroke={K.white} strokeWidth={64} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        <path d={TRAIL} fill="none" stroke={K.orange} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray="0.012 0.02" strokeDashoffset={0} style={{clipPath: `inset(0 0 ${(1 - draw) * 0}% 0)`}} opacity={draw} />
      </svg>
      {TRAIL_N.map(([x, y], i) => {
        const p = prog(t, 0.6 + i * 0.4, 0.45, back);
        const right = x > W / 2;
        return (
          <React.Fragment key={i}>
            <Head x={x} y={y} d={112} color={i === 5 ? K.orange : K.ink} p={p}>
              <span style={{fontWeight: 900, fontSize: 54, color: i === 5 ? K.ink : K.white}}>{i + 1}</span>
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

// ───────────────────────── 6 · stops
const Dots: React.FC<{i: number; t: number; dark?: boolean}> = ({i, t, dark}) => (
  <div style={{position: 'absolute', left: 80, top: 262, display: 'flex', gap: 14, alignItems: 'center'}}>
    {STOPS.map((_, k) => {
      const on = k === i;
      const w = on ? lerp(26, 120, prog(t, 0.1, 0.5, easeOut)) : 26;
      return (
        <div key={k} style={{width: w, height: 26, borderRadius: 13, background: k <= i ? (on ? K.orange : dark ? K.white : K.ink) : dark ? 'rgba(255,255,255,0.45)' : K.white, border: on && !dark ? `0 solid ${K.ink}` : undefined, overflow: 'hidden'}}>
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

/** Layout 1 — arch + circle on tint. */
const StopArch: React.FC<{t: number; i: number; main: [string, string]; side: [string, string]}> = ({t, i, main, side}) => {
  const a = prog(t, 0.25, 0.85, easeOut);
  return (
    <>
      <Dots i={i} t={t} />
      <Head x={760} y={760} d={820} color={K.orange} p={prog(t, 0.1, 0.8, back)} />
      <div style={{position: 'absolute', left: 64, top: 330, fontFamily: FONT, fontWeight: 900, fontSize: 250, color: K.orange, letterSpacing: '-0.04em', lineHeight: 1}}>
        <Rise t={t} at={0.2}>0{i + 1}</Rise>
      </div>
      <Ph n={main[0]} pos={main[1]} k={t / T.stopDur} style={{left: 390, top: 400, width: 620, height: 880, borderRadius: '310px 310px 32px 32px', transform: `translateY(${(1 - a) * 1700}px)`}} />
      <div style={{position: 'absolute', left: 60, top: 860, width: 400, height: 400, transform: `scale(${prog(t, 0.75, 0.55, back)})`}}>
        <Ph n={side[0]} pos={side[1]} k={t / T.stopDur} style={{inset: 0, borderRadius: '50%', border: `14px solid ${K.white}`, boxSizing: 'border-box'}} />
      </div>
      <div style={{position: 'absolute', left: 80, top: 1318}}>
        <Title t={t} at={0.55} lines={STOPS[i].title} />
      </div>
      <Trazo p={prog(t, 1.1, 0.7, easeIO)} color={K.orange} style={{left: 76, top: 1492, width: 300}} />
    </>
  );
};

/** Layout 2 — full-bleed fast cuts with an orange block. */
const StopCuts: React.FC<{t: number; i: number; shots: [string, string][]}> = ({t, i, shots}) => (
  <>
    <CutStack t={t} dur={T.stopDur} shots={shots} />
    <Dots i={i} t={t} dark />
    <div style={{position: 'absolute', left: 0, top: 1200, background: K.orange, padding: '70px 64px 44px 80px', borderRadius: '0 40px 40px 0', transform: `translateX(${(1 - prog(t, 0.25, 0.7, easeOut)) * -1000}px)`}}>
      <Title t={t} at={0.5} lines={STOPS[i].title} size={80} />
    </div>
    <Head x={150} y={1200} d={140} color={K.ink} p={prog(t, 0.6, 0.5, back)}>
      <span style={{fontWeight: 900, fontSize: 68, color: K.white}}>{i + 1}</span>
    </Head>
  </>
);

/** Layout 3 — two halves sliding in from opposite sides + centre card. */
const StopSplit: React.FC<{t: number; i: number; top: [string, string][]; bottom: [string, string][]}> = ({t, i, top, bottom}) => {
  const p = prog(t, 0.1, 0.7, easeOut);
  const half = (shots: [string, string][], y: number, dir: number) => (
    <div style={{position: 'absolute', left: 0, top: y, width: W, height: 960, overflow: 'hidden', transform: `translateX(${(1 - p) * dir * W}px)`}}>
      {shots.map(([n, pos], k) => {
        const lt = t - k * (T.stopDur / shots.length) - (dir > 0 ? 0.25 : 0);
        if (k > 0 && lt < 0) return null;
        const q = k === 0 ? 1 : prog(lt, 0, 0.4, easeIO);
        return <Ph key={n} n={n} pos={pos} k={(k === 0 ? t : lt) / T.stopDur} from={1.16} to={1.02} style={{inset: 0, clipPath: dir > 0 ? `inset(0 0 0 ${(1 - q) * 100}%)` : `inset(0 ${(1 - q) * 100}% 0 0)`}} />;
      })}
    </div>
  );
  return (
    <>
      {half(top, 0, -1)}
      {half(bottom, 960, 1)}
      <Dots i={i} t={t} dark />
      <div style={{position: 'absolute', left: 80, top: 826, width: 920, boxSizing: 'border-box', background: K.orange, borderRadius: 32, padding: '34px 44px 40px 190px', transform: `scale(${prog(t, 0.45, 0.55, back)})`}}>
        <Title t={t} at={0.7} lines={STOPS[i].title} size={72} />
      </div>
      <Head x={170} y={960} d={130} color={K.ink} p={prog(t, 0.7, 0.5, back)}>
        <span style={{fontWeight: 900, fontSize: 64, color: K.white}}>{i + 1}</span>
      </Head>
    </>
  );
};

// ───────────────────────── 7 · close
const CARDS: {n: string; pos: string; x: number; y: number; w: number; h: number; r: string}[] = [
  {n: '62', pos: '45% 30%', x: 80, y: 250, w: 440, h: 560, r: '220px 220px 32px 32px'},
  {n: '66', pos: '50% 35%', x: 560, y: 330, w: 440, h: 440, r: '50%'},
  {n: '36', pos: '50% 35%', x: 80, y: 850, w: 440, h: 440, r: '50%'},
  {n: '60', pos: '50% 40%', x: 560, y: 810, w: 440, h: 560, r: '32px'},
];
const Close: React.FC<{t: number}> = ({t}) => (
  <>
    <Head x={1010} y={1500} d={620} color={K.orange} p={prog(t, 0, 0.8, back)} />
    {CARDS.map((c, i) => (
      <div key={c.n} style={{position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, transform: `scale(${prog(t, 0.15 + i * 0.16, 0.55, back)})`}}>
        <Ph n={c.n} pos={c.pos} k={t / 4.2} style={{inset: 0, borderRadius: c.r}} />
      </div>
    ))}
    <div style={{position: 'absolute', left: 80, top: 1400, fontFamily: FONT, color: K.ink, lineHeight: 1.05}}>
      <Rise t={t} at={0.9} style={{fontWeight: 300, fontSize: 64}}>Aprender jugando,</Rise>
      <Rise t={t} at={1.02} style={{fontWeight: 900, fontSize: 64}}>al aire libre.</Rise>
    </div>
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
  const origins: [number, number][] = [
    [140, 275],
    [W, H],
    [0, 960],
    [W, 300],
    [540, H],
    [0, 0],
  ];
  const stop = (i: number, lt: number) => {
    switch (i) {
      case 0:
        return <StopArch t={lt} i={0} main={['03', '50% 40%']} side={['37', '45% 30%']} />;
      case 1:
        return (
          <StopCuts
            t={lt}
            i={1}
            shots={[
              ['28', '40% 25%'],
              ['38', '45% 35%'],
              ['29', '50% 40%'],
              ['32', '55% 45%'],
            ]}
          />
        );
      case 2:
        return <StopSplit t={lt} i={2} top={[['33', '50% 50%']]} bottom={[['35', '50% 56%']]} />;
      case 3:
        return <StopArch t={lt} i={3} main={['43', '55% 30%']} side={['44', '60% 25%']} />;
      case 4:
        return (
          <StopCuts
            t={lt}
            i={4}
            shots={[
              ['15', '50% 60%'],
              ['10', '50% 40%'],
              ['12', '50% 30%'],
              ['23', '50% 35%'],
            ]}
          />
        );
      default:
        return (
          <StopSplit
            t={lt}
            i={5}
            top={[
              ['47', '50% 12%'],
              ['48', '65% 30%'],
            ]}
            bottom={[
              ['50', '50% 60%'],
              ['52', '50% 45%'],
            ]}
          />
        );
    }
  };
  return (
    <AbsoluteFill style={{background: K.orange}}>
      <style>{fontCss}</style>
      <Scene t={t} at={T.intro} until={T.map} bg={K.orange} first>
        {(lt) => <Intro t={lt} />}
      </Scene>
      <Scene t={t} at={T.map} until={T.bus} bg={K.gray} origin={[740, 1500]}>
        {(lt) => <RouteMap t={lt} />}
      </Scene>
      <Scene t={t} at={T.bus} until={T.arrive} bg={K.ink} origin={[440, 760]}>
        {(lt) => <Bus t={lt} />}
      </Scene>
      <Scene t={t} at={T.arrive} until={T.trail} bg={K.orange} origin={[0, 1400]}>
        {(lt) => <Arrive t={lt} />}
      </Scene>
      <Scene t={t} at={T.trail} until={T.stops} bg={K.tint} origin={[W, 300]}>
        {(lt) => <Trail t={lt} />}
      </Scene>
      {STOPS.map((_, i) => (
        <Scene key={i} t={t} at={s(i)} until={s(i + 1)} bg={i % 3 === 0 ? K.tint : K.ink} origin={origins[i]}>
          {(lt) => stop(i, lt)}
        </Scene>
      ))}
      <Scene t={t} at={T.close} until={T.outro} bg={K.tint} origin={[W / 2, H / 2]}>
        {(lt) => <Close t={lt} />}
      </Scene>
      <Scene t={t} at={T.outro} until={T.end} bg={K.white} origin={[W / 2, 1500]}>
        {(lt) => <Outro t={lt} />}
      </Scene>
    </AbsoluteFill>
  );
};
