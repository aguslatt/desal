import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Img, Sequence, continueRender, delayRender,
  interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/oswald/700.css';

const RED = '#D7252B';
const YELLOW = '#F3D338';
const CREAM = '#F2EDE3';
const OSWALD = "'Oswald', sans-serif";
const MONT = "'Montserrat', sans-serif";

// ---- Tiempos (frames @30fps) ----
const S = {
  open: [0, 90], host: [90, 270], index: [270, 390],
  decl: [390, 630], wait: [630, 750], close: [750, 900],
} as const;
const dur = (s: readonly [number, number]) => s[1] - s[0];

const useLayout = () => {
  const {width, height} = useVideoConfig();
  return {width, height, v: height > width};
};

// ---- Fuentes: esperar a que carguen antes de renderizar ----
const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load("700 40px 'Oswald'"),
      document.fonts.load("700 40px 'Montserrat'"),
      document.fonts.load("600 40px 'Montserrat'"),
      document.fonts.load("800 40px 'Montserrat'"),
    ]).finally(() => continueRender(handle));
  }, [handle]);
};

// ---- Foto a pantalla completa con Ken Burns + textura retro ----
const Photo: React.FC<{
  src: string; from: number; to: number; fx?: number; fy?: number;
  easing?: (t: number) => number; texture?: boolean;
}> = ({src, from, to, fx = 50, fy = 50, easing, texture = true}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const total = (useSceneDuration() ?? durationInFrames) - 1;
  const scale = interpolate(frame, [0, total], [from, to], {extrapolateRight: 'clamp', easing});
  return (
    <AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
      <Img src={staticFile(src)} style={{
        width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${fx}% ${fy}%`,
        transform: `scale(${scale})`, transformOrigin: `${fx}% ${fy}%`,
      }} />
      {texture && <Texture />}
    </AbsoluteFill>
  );
};

const SceneDurCtx = React.createContext<number | null>(null);
const useSceneDuration = () => React.useContext(SceneDurCtx);
const Scene: React.FC<{range: readonly [number, number]; children: React.ReactNode}> = ({range, children}) => (
  <Sequence from={range[0]} durationInFrames={dur(range)} layout="none">
    <SceneDurCtx.Provider value={dur(range)}>
      <AbsoluteFill>{children}</AbsoluteFill>
    </SceneDurCtx.Provider>
  </Sequence>
);

// Viñeta + líneas de barrido muy sutiles (look de tele de los 70) y degradé inferior para leer subtítulos
const Texture: React.FC = () => (
  <>
    <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 2px, transparent 2px, transparent 4px)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 38%)'}} />
  </>
);

// ---- Zócalo: etiqueta roja + barra amarilla, entra/sale deslizando 0,3 s ----
const Zocalo: React.FC<{label: string; text: string; bottom?: number}> = ({label, text, bottom}) => {
  const frame = useCurrentFrame();
  const total = useSceneDuration()!;
  const {width, v} = useLayout();
  const IN = 6, SLIDE = 9, OUT = total - 6;
  const ease = Easing.out(Easing.cubic);
  const slide = (delay: number) => {
    const q = interpolate(frame, [IN + delay, IN + delay + SLIDE], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease})
      * (1 - interpolate(frame, [OUT - SLIDE + delay, OUT + delay], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)}));
    return `translateX(${(1 - q) * -110}%)`;
  };
  return (
    <div style={{position: 'absolute', left: 0, bottom: bottom ?? (v ? 500 : 250), display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: width - 60}}>
      <div style={{transform: slide(0), background: RED, color: '#fff', fontFamily: OSWALD, fontWeight: 700, textTransform: 'uppercase',
        fontSize: v ? 40 : 40, letterSpacing: 3, padding: '6px 40px 4px 56px', lineHeight: 1.2, boxShadow: '0 4px 14px rgba(0,0,0,0.35)'}}>
        {label}
      </div>
      <div style={{transform: slide(3), background: YELLOW, color: '#000', fontFamily: OSWALD, fontWeight: 700, textTransform: 'uppercase',
        fontSize: v ? 52 : 62, letterSpacing: 1.5, textWrap: 'balance', padding: '10px 56px 8px 56px', lineHeight: 1.15, boxShadow: '0 6px 18px rgba(0,0,0,0.35)'}}>
        {text}
      </div>
    </div>
  );
};

// ---- Subtítulo amarillo, centrado abajo ----
const Subtitle: React.FC<{text: string; start?: number}> = ({text, start = 15}) => {
  const frame = useCurrentFrame();
  const total = useSceneDuration()!;
  const {width, v} = useLayout();
  const o = interpolate(frame, [start, start + 6, total - 12, total - 6], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: v ? 290 : 62, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{maxWidth: v ? width - 120 : 1480, textAlign: 'center', fontFamily: MONT, fontWeight: 700, color: YELLOW,
        fontSize: 48, lineHeight: 1.25, textWrap: 'balance', textShadow: '0 3px 10px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)'}}>
        {text}
      </div>
    </div>
  );
};

// ---- 1. Apertura ----
const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const {v} = useLayout();
  const flash = interpolate(frame, [36, 45, 58], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const plate = frame >= 45;
  const txt = interpolate(frame, [45, 58], [0.93, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const barW = interpolate(frame, [48, 66], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      {!plate && <Photo src="01_apertura_globo.jpg" from={1} to={1.9} easing={Easing.in(Easing.cubic)} />}
      {plate && (
        <AbsoluteFill style={{background: `radial-gradient(ellipse at center, #E3303A 0%, ${RED} 55%, #A81A20 100%)`, alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: `${barW * 80}%`, height: 14, background: '#fff', marginBottom: v ? 50 : 40}} />
          <div style={{transform: `scale(${txt})`, color: '#fff', fontFamily: OSWALD, fontWeight: 700, textTransform: 'uppercase', textAlign: 'center',
            fontSize: v ? 190 : 240, lineHeight: 1.02, letterSpacing: v ? 4 : 6, textShadow: '0 8px 0 rgba(0,0,0,0.25)'}}>
            {v ? <>ÚLTIMO<br />MOMENTO</> : 'ÚLTIMO MOMENTO'}
          </div>
          <div style={{width: `${barW * 80}%`, height: 14, background: '#fff', marginTop: v ? 50 : 40}} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

// ---- 3. Índice RIESGO AMIGO ----
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const Digits: React.FC<{text: string; size: number; color: string; glow?: boolean}> = ({text, size, color, glow}) => (
  <div style={{display: 'flex', fontFamily: OSWALD, fontWeight: 700, fontSize: size, lineHeight: 1, color,
    textShadow: glow ? `0 0 ${size * 0.08}px rgba(215,37,43,0.9), 0 0 ${size * 0.22}px rgba(215,37,43,0.5)` : undefined}}>
    {text.split('').map((c, i) => (
      <span key={i} style={{display: 'inline-block', width: c === '.' ? size * 0.28 : size * 0.52, textAlign: 'center'}}>{c}</span>
    ))}
  </div>
);
const Index: React.FC = () => {
  const frame = useCurrentFrame();
  const {v} = useLayout();
  const n = interpolate(frame, [12, 90], [1200, 2000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const size = v ? 300 : 340;
  return (
    <AbsoluteFill style={{background: '#050505', alignItems: 'center', justifyContent: 'center'}}>
      <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 2px, transparent 2px, transparent 4px)'}} />
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: v ? -120 : -290}}>
        <div style={{fontFamily: OSWALD, fontWeight: 700, color: '#fff', fontSize: v ? 76 : 70, letterSpacing: v ? 14 : 18, marginBottom: 28, textTransform: 'uppercase'}}>
          RIESGO AMIGO
        </div>
        <div style={{position: 'relative', padding: v ? '30px 40px' : '30px 70px', border: '6px solid #3a0e10', borderRadius: 6, background: '#0b0505'}}>
          <div style={{position: 'absolute', top: v ? 30 : 30, left: v ? 40 : 70}}>
            <Digits text="8.888" size={size} color="rgba(215,37,43,0.13)" />
          </div>
          <Digits text={fmt(n)} size={size} color={RED} glow />
        </div>
      </div>
      <Zocalo label="ÚLTIMO MOMENTO" text="EL RIESGO AMIGO SUPERÓ LOS 2.000 PUNTOS" />
    </AbsoluteFill>
  );
};

// ---- 4. Declaraciones ----
const Declarations: React.FC = () => {
  const frame = useCurrentFrame();
  const {v} = useLayout();
  const IN = 18;
  const t = interpolate(frame, [IN, IN + 15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const boxW = v ? 360 : 380;
  const imgH = v ? 400 : 470;
  return (
    <AbsoluteFill>
      <Photo src="03_conferencia_micros.jpg" from={1.02} to={1.12} fx={v ? 42 : 50} fy={50} />
      <div style={{position: 'absolute', left: v ? 40 : 70, top: v ? 150 : 90, width: boxW, transform: `translateX(${(1 - t) * -(boxW + 120)}px)`,
        background: '#0c0c0c', padding: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.55)', borderRadius: 4}}>
        <div style={{height: imgH, background: `linear-gradient(160deg, #FBF7EE, ${CREAM} 60%, #E3DACA)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
          <Img src={staticFile('paquete_romance.png')} style={{height: imgH - 40}} />
        </div>
        <div style={{background: RED, color: '#fff', fontFamily: OSWALD, fontWeight: 700, textTransform: 'uppercase', fontSize: v ? 28 : 32, letterSpacing: 1.5,
          textAlign: 'center', padding: '8px 4px 6px', marginTop: 8, whiteSpace: 'nowrap'}}>
          ENTREVISTA: ROMANCE
        </div>
      </div>
      <Zocalo label="SOFÍA G." text="DEBE MATES DESDE 2023" />
      <Subtitle text="Asumo toda la responsabilidad. Este viernes." start={30} />
    </AbsoluteFill>
  );
};

// ---- 6. Cierre ----
const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {height, v} = useLayout();
  const pack = spring({frame: frame - 6, fps, config: {damping: 11, stiffness: 90, mass: 1}});
  const y = (1 - pack) * -(height * 0.9);
  const ty = interpolate(frame, [30, 48], [24, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const to = interpolate(frame, [30, 48], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const packH = v ? 820 : 560;
  return (
    <AbsoluteFill style={{background: CREAM, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: v ? 60 : 44, marginTop: v ? -40 : -10}}>
        <Img src={staticFile('paquete_romance.png')} style={{height: packH, transform: `translateY(${y}px)`, filter: 'drop-shadow(0 30px 36px rgba(0,0,0,0.25))'}} />
        <div style={{fontFamily: MONT, fontWeight: 800, color: '#1F4D36', fontSize: v ? 84 : 84, letterSpacing: -1, opacity: to, transform: `translateY(${ty}px)`}}>
          el mate que te debo.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  useFonts();
  const {v} = useLayout();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Scene range={S.open}><Opening /></Scene>
      <Scene range={S.host}>
        <Photo src="02_conductor_retro.jpg" from={1.04} to={1.14} fx={50} fy={40} />
        <Zocalo label="URGENTE" text="ARGENTINA ENTRA EN DEFAULT AFECTIVO" />
        <Subtitle text="Interrumpimos la programación por una noticia que preocupa al país." />
      </Scene>
      <Scene range={S.index}><Index /></Scene>
      <Scene range={S.decl}><Declarations /></Scene>
      <Scene range={S.wait}>
        <Photo src="04_sala_espera.jpg" from={1.02} to={1.06} fx={v ? 68 : 50} fy={50} />
        <Zocalo label="ATENCIÓN" text="LAS DEUDAS DE MATE NO PRESCRIBEN" />
        <Subtitle text="Mientras tanto, miles de amigos siguen esperando." />
      </Scene>
      <Scene range={S.close}><Closing /></Scene>
      {/* Sting: el último tono cae sobre el flash (1,5 s) y sobre el rebote del paquete */}
      <Sequence from={33}><Audio src={staticFile('sting.wav')} volume={0.8} /></Sequence>
      <Sequence from={S.close[0] + 8}><Audio src={staticFile('sting.wav')} volume={0.8} /></Sequence>
    </AbsoluteFill>
  );
};
