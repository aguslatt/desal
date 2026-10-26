import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera, Subject} from './Camera';
import {Captions} from './Captions';
import {Ribbons} from './Ribbons';
import {BEHIND_WINDOWS, BehindNumbers, Closing, Cobertura, Hook, Horarios, Outro, Question, Sedes, TM, Vias} from './scenes';
import {C, FONT} from './ui';
import {TE} from './data';
import edl from './edl.json';

const fontCss = [400, 600, 700, 800, 900]
  .map(
    (w) =>
      `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(
        `fonts/montserrat-latin-${w}-normal.woff2`,
      )}') format('woff2');}`,
  )
  .join('\n');

export const HOOK_TO_Q = edl.offsets[3]; // the cut from Andy's hook to the interview
export const OUTRO_START = TE('contactarnos') + 0.12;

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const live = t < OUTRO_START + 0.7;
  const behind = BEHIND_WINDOWS.some(([a, b]) => t >= a && t <= b);
  return (
    <AbsoluteFill style={{background: C.cream, fontFamily: FONT}}>
      <style>{fontCss}</style>
      {live && <Camera />}
      {live && behind && <BehindNumbers t={t} />}
      {live && behind && <Subject />}
      {live && (
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
      <Ribbons t0={HOOK_TO_Q - 0.5} dur={1.0} mode="pass" dir="lr" />
      <Ribbons t0={OUTRO_START} dur={1.0} mode="cover" dir="rl" palette={[C.violet, C.pink, C.yellow, C.green, C.orange]} />
      <Outro t={t} t0={OUTRO_START + 0.35} />
    </AbsoluteFill>
  );
};
