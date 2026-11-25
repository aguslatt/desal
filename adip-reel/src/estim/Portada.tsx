import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {FONT, P, fontCss} from './Estim';

const strip: React.CSSProperties = {
  display: 'inline-block',
  background: P.white,
  color: P.ink,
  fontFamily: FONT,
  fontWeight: 800,
  fontSize: 122,
  lineHeight: 1,
  letterSpacing: '-0.025em',
  padding: '16px 30px 22px',
  whiteSpace: 'nowrap',
};

const PTS: [number, number, number][] = [[110, 640, 24], [70, 900, 18], [200, 1130, 20], [980, 620, 20], [1015, 880, 24], [900, 1140, 18]];
const NET: [number, number][] = [[0, 1], [1, 2], [3, 4], [4, 5]];

/** Reel cover. Everything that matters lives in the centred 1080 x 1440 grid crop (y 240 - 1680). */
export const Portada: React.FC = () => (
  <AbsoluteFill style={{background: P.tint, fontFamily: FONT}}>
    <style>{fontCss()}</style>
    <Img src={staticFile('brand/logo-color.png')} style={{position: 'absolute', left: 540 - 120, top: 286, width: 240}} />
    <div style={{position: 'absolute', left: 0, width: 1080, top: 428, textAlign: 'center'}}>
      <span style={{display: 'inline-block', background: P.pink, color: P.white, fontWeight: 800, fontSize: 32, letterSpacing: '0.06em', lineHeight: 1, padding: '18px 32px', borderRadius: 999}}>
        ESTIMULACIÓN TEMPRANA
      </span>
    </div>
    {/* conexiones: brand heads linked by lines, echoing the reel */}
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      {NET.map(([a, b], k) => (
        <line key={k} x1={PTS[a][0]} y1={PTS[a][1]} x2={PTS[b][0]} y2={PTS[b][1]} stroke={P.pink} strokeWidth={7} strokeLinecap="round" />
      ))}
      {PTS.map(([x, y, r], k) => (
        <circle key={k} cx={x} cy={y} r={r} fill={P.white} stroke={P.pink} strokeWidth={7} />
      ))}
    </svg>
    {/* la cabeza: fuchsia circle behind Andy */}
    <div style={{position: 'absolute', left: 540 - 430, top: 560, width: 860, height: 860, borderRadius: '50%', background: P.pink}} />
    <div style={{position: 'absolute', left: 60, top: 560, width: 980, height: 800, overflow: 'hidden'}}>
      <Img src={staticFile('estim/andy-cut.png')} style={{width: 980}} />
    </div>
    <div style={{position: 'absolute', left: 0, width: 1080, top: 1326, textAlign: 'center', transform: 'rotate(-2deg)'}}>
      <div>
        <span style={strip}>
          <span style={{color: P.pink}}>1 millón</span>
        </span>
      </div>
      <div style={{marginTop: -2}}>
        <span style={strip}>por segundo</span>
      </div>
    </div>
  </AbsoluteFill>
);
