import React from 'react';
import {continueRender, delayRender, Img, staticFile} from 'remotion';
import {fitText} from '@remotion/layout-utils';
import {FONT, GRAD, K, W, H, clamp, easeInCubic, easeInOutCubic, easeOutExpo, lin, prog} from './tokens';

// ---------------------------------------------------------------- fuentes
const WEIGHTS = [300, 400, 500, 600, 700, 800, 900];
const css = WEIGHTS.map(
  (w) =>
    `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(
      `fonts/montserrat-latin-${w}-normal.woff2`,
    )}') format('woff2');}`,
).join('\n');

export const Fonts: React.FC = () => {
  const [handle] = React.useState(() => delayRender('fuentes'));
  React.useEffect(() => {
    Promise.all(WEIGHTS.map((w) => document.fonts.load(`${w} 40px Montserrat`, '¿Aá0123456789'))).then(() => continueRender(handle));
  }, [handle]);
  return <style>{css}</style>;
};

// ---------------------------------------------------------------- texto que sube desde una máscara
/** Línea de texto que entra deslizando desde una máscara (y sale hacia arriba en t1). */
export const Rise: React.FC<{
  t: number;
  t0: number;
  t1?: number;
  dur?: number;
  outDur?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
  pad?: number; // aire de la máscara (px) para no cortar tildes ni colas
}> = ({t, t0, t1, dur = 0.6, outDur = 0.35, style, children, pad = 22}) => {
  const pin = prog(t, t0, dur, easeOutExpo);
  const pout = t1 === undefined ? 0 : prog(t, t1, outDur, easeInCubic);
  if (t < t0 - 0.02 || (t1 !== undefined && t > t1 + outDur)) return null;
  return (
    <div style={{position: 'absolute', overflow: 'hidden', paddingTop: pad, paddingBottom: pad, marginTop: -pad, marginBottom: -pad, whiteSpace: 'nowrap', fontFamily: FONT, ...style}}>
      <div style={{transform: `translateY(${(1 - pin) * 112 - pout * 112}%)`}}>{children}</div>
    </div>
  );
};

// ---------------------------------------------------------------- cabeza (círculo pleno, recurso del logo)
export const Head: React.FC<{
  t: number;
  t0: number;
  cx: number;
  cy: number;
  r: number;
  color: string;
  label?: string;
  ink?: string;
  size?: number;
  dur?: number;
  t1?: number;
}> = ({t, t0, cx, cy, r, color, label, ink = K.white, size = 30, dur = 0.55, t1}) => {
  const p = prog(t, t0, dur, easeOutExpo) * (t1 === undefined ? 1 : 1 - prog(t, t1, 0.3, easeInCubic));
  if (p <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        background: color,
        transform: `scale(${p})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        color: ink,
        lineHeight: 1,
      }}
    >
      {label}
    </div>
  );
};

// ---------------------------------------------------------------- el trazo (hilo)
export const ThreadDefs: React.FC<{id: string; x1?: number; y1?: number; x2?: number; y2?: number}> = ({id, x1 = 0, y1 = 0, x2 = W, y2 = 0}) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
    {GRAD.map(([o, c]) => (
      <stop key={o} offset={o} stopColor={c} />
    ))}
  </linearGradient>
);

/**
 * Trazo continuo de puntas redondeadas. Se dibuja (t0, dur) y puede retirarse desde la cola (t1, outDur):
 * visible = tramo [cola, cabeza] del recorrido.
 */
export const Thread: React.FC<{
  t: number;
  d: string;
  t0: number;
  dur: number;
  t1?: number;
  outDur?: number;
  w?: number;
  color?: string; // si falta, degradé ADIP
  gx?: [number, number, number, number]; // vector del degradé (x1,y1,x2,y2)
  ease?: (x: number) => number;
  id: string;
}> = ({t, d, t0, dur, t1, outDur = 0.5, w = 14, color, gx, ease = easeInOutCubic, id}) => {
  const head = prog(t, t0, dur, ease);
  const tail = t1 === undefined ? 0 : prog(t, t1, outDur, easeInOutCubic);
  const len = head - tail;
  if (len < 0.003) return null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {!color && <defs><ThreadDefs id={id} x1={gx?.[0]} y1={gx?.[1]} x2={gx?.[2]} y2={gx?.[3]} /></defs>}
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={color ?? `url(#${id})`}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${len} 2`}
        strokeDashoffset={-tail}
      />
    </svg>
  );
};

// ---------------------------------------------------------------- etiqueta (cabeza + texto)
export const Label: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; dot?: string; children: string; color?: string}> = ({t, t0, t1, x, y, dot = K.pink, children, color = K.ink}) => {
  const p = prog(t, t0, 0.5, easeOutExpo) * (t1 === undefined ? 1 : 1 - prog(t, t1, 0.3, lin));
  if (p <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT, fontWeight: 800, fontSize: 28, letterSpacing: '0.06em', color, opacity: p, transform: `translateY(${(1 - p) * 10}px)`, whiteSpace: 'nowrap'}}>
      <div style={{width: 20, height: 20, borderRadius: '50%', background: dot}} />
      {children}
    </div>
  );
};

// ---------------------------------------------------------------- logo oficial
export const Logo: React.FC<{t: number; t0: number; t1?: number; y?: number; w?: number; kind?: 'color' | 'blanco' | 'negro'}> = ({t, t0, t1, y = 262, w = 200, kind = 'color'}) => {
  const p = prog(t, t0, 0.5, easeOutExpo) * (t1 === undefined ? 1 : 1 - prog(t, t1, 0.35, lin));
  if (p <= 0.001) return null;
  return (
    <Img src={staticFile(`brand/logo_adip_${kind}.png`)} style={{position: 'absolute', left: (W - w) / 2, top: y, width: w, opacity: p, transform: `translateY(${(1 - p) * 8}px)`}} />
  );
};

// ---------------------------------------------------------------- ajuste de texto a ancho
export const fit = (text: string, weight: number, max: number, within: number, min = 40) => {
  const {fontSize} = fitText({text, withinWidth: within, fontFamily: 'Montserrat', fontWeight: String(weight)});
  return clamp(Math.floor(fontSize), min, max);
};
