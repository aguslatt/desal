import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {fit} from './anim';
import {useFonts} from './fonts';
import {QMark, Trazo} from './kit';
import {C, FONT, css} from './theme';

/**
 * Portada para fijar (1080 x 1920), fondo liso. Todo vive en la zona 3:4 que se ve en la grilla (y 240-1680)
 * y el título queda dentro del cuadrado central, que es lo que muestra el perfil.
 * variant "clara": institucional (gris claro, logo color). "violeta": fondo pleno con logo blanco.
 */
export const Cover: React.FC<{variant?: 'clara' | 'violeta'}> = ({variant = 'clara'}) => {
  const ready = useFonts();
  const dark = variant === 'violeta';
  const bg = dark ? css(C.violet) : css(C.gray);
  if (!ready) return <AbsoluteFill style={{background: bg}} />;
  const fg = dark ? '#fff' : '#000';
  const S = fit(['FRECUENTES'], 900, 150, 900);
  return (
    <AbsoluteFill style={{background: bg}}>
      <Img src={staticFile(dark ? 'brand/logo-white.png' : 'brand/logo-color.png')} style={{position: 'absolute', left: 540 - 150, top: 470, width: 300}} />
      <div style={{position: 'absolute', left: 0, width: 1080, top: 632, display: 'flex', justifyContent: 'center'}}>
        <div style={{height: 68, padding: '0 38px', borderRadius: 34, background: dark ? '#fff' : '#000', color: dark ? '#000' : '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: '0.08em', display: 'flex', alignItems: 'center'}}>RESPONDE</div>
      </div>
      <div style={{position: 'absolute', left: 0, width: 1080, top: 770, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: S, lineHeight: 1.02, color: fg}}>
        <div>PREGUNTAS</div>
        <div>FRECUENTES</div>
      </div>
      <Trazo t={1} t0={0} dur={0.1} x={540 - 230} y={770 + 2 * S * 1.02 + 6} w={460} color={dark ? css(C.yellow) : undefined} sw={12} />
      <div style={{position: 'absolute', left: 540 - 75, top: 1270, width: 150, height: 150, borderRadius: 75, background: dark ? css(C.yellow) : css(C.violet), display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(8deg)'}}>
        <QMark size={72} color={dark ? '#000' : '#fff'} />
      </div>
    </AbsoluteFill>
  );
};
