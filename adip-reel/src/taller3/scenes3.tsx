import React from 'react';
import {Freeze, Img, OffthreadVideo, staticFile} from 'remotion';
import {easeIO, easeIn, easeOut, lerp, prog} from '../ui';
import {FONT, GRADIENT, K, Rise, Trazo, Wipe, abs} from '../charla/kit';
import {CHUNKS} from '../taller/data';

const INK = K.ink;
export const TINT = '#FFE6D2'; // tinte naranja de la marca

/** headline line: left aligned at the 80 px margin, rises out of a mask */
const H: React.FC<{t: number; t0: number; t1?: number; y: number; size: number; weight: number; color?: string; x?: number; ls?: string; children: React.ReactNode}> = ({
  t,
  t0,
  t1,
  y,
  size,
  weight,
  color = INK,
  x = 80,
  ls = '-0.02em',
  children,
}) => (
  <div style={abs(x, y, {fontSize: size, fontWeight: weight, color, lineHeight: 1.04, letterSpacing: ls})}>
    <Rise t={t} t0={t0} t1={t1}>
      {children}
    </Rise>
  </div>
);

/** soft white veils: text lives on the top one, subtitles on the bottom one */
export const Veils: React.FC<{two?: boolean}> = ({two}) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 1080,
        height: two ? 1020 : 860,
        background: two
          ? 'linear-gradient(to bottom, #fff 0%, #fff 76%, rgba(255,255,255,0.6) 90%, rgba(255,255,255,0) 100%)'
          : 'linear-gradient(to bottom, #fff 0%, #fff 46%, rgba(255,255,255,0.75) 62%, rgba(255,255,255,0) 100%)',
      }}
    />
    <div style={{position: 'absolute', left: 0, top: 1280, width: 1080, height: 640, background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.80) 38%, rgba(255,255,255,0.97) 62%, #fff 100%)'}} />
  </>
);

export const Logo: React.FC<{t: number; t0: number; t1?: number}> = ({t, t0, t1}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 236, display: 'flex', justifyContent: 'center'}}>
    <Wipe t={t} t0={t0} t1={t1} dur={0.6}>
      <Img src={staticFile('brand/logo-color.png')} style={{width: 190, height: 85, display: 'block'}} />
    </Wipe>
  </div>
);

/** • SMALL LABEL (ExtraBold, tracked, with the colour dot) */
export const Tag: React.FC<{t: number; t0: number; t1?: number; text: string; y?: number; dot?: string}> = ({t, t0, t1, text, y = 346, dot = K.orange}) => {
  const a = prog(t, t0, 0.5, easeOut);
  const b = t1 !== undefined ? prog(t, t1, 0.3, easeIn) : 0;
  if (a <= 0 || b >= 1) return null;
  return (
    <div style={abs(80, y, {display: 'flex', alignItems: 'center', gap: 14, opacity: (1 - b) * a, transform: `translateY(${(1 - a) * 10}px)`})}>
      <div style={{width: 16, height: 16, borderRadius: 16, background: dot}} />
      <div style={{fontSize: 26, fontWeight: 800, letterSpacing: '0.1em', color: INK}}>{text}</div>
    </div>
  );
};

/** numbered list: coloured heads with a number, joined by one line */
export type Item = {n: string; text: string; t0: number};
export const NumList: React.FC<{t: number; t1: number; items: Item[]; x?: number; y: number; step: number; size: number; weight?: number; head?: number}> = ({
  t,
  t1,
  items,
  x = 80,
  y,
  step,
  size,
  weight = 800,
  head = 52,
}) => {
  const cols = [K.violet, K.orange];
  return (
    <>
      {items.map((it, i) => {
        if (i === 0) return null;
        const seg = prog(t, it.t0 - 0.05, 0.45, easeIO);
        const q = prog(t, t1, 0.35, easeIn);
        return <div key={`l${i}`} style={{position: 'absolute', left: x + head / 2 - 2, top: y + (i - 1) * step + head, width: 4, height: (step - head) * seg * (1 - q), background: INK, borderRadius: 4}} />;
      })}
      {items.map((it, i) => {
        const a = prog(t, it.t0 - 0.1, 0.45, easeOut);
        const b = prog(t, t1 + i * 0.04, 0.3, easeIn);
        if (a <= 0 || b >= 1) return null;
        const col = cols[i % 2];
        return (
          <div key={it.n} style={abs(x, y + i * step, {display: 'flex', alignItems: 'center', gap: 22, opacity: 1 - b})}>
            <div style={{width: head, height: head, borderRadius: head, background: col, color: col === K.orange ? INK : K.white, fontSize: head * 0.52, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${a})`}}>{it.n}</div>
            <div style={{fontSize: size, fontWeight: weight, color: INK, letterSpacing: '-0.015em', lineHeight: 1}}>
              <Rise t={t} t0={it.t0} t1={t1 + i * 0.04}>
                {it.text}
              </Rise>
            </div>
          </div>
        );
      })}
    </>
  );
};

/** duotone icon on a white circle (manual: black stroke + one filled detail) */
export const IconRow: React.FC<{t: number; t0: number; t1: number; y: number; kind: 'phone' | 'tablet'; text: string}> = ({t, t0, t1, y, kind, text}) => {
  const a = prog(t, t0 - 0.1, 0.5, easeOut);
  const b = prog(t, t1, 0.3, easeIn);
  if (a <= 0 || b >= 1) return null;
  const s = {fill: 'none', stroke: INK, strokeWidth: 3.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <div style={abs(80, y, {display: 'flex', alignItems: 'center', gap: 24, opacity: 1 - b, transform: `translateX(${(1 - a) * -60}px)`})}>
      <div style={{width: 96, height: 96, borderRadius: 96, background: '#EFEFEF', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <svg viewBox="0 0 48 48" width={60} height={60}>
          {kind === 'phone' ? (
            <>
              <rect x="14" y="5" width="20" height="38" rx="5" {...s} />
              <rect x="14" y="30" width="20" height="13" rx="5" fill={K.orange} stroke={INK} strokeWidth={3.4} />
              <path d="M21 9h6" {...s} />
            </>
          ) : (
            <>
              <rect x="6" y="11" width="36" height="26" rx="5" {...s} />
              <rect x="6" y="28" width="36" height="9" rx="4" fill={K.orange} stroke={INK} strokeWidth={3.4} />
            </>
          )}
        </svg>
      </div>
      <div style={{fontSize: 60, fontWeight: 800, letterSpacing: '-0.015em', color: INK}}>
        <Rise t={t} t0={t0} t1={t1}>
          {text}
        </Rise>
      </div>
    </div>
  );
};

/** key word with the brand stroke underneath (gradient = institutional use) */
export const KeyTrazo: React.FC<{t: number; t0: number; t1?: number; left?: number; top: number; w: number; id: string}> = ({t, t0, t1, left = 80, top, w, id}) => (
  <Trazo t={t} t0={t0} t1={t1} left={left} top={top} w={w} gradient dur={0.8} id={id} />
);

// ────────────────────────── subtitles ──────────────────────────
const parse = (text: string) =>
  text
    .split(/(\[[^\]]+\])/)
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^\[(.+)\|([\d.]+)\]$/);
      return m ? {w: m[1], kt: parseFloat(m[2])} : {w: part, kt: null as number | null};
    });

export const Subs: React.FC<{t: number}> = ({t}) => {
  const c = CHUNKS.find((x) => t >= x.s && t < x.e);
  if (!c) return null;
  const inP = prog(t, c.s, 0.18, easeOut);
  const outP = 1 - prog(t, c.e - 0.08, 0.08, (x) => x);
  const op = Math.min(inP, outP);
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 1400, height: 180, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT, opacity: op, transform: `translateY(${(1 - inP) * 12}px)`}}>
      <div style={{textAlign: 'center', fontSize: 52, lineHeight: 1.16, fontWeight: 700, color: INK, letterSpacing: '-0.012em', textWrap: 'balance' as any, textShadow: '0 0 18px rgba(255,255,255,0.95), 0 0 6px rgba(255,255,255,0.9)'}}>
        {parse(c.text).map((p, i) => {
          if (p.kt === null) return <React.Fragment key={i}>{p.w}</React.Fragment>;
          const on = t >= p.kt - 0.02;
          return (
            <span key={i} style={{color: on ? K.violet : INK, fontWeight: on ? 800 : 700}}>
              {p.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ────────────────────────── closing card ──────────────────────────
export const EndCard: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  if (t < t0) return null;
  const btn = prog(t, t0 + 2.2, 0.6, easeOut);
  const arch = prog(t, t0 + 1.3, 0.9, easeOut);
  return (
    <div style={{position: 'absolute', inset: 0, background: '#fff', fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080 * prog(t, t0 + 0.05, 0.9, easeIO), height: 14, background: `linear-gradient(90deg, ${GRADIENT.map(([o, c]) => `${c} ${o * 100}%`).join(',')})`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 262, display: 'flex', justifyContent: 'center'}}>
        <Wipe t={t} t0={t0 + 0.25} dur={0.7}>
          <Img src={staticFile('brand/logo-color.png')} style={{width: 240, height: 107, display: 'block'}} />
        </Wipe>
      </div>
      <H t={t} t0={t0 + 0.7} y={440} size={100} weight={300}>
        Taller para
      </H>
      <H t={t} t0={t0 + 0.95} y={544} size={86} weight={900} color={K.violet}>
        personas mayores
      </H>
      <Trazo t={t} t0={t0 + 1.35} left={80} top={640} w={440} gradient dur={0.9} id="tz3o" />
      {/* the two of them in the brand arch, with a circle behind */}
      <div style={{position: 'absolute', left: 280, top: 770, width: 520, height: 560, opacity: arch}}>
        <div style={{position: 'absolute', left: 300, top: 250, width: 300, height: 300, borderRadius: 300, background: K.orange, transform: `scale(${arch})`, transformOrigin: '30% 70%'}} />
        <div style={{position: 'absolute', left: 0, top: 0, width: 520, height: 560, borderRadius: '260px 260px 0 0', overflow: 'hidden', background: TINT, transform: `translateY(${(1 - arch) * 40}px)`}}>
          <Freeze frame={Math.round(52.3 * 30)}>
            <div style={{position: 'absolute', left: 0, top: 0, width: 2160, height: 3840, transformOrigin: '0 0', transform: 'translate(-141px, -598px) scale(0.4)'}}>
              <OffthreadVideo src={staticFile('taller/lu_4k.mp4')} muted style={{width: 2160, height: 3840}} />
            </div>
          </Freeze>
        </div>
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 1366, textAlign: 'center', fontSize: 52, fontWeight: 700, lineHeight: 1.18, color: INK, letterSpacing: '-0.012em'}}>
        <Rise t={t} t0={t0 + 1.8}>Escribinos para conocer</Rise>
        <br />
        <Rise t={t} t0={t0 + 1.95}>la propuesta</Rise>
      </div>
      {btn > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1486, display: 'flex', justifyContent: 'center', opacity: btn, transform: `translateY(${(1 - btn) * 24}px)`}}>
          <div style={{height: 96, padding: '0 54px', borderRadius: 48, background: K.orange, color: INK, fontSize: 42, fontWeight: 700, display: 'flex', alignItems: 'center'}}>
            Comentá&nbsp;<span style={{fontWeight: 900}}>INFO</span>
          </div>
        </div>
      )}
    </div>
  );
};
export {H};
