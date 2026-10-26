import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {BASE_FRAMES} from './data';

const pad = (n: number) => String(n).padStart(4, '0');

/** Camera-framed background, pre-rendered by tools/layers.py (Lanczos crop of the 4K source). */
export const Camera: React.FC = () => {
  const n = Math.min(useCurrentFrame(), BASE_FRAMES - 1);
  return (
    <Img src={staticFile(`frames/f${pad(n)}.jpg`)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}} />
  );
};

/** Person cut-out (alpha) on top of the "behind" typography. */
export const Subject: React.FC = () => {
  const n = Math.min(useCurrentFrame(), BASE_FRAMES - 1);
  return (
    <Img src={staticFile(`subj/s${pad(n)}.webp`)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}} />
  );
};
