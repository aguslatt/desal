import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {ARC, ARC_CAM, Cam, FULL, Rect, SHOTS, SRC_H, SRC_W, camXform, closeCam, ease, lerpCam} from './camera';
import {FONT, FPS, H, K, W, clamp, lerp, prog} from './tokens';
import {Fonts, fit} from './kit';
import type {Seg, Timeline} from './types';
import {Scenes} from './scenes';

const VIDEO = staticFile('media/sdr4k.mp4');

/** Plano de video con reencuadre (cam) dentro de una ventana (pantalla completa o arco). */
export const Plate: React.FC<{cam: Cam; win?: Rect; rTop?: number; srcF0: number; freeze?: boolean; grade?: boolean; scrim?: number}> = ({cam, win = FULL, rTop = 0, srcF0, freeze, grade = true, scrim = 1}) => {
  const {s, tx, ty} = camXform(cam, win);
  const vid = (
    <OffthreadVideo
      src={VIDEO}
      trimBefore={srcF0}
      muted
      pauseWhenBuffering={false}
      style={{position: 'absolute', left: 0, top: 0, width: SRC_W, height: SRC_H, transformOrigin: '0 0', transform: `translate(${tx - win.x}px, ${ty - win.y}px) scale(${s})`}}
    />
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        overflow: 'hidden',
        borderRadius: `${rTop}px ${rTop}px 0 0`,
        filter: grade ? 'contrast(1.04) saturate(1.07)' : undefined,
        background: K.gray,
      }}
    >
      {freeze ? <Freeze frame={0}>{vid}</Freeze> : vid}
      {/* velo oscuro bajo los subtítulos: vive dentro del marco, así no ensucia el lienzo blanco del cierre */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: scrim, background: `linear-gradient(to bottom, rgba(0,0,0,0) ${1240 - win.y}px, rgba(0,0,0,0.58) ${1620 - win.y}px)`}} />
    </div>
  );
};

const camFor = (seg: Seg, t: number): Cam => {
  const u = clamp((t - seg.outF0 / FPS) / ((seg.outF1 - seg.outF0) / FPS));
  if (seg.cam) {
    switch (seg.cam) {
      case 'wide':
        return SHOTS.wide;
      case 'wide2':
        return {z: 1.3, px: 1000, py: 1930, ax: 540, ay: 1120};
      case 'intCU':
        return SHOTS.intCU;
      case 'intCU2':
        return {z: 1.38, px: 1780, py: 1900, ax: 600, ay: 1190};
      case 'luA':
        return SHOTS.luA;
      case 'luB':
        return SHOTS.luB;
      case 'luC':
        return SHOTS.luC;
      case 'a2':
        return lerpCam({...SHOTS.luB, z: 1.25, ay: 1240}, {...SHOTS.luB, z: 1.5, ay: 1260}, ease(u));
      default:
        return SHOTS.frontal;
    }
  }
  switch (seg.id) {
    case 'HA':
    case 'HB':
      return SHOTS.luA;
    case 'HC':
      return {z: 1.55, px: 1650, py: 1560, ax: 600, ay: 1130};
    case 'IN':
      return SHOTS.wide;
    case 'LI':
    case 'LI7':
      return SHOTS.luB;
    case 'B2':
    case 'B3':
      return SHOTS.intCU;
    case 'A2':
      return lerpCam({...SHOTS.luB, z: 1.25, ay: 1240}, {...SHOTS.luB, z: 1.5, ay: 1260}, ease(u));
    case 'A3':
      return SHOTS.luC;
    default:
      return SHOTS.frontal;
  }
};

export const Ad: React.FC<{tl: Timeline}> = ({tl}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const segs = tl.segments;
  const close = segs.find((s) => s.kind === 'close')!;
  const tAdm = tl.marks.admisiones[tl.marks.admisiones.length - 1];
  const holdStart = close.outF1;
  const holdN = tl.totalFrames - holdStart;
  return (
    <AbsoluteFill style={{background: K.white, fontFamily: FONT}}>
      <Fonts />
      {segs.map((s, i) => {
        const prev = segs[i - 1];
        const gapN = prev ? s.outF0 - prev.outF1 : 0;
        const dur = s.outF1 - s.outF0;
        if (s.kind === 'close') {
          const c = closeCam(t, tAdm);
          return (
            <React.Fragment key={s.id}>
              {gapN > 0 && (
                <Sequence from={s.outF0 - gapN} durationInFrames={gapN}>
                  <Plate cam={closeCam(s.outF0 / FPS, tAdm).cam} win={closeCam(s.outF0 / FPS, tAdm).win} srcF0={s.srcF0} freeze scrim={1} />
                </Sequence>
              )}
              <Sequence from={s.outF0} durationInFrames={dur}>
                <Plate cam={c.cam} win={c.win} rTop={c.rTop} srcF0={s.srcF0} scrim={1 - c.p} />
              </Sequence>
              <Sequence from={holdStart} durationInFrames={holdN}>
                <Plate
                  cam={ARC_CAM(ARC.x + ARC.w / 2, ARC.y + 0.5 * ARC.h, lerp(0.8, 0.84, clamp((t - holdStart / FPS) / (holdN / FPS))))}
                  win={ARC}
                  rTop={ARC.w / 2}
                  srcF0={s.srcF1 - 1}
                  freeze
                  scrim={0}
                />
              </Sequence>
            </React.Fragment>
          );
        }
        return (
          <React.Fragment key={s.id}>
            {gapN > 0 && (
              <Sequence from={s.outF0 - gapN} durationInFrames={gapN}>
                <Plate cam={camFor(s, s.outF0 / FPS)} srcF0={s.srcF0} freeze />
              </Sequence>
            )}
            <Sequence from={s.outF0} durationInFrames={dur}>
              <Plate cam={camFor(s, t)} srcF0={s.srcF0} />
            </Sequence>
          </React.Fragment>
        );
      })}
      <Scenes tl={tl} t={t} />
    </AbsoluteFill>
  );
};
