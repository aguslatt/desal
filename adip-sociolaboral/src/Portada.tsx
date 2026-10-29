import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT} from './ui';
import {Cam, Chip, Logo, MediaDef, T1} from './parts';

const ANDY: MediaDef = {kind: 'img', src: 'fotos/portada_andy.png', nw: 1620, nh: 2880};

// Portada del reel 1080×1920: lo importante queda dentro de la zona 3:4 (y 240–1680) que se ve en la grilla.
export const Portada: React.FC = () => (
  <AbsoluteFill style={{background: C.white, fontFamily: FONT}}>
    <Cam m={ANDY} w={1080} h={1920} px={0.54} py={0.4} Y={1110} z={1.3} />
    <div style={{position: 'absolute', left: -40, top: 400, width: 880, height: 310, transform: 'rotate(-2.5deg)', background: C.yellow, boxShadow: '0 22px 50px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', paddingLeft: 110, gap: 34}}>
      <T1 size={300} ls={-0.05}>1</T1>
      <T1 size={70} weight={700} ls={-0.01}>{'de\ncada'}</T1>
      <T1 size={300} ls={-0.05}>10</T1>
    </div>
    <Chip x={300} y={725} text="trabajo registrado" size={64} bg={C.pink} color={C.white} weight={800} rot={3} p={1} />
    <Chip x={40} y={1445} text={'Programa de Inclusión\nSociolaboral y Vida Independiente'} size={46} bg={C.orange} weight={800} rot={-1.5} p={1} />
    <Logo x={430} y={262} w={220} />
  </AbsoluteFill>
);
