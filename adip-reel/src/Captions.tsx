import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CHUNKS, VOICE_END} from './data';
import {C, FONT, easeOut, prog} from './ui';

/** Karaoke-style captions: the phrase is laid out once, words light up as they are said. */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const chunk = CHUNKS.find((c) => t >= c.s && t < c.e);
  if (!chunk || t > VOICE_END + 0.2) return null;
  const inP = prog(t, chunk.s, 0.22, easeOut);
  const outP = 1 - prog(t, chunk.e - 0.09, 0.09, (x) => x);
  const op = Math.min(inP, outP);
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        right: 90,
        bottom: 1920 - 1500,
        textAlign: 'center',
        fontFamily: FONT,
        opacity: op,
        transform: `translateY(${(1 - inP) * 20}px)`,
      }}
    >
      <span
        style={{
          fontSize: 52,
          lineHeight: 1.6,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          background: 'rgba(22,17,29,0.88)',
          padding: '4px 20px',
          borderRadius: 14,
          WebkitBoxDecorationBreak: 'clone',
          boxDecorationBreak: 'clone',
        }}
      >
        {chunk.words.map((w, i) => {
          const k = prog(t, w.s - 0.03, 0.14, easeOut);
          const active = t >= w.s - 0.03 && t < w.e + 0.02;
          const pop = 1 + (w.key ? 0.12 : 0.05) * Math.sin(Math.min(1, prog(t, w.s - 0.03, 0.3, easeOut)) * Math.PI);
          const base = w.key ? C.orange : C.white;
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  display: 'inline-block',
                  color: base,
                  opacity: 0.38 + 0.62 * k,
                  fontWeight: w.key ? 800 : 700,
                  transform: `scale(${active ? pop : 1})`,
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
