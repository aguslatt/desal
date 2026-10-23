import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CHUNKS, VOICE_END} from './data';
import {C, FONT, easeOut, prog} from './ui';

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const chunk = CHUNKS.find((c) => t >= c.s && t < c.e);
  if (!chunk || t > VOICE_END + 0.2) return null;
  const inP = prog(t, chunk.s, 0.2, easeOut);
  const outP = 1 - prog(t, chunk.e - 0.1, 0.1, (x) => x);
  const op = Math.min(inP, outP);
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        right: 90,
        bottom: 1920 - 1520,
        textAlign: 'center',
        fontFamily: FONT,
        opacity: op,
        transform: `translateY(${(1 - inP) * 22}px)`,
      }}
    >
      <span
        style={{
          fontSize: 56,
          lineHeight: 1.6,
          fontWeight: 700,
          color: C.white,
          letterSpacing: '-0.01em',
          background: 'rgba(22,17,29,0.86)',
          padding: '4px 20px',
          borderRadius: 14,
          WebkitBoxDecorationBreak: 'clone',
          boxDecorationBreak: 'clone',
        }}
      >
        {chunk.words.map((w, i) => {
          const k = prog(t, w.s - 0.02, 0.28, easeOut);
          const pop = w.key ? 1 + 0.13 * Math.sin(Math.min(1, k) * Math.PI) : 1;
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  display: 'inline-block',
                  color: w.key ? C.orange : C.white,
                  fontWeight: w.key ? 800 : 700,
                  transform: `scale(${pop})`,
                }}
              >
                {w.text}
              </span>
              {i < chunk.words.length - 1 ? ' ' : ''}
            </React.Fragment>
          );
        })}
      </span>
    </div>
  );
};
