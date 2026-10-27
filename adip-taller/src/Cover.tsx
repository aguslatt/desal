import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT, GRADIENT} from './ui';

const fontCss = [500, 600, 700, 800, 900]
  .map((w) => `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}') format('woff2');}`)
  .join('\n');

const chip = (bg: string): React.CSSProperties => ({display: 'inline-block', background: bg, color: C.black, fontSize: 40, fontWeight: 800, padding: '18px 28px', lineHeight: 1});

// Portada de reel 1080x1920. Zona visible en la grilla (3:4): y 240 a 1680.
export const Cover: React.FC = () => {
  const s = 0.648;
  const w = 700;
  const h = 700;
  return (
    <AbsoluteFill style={{background: C.white, fontFamily: FONT, color: C.black}}>
      <style>{fontCss}</style>
      <div style={{position: 'absolute', left: 560, top: 1010, width: 760, height: 760, borderRadius: '50%', background: C.tintPink}} />
      <div style={{position: 'absolute', left: 0, top: 240, width: 1080, height: 16, background: GRADIENT}} />
      <Img src={staticFile('brand/logo-color.png')} style={{position: 'absolute', left: 420, top: 290, width: 240}} />
      <div style={{position: 'absolute', left: 80, top: 430, fontSize: 28, fontWeight: 800, letterSpacing: '0.06em'}}>
        <span style={{background: C.tintPink, padding: '10px 22px', display: 'inline-block'}}>TALLER ONLINE PARA FAMILIAS</span>
      </div>
      <div style={{position: 'absolute', left: 80, top: 500, fontSize: 124, lineHeight: 1.03, fontWeight: 800, letterSpacing: '-0.015em', whiteSpace: 'nowrap'}}>
        Ser padres,
        <br />
        <span style={{fontWeight: 900, color: C.violet}}>no pares</span>
      </div>
      <svg viewBox="0 0 400 120" width={330} height={99} style={{position: 'absolute', left: 76, top: 788, overflow: 'visible'}}>
        <defs>
          <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="400" y2="0">
            <stop offset="0" stopColor={C.violet} /><stop offset="0.3" stopColor={C.pink} /><stop offset="0.55" stopColor={C.orange} /><stop offset="0.78" stopColor={C.yellow} /><stop offset="1" stopColor={C.green} />
          </linearGradient>
        </defs>
        <path d="M10 96 C 70 98, 120 92, 156 74 C 196 54, 204 16, 178 12 C 150 8, 146 54, 182 76 C 220 98, 300 98, 390 92" fill="none" stroke="url(#g)" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{position: 'absolute', left: 80, top: 905, fontSize: 50, fontWeight: 600, whiteSpace: 'nowrap'}}>el arte de poner límites</div>
      <div style={{position: 'absolute', left: 190, top: 980, width: w, height: h, borderRadius: 32, overflow: 'hidden', background: C.gray}}>
        <div style={{position: 'absolute', left: 0, top: Math.max(h - 1908 * s, Math.min(0, h / 2 - 835 * s)), width: 1080, height: 1908, transformOrigin: '0 0', transform: `scale(${s})`}}>
          <Img src={staticFile('cover-frame.png')} style={{width: 1080, height: 1908}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 80, top: 1550, display: 'flex', gap: 12, flexDirection: 'column'}} />
      <div style={{position: 'absolute', left: 190, top: 1590, display: 'flex', gap: 12}}>
        <span style={chip(C.yellow)}>24 de noviembre</span>
        <span style={chip(C.orange)}>19 h</span>
        <span style={chip(C.green)}>online</span>
      </div>
    </AbsoluteFill>
  );
};
