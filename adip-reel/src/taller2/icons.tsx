import React from 'react';
import {easeIO, easeOut, prog} from '../ui';
import {K} from '../charla/kit';

const ST = {fill: 'none', stroke: K.ink, strokeWidth: 6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
type P = {t: number; t0: number; size?: number; on?: boolean};
const wrap = (size: number, children: React.ReactNode) => (
  <svg viewBox="0 0 220 220" width={size} height={size} style={{overflow: 'visible'}}>
    {children}
  </svg>
);

/** Memoria: a sequence of squares that light up (like remembering a pattern) */
export const IconMemoria: React.FC<P> = ({t, t0, size = 230, on}) => {
  const order = [0, 4, 8, 5, 2, 1, 3, 7];
  const step = Math.floor(Math.max(0, t - t0) / 0.3) % order.length;
  const lit = on ? order[step] : -1;
  return wrap(
    size,
    <>
      {Array.from({length: 9}).map((_, i) => {
        const x = 18 + (i % 3) * 64;
        const y = 18 + Math.floor(i / 3) * 64;
        const a = prog(t, t0 + i * 0.04, 0.4, easeOut);
        const isLit = i === lit;
        return (
          <rect key={i} x={x + (1 - a) * 28} y={y + (1 - a) * 28} width={56 * a} height={56 * a} rx={14} fill={isLit ? K.orange : on ? '#FFE6D2' : K.white} stroke={K.ink} strokeWidth={5} />
        );
      })}
    </>,
  );
};

/** Atención: rings that converge on a point */
export const IconAtencion: React.FC<P> = ({t, t0, size = 230}) => {
  const a = prog(t, t0, 0.6, easeOut);
  const T = Math.max(0, t - t0);
  return wrap(
    size,
    <>
      {[0, 1, 2].map((i) => {
        const ph = ((T * 0.7 + i / 3) % 1);
        const r = 96 - ph * 80;
        return <circle key={i} cx={110} cy={110} r={Math.max(2, r * a)} {...ST} strokeWidth={5} opacity={0.25 + 0.75 * (1 - ph)} />;
      })}
      <circle cx={110} cy={110} r={16 * a} fill={K.orange} stroke={K.ink} strokeWidth={5} />
      {[[110, 6, 110, 28], [110, 192, 110, 214], [6, 110, 28, 110], [192, 110, 214, 110]].map(([x1, y1, x2, y2], i) => (
        <path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} {...ST} strokeWidth={5} opacity={a} />
      ))}
    </>,
  );
};

/** Movimiento: a dot travelling along a curve, leaving a fading trail */
export const IconMovimiento: React.FC<P> = ({t, t0, size = 230}) => {
  const d = 'M18 170 C 62 170, 70 62, 112 84 C 158 108, 146 30, 202 44';
  const T = Math.max(0, t - t0);
  const draw = prog(t, t0, 0.9, easeIO);
  const loop = (T * 0.55) % 1;
  return wrap(
    size,
    <>
      <path d={d} {...ST} pathLength={1} strokeDasharray={`${draw} 2`} />
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          r={14 - i * 2.5}
          fill={i === 0 ? K.orange : '#FFB37A'}
          stroke={K.ink}
          strokeWidth={i === 0 ? 5 : 0}
          opacity={draw > 0.95 ? 1 - i * 0.22 : 0}
          style={{offsetPath: `path("${d}")`, offsetDistance: `${Math.max(0, loop - i * 0.05) * 100}%`, offsetRotate: '0deg'} as React.CSSProperties}
        />
      ))}
    </>,
  );
};

/** Alimentación saludable: an apple drawn with one stroke, a leaf that fills */
export const IconAlimentacion: React.FC<P> = ({t, t0, size = 230}) => {
  const draw = prog(t, t0, 0.9, easeIO);
  const fill = prog(t, t0 + 0.7, 0.5, easeOut);
  const body = 'M110 70 C 72 46, 26 78, 38 132 C 48 178, 84 206, 110 192 C 136 206, 172 178, 182 132 C 194 78, 148 46, 110 70 Z';
  return wrap(
    size,
    <>
      <path d={body} fill={K.orange} fillOpacity={fill} />
      <path d={body} {...ST} pathLength={1} strokeDasharray={`${draw} 2`} />
      <path d="M112 68 C 112 40, 132 22, 160 24 C 160 52, 142 68, 112 68 Z" fill={K.violet} fillOpacity={fill} stroke={K.ink} strokeWidth={6} strokeLinejoin="round" strokeDasharray="1 0" opacity={draw} />
      <path d="M110 68 L106 40" {...ST} opacity={draw} />
    </>,
  );
};

/** Celular */
export const IconCelular: React.FC<P> = ({t, t0, size = 230, on}) => {
  const a = prog(t, t0, 0.5, easeOut);
  return wrap(
    size,
    <>
      <rect x={62} y={14} width={96} height={192} rx={22} fill={K.white} stroke={K.ink} strokeWidth={6} transform={`translate(0 ${(1 - a) * 20})`} opacity={a} />
      <path d="M96 30h28" {...ST} strokeWidth={5} opacity={a} />
      {Array.from({length: 6}).map((_, i) => {
        const k = prog(t, t0 + 0.25 + i * 0.08, 0.4, easeOut);
        const tap = on && Math.floor(((t - t0) * 2.2) % 6) === i;
        return <rect key={i} x={78 + (i % 2) * 36 + (1 - k) * 14} y={56 + Math.floor(i / 2) * 44 + (1 - k) * 14} width={30 * k} height={34 * k} rx={9} fill={tap ? K.violet : i % 3 === 0 ? K.orange : '#FFE6D2'} stroke={K.ink} strokeWidth={4} />;
      })}
    </>,
  );
};

/** Tablet */
export const IconTablet: React.FC<P> = ({t, t0, size = 230, on}) => {
  const a = prog(t, t0, 0.5, easeOut);
  return wrap(
    size,
    <>
      <rect x={16} y={42} width={188} height={136} rx={20} fill={K.white} stroke={K.ink} strokeWidth={6} transform={`translate(0 ${(1 - a) * 20})`} opacity={a} />
      <circle cx={194} cy={110} r={4} fill={K.ink} opacity={a} />
      {Array.from({length: 6}).map((_, i) => {
        const k = prog(t, t0 + 0.25 + i * 0.08, 0.4, easeOut);
        const tap = on && Math.floor(((t - t0) * 2.2) % 6) === i;
        return <rect key={i} x={34 + (i % 3) * 52 + (1 - k) * 14} y={62 + Math.floor(i / 3) * 52 + (1 - k) * 14} width={44 * k} height={42 * k} rx={10} fill={tap ? K.violet : i % 2 === 0 ? K.orange : '#FFE6D2'} stroke={K.ink} strokeWidth={4} />;
      })}
    </>,
  );
};
