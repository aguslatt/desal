import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Ribbons} from '../Ribbons';
import {easeIn, prog} from '../ui';
import {K} from '../charla/kit';
import {OUTRO_AT} from '../taller/data';
import {CREAM, GuestHead, Hook, InviteHead, Needs, Outro, Subs, TitleTop, CtaPanel} from '../taller/scenes';
import {Arch, Circle, CircleWipe, Person, TwoUp, TwoUpFinal, poseAt} from './stage';
import {Areas, AskHead2, BigQ, ConvLink, InfoRipple, TeamHeads, Tech, Weekly} from './scenes2';

const fontCss = [300, 400, 500, 600, 700, 800, 900]
  .map((w) => `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}') format('woff2');}`)
  .join('\n');

const inR = (t: number, a: number, b: number) => t >= a && t < b;

/** everything that sits BEHIND the people */
const Back: React.FC<{t: number}> = ({t}) => {
  const f = poseAt(t).face;
  // host alone: a circle that changes colour with each thing she says
  if (t < 9.74) {
    return (
      <>
        <Circle t={t} t0={0.05} cx={f.x + 10} cy={f.y + 40} r={470} color={K.violet} drift={8} />
        <Circle t={t} t0={3.28} cx={f.x + 10} cy={f.y + 40} r={470} color={K.orange} drift={8} />
        <Circle t={t} t0={6.16} cx={f.x + 10} cy={f.y + 40} r={470} color={K.violet} drift={8} />
        <Circle t={t} t0={8.38} cx={f.x + 10} cy={f.y + 40} r={470} color={K.orange} drift={8} />
        <Circle t={t} t0={0.55} cx={930} cy={330} r={70} color={K.orange} drift={10} />
        <Circle t={t} t0={0.8} cx={120} cy={1180} r={44} color={K.violet} drift={10} />
      </>
    );
  }
  if (inR(t, 9.74, 16.4) || inR(t, 29.4, 39.4)) {
    const t0 = t < 20 ? 9.8 : 29.5;
    return (
      <>
        <Arch t={t} t0={t0} x={30} w={500} bottom={800} h={640} color={K.violet} />
        <Arch t={t} t0={t0 + 0.18} x={550} w={500} bottom={800} h={640} color={K.orange} />
      </>
    );
  }
  if (inR(t, 16.4, 24.3)) {
    return (
      <>
        <Circle t={t} t0={16.45} cx={f.x + 20} cy={f.y + 30} r={440} color={K.orange} drift={8} />
        <Circle t={t} t0={16.9} cx={960} cy={120} r={54} color={K.violet} drift={8} />
      </>
    );
  }
  if (inR(t, 24.3, 29.5)) {
    return (
      <>
        <Circle t={t} t0={16.45} cx={f.x + 20} cy={f.y + 30} r={440} color={K.orange} drift={8} />
        <Circle t={t} t0={24.3} cx={f.x + 20} cy={f.y + 30} r={440} color={K.violet} drift={8} />
      </>
    );
  }
  if (inR(t, 39.4, 42.9)) {
    return (
      <>
        <Circle t={t} t0={39.45} cx={f.x + 60} cy={f.y + 20} r={430} color={K.violet} drift={8} />
        <BigQ t={t} />
      </>
    );
  }
  if (inR(t, 42.9, 47.3)) {
    return (
      <>
        <Circle t={t} t0={42.95} cx={f.x + 20} cy={f.y + 40} r={430} color={K.violet} drift={8} />
        <Circle t={t} t0={43.4} cx={980} cy={130} r={50} color={K.orange} drift={8} />
      </>
    );
  }
  if (inR(t, 47.3, 51.9)) {
    return (
      <>
        <Circle t={t} t0={47.3} cx={f.x + 20} cy={f.y + 50} r={420} color={K.orange} drift={8} dur={0.6} />
        <Circle t={t} t0={48.4} cx={980} cy={120} r={50} color={K.violet} drift={8} />
      </>
    );
  }
  if (inR(t, 51.9, 54)) {
    return (
      <>
        <Arch t={t} t0={51.9} x={30} w={500} bottom={1830} h={900} color={K.violet} />
        <Arch t={t} t0={52.0} x={550} w={500} bottom={1830} h={900} color={K.orange} />
      </>
    );
  }
  return null;
};

const plinthColor = (t: number) => {
  if (t < 9.74) return K.orange;
  if (inR(t, 16.4, 24.3)) return K.violet;
  if (inR(t, 24.3, 29.5)) return K.orange;
  if (inR(t, 39.4, 47.3)) return K.orange;
  return K.violet;
};

export const Taller2: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const live = t < OUTRO_AT + 0.8;
  const windowed = inR(t, 9.67, 16.37) || inR(t, 29.5, 39.33);
  const plinth = live && !windowed && t < 53.9;

  return (
    <AbsoluteFill style={{background: CREAM}}>
      <style>{fontCss}</style>
      {live && (
        <>
          <Back t={t} />
          {windowed ? <TwoUp t={t} /> : t >= 51.9 && t < 54 ? <TwoUpFinal t={t} /> : <Person t={t} />}
          {plinth && <div style={{position: 'absolute', left: 0, right: 0, top: 1830, height: 90, background: plinthColor(t)}} />}
          {windowed && <div style={{position: 'absolute', left: 0, top: 800, width: 1080, height: 10, background: K.orange}} />}

          <Hook t={t} />
          <Needs t={t} />
          <TitleTop t={t} />
          <GuestHead t={t} />
          <TeamHeads t={t} />
          <Areas t={t} />
          <Tech t={t} />
          <ConvLink t={t} />
          <AskHead2 t={t} />
          <Weekly t={t} />
          <InviteHead t={t} />
          <CtaPanel t={t} />
          <InfoRipple t={t} />
          <Subs t={t} />
        </>
      )}

      <CircleWipe t={t} tIn={9.36} tOut={9.74} cx={540} cy={960} color={K.violet} word="TALLER" />
      <CircleWipe t={t} tIn={16.04} tOut={16.42} cx={1080} cy={900} color={K.orange} word="PROFESIONALES" textColor={K.ink} outCx={0} outCy={900} />
      <CircleWipe t={t} tIn={29.12} tOut={29.52} cx={540} cy={1300} color={K.orange} />
      <CircleWipe t={t} tIn={39.0} tOut={39.42} cx={0} cy={900} color={K.violet} outCx={1080} outCy={700} />
      <CircleWipe t={t} tIn={42.52} tOut={42.92} cx={1080} cy={600} color={K.orange} outCx={0} outCy={1400} />
      <CircleWipe t={t} tIn={51.5} tOut={51.9} cx={540} cy={960} color={K.violet} />
      <Ribbons t0={OUTRO_AT} dur={0.9} mode="cover" dir="lr" palette={[K.violet, K.orange, K.violet, K.orange, K.violet]} />
      <Outro t={t} t0={OUTRO_AT + 0.75} />
    </AbsoluteFill>
  );
};
