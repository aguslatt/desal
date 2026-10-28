import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Ribbons} from '../Ribbons';
import {easeOut, prog} from '../ui';
import {ARC_IN, ARC_OUT, INFO_OUT, INFO_SWAP, layoutAt, poseAt, videoTransform} from './camera';
import {CHUNKS, FPS, H, OUTRO_AT, T, TE} from './data';
import {FONT, K} from './kit';
import {
  ArcShapes,
  ArcText,
  CtaBehind,
  CtaTop,
  HOOK_END,
  HookBehind,
  HookTop,
  IntroBehind,
  PanelBg,
  InfoCard,
  Intro,
  Limits,
  LogoBug,
  Outro,
  Stage,
  Tools,
  Wait,
} from './scenes';

const fontCss = [300, 400, 500, 600, 700, 800, 900]
  .map(
    (w) =>
      `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(
        `fonts/montserrat-latin-${w}-normal.woff2`,
      )}') format('woff2');}`,
  )
  .join('\n');

// frames for which a person cut-out exists (text can sit behind the speaker)
const MATTE: [number, number][] = [
  [0, 107],
  [108, 205],
  [1556, 1631],
];
const matteAt = (f: number) => MATTE.some(([a, b]) => f >= a && f <= b);
const pad = (n: number) => String(n).padStart(4, '0');

const Captions: React.FC<{t: number; light: boolean}> = ({t, light}) => {
  const chunk = CHUNKS.find((c) => t >= c.s && t < c.e);
  if (!chunk || t > OUTRO_AT - 0.25) return null;
  const inP = prog(t, chunk.s, 0.2, easeOut);
  const outP = 1 - prog(t, chunk.e - 0.08, 0.08, (x) => x);
  const op = Math.min(inP, outP);
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 80,
        top: 1384,
        height: 150,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: FONT,
        opacity: op,
        transform: `translateY(${(1 - inP) * 22}px)`,
      }}
    >
      <div style={{fontSize: 62, lineHeight: 1.12, fontWeight: 700, letterSpacing: '-0.015em', textShadow: light ? 'none' : '0 2px 22px rgba(0,0,0,0.38)'}}>
        {chunk.words.map((w, i) => {
          const said = t >= w.s - 0.02;
          const active = said && t < w.e + 0.04;
          const base = light ? K.ink : K.white;
          const accent = light ? K.pink : K.yellow;
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  display: 'inline-block',
                  color: w.k && said ? accent : base,
                  opacity: said ? 1 : 0.42,
                  fontWeight: w.k ? 800 : 700,
                  transform: `translateY(${active ? -4 : 0}px)`,
                }}
              >
                {w.w}
              </span>
              {i < chunk.words.length - 1 ? ' ' : ''}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export const Charla: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const lay = layoutAt(t);
  const pose = poseAt(t);
  const {tx, ty, s} = videoTransform(pose, lay.rect.w, lay.rect.h);
  const isFull = lay.rect.w > 1079 && lay.rect.h > 1919;
  const live = t < OUTRO_AT + 0.7;
  const hasMatte = isFull && matteAt(frame);
  const lightCaps = lay.arc > 0.5 || lay.info > 0.5;

  return (
    <AbsoluteFill style={{background: K.gray, fontFamily: FONT}}>
      <style>{fontCss}</style>
      {live && (
        <>
          <ArcShapes t={t} w={lay.arc} />
          {lay.panel > 0.01 && <PanelBg h={lay.rect.y} />}
          {/* footage container: morphs between full-frame, arc window and top panel */}
          <div
            style={{
              position: 'absolute',
              left: lay.rect.x,
              top: lay.rect.y,
              width: lay.rect.w,
              height: lay.rect.h,
              overflow: 'hidden',
              borderRadius: `${lay.rect.rt}px ${lay.rect.rt}px ${lay.rect.rb}px ${lay.rect.rb}px`,
            }}
          >
            <OffthreadVideo
              src={staticFile('charla/edit.mp4')}
              muted
              style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${s})`}}
            />
          </div>

          {/* type that sits behind the speaker */}
          {hasMatte && t < HOOK_END && <HookBehind t={t} />}
          {hasMatte && t > 40 && <CtaBehind t={t} />}
          {hasMatte && t >= HOOK_END && t < 7.2 && <IntroBehind t={t} />}
          {hasMatte && (
            <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
              <Img
                src={staticFile(`charla/subj/s${pad(frame)}.webp`)}
                style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${s})`}}
              />
            </div>
          )}

          <HookTop t={t} />
          <LogoBug t={t} t0={H('turbulenta') + 2.6} t1={T('para') - 0.25} />
          <Intro t={t} />
          <ArcText t={t} />
          <Stage t={t} />
          <Tools t={t} />
          <Limits t={t} />
          <Wait t={t} />
          <InfoCard t={t} />
          <CtaTop t={t} />
          {t > T('los') - 3 && <Captions t={t} light={lightCaps} />}
        </>
      )}

      {/* transitions: ADIP stroke ribbons */}
      <Ribbons t0={HOOK_END - 0.5} dur={1.0} mode="pass" dir="lr" />
      <Ribbons t0={INFO_SWAP - 0.5} dur={1.0} mode="pass" dir="rl" palette={[K.green, K.yellow, K.orange, K.pink, K.violet]} />
      <Ribbons t0={OUTRO_AT - 0.2} dur={1.0} mode="cover" dir="lr" />
      <Outro t={t} t0={OUTRO_AT + 0.35} />
    </AbsoluteFill>
  );
};

export const _anchors = {ARC_IN, ARC_OUT, INFO_OUT, TE, FPS};
