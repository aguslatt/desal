import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Key, Shape, back, clamp01, easeIn, easeIO, fit, lerp, prog, track, tw} from './anim';
import {Block1, Block2, Block3, Block4, Block5} from './blocks';
import {useFonts} from './fonts';
import {CARD_Y, CW, HEADER, Header, QMark, Rise, ShapeDiv, T, Trazo, X0, cardLayout, dot, headerW} from './kit';
import {C, FONT, GRADIENT, PALETTE, css, onColor} from './theme';
import {FPS, SHOTS, SPLITS, SUBS, VIDEO_END} from './timeline';

const ARCH = {top: 930, side: 130, r: 410};
const Q_STARTS = [4.4333, 16.2, 23.6, 30.2333, 40.9333, 44.9667];

const splitAmount = (t: number) => Math.max(...SPLITS.map(([a, b]) => prog(t, a, 0.55, easeIO) * (1 - prog(t, b, 0.45, easeIO))));

/** Footage with per-shot push-ins; during the split windows it steps back into the arch. */
const Footage: React.FC<{t: number}> = ({t}) => {
  const shot = SHOTS.find((s) => t >= s.a - 1e-4 && t < s.b - 1e-4) ?? SHOTS[SHOTS.length - 1];
  const sp = splitAmount(t);
  const s = lerp(shot.s0, shot.s1, clamp01((t - shot.a) / (shot.b - shot.a)));
  const split = shot.split ?? {fx: 0.5, ty: 395};
  const ss = 0.86 * (shot.split ? s : 1);
  const S = lerp(s, ss, sp);
  const X = lerp((shot.ox / 100) * 1080 * (1 - s), 540 - split.fx * 1080 * ss, sp);
  const Y = lerp((shot.oy / 100) * 1920 * (1 - s), split.ty, sp);
  const splitCol = t < 20 ? C.violet : C.orange;
  return (
    <>
      {sp > 0 ? (
        <div style={{position: 'absolute', left: 905 - 290, top: 1190 - 290, width: 580, height: 580, borderRadius: 290, background: css(splitCol), transform: `scale(${sp})`}} />
      ) : null}
      <AbsoluteFill style={{clipPath: `inset(${ARCH.top * sp}px ${ARCH.side * sp}px 0px ${ARCH.side * sp}px round ${ARCH.r * sp}px ${ARCH.r * sp}px 0px 0px)`}}>
        <OffthreadVideo muted src={staticFile('base.mp4')} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `translate(${X}px, ${Y}px) scale(${S})`}} />
      </AbsoluteFill>
    </>
  );
};

/** 0-4.4 s · the section card lands on the first word, then folds into the header that stays all video long. */
const useOpeningShape = (t: number) => {
  const R = fit(['RESPONDE'], CW - 96, 150, 900);
  const h = 44 + 96 + R + 34;
  const base: Shape = {x: X0, y: CARD_Y + 90, w: CW, h, r: 32, col: C.white, fa: 1, bw: 0, op: 1};
  const keys: Key[] = [
    {t: -0.24, dur: 0.6, ease: back, y: CARD_Y},
    {t: 2.42, dur: 0.55, x: X0, y: HEADER.y, w: headerW(), h: HEADER.h, r: HEADER.h / 2, col: C.ink},
  ];
  return {shape: track(t, base, keys), R};
};

const Opening: React.FC<{t: number; shape: Shape; R: number}> = ({t, shape, R}) => {
  if (t > 5) return null;
  const out = 1 - prog(t, 2.42, 0.16);
  const dy = shape.y - CARD_Y;
  const S = fit(['UNA POR UNA'], CW, 124, 900);
  const words = ['UNA', 'POR', 'UNA'];
  const times = [3.24, 3.5, 3.76];
  let wx = X0;
  return (
    <>
      {out > 0 ? (
        <div style={{opacity: out, position: 'absolute', left: 0, top: dy}}>
          <T t={t} t0={-0.3} x={X0 + 48} y={CARD_Y + 46} size={84} weight={800}>
            EQUIPO ADIP
          </T>
          <T t={t} t0={-0.18} x={X0 + 48} y={CARD_Y + 44 + 96} size={R} weight={900}>
            RESPONDE
          </T>
          <Trazo t={t} t0={0.2} dur={0.9} x={X0 + 48 + tw('EQUIPO ADIP', 84, 800) + 30} y={CARD_Y + 50} w={Math.min(250, CW - 96 - tw('EQUIPO ADIP', 84, 800) - 40)} />
        </div>
      ) : null}
      <T t={t} t0={2.95} t1={4.2} x={X0} y={306} size={30} tracking={0.06} color={css(C.violet)}>
        LAS RESPONDEMOS
      </T>
      {words.map((w, i) => {
        const x = wx;
        wx += tw(w + ' ', S, 900);
        return (
          <T key={i} t={t} t0={times[i]} t1={4.22} x={x} y={366} size={S} weight={900} dur={0.4}>
            {w}
          </T>
        );
      })}
      {PALETTE.map((c, i) => {
        const p = prog(t, 3.3 + i * 0.1, 0.42, back);
        if (p <= 0 || t > 4.74) return null;
        const f = prog(t, 4.26 + i * 0.02, 0.44, easeIO);
        const d = lerp(96, 16, f);
        const cx = lerp(X0 + 48 + i * 116, dot(i).x, f);
        const cy = lerp(366 + S + 30 + 48, dot(i).y, f);
        return (
          <div
            key={i}
            style={{position: 'absolute', left: cx - d / 2, top: cy - d / 2, width: d, height: d, borderRadius: d / 2, background: css(c, lerp(1, i === 0 ? 1 : 0.38, f)), transform: `scale(${p})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 46, color: onColor(c)}}
          >
            <span style={{opacity: 1 - clamp01(f * 3)}}>{i + 1}</span>
          </div>
        );
      })}
    </>
  );
};

/** 45 s · the spoken call to action, as one last card + the brand button. */
const CTA_Q = ['¿Te quedó alguna', 'pregunta?'];
const CTA_T = 44.9667;
const Cta: React.FC<{t: number}> = ({t}) => {
  if (t < CTA_T - 0.05) return null;
  const {size, lh, h} = cardLayout(CTA_Q);
  const base: Shape = {x: dot(4).x - 8, y: dot(4).y - 8, w: 16, h: 16, r: 8, col: C.green, fa: 1, bw: 0, op: 0};
  const shape = track(t, base, [
    {t: CTA_T - 0.02, dur: 0.02, op: 1},
    {t: CTA_T, dur: 0.5, ease: back, x: X0, y: CARD_Y, w: CW, h, r: 32, col: C.white},
  ]);
  const outro = prog(t, 48.3, 0.3);
  const badge = prog(t, CTA_T + 0.16, 0.45, back);
  const btn = 'Dejala en comentarios';
  const bw = tw(btn, 44, 700) + 96;
  const bp = prog(t, 46.5, 0.45, back);
  const pulse = 1 + 0.045 * Math.sin(Math.PI * clamp01((t - 47.35) / 0.4));
  return (
    <>
      <ShapeDiv s={shape} shadow={prog(t, CTA_T + 0.05, 0.3) * (1 - outro)} />
      {outro > 0 ? <div style={{position: 'absolute', left: X0, top: CARD_Y, width: CW, height: h, borderRadius: 32, background: css(C.gray), opacity: outro}} /> : null}
      <div style={{position: 'absolute', left: X0 + 48, top: CARD_Y + 46, fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1, color: '#000', whiteSpace: 'nowrap'}}>
        {CTA_Q.map((l, k) => (
          <div key={k} style={{height: lh}}>
            <Rise t={t} t0={CTA_T + 0.14 + k * 0.07} dur={0.42}>
              {l}
            </Rise>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: X0 + CW - 124, top: CARD_Y - 44, width: 104, height: 104, borderRadius: 52, background: css(C.violet), display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${badge}) rotate(${lerp(-18, 8, badge)}deg)`}}>
        <QMark size={50} color="#fff" />
      </div>
      {bp > 0 ? (
        <div style={{position: 'absolute', left: X0, top: CARD_Y + h + 22, width: bw, height: 92, borderRadius: 46, background: '#000', color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${bp * pulse})`, transformOrigin: '20% 50%'}}>
          {btn}
        </div>
      ) : null}
    </>
  );
};

const OutroWash: React.FC<{t: number}> = ({t}) => {
  const p = prog(t, 48.02, 0.5, easeIO);
  if (p <= 0) return null;
  return <AbsoluteFill style={{background: '#fff', clipPath: `circle(${p * 2300}px at 360px 640px)`}} />;
};
const OutroContent: React.FC<{t: number}> = ({t}) => {
  if (t < 48.3) return null;
  const lp = prog(t, 48.5, 0.55, back);
  const stripes = [...GRADIENT.map(([, c]) => c), '#000000'];
  return (
    <>
      {stripes.map((c, i) => (
        <div key={i} style={{position: 'absolute', left: i * 180, top: 0, width: 181, height: 24, background: c, transform: `scaleX(${prog(t, 48.45 + i * 0.06, 0.4, easeIO)})`, transformOrigin: '0 0'}} />
      ))}
      <Img src={staticFile('brand/logo-color.png')} style={{position: 'absolute', left: 540 - 270, top: 900, width: 540, transform: `scale(${lerp(0.8, 1, lp)})`, opacity: clamp01(lp * 2)}} />
      <Trazo t={t} t0={48.9} dur={0.8} x={540 - 150} y={1168} w={300} />
      <div style={{position: 'absolute', left: 0, width: 1080, top: 1300, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 36, color: '#626161', opacity: prog(t, 49.3, 0.4), transform: `translateY(${(1 - prog(t, 49.3, 0.5)) * 14}px)`}}>
        Acompañar con amor hace la diferencia
      </div>
    </>
  );
};

const Subtitles: React.FC<{t: number}> = ({t}) => {
  const s = SUBS.find(([a, b]) => t >= a && t < b);
  if (!s) return null;
  const p = prog(t, s[0], 0.12);
  return (
    <div style={{position: 'absolute', left: 0, width: 1080, bottom: 1920 - 1590, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{background: '#fff', borderRadius: 22, padding: '14px 30px 16px', fontFamily: FONT, fontWeight: 700, fontSize: 45, lineHeight: 1.22, color: '#000', textAlign: 'center', whiteSpace: 'pre', opacity: p, transform: `translateY(${(1 - p) * 10}px)`, boxShadow: '0 8px 30px rgba(0,0,0,0.12)'}}
      >
        {s[2]}
      </div>
    </div>
  );
};

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const ready = useFonts();
  const t = frame / FPS;
  if (!ready) return <AbsoluteFill style={{background: '#fff'}} />;
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <Sequence durationInFrames={Math.round(VIDEO_END * FPS)}>
        <Footage t={t} />
      </Sequence>
      <Scene t={t} />
      <Audio src={staticFile('audio/mix.wav')} />
    </AbsoluteFill>
  );
};

const Scene: React.FC<{t: number}> = ({t}) => {
  const {shape, R} = useOpeningShape(t);
  let current = -1;
  Q_STARTS.forEach((q, i) => {
    if (t >= q) current = i;
  });
  return (
    <AbsoluteFill>
      <Block1 t={t} />
      <Block2 t={t} />
      <Block3 t={t} />
      <Block4 t={t} />
      <Block5 t={t} />
      <Subtitles t={t} />
      <OutroWash t={t} />
      <ShapeDiv s={shape} shadow={1 - prog(t, 2.42, 0.4)} />
      <Opening t={t} shape={shape} R={R} />
      <Header t={t} show={prog(t, 2.6, 0.1)} current={current} contentOp={prog(t, 2.78, 0.25)} drawCapsule={false} />
      <Cta t={t} />
      <OutroContent t={t} />
    </AbsoluteFill>
  );
};
