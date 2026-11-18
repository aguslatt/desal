import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeIO, easeIn, easeOut, lerp, prog} from '../ui';
import {
  ARC_IN,
  ARC_OUT,
  BALL,
  FAM_OUT,
  HOOK_OUT,
  MATTE,
  NET_OUT,
  T_FAM,
  T_HOOK,
  T_NET,
  BIG_OUT,
  BIG_WINDOWS,
  BIG_WORDS,
  CHUNKS,
  CLAVE_OUT,
  OUTRO_AT,
  PILL_OUT,
  PLATE_IN,
  PLATE_OUT,
  SNAP,
  SRC_FRAMES,
  T_BTN,
  T_CADA,
  T_CADA_OUT,
  T_CLAVE,
  T_PILL,
  WORDS,
} from './data';

// Estimulación temprana = tinte fucsia + acentos fucsia. No other colours exist in this piece.
export const P = {pink: '#ED2995', tint: '#FBD4EA', ink: '#000000', white: '#FFFFFF', gray: '#EFEFEF'};
export const FONT = "'Montserrat', sans-serif";
export const TRAZO = 'M10 96 C 70 98, 120 92, 156 74 C 196 54, 204 16, 178 12 C 150 8, 146 54, 182 76 C 220 98, 300 98, 390 92';

export const fontCss = () =>
  [500, 600, 700, 800, 900]
    .map(
      (w) =>
        `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(
          `fonts/montserrat-latin-${w}-normal.woff2`,
        )}') format('woff2');}`,
    )
    .join('\n');

const back = Easing.out(Easing.back(2.2));
/** scale-in from 80 % to 100 % with a small overshoot */
const pop = (t: number, t0: number, dur = 0.28) => lerp(0.8, 1, prog(t, t0, dur, back));
const fade = (t: number, t0: number, dur = 0.1) => prog(t, t0, dur, (x) => x);

// ---------------------------------------------------------------------------
// camera: normal / punch-in alternation on top of the untouched edit
// ---------------------------------------------------------------------------
type Seg = {t: number; s0: number; s1: number; ox: number; oy: number; cut?: boolean};
const SEGS: Seg[] = [
  {t: 0, s0: 1, s1: 1, ox: 430, oy: 620, cut: true},
  {t: SNAP - 0.03, s0: 1.15, s1: 1.17, ox: 430, oy: 620},
  {t: 0.633, s0: 1, s1: 1.03, ox: 486, oy: 490, cut: true},
  {t: 1.5, s0: 1, s1: 1.03, ox: 486, oy: 540, cut: true},
  {t: 2.94, s0: 1.13, s1: 1.16, ox: 486, oy: 540},
  {t: 4.267, s0: 1, s1: 1, ox: 540, oy: 960, cut: true},
  {t: 6.0, s0: 1, s1: 1.03, ox: 567, oy: 946, cut: true},
  {t: 7.24, s0: 1.12, s1: 1.15, ox: 567, oy: 946},
  {t: 8.767, s0: 1, s1: 1.05, ox: 513, oy: 946, cut: true},
  {t: 10.767, s0: 1, s1: 1.04, ox: 420, oy: 900, cut: true},
  {t: 12.8, s0: 1, s1: 1.03, ox: 550, oy: 850, cut: true},
  {t: 14.74, s0: 1.15, s1: 1.18, ox: 550, oy: 850},
  {t: 16.7, s0: 1, s1: 1.06, ox: 500, oy: 900, cut: true},
  {t: 20.167, s0: 1, s1: 1.02, ox: 500, oy: 900, cut: true},
  {t: T_CLAVE, s0: 1.08, s1: 1.1, ox: 500, oy: 900},
  {t: 22.1, s0: 1, s1: 1.03, ox: 600, oy: 940, cut: true},
  {t: 24.22, s0: 1.13, s1: 1.15, ox: 600, oy: 940},
  {t: 26.1, s0: 1, s1: 1.02, ox: 600, oy: 940},
  {t: 27.633, s0: 1, s1: 1.05, ox: 486, oy: 820, cut: true},
  {t: 29.467, s0: 1, s1: 1.03, ox: 486, oy: 892, cut: true},
  {t: 31.15, s0: 1.13, s1: 1.15, ox: 486, oy: 892},
  {t: T_BTN - 0.05, s0: 1, s1: 1.02, ox: 486, oy: 892},
];
const camAt = (t: number) => {
  let i = 0;
  while (i < SEGS.length - 1 && t >= SEGS[i + 1].t) i++;
  const g = SEGS[i];
  const end = SEGS[i + 1]?.t ?? 34.1;
  let s = lerp(g.s0, g.s1, clamp((t - g.t) / (end - g.t), 0, 1));
  if (!g.cut && i > 0) s = lerp(SEGS[i - 1].s1, s, prog(t, g.t, 4 / 30, easeOut)); // punch in 4 frames
  return {s, ox: g.ox, oy: g.oy};
};

// ---------------------------------------------------------------------------
// brand pieces
// ---------------------------------------------------------------------------
const Trazo: React.FC<{t: number; t0: number; left: number; top: number; w: number; dur?: number}> = ({t, t0, left, top, w, dur = 0.6}) => {
  const p = prog(t, t0, dur, easeIO);
  if (p <= 0) return null;
  return (
    <svg viewBox="0 0 400 120" width={w} height={(w * 120) / 400} style={{position: 'absolute', left, top, overflow: 'visible'}}>
      <path d={TRAZO} pathLength={1} fill="none" stroke={P.pink} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${p} 2`} />
    </svg>
  );
};

/** white block behind black ExtraBold/Black type */
const Strip: React.FC<{children: React.ReactNode; size: number; weight?: number; inv?: boolean; style?: React.CSSProperties}> = ({children, size, weight = 900, inv, style}) => (
  <div
    style={{
      display: 'inline-block',
      background: inv ? P.pink : P.white,
      color: inv ? P.white : P.ink,
      fontFamily: FONT,
      fontWeight: weight,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: '-0.02em',
      padding: `${size * 0.14}px ${size * 0.2}px ${size * 0.16}px`,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

const Button: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => (
  <div
    style={{
      display: 'inline-block',
      background: P.ink,
      color: P.white,
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1,
      padding: `${size * 0.52}px ${size * 0.95}px`,
      borderRadius: 999,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    Comentá INFO
  </div>
);

/** the only transition: a fuchsia circle that expands, with the tint following right behind */
const CircleCover: React.FC<{t: number; t0: number; x: number; y: number; dur?: number}> = ({t, t0, x, y, dur = 0.3}) => {
  if (t < t0) return null;
  const R = 2300;
  const a = prog(t, t0, dur, easeIn) * R;
  const b = prog(t, t0 + 0.09, dur, easeIn) * R;
  const c = (r: number, col: string) => (
    <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: col}} />
  );
  return (
    <>
      {c(a, P.pink)}
      {c(b, P.tint)}
    </>
  );
};

// ---------------------------------------------------------------------------
// captions: 2-4 words, black Bold on a white block, one fuchsia word
// ---------------------------------------------------------------------------
const Captions: React.FC<{t: number}> = ({t}) => {
  if (BIG_WINDOWS.some(([a, b]) => t >= a && t < b)) return null;
  const idx = CHUNKS.findIndex((c, i) => !c.hidden && t >= c.s - 0.05 && t < Math.min(c.e + 0.3, (CHUNKS[i + 1]?.s ?? 99) - 0.05));
  if (idx < 0) return null;
  const c = CHUNKS[idx];
  const words = WORDS.slice(c.i0, c.i0 + c.n);
  const k = prog(t, c.s - 0.05, 0.14, easeOut);
  return (
    <div style={{position: 'absolute', left: 80, width: 880, top: 1352, height: 148, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          background: P.white,
          color: P.ink,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 56,
          lineHeight: 1,
          letterSpacing: '-0.01em',
          padding: '18px 28px 20px',
          whiteSpace: 'nowrap',
          opacity: k,
          transform: `translateY(${(1 - k) * 14}px) scale(${lerp(0.94, 1, k)})`,
        }}
      >
        {words
          .map((w, i) => ({w, i}))
          .filter((x) => x.w.w)
          .map(({w, i}, j) => {
            const said = prog(t, w.s - 0.06, 0.12, easeOut);
            return (
              <React.Fragment key={i}>
                {j > 0 ? ' ' : ''}
                <span style={{display: 'inline-block', opacity: 0.3 + 0.7 * said, transform: `translateY(${(1 - said) * 8}px)`, ...(i === c.hi ? {color: P.pink, fontWeight: 800} : {})}}>{w.w}</span>
              </React.Fragment>
            );
          })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// scenes
// ---------------------------------------------------------------------------
/** Block 1a · the snap: ring bursts from Andy's hand */
const SnapRing: React.FC<{t: number}> = ({t}) => {
  const p = prog(t, SNAP - 0.03, 0.42, easeOut);
  if (p <= 0 || p >= 1) return null;
  const ring = (r: number, sw: number, o: number) => (
    <div style={{position: 'absolute', left: 215 - r, top: 640 - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `${sw}px solid ${P.pink}`, boxSizing: 'border-box', opacity: o}} />
  );
  return (
    <>
      {ring(lerp(60, 560, p), lerp(64, 18, p), 1 - p * p * p)}
      {ring(lerp(30, 300, prog(t, SNAP + 0.03, 0.4, easeOut)), 26, 1 - prog(t, SNAP + 0.03, 0.4, easeOut))}
    </>
  );
};

const fmt = (n: number) => Math.round(n).toLocaleString('de-DE');
/** Block 1b · full-screen tint plate with the counter */
const CounterPlate: React.FC<{t: number}> = ({t}) => {
  const t0 = PLATE_IN;
  if (t < t0 - 0.3 || t >= PLATE_OUT) return null;
  const cp = prog(t, t0 + 0.08, 0.95, Easing.out(Easing.exp));
  const done = t >= t0 + 0.08 + 0.95;
  const val = done ? 1000000 : Math.min(999999, 1000000 * cp);
  const bump = 1 + 0.07 * Math.sin(prog(t, t0 + 1.03, 0.35, easeOut) * Math.PI);
  const head = prog(t, t0 + 0.02, 0.55, back);
  const sub = prog(t, t0 + 0.45, 0.4, easeOut);
  return (
    <>
      <CircleCover t={t} t0={t0 - 0.27} x={540} y={900} />
      {t >= t0 - 0.02 && (
        <>
          {/* la cabeza: big fuchsia circle coming in from the top-right edge */}
          <div style={{position: 'absolute', left: 770, top: 40, width: 640, height: 640, borderRadius: '50%', background: P.pink, transform: `scale(${head})`, transformOrigin: '80% 20%'}} />
          <Net t={t} t0={t0 + 0.1} nodes={PLATE_NODES} edges={PLATE_EDGES} node={P.white} step={0.085} />
          <div
            style={{
              position: 'absolute',
              left: 0,
              width: 1080,
              top: 830,
              textAlign: 'center',
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 170,
              lineHeight: 1,
              letterSpacing: '-0.035em',
              fontVariantNumeric: 'tabular-nums',
              color: P.ink,
              transform: `scale(${bump})`,
            }}
          >
            {done ? '+' : ''}
            {fmt(val)}
          </div>
          <div style={{position: 'absolute', left: 0, width: 1080, top: 1040, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 56, color: P.ink, opacity: sub, transform: `translateY(${(1 - sub) * 20}px)`}}>
            conexiones nuevas <span style={{color: P.pink, fontWeight: 800}}>por segundo</span>
          </div>
        </>
      )}
    </>
  );
};

/** Block 2 · "cada segundo" + small source credit */
const Second: React.FC<{t: number}> = ({t}) => {
  const show = t >= T_CADA - 0.03 && t < T_CADA_OUT;
  const credit = t >= 6.12 && t < 9.25;
  const ck = Math.min(prog(t, 6.12, 0.3, easeOut), 1 - prog(t, 9.0, 0.25, easeIn));
  return (
    <>
      {show && (
        <div style={{position: 'absolute', left: 80, top: 360}}>
          <div style={{transform: `scale(${pop(t, T_CADA - 0.03)})`, transformOrigin: '0 100%', opacity: fade(t, T_CADA - 0.03)}}>
            <Strip size={150}>CADA</Strip>
          </div>
          <div style={{marginTop: -2, transform: `scale(${pop(t, T_CADA + 0.24)})`, transformOrigin: '0 0', opacity: fade(t, T_CADA + 0.24)}}>
            <Strip size={150}>
              <span style={{color: P.pink}}>SEGUNDO</span>
            </Strip>
          </div>
        </div>
      )}
      {credit && (
        <div style={{position: 'absolute', left: 80, top: 1522, background: P.white, color: P.ink, fontFamily: FONT, fontWeight: 600, fontSize: 24, lineHeight: 1, padding: '12px 16px', whiteSpace: 'nowrap', opacity: ck}}>
          Fuente: Center on the Developing Child, Universidad de Harvard
        </div>
      )}
    </>
  );
};

/** Block 3 · JUGAR · MIRAR · HABLAR · RESPONDER, one by one, exactly when Andy says them.
 *  Rendered between the footage and Andy's cut-out, so her head overlaps the block. */
const BigWords: React.FC<{t: number}> = ({t}) => {
  if (t < BIG_WORDS[0].t - 0.03 || t >= BIG_OUT) return null;
  let i = 0;
  while (i < BIG_WORDS.length - 1 && t >= BIG_WORDS[i + 1].t - 0.03) i++;
  const w = BIG_WORDS[i];
  const t0 = w.t - 0.03;
  return (
    <>
      {/* progress: four heads, the spoken ones filled */}
      <div style={{position: 'absolute', left: 0, width: 1080, top: 560, display: 'flex', justifyContent: 'center', gap: 22}}>
        {BIG_WORDS.map((x, j) => (
          <div key={j} style={{width: 38, height: 38, borderRadius: '50%', background: j <= i ? P.pink : P.white, transform: `scale(${j === i ? pop(t, t0) : 1})`}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, width: 1080, top: 636, textAlign: 'center'}}>
        <div style={{display: 'inline-block', transform: `scale(${pop(t, t0)}) rotate(${i % 2 ? 2 : -2}deg)`, opacity: fade(t, t0, 0.07)}}>
          <Strip size={w.text.length > 7 ? 126 : 200} inv={i % 2 === 1}>
            {w.text}
          </Strip>
        </div>
      </div>
    </>
  );
};

/** Block 4 · "clave" with the brand stroke drawing underneath, then the service label */
const Clave: React.FC<{t: number}> = ({t}) => {
  if (t < T_CLAVE || t >= CLAVE_OUT) return null;
  return (
    <>
      <div style={{position: 'absolute', left: 0, width: 1080, top: 1196, textAlign: 'center'}}>
        <div style={{display: 'inline-block', transform: `scale(${pop(t, T_CLAVE)})`, opacity: fade(t, T_CLAVE, 0.07)}}>
          <Strip size={190}>CLAVE</Strip>
        </div>
      </div>
      <Trazo t={t} t0={T_CLAVE + 0.08} left={300} top={1436} w={480} dur={0.5} />
    </>
  );
};

const Pill: React.FC<{t: number}> = ({t}) => {
  if (t < T_PILL || t >= PILL_OUT) return null;
  return (
    <div style={{position: 'absolute', left: 0, width: 1080, top: 380, textAlign: 'center'}}>
      <span
        style={{
          display: 'inline-block',
          background: P.pink,
          color: P.white,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 36,
          letterSpacing: '0.06em',
          lineHeight: 1,
          padding: '22px 38px',
          borderRadius: 999,
          whiteSpace: 'nowrap',
          opacity: fade(t, T_PILL, 0.08),
          transform: `scale(${pop(t, T_PILL, 0.36)})`,
        }}
      >
        ESTIMULACIÓN TEMPRANA
      </span>
    </div>
  );
};

/** Block 5 · the one CTA */
const Cta: React.FC<{t: number}> = ({t}) => {
  if (t < T_BTN) return null;
  return (
    <div style={{position: 'absolute', left: 0, width: 1080, top: 392, textAlign: 'center'}}>
      <Button size={52} style={{transform: `scale(${pop(t, T_BTN, 0.34)})`, opacity: fade(t, T_BTN, 0.08)}} />
    </div>
  );
};

/** End card: tint, full colour logo, button, signature with the stroke */
const Outro: React.FC<{t: number}> = ({t}) => {
  const t0 = OUTRO_AT;
  if (t < t0) return null;
  const a = t0 + 0.38;
  const logo = prog(t, a, 0.45, easeOut);
  const sig = prog(t, a + 0.45, 0.45, easeOut);
  const head = prog(t, a - 0.05, 0.6, back);
  return (
    <>
      <CircleCover t={t} t0={t0} x={540} y={450} dur={0.32} />
      {t >= a - 0.05 && (
        <>
          <div style={{position: 'absolute', left: -250, top: 1330, width: 700, height: 700, borderRadius: '50%', background: P.pink, transform: `scale(${head})`, transformOrigin: '20% 80%'}} />
          <Img src={staticFile('brand/logo-color.png')} style={{position: 'absolute', left: 540 - 150, top: 560, width: 300, opacity: logo, transform: `translateY(${(1 - logo) * 24}px)`}} />
          <div style={{position: 'absolute', left: 0, width: 1080, top: 880, textAlign: 'center'}}>
            <Button size={72} style={{transform: `scale(${pop(t, a + 0.2, 0.36)})`, opacity: fade(t, a + 0.2, 0.08)}} />
          </div>
          <div style={{position: 'absolute', left: 0, width: 1080, top: 1160, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 42, color: P.ink, opacity: sig, transform: `translateY(${(1 - sig) * 16}px)`}}>
            Acompañar con amor hace la diferencia
          </div>
          <Trazo t={t} t0={a + 0.6} left={370} top={1222} w={340} dur={0.7} />
        </>
      )}
    </>
  );
};

/** Brand tab: the full colour logo on a white arch that hangs from the top edge (anchored, never floating). */
const LogoTab: React.FC<{t: number}> = ({t}) => {
  const p = prog(t, 0.63, 0.5, back);
  const q = prog(t, OUTRO_AT + 0.05, 0.25, easeIn);
  if (p <= 0 || q >= 1) return null;
  return (
    <div style={{position: 'absolute', left: 540 - 170, top: 0, width: 340, height: 336, borderRadius: '0 0 170px 170px', background: P.white, transform: `translateY(${(1 - p) * -340 - q * 340}px)`}}>
      <Img src={staticFile('brand/logo-color.png')} style={{position: 'absolute', left: 60, top: 176, width: 220}} />
    </div>
  );
};

/** Hook for people watching muted */
const Hook: React.FC<{t: number}> = ({t}) => {
  if (t < T_HOOK || t >= HOOK_OUT) return null;
  return (
    <div style={{position: 'absolute', left: 80, top: 1130}}>
      <div style={{transform: `scale(${pop(t, T_HOOK)}) rotate(-3deg)`, transformOrigin: '0 100%', opacity: fade(t, T_HOOK, 0.06)}}>
        <Strip size={168}>¿VISTE</Strip>
      </div>
      <div style={{marginTop: -6, marginLeft: 70, transform: `scale(${pop(t, T_HOOK + 0.3)}) rotate(-3deg)`, transformOrigin: '0 0', opacity: fade(t, T_HOOK + 0.3, 0.06)}}>
        <Strip size={168} inv>
          ESO?
        </Strip>
      </div>
    </div>
  );
};

/** "Conexiones": brand heads (circles) that get linked one by one */
type Pt = [number, number, number];
const PLATE_NODES: Pt[] = [[130, 470, 26], [320, 610, 18], [120, 720, 20], [150, 1290, 24], [370, 1420, 18], [170, 1580, 20], [570, 1330, 20], [770, 1480, 26], [950, 1300, 18], [930, 1610, 22], [560, 1650, 18]];
const PLATE_EDGES: [number, number][] = [[0, 1], [1, 2], [0, 2], [3, 4], [4, 5], [3, 5], [4, 6], [6, 7], [7, 8], [7, 9], [6, 10], [9, 10], [5, 10]];
const WALL_NODES: Pt[] = [[150, 470, 26], [320, 400, 18], [290, 610, 20], [520, 480, 24], [770, 400, 20], [940, 520, 26], [790, 620, 18], [120, 660, 18]];
const WALL_EDGES: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5], [5, 6], [3, 6], [2, 7]];
const Net: React.FC<{t: number; t0: number; t1?: number; nodes: Pt[]; edges: [number, number][]; node: string; step: number}> = ({t, t0, t1, nodes, edges, node, step}) => {
  if (t < t0 || (t1 !== undefined && t >= t1)) return null;
  const born = nodes.map(() => 99);
  born[edges[0][0]] = t0;
  edges.forEach(([a, b], k) => {
    const te = t0 + 0.08 + k * step;
    born[b] = Math.min(born[b], te + step * 0.8);
    born[a] = Math.min(born[a], te);
  });
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      {edges.map(([a, b], k) => {
        const e = prog(t, t0 + 0.08 + k * step, step * 1.6, easeIO);
        if (e <= 0) return null;
        const [x1, y1] = nodes[a];
        const [x2, y2] = nodes[b];
        return <line key={k} x1={x1} y1={y1} x2={lerp(x1, x2, e)} y2={lerp(y1, y2, e)} stroke={P.pink} strokeWidth={7} strokeLinecap="round" />;
      })}
      {nodes.map(([x, y, r], k) => {
        const g = prog(t, born[k], 0.3, back);
        return g > 0 ? <circle key={k} cx={x} cy={y} r={r * g} fill={node} stroke={P.pink} strokeWidth={node === P.white ? 7 : 0} /> : null;
      })}
    </svg>
  );
};

/** "…por la familia" */
const Familia: React.FC<{t: number}> = ({t}) => {
  if (t < T_FAM || t >= FAM_OUT) return null;
  return (
    <>
      <div style={{position: 'absolute', left: 0, width: 1080, top: 1210, textAlign: 'center'}}>
        <div style={{display: 'inline-block', transform: `scale(${pop(t, T_FAM)})`, opacity: fade(t, T_FAM, 0.07)}}>
          <Strip size={132}>
            EN <span style={{color: P.pink}}>FAMILIA</span>
          </Strip>
        </div>
      </div>
      <Trazo t={t} t0={T_FAM + 0.1} left={320} top={1392} w={440} dur={0.45} />
    </>
  );
};

const pad4 = (n: number) => String(n).padStart(4, '0');

export const Estim: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cam = camAt(t);
  const ring = prog(t, BALL.t0, 0.3, easeIO);
  const ringOut = prog(t, BALL.t1 - 0.2, 0.2, (x) => x);
  const C = 2 * Math.PI * BALL.r;
  const arc = t >= ARC_IN && t < ARC_OUT; // Andy framed by "el arco" while she talks about ADIP
  const camStyle: React.CSSProperties = arc
    ? {position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `translate(${360 - 600 * cam.s}px, ${430 - 940 * cam.s}px) scale(${cam.s})`}
    : {position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${cam.ox}px ${cam.oy}px`, transform: `scale(${cam.s})`};
  const arcPop = lerp(0.9, 1, prog(t, ARC_IN, 0.4, back));
  const matte = frame >= MATTE[0] && frame <= MATTE[1];
  return (
    <AbsoluteFill style={{background: P.tint, fontFamily: FONT}}>
      <style>{fontCss()}</style>
      {arc && (
        <>
          <div style={{position: 'absolute', left: 430, top: 760, width: 800, height: 800, borderRadius: '50%', background: P.pink, transform: `scale(${prog(t, ARC_IN, 0.5, back)})`}} />
          <div style={{position: 'absolute', left: -90, top: 560, width: 300, height: 300, borderRadius: '50%', background: P.white, transform: `scale(${prog(t, ARC_IN + 0.12, 0.5, back)})`}} />
        </>
      )}
      <div
        style={
          arc
            ? {position: 'absolute', left: 180, top: 500, width: 720, height: 880, overflow: 'hidden', borderRadius: '360px 360px 0 0', transformOrigin: '50% 100%', transform: `scale(${arcPop})`}
            : {position: 'absolute', inset: 0, overflow: 'hidden'}
        }
      >
        <div style={camStyle}>
          <Sequence durationInFrames={SRC_FRAMES} layout="none">
            <OffthreadVideo src={staticFile('estim/base.mp4')} muted style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, filter: 'contrast(1.03) saturate(1.05)'}} />
          </Sequence>
          {/* ring that frames the toy Andy lifts */}
          {t >= BALL.t0 && t < BALL.t1 && (
            <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - ringOut}}>
              <circle cx={BALL.x} cy={BALL.y} r={BALL.r} fill="none" stroke={P.pink} strokeWidth={16} strokeLinecap="round" strokeDasharray={`${ring * C} ${C}`} transform={`rotate(-90 ${BALL.x} ${BALL.y})`} />
            </svg>
          )}
        </div>
      </div>
      <BigWords t={t} />
      {matte && (
        <div style={{...camStyle}}>
          <Img src={staticFile(`estim/subj/s${pad4(frame)}.webp`)} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, filter: 'contrast(1.03) saturate(1.05)'}} />
        </div>
      )}
      <SnapRing t={t} />
      <Hook t={t} />
      <Second t={t} />
      <Net t={t} t0={T_NET} t1={NET_OUT} nodes={WALL_NODES} edges={WALL_EDGES} node={P.pink} step={0.12} />
      <Clave t={t} />
      <Pill t={t} />
      <Familia t={t} />
      {t < OUTRO_AT + 0.4 && <Cta t={t} />}
      {t < OUTRO_AT + 0.25 && <Captions t={t} />}
      <CounterPlate t={t} />
      <Outro t={t} />
      <LogoTab t={t} />
    </AbsoluteFill>
  );
};
