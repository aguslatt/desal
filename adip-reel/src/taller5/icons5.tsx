import React from 'react';
import {easeIO, easeOut, prog} from '../ui';
import {K} from '../charla/kit';

/** clean line icons: 6 px stroke, round caps, one filled detail (manual: duotone) */
type P = {t: number; t0: number; ink: string; accent: string; size?: number};
const W: React.FC<{size: number; children: React.ReactNode}> = ({size, children}) => (
  <svg viewBox="0 0 120 120" width={size} height={size} style={{overflow: 'visible'}}>
    {children}
  </svg>
);
const Draw: React.FC<{t: number; t0: number; d: string; ink: string; fill?: string; w?: number; dur?: number}> = ({t, t0, d, ink, fill, w = 6, dur = 0.7}) => {
  const p = prog(t, t0, dur, easeIO);
  const f = prog(t, t0 + dur * 0.7, 0.4, easeOut);
  return (
    <>
      {fill && <path d={d} fill={fill} opacity={f} />}
      <path d={d} fill="none" stroke={ink} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 2`} />
    </>
  );
};
const rr = (x: number, y: number, w: number, h: number, r: number) => `M${x + r} ${y} h${w - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} v${h - 2 * r} a${r} ${r} 0 0 1 -${r} ${r} h-${w - 2 * r} a${r} ${r} 0 0 1 -${r} -${r} v-${h - 2 * r} a${r} ${r} 0 0 1 ${r} -${r} z`;

export const IMemory: React.FC<P> = ({t, t0, ink, accent, size = 120}) => (
  <W size={size}>
    {Array.from({length: 9}).map((_, i) => (
      <Draw key={i} t={t} t0={t0 + i * 0.05} ink={ink} w={5} dur={0.4} d={rr(12 + (i % 3) * 36, 12 + Math.floor(i / 3) * 36, 28, 28, 7)} fill={[0, 4, 8].includes(i) ? accent : undefined} />
    ))}
  </W>
);
export const IFocus: React.FC<P> = ({t, t0, ink, accent, size = 120}) => (
  <W size={size}>
    <Draw t={t} t0={t0} ink={ink} d="M60 10 a50 50 0 1 0 0.1 0" dur={0.6} />
    <Draw t={t} t0={t0 + 0.15} ink={ink} d="M60 32 a28 28 0 1 0 0.1 0" dur={0.6} />
    <Draw t={t} t0={t0 + 0.3} ink={ink} d="M60 50 a10 10 0 1 0 0.1 0" fill={accent} dur={0.4} />
  </W>
);
export const IMove: React.FC<P> = ({t, t0, ink, accent, size = 120}) => (
  <W size={size}>
    <Draw t={t} t0={t0} ink={ink} d="M12 92 C 34 92, 40 30, 62 30 S 92 80, 108 36" dur={0.9} />
    <Draw t={t} t0={t0 + 0.8} ink={ink} d="M92 30 L108 36 L100 52" dur={0.3} />
    <Draw t={t} t0={t0 + 0.3} ink={ink} d="M12 92 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0" fill={accent} dur={0.3} />
  </W>
);
export const IFood: React.FC<P> = ({t, t0, ink, accent, size = 120}) => (
  <W size={size}>
    <Draw t={t} t0={t0} ink={ink} d="M60 34 C 40 22, 14 38, 20 66 C 26 94, 46 108, 60 100 C 74 108, 94 94, 100 66 C 106 38, 80 22, 60 34 Z" fill={accent} dur={0.9} />
    <Draw t={t} t0={t0 + 0.6} ink={ink} d="M62 32 C 62 14, 76 6, 92 8 C 92 24, 80 32, 62 32 Z" fill={ink} dur={0.4} />
  </W>
);
export const IPhone: React.FC<P> = ({t, t0, ink, accent, size = 120}) => (
  <W size={size}>
    <Draw t={t} t0={t0} ink={ink} d={rr(34, 8, 52, 104, 14)} dur={0.7} />
    <Draw t={t} t0={t0 + 0.4} ink={ink} d="M52 20 h16" dur={0.3} />
    {[0, 1, 2, 3].map((i) => (
      <Draw key={i} t={t} t0={t0 + 0.5 + i * 0.07} ink={ink} w={4} dur={0.3} d={rr(44 + (i % 2) * 17, 46 + Math.floor(i / 2) * 22, 13, 16, 4)} fill={i === 0 || i === 3 ? accent : undefined} />
    ))}
  </W>
);
export const ITablet: React.FC<P> = ({t, t0, ink, accent, size = 120}) => (
  <W size={size}>
    <Draw t={t} t0={t0} ink={ink} d={rr(8, 24, 104, 72, 12)} dur={0.7} />
    <Draw t={t} t0={t0 + 0.4} ink={ink} d="M100 60 L100.5 60" dur={0.2} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <Draw key={i} t={t} t0={t0 + 0.5 + i * 0.06} ink={ink} w={4} dur={0.3} d={rr(20 + (i % 3) * 26, 38 + Math.floor(i / 3) * 24, 20, 18, 5)} fill={i === 0 || i === 4 ? accent : undefined} />
    ))}
  </W>
);
export const iconSet = {mem: IMemory, att: IFocus, mov: IMove, food: IFood, phone: IPhone, tablet: ITablet};
export {K};
