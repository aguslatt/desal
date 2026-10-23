import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, easeIO, prog} from './ui';

const COLS = [C.violet, C.pink, C.orange, C.yellow, C.green];
const YS = [192, 576, 960, 1344, 1728];

// Ribbons inspired by the looping strokes of the ADIP mark.
// mode "pass": sweep across and leave; mode "cover": sweep in and stay.
export const Ribbons: React.FC<{t0: number; dur?: number; mode: 'pass' | 'cover'; dir?: 'lr' | 'rl'; palette?: string[]}> = ({
  t0,
  dur = 1.2,
  mode,
  dir = 'lr',
  palette = COLS,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < t0 - 0.05 || (mode === 'pass' && t > t0 + dur + 0.6)) return null;
  const leg = dur * 0.5;
  return (
    <svg
      viewBox="0 0 1080 1920"
      width={1080}
      height={1920}
      style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}
    >
      <g transform={dir === 'rl' ? 'translate(1080,0) scale(-1,1)' : undefined}>
        {YS.map((y, i) => {
          const sgn = i % 2 === 0 ? 1 : -1;
          const d = `M -520 ${y} C 80 ${y - 380 * sgn}, 820 ${y + 380 * sgn}, 1600 ${y}`;
          const head = prog(t, t0 + i * 0.06, leg, easeIO);
          const tail = mode === 'pass' ? prog(t, t0 + leg * 0.9 + i * 0.06, leg, easeIO) : 0;
          const vis = Math.max(0, head - tail);
          return (
            <path
              key={i}
              d={d}
              pathLength={1}
              fill="none"
              stroke={palette[i % palette.length]}
              strokeWidth={470}
              strokeLinecap="round"
              strokeDasharray={`${vis} 3`}
              strokeDashoffset={-tail}
            />
          );
        })}
      </g>
    </svg>
  );
};
