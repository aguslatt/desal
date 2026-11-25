import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {FONT, P, fontCss} from './Estim';

const PTS: [number, number, number][] = [[640, 610, 24], [860, 540, 18], [960, 760, 26], [740, 840, 18]];
const NET: [number, number][] = [[0, 1], [1, 2], [2, 3], [0, 3], [0, 2]];

/** Reel cover: the number is the protagonist. Everything that matters lives in the centred 1080 x 1440 grid crop (y 240 - 1680). */
export const Portada: React.FC = () => (
  <AbsoluteFill style={{background: P.tint, fontFamily: FONT}}>
    <style>{fontCss()}</style>
    <Img src={staticFile('brand/logo-color.png')} style={{position: 'absolute', left: 540 - 110, top: 280, width: 220}} />
    {/* conexiones */}
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      {NET.map(([a, b], k) => (
        <line key={k} x1={PTS[a][0]} y1={PTS[a][1]} x2={PTS[b][0]} y2={PTS[b][1]} stroke={P.pink} strokeWidth={8} strokeLinecap="round" />
      ))}
      {PTS.map(([x, y, r], k) => (
        <circle key={k} cx={x} cy={y} r={r} fill={P.white} stroke={P.pink} strokeWidth={8} />
      ))}
    </svg>
    <div style={{position: 'absolute', left: 80, top: 452}}>
      <span style={{display: 'inline-block', background: P.pink, color: P.white, fontWeight: 800, fontSize: 30, letterSpacing: '0.06em', lineHeight: 1, padding: '17px 30px', borderRadius: 999}}>
        ESTIMULACIÓN TEMPRANA
      </span>
    </div>
    <div style={{position: 'absolute', left: 66, top: 500, fontWeight: 900, fontSize: 470, lineHeight: 1, letterSpacing: '-0.05em', color: P.ink}}>+1</div>
    <div style={{position: 'absolute', left: 80, top: 930, fontWeight: 900, fontSize: 212, lineHeight: 1, letterSpacing: '-0.035em', color: P.ink}}>MILLÓN</div>
    {/* Andy inside a head (circle) */}
    <div style={{position: 'absolute', left: 510, top: 1140, width: 520, height: 520, borderRadius: '50%', background: P.pink, overflow: 'hidden'}}>
      <Img src={staticFile('estim/andy-cut.png')} style={{position: 'absolute', left: -70, top: 70, width: 760}} />
    </div>
    <div style={{position: 'absolute', left: 80, top: 1180, transform: 'rotate(-2deg)', transformOrigin: '0 50%'}}>
      <div>
        <span style={{display: 'inline-block', background: P.white, color: P.ink, fontWeight: 800, fontSize: 66, lineHeight: 1, letterSpacing: '-0.02em', padding: '14px 24px 18px', whiteSpace: 'nowrap'}}>de conexiones</span>
      </div>
      <div style={{marginTop: -2}}>
        <span style={{display: 'inline-block', background: P.pink, color: P.white, fontWeight: 800, fontSize: 66, lineHeight: 1, letterSpacing: '-0.02em', padding: '14px 24px 18px', whiteSpace: 'nowrap'}}>por segundo</span>
      </div>
    </div>
  </AbsoluteFill>
);
