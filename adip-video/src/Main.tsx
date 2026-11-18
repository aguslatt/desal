import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Key, Shape, back, clamp01, easeIn, easeIO, fit, lerp, prog, track, tw} from './anim';
import {Block1, Block2, Block3, Block4, Block5} from './blocks';
import {useFonts} from './fonts';
import {CARD_Y, CW, Header, QMark, Ripple, Rise, T, Trazo, X0, seg} from './kit';
import {C, FONT, GRADIENT, PALETTE, css, onColor} from './theme';
import {HoldContacto, HoldPrestaciones} from './holds';
import {FPS, HOLDS, SHOTS, SPLITS, SUBS, VIDEO_END, holdStart, toSource} from './timeline';

const ARCH = {top: 930, side: 130, r: 410};
const Q_STARTS = [4.4333, 16.2, 23.6, 30.2333, 40.9333, 44.9667];

const splitAmount = (t: number) => Math.max(...SPLITS.map(([a, b]) => prog(t, a, 0.55, easeIO) * (1 - prog(t, b, 0.45, easeIO))));

/** Footage with per-shot push-ins; during the split windows it steps back into the arch. */
const Footage: React.FC<{t: number; startFrom: number}> = ({t, startFrom}) => {
  const shot = SHOTS.find((s) => t >= s.a - 1e-4 && t < s.b - 1e-4) ?? SHOTS[SHOTS.length - 1];
  const sp = splitAmount(t);
  let s = lerp(shot.s0, shot.s1, clamp01((t - shot.a) / (shot.b - shot.a)));
  // opening shot: snap in, then a beat on "Hicimos un video"
  if (shot.a === 0) s = lerp(1.34, 1.15, prog(t, -0.1, 0.8, easeIO)) + 0.07 * prog(t, 2.42, 0.4, easeIO) + 0.02 * (t / 4.4);
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
        <OffthreadVideo muted startFrom={startFrom} src={staticFile('base.mp4')} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `translate(${X}px, ${Y}px) scale(${S})`}} />
      </AbsoluteFill>
    </>
  );
};

/** 0-4.4 s · the questions arrive as chat bubbles (they come from WhatsApp), then load the progress bar one by one. */
const BUBBLES = ['¿Dónde están ubicados?', '¿Qué prestaciones brindan?', '¿Cómo me contacto?', '¿Solo chicos o también adultos?', '¿Trabajan con obras sociales?'];
const B_IN = [-0.2, 0.3, 0.7, 1.1, 1.5];
export const flyT = (i: number) => 2.42 + i * 0.14;
const Opening: React.FC<{t: number}> = ({t}) => {
  if (t > 4.5) return null;
  const S = fit(['UNA POR UNA'], CW, 150, 900);
  const words = ['UNA', 'POR', 'UNA'];
  const times = [3.3, 3.55, 3.8];
  let wx = X0;
  return (
    <>
      {BUBBLES.map((txt, i) => {
        const p = prog(t, B_IN[i], 0.4, back);
        const f = prog(t, flyT(i), 0.42, easeIO);
        if (p <= 0 || f >= 1) return null;
        const c = PALETTE[i];
        const left = i % 2 === 0;
        const typed = i === 0 ? 1 : prog(t, B_IN[i] + 0.26, 0.24, easeIO);
        const full = tw(txt, 44, 800) + 84;
        const w0 = lerp(150, full, typed);
        const g = seg(i);
        const w = lerp(w0, g.w, f);
        const h = lerp(92, g.h, f);
        const x = lerp(left ? X0 : X0 + CW - w0, g.x, f);
        const y = lerp(300 + i * 104 + Math.sin(t * 2.2 + i * 1.3) * 4, g.y, f);
        const r = lerp(46, 5, f);
        const tail = lerp(10, 5, f);
        return (
          <div
            key={i}
            style={{position: 'absolute', left: x, top: y, width: w, height: h, background: css(c), borderRadius: left ? `${r}px ${r}px ${r}px ${tail}px` : `${r}px ${r}px ${tail}px ${r}px`, transform: `scale(${p})`, transformOrigin: left ? '0% 100%' : '100% 100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: `0 10px 30px rgba(0,0,0,${0.14 * (1 - f)})`}}
          >
            {typed < 0.5 ? (
              <div style={{display: 'flex', gap: 10}}>
                {[0, 1, 2].map((k) => (
                  <div key={k} style={{width: 14, height: 14, borderRadius: 7, background: onColor(c), opacity: 0.45 + 0.55 * Math.max(0, Math.sin(t * 14 - k * 0.9))}} />
                ))}
              </div>
            ) : (
              <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 44, color: onColor(c), whiteSpace: 'nowrap', opacity: clamp01((typed - 0.5) * 2) * (1 - clamp01(f * 4))}}>{txt}</span>
            )}
          </div>
        );
      })}
      <T t={t} t0={2.95} x={X0} y={312} size={58}>
        Las respondemos
      </T>
      {words.map((w, i) => {
        const x = wx;
        wx += tw(w + ' ', S, 900);
        return (
          <T key={i} t={t} t0={times[i]} x={x} y={388} size={S} weight={900} dur={0.4}>
            {w}
          </T>
        );
      })}
      <Trazo t={t} t0={3.85} dur={0.5} x={X0} y={388 + S + 4} w={440} />
    </>
  );
};

/** 45 s · the spoken call to action: one last card and a comment field that "types" the invitation. */
const CTA_Q = ['¿Te quedó alguna', 'pregunta?'];
const CTA_T = 44.9667;
const Cta: React.FC<{t: number}> = ({t}) => {
  if (t < CTA_T - 0.05) return null;
  const size = fit(CTA_Q, CW - 96, 88, 800);
  const lh = size * 1.1;
  const h = 46 + 2 * lh + 34;
  const p = prog(t, CTA_T, 0.5, back);
  const outro = prog(t, 48.3, 0.3);
  const msg = 'Dejala en comentarios';
  const n = Math.round(msg.length * prog(t, 46.5, 0.8, (x) => x));
  const fp = prog(t, 46.2, 0.45, back);
  const fy = CARD_Y + h + 20;
  const press = 1 - 0.12 * Math.sin(Math.PI * clamp01((t - 47.4) / 0.3));
  const caret = n < msg.length || Math.sin(t * 9) > 0;
  return (
    <>
      <div style={{position: 'absolute', left: X0, top: CARD_Y, width: CW, height: h, borderRadius: 32, background: outro > 0.5 ? css(C.gray) : '#fff', boxShadow: `0 14px 44px rgba(0,0,0,${0.13 * (1 - outro)})`, transform: `scale(${p})`, transformOrigin: '10% 0%', opacity: clamp01(p * 3)}}>
        <div style={{position: 'absolute', left: 48, top: 46, fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1, color: '#000', whiteSpace: 'nowrap'}}>
          {CTA_Q.map((l, k) => (
            <div key={k} style={{height: lh}}>
              <Rise t={t} t0={CTA_T + 0.14 + k * 0.07} dur={0.42}>
                {l}
              </Rise>
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', left: CW - 124, top: -44, width: 104, height: 104, borderRadius: 52, background: css(C.violet), display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${lerp(-18, 8, p)}deg)`}}>
          <QMark size={50} color="#fff" />
        </div>
      </div>
      {fp > 0 ? (
        <div style={{position: 'absolute', left: X0, top: fy, width: CW, height: 104, borderRadius: 52, background: '#fff', border: outro > 0.5 ? `4px solid ${css(C.gray)}` : undefined, boxSizing: 'border-box', boxShadow: `0 14px 44px rgba(0,0,0,${0.13 * (1 - outro)})`, transform: `scale(${fp})`, transformOrigin: '10% 50%', display: 'flex', alignItems: 'center', fontFamily: FONT}}>
          <div style={{marginLeft: 40, fontWeight: 700, fontSize: 44, color: '#000', whiteSpace: 'pre'}}>
            {msg.slice(0, n)}
            <span style={{display: 'inline-block', width: 4, height: 50, background: css(C.violet), marginLeft: 4, verticalAlign: 'middle', opacity: caret ? 1 : 0}} />
          </div>
          <div style={{position: 'absolute', right: 12, top: 12, width: 80, height: 80, borderRadius: 40, background: css(C.violet), display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${press})`}}>
            <svg width={40} height={40} viewBox="0 0 40 40" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 32V9M9 19l11-11 11 11" />
            </svg>
          </div>
        </div>
      ) : null}
      <Ripple t={t} t0={47.42} x={X0 + CW - 52} y={fy + 52} color={css(C.violet)} size={220} />
    </>
  );
};

const OutroWash: React.FC<{t: number}> = ({t}) => {
  const p = prog(t, 48.02, 0.5, easeIO);
  if (p <= 0) return null;
  return <AbsoluteFill style={{background: '#fff', clipPath: `circle(${p * 2300}px at 948px 630px)`}} />;
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
  const T = frame / FPS;
  const t = toSource(T);
  // footage runs in segments; between them a reading pause holds the screen
  const cuts = [0, ...HOLDS.map((h) => h.at), VIDEO_END];
  if (!ready) return <AbsoluteFill style={{background: '#fff'}} />;
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      {cuts.slice(0, -1).map((a, i) => {
        const from = Math.round((a + HOLDS.slice(0, i).reduce((x, h) => x + h.dur, 0)) * FPS);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.round((cuts[i + 1] - a) * FPS)}>
            <Footage t={t} startFrom={Math.round(a * FPS)} />
          </Sequence>
        );
      })}
      <Scene t={t} T={T} />
      <Audio src={staticFile('audio/mix.wav')} />
    </AbsoluteFill>
  );
};

const BLOCK_T: [number, number, number][] = [
  [4.4333, 5.7333, 16.2],
  [16.2, 17.8667, 23.6],
  [23.6, 25.3667, 30.2333],
  [30.2333, 32.3667, 40.9333],
  [40.9333, 42.1333, 44.9667],
];

const Scene: React.FC<{t: number; T: number}> = ({t, T}) => {
  const fills = BLOCK_T.map(([q, , e]) => clamp01((t - q) / (e - q - 0.4)));
  const loaded = BLOCK_T.map((_, i) => prog(t, flyT(i) + 0.38, 0.15));
  const inQuestion = BLOCK_T.some(([q, a]) => t >= q - 0.1 && t < a);
  return (
    <AbsoluteFill>
      <Opening t={t} />
      <Block1 t={t} />
      <Block2 t={t} />
      <Block3 t={t} />
      <Block4 t={t} />
      <Block5 t={t} />
      {inQuestion ? null : <Subtitles t={t} />}
      <OutroWash t={t} />
      <HoldPrestaciones T={T} />
      <HoldContacto T={T} />
      <Header t={t} fills={fills} loaded={loaded} logoOp={1 - prog(t, 48.2, 0.25)} inP={prog(t, -0.25, 0.5, easeIO)} />
      <Cta t={t} />
      <OutroContent t={t} />
    </AbsoluteFill>
  );
};
