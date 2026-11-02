import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Ribbons} from '../Ribbons';
import {K} from '../charla/kit';
import {layoutAt, videoTransform} from './camera';
import {OUTRO_AT} from './data';
import {
  AreasPanel,
  AskHead,
  BlockWipe,
  CREAM,
  ConvTop,
  CtaPanel,
  GuestHead,
  Hook,
  InviteHead,
  MeetPanel,
  Needs,
  Outro,
  Subs,
  TechPanel,
  TitleTop,
} from './scenes';

const fontCss = [300, 400, 500, 600, 700, 800, 900]
  .map((w) => `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}') format('woff2');}`)
  .join('\n');

export const Taller: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const lay = layoutAt(t);
  const {tx, ty, s} = videoTransform(t, lay.win.h);
  const live = t < OUTRO_AT + 0.8;

  return (
    <AbsoluteFill style={{background: CREAM}}>
      <style>{fontCss}</style>
      {live && (
        <>
          <div style={{position: 'absolute', left: 0, top: lay.win.y, width: 1080, height: lay.win.h, overflow: 'hidden'}}>
            <OffthreadVideo
              src={staticFile('taller/lu_4k.mp4')}
              muted
              style={{position: 'absolute', left: 0, top: 0, width: 2160, height: 3840, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${s})`}}
            />
          </div>
          {/* split accents: a rule where the footage meets the panel */}
          {lay.top > 0.01 && <div style={{position: 'absolute', left: 0, top: lay.win.y + lay.win.h, width: 1080 * lay.top, height: 10, background: K.orange}} />}
          {lay.bot > 0.01 && <div style={{position: 'absolute', left: 1080 * (1 - lay.bot), top: lay.win.y - 10, width: 1080 * lay.bot, height: 10, background: K.violet}} />}

          <Hook t={t} />
          <Needs t={t} />
          <TitleTop t={t} />
          <GuestHead t={t} />
          <AreasPanel t={t} />
          <TechPanel t={t} />
          <ConvTop t={t} />
          <AskHead t={t} />
          <MeetPanel t={t} />
          <InviteHead t={t} />
          <CtaPanel t={t} />
          <Subs t={t} />
        </>
      )}

      {/* transitions: colour block + a word that bridges two moments */}
      <BlockWipe t={t} tIn={9.36} tOut={9.74} color={K.violet} textColor={K.white} word="TALLER" dir={1} />
      <BlockWipe t={t} tIn={16.04} tOut={16.42} color={K.orange} textColor={K.ink} word="PROFESIONALES" dir={-1} />
      <Ribbons t0={OUTRO_AT} dur={0.9} mode="cover" dir="lr" palette={[K.violet, K.orange, K.violet, K.orange, K.violet]} />
      <Outro t={t} t0={OUTRO_AT + 0.75} />
    </AbsoluteFill>
  );
};
