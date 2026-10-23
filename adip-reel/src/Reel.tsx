import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from './Camera';
import {Captions} from './Captions';
import {Ribbons} from './Ribbons';
import {Closing, Cobertura, Hook, Horarios, Outro, Question, Sedes, Vias} from './scenes';
import {C, FONT} from './ui';
import {VOICE_END} from './data';

const fontCss = [400, 600, 700, 800, 900]
  .map(
    (w) =>
      `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(
        `fonts/montserrat-latin-${w}-normal.woff2`,
      )}') format('woff2');}`,
  )
  .join('\n');

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const outroStart = 53.05;
  return (
    <AbsoluteFill style={{background: C.cream, fontFamily: FONT}}>
      <style>{fontCss}</style>
      <Camera />
      {t < outroStart + 0.6 && (
        <>
          <Hook t={t} />
          <Question t={t} />
          <Vias t={t} />
          <Sedes t={t} />
          <Horarios t={t} />
          <Cobertura t={t} />
          <Closing t={t} />
          <Captions />
        </>
      )}
      <Ribbons t0={5.42} dur={1.3} mode="pass" dir="lr" />
      <Ribbons t0={outroStart} dur={1.0} mode="cover" dir="rl" palette={[C.violet, C.pink, C.yellow, C.green, C.orange]} />
      <Outro t={t} t0={outroStart + 0.35} />
    </AbsoluteFill>
  );
};
