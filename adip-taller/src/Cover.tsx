import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT, GRADIENT} from './ui';

const fontCss = [500, 600, 700, 800, 900]
  .map((w) => `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}') format('woff2');}`)
  .join('\n');

// Portada de reel 1080x1920: foto plena + texto en bloque de color pleno.
// Zona visible en la grilla (3:4): y 240 a 1680.
export const Cover: React.FC = () => (
  <AbsoluteFill style={{background: C.gray, fontFamily: FONT, color: C.black}}>
    <style>{fontCss}</style>
    <Img src={staticFile('cover-frame.png')} style={{position: 'absolute', left: 0, top: 20, width: 1080, height: 1908}} />
    <div style={{position: 'absolute', left: 390, top: 258, width: 300, height: 128, background: C.white, borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Img src={staticFile('brand/logo-color.png')} style={{width: 210}} />
    </div>
    <div style={{position: 'absolute', left: 0, top: 1326, width: 1080, height: 14, background: GRADIENT}} />
    <div style={{position: 'absolute', left: 0, top: 1340, width: 1080, height: 340, background: C.yellow}} />
    <div style={{position: 'absolute', left: 80, top: 1366, fontSize: 112, lineHeight: 1.02, fontWeight: 900, letterSpacing: '-0.02em', whiteSpace: 'nowrap'}}>
      El límite
      <br />
      <span style={{color: C.violet}}>es amor.</span>
    </div>
    <div style={{position: 'absolute', left: 80, top: 1612, fontSize: 36, fontWeight: 700, whiteSpace: 'nowrap'}}>Taller online · 24 de noviembre · 19 h</div>
  </AbsoluteFill>
);
