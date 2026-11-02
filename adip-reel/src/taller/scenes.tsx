import React from 'react';
import {Img, staticFile} from 'remotion';
import {easeIO, easeIn, easeOut, lerp, prog} from '../ui';
import {FONT, Icon, K, Label, Rise, Trazo, Wipe, abs} from '../charla/kit';
import {CHUNKS} from './data';

export const CREAM = '#FFF6EC';
const INK = K.ink;

/** One line of type that rises out of a mask. */
const L: React.FC<{
  t: number;
  t0: number;
  t1?: number;
  x: number;
  y: number;
  size: number;
  weight: number;
  color?: string;
  lh?: number;
  ls?: string;
  children: React.ReactNode;
}> = ({t, t0, t1, x, y, size, weight, color = INK, lh = 1.02, ls = '-0.02em', children}) => (
  <div style={abs(x, y, {fontSize: size, fontWeight: weight, color, lineHeight: lh, letterSpacing: ls})}>
    <Rise t={t} t0={t0} t1={t1}>
      {children}
    </Rise>
  </div>
);

/** colour that flips at a spoken instant (no layout shift: same weight) */
const at = (t: number, t0: number, a: string, b: string) => (t >= t0 ? b : a);

// ───────────────────────── 1. HOOK (0 – 2.3) ─────────────────────────
export const Hook: React.FC<{t: number}> = ({t}) => {
  if (t > 2.5) return null;
  const out = 1.95;
  return (
    <>
      <L t={t} t0={0.04} t1={out} x={80} y={128} size={100} weight={300}>
        ¿Te olvidás
      </L>
      <L t={t} t0={0.3} t1={out + 0.07} x={80} y={236} size={100} weight={900}>
        dónde dejaste
      </L>
      <L t={t} t0={0.66} t1={out + 0.14} x={80} y={344} size={100} weight={900} color={K.violet}>
        las cosas?
      </L>
      <Trazo t={t} t0={1.0} t1={out} left={80} top={426} w={330} color={K.orange} dur={0.7} id="tzh" />
    </>
  );
};

// ───────────────────────── 2. NEED LIST (2 – 9.3) ─────────────────────────
const NEEDS: [string, string, number][] = [
  ['01', 'Concentrarte', 2.05],
  ['02', 'Seguirle el ritmo', 4.5],
  ['03', 'Moverte más', 6.1],
  ['04', 'Conectar', 8.3],
];
export const Needs: React.FC<{t: number}> = ({t}) => {
  if (t < 2 || t > 9.9) return null;
  return (
    <>
      {NEEDS.map(([n, w, t0], i) => (
        <div key={n} style={abs(80, 140 + i * 98, {display: 'flex', alignItems: 'baseline', gap: 26})}>
          <Rise t={t} t0={t0} t1={9.3 + i * 0.05} style={{fontSize: 40, fontWeight: 800, color: K.orange, letterSpacing: '0.06em'}}>
            {n}
          </Rise>
          <Rise t={t} t0={t0 + 0.04} t1={9.3 + i * 0.05} style={{fontSize: 66, fontWeight: 800, color: INK, letterSpacing: '-0.02em'}}>
            {w}
          </Rise>
        </div>
      ))}
    </>
  );
};

// ───────────────────────── 3. BLOCK WIPES ─────────────────────────
export const BlockWipe: React.FC<{t: number; tIn: number; tOut: number; color: string; textColor: string; word: string; dir?: 1 | -1}> = ({
  t,
  tIn,
  tOut,
  color,
  textColor,
  word,
  dir = 1,
}) => {
  const a = prog(t, tIn, 0.3, easeIO);
  const b = prog(t, tOut, 0.32, easeIO);
  if (a <= 0 || b >= 1) return null;
  const x = dir * ((a - 1) * 1080 + b * 1080);
  const edge = dir === 1 ? {right: -26} : {left: -26};
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateX(${x}px)`, background: color, overflow: 'visible'}}>
      <div style={{position: 'absolute', top: 0, bottom: 0, width: 26, background: color === K.violet ? K.orange : K.violet, ...edge}} />
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          top: 880,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: word.length > 9 ? 84 : 190,
          letterSpacing: '-0.02em',
          color: textColor,
          textAlign: 'left',
          lineHeight: 1,
        }}
      >
        {word}
      </div>
    </div>
  );
};

// ───────────────────────── 4. SPLIT A: workshop title (9.67 – 16.4) ─────────────────────────
export const TitleTop: React.FC<{t: number}> = ({t}) => {
  if (t < 9.6 || t > 16.5) return null;
  const out = 16.05;
  return (
    <>
      <div style={abs(80, 838, {})}>
        <Wipe t={t} t0={9.85} t1={out} dur={0.6}>
          <Img src={staticFile('brand/logo-color.png')} style={{width: 236, height: 105, display: 'block'}} />
        </Wipe>
      </div>
      <L t={t} t0={10.84} t1={out} x={80} y={962} size={66} weight={600} color={INK}>
        Un{' '}
        <span style={{color: at(t, 11.1, INK, K.violet)}}>taller</span> para el
      </L>
      <L t={t} t0={12.1} t1={out + 0.05} x={80} y={1030} size={128} weight={900} color={INK}>
        bienestar
      </L>
      <L t={t} t0={12.5} t1={out + 0.1} x={80} y={1158} size={128} weight={900} color={K.violet}>
        integral
      </L>
      <div style={{position: 'absolute', left: 84, top: 1290, height: 10, width: 640 * prog(t, 13.0, 0.8, easeIO) * (1 - prog(t, out, 0.35, easeIn)), background: K.orange, borderRadius: 10}} />
      {t >= 13.38 && t < out + 0.3 && (
        <div style={abs(80, 1330, {})}>
          <Wipe t={t} t0={13.38} t1={out} dur={0.5}>
            <div style={{background: K.violet, color: K.white, fontSize: 30, fontWeight: 800, letterSpacing: '0.12em', padding: '15px 28px', borderRadius: 14}}>
              PARA PERSONAS MAYORES
            </div>
          </Wipe>
        </div>
      )}
    </>
  );
};

// ───────────────────────── 5. GUEST HEADLINE (16.4 – 18.5) ─────────────────────────
export const GuestHead: React.FC<{t: number}> = ({t}) => {
  if (t < 16.4 || t > 18.9) return null;
  const out = 18.4;
  return (
    <>
      <L t={t} t0={16.62} t1={out} x={80} y={140} size={96} weight={900}>
        Profesionales
      </L>
      <L t={t} t0={17.3} t1={out + 0.06} x={80} y={246} size={64} weight={600} color={K.violet}>
        de diferentes áreas
      </L>
      <Trazo t={t} t0={17.75} t1={out} left={80} top={318} w={300} color={K.orange} dur={0.7} id="tzg" />
    </>
  );
};

// ───────────────────────── 6. LIST PANEL (bot layout, 18.5 – 24.2) ─────────────────────────
const AREAS: [string, string, number, number][] = [
  ['01', 'Memoria', 19.6, 330],
  ['02', 'Atención', 20.46, 360],
  ['03', 'Movimiento', 21.44, 470],
  ['04', 'Alimentación saludable', 22.58, 790],
];
export const AreasPanel: React.FC<{t: number}> = ({t}) => {
  if (t < 18.5 || t > 24.7) return null;
  const out = 24.05;
  return (
    <>
      <Label t={t} t0={18.7} t1={out} left={80} top={86} text="VAMOS A TRABAJAR" rule={K.orange} size={28} />
      {AREAS.map(([n, w, t0, bw], i) => {
        const nextT = AREAS[i + 1]?.[2] ?? 99;
        const active = t >= t0 && t < nextT;
        const bar = prog(t, t0, 0.55, easeIO);
        const y = 160 + i * 112;
        return (
          <React.Fragment key={n}>
            <div style={abs(80, y + 22, {})}>
              <Rise t={t} t0={t0 - 0.08} t1={out + i * 0.04}>
                <span style={{fontSize: 38, fontWeight: 800, color: K.orange, letterSpacing: '0.06em'}}>{n}</span>
              </Rise>
            </div>
            <L t={t} t0={t0 - 0.04} t1={out + i * 0.04} x={178} y={y} size={62} weight={900} color={active ? K.violet : INK}>
              {w}
            </L>
            {bar > 0 && t < out + i * 0.04 + 0.3 && (
              <div style={{position: 'absolute', left: 178, top: y + 78, height: 8, width: bw * bar, background: K.orange, borderRadius: 8}} />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

// ───────────────────────── side panels ─────────────────────────
const SidePanel: React.FC<{
  t: number;
  t0: number;
  t1: number;
  y: number;
  w: number;
  h: number;
  bg: string;
  children: React.ReactNode;
}> = ({t, t0, t1, y, w, h, bg, children}) => {
  const a = prog(t, t0, 0.6, easeOut);
  const b = prog(t, t1, 0.45, easeIn);
  if (a <= 0 || b >= 1) return null;
  const x = (a - 1) * (w + 20) - b * (w + 20);
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: w, height: h, transform: `translateX(${x}px)`, background: bg, borderRadius: '0 32px 32px 0', fontFamily: FONT}}>
      {children}
    </div>
  );
};

// 7. technology (violet)
export const TechPanel: React.FC<{t: number}> = ({t}) => {
  const t0 = 25.0;
  const t1 = 29.55;
  return (
    <SidePanel t={t} t0={t0} t1={t1} y={170} w={540} h={540} bg={K.violet}>
      <div style={{position: 'absolute', left: 44, top: 40}}>
        <Icon kind="screen" color={K.orange} size={92} p={prog(t, t0 + 0.25, 0.5)} />
      </div>
      <L t={t} t0={25.38} t1={t1} x={44} y={154} size={56} weight={900} color={K.white}>
        Herramientas
      </L>
      <L t={t} t0={25.88} t1={t1} x={44} y={214} size={56} weight={900} color={K.orange}>
        tecnológicas
      </L>
      {[
        ['Celular', 28.5],
        ['Tablet', 29.14],
      ].map(([w, tt], i) => (
        <React.Fragment key={w as string}>
          {t >= (tt as number) - 0.05 && <div style={{position: 'absolute', left: 44, top: 326 + i * 84 + 14, width: 8, height: 40, background: K.orange, borderRadius: 4}} />}
          <L t={t} t0={tt as number} t1={t1} x={72} y={316 + i * 84} size={58} weight={800} color={K.white}>
            {w as string}
          </L>
        </React.Fragment>
      ))}
    </SidePanel>
  );
};

// 10. weekly meetings (orange)
export const MeetPanel: React.FC<{t: number}> = ({t}) => {
  const t0 = 42.97;
  const t1 = 47.2;
  return (
    <SidePanel t={t} t0={t0} t1={t1} y={170} w={520} h={560} bg={K.orange}>
      <L t={t} t0={43.06} t1={t1} x={44} y={44} size={62} weight={900} color={INK}>
        Encuentros
      </L>
      <L t={t} t0={43.5} t1={t1} x={44} y={112} size={62} weight={900} color={K.white}>
        semanales
      </L>
      <div style={{position: 'absolute', left: 44, top: 206, height: 6, width: 420 * prog(t, 43.9, 0.7, easeIO), background: INK, borderRadius: 6}} />
      {[
        ['Aprender', 44.34],
        ['Cuidarte', 45.24],
        ['Conectar', 45.98],
      ].map(([w, tt], i) => (
        <React.Fragment key={w as string}>
          {t >= (tt as number) - 0.05 && <div style={{position: 'absolute', left: 44, top: 240 + i * 92 + 20, width: 22, height: 22, background: INK, borderRadius: 22}} />}
          <L t={t} t0={tt as number} t1={t1} x={84} y={232 + i * 92} size={58} weight={800} color={INK}>
            {w as string}
          </L>
        </React.Fragment>
      ))}
    </SidePanel>
  );
};

// 11b. call to action (violet)
export const CtaPanel: React.FC<{t: number}> = ({t}) => {
  const t0 = 48.66;
  const t1 = 52.45;
  const box = prog(t, 50.34, 0.5, easeOut);
  return (
    <SidePanel t={t} t0={t0} t1={t1} y={150} w={540} h={540} bg={K.violet}>
      <L t={t} t0={48.74} t1={t1} x={44} y={38} size={56} weight={900} color={K.white}>
        Dejanos tu
      </L>
      <L t={t} t0={49.1} t1={t1} x={44} y={98} size={56} weight={900} color={K.white}>
        comentario
      </L>
      <L t={t} t0={49.94} t1={t1} x={44} y={190} size={34} weight={500} color={K.white} ls="0">
        con la palabra
      </L>
      {box > 0 && (
        <div style={{position: 'absolute', left: 44, top: 246, width: 330, height: 150, background: K.white, borderRadius: 20, overflow: 'hidden', transform: `scale(${lerp(0.9, 1, box)})`, transformOrigin: '0 50%', opacity: box}}>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 118, lineHeight: '150px', textAlign: 'center', color: K.violet, letterSpacing: '0.01em'}}>INFO</div>
        </div>
      )}
      <L t={t} t0={50.92} t1={t1} x={44} y={430} size={38} weight={700} color={K.white} ls="0">
        y te contactaremos
      </L>
    </SidePanel>
  );
};

// ───────────────────────── 8. CONVERSATION PANEL (top layout, 29.5 – 39.3) ─────────────────────────
const CONV: [string, number][] = [
  ['Interactuar', 32.28],
  ['Conversación', 34.28],
  ['Temas en común', 35.1],
  ['Miedos e inquietudes', 37.78],
];
export const ConvTop: React.FC<{t: number}> = ({t}) => {
  if (t < 30 || t > 39.8) return null;
  const out = 39.15;
  const y0 = 1014;
  const step = 84;
  return (
    <>
      <L t={t} t0={30.45} t1={out} x={80} y={866} size={100} weight={900} color={K.violet}>
        Un espacio
      </L>
      {/* line that links the ideas */}
      {CONV.map(([w, t0], i) => {
        if (i === 0) return null;
        const seg = prog(t, t0 - 0.05, 0.45, easeIO);
        const q = prog(t, out, 0.35, easeIn);
        return <div key={w} style={{position: 'absolute', left: 98, top: y0 + (i - 1) * step + 36, width: 8, height: (step - 6) * seg * (1 - q), background: K.orange, borderRadius: 4}} />;
      })}
      {CONV.map(([w, t0], i) => {
        const p = prog(t, t0 - 0.05, 0.4, easeOut);
        const q = prog(t, out + i * 0.04, 0.3, easeIn);
        return (
          <React.Fragment key={w}>
            {p > 0 && q < 1 && <div style={{position: 'absolute', left: 88, top: y0 + i * step + 18, width: 28, height: 28, borderRadius: 28, background: K.violet, transform: `scale(${p * (1 - q)})`}} />}
            <L t={t} t0={t0} t1={out + i * 0.04} x={146} y={y0 + i * step} size={56} weight={800} color={INK} ls="-0.01em">
              {w}
            </L>
          </React.Fragment>
        );
      })}
    </>
  );
};

// ───────────────────────── 9. the question (39.4 – 42.8) ─────────────────────────
export const AskHead: React.FC<{t: number}> = ({t}) => {
  if (t < 40 || t > 43.2) return null;
  const out = 42.55;
  return (
    <>
      <L t={t} t0={40.2} t1={out} x={80} y={140} size={100} weight={300}>
        Contame
      </L>
      <L t={t} t0={40.84} t1={out + 0.07} x={80} y={248} size={100} weight={900} color={K.violet}>
        la dinámica
      </L>
      <Trazo t={t} t0={41.35} t1={out} left={80} top={330} w={340} color={K.orange} dur={0.7} id="tzq" />
    </>
  );
};

// ───────────────────────── 11a. invitation (47.3 – 48.7) ─────────────────────────
export const InviteHead: React.FC<{t: number}> = ({t}) => {
  if (t < 47.3 || t > 49.2) return null;
  const out = 48.4;
  return (
    <>
      <L t={t} t0={47.34} t1={out} x={80} y={262} size={84} weight={300}>
        Si te gustaría
      </L>
      <L t={t} t0={47.78} t1={out + 0.06} x={80} y={356} size={112} weight={900} color={K.violet}>
        participar
      </L>
      <Trazo t={t} t0={48.1} t1={out} left={80} top={458} w={340} color={K.orange} dur={0.5} id="tzi" />
    </>
  );
};

// ───────────────────────── subtitles ─────────────────────────
const parse = (text: string) =>
  text
    .split(/(\[[^\]]+\])/)
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^\[(.+)\|([\d.]+)\]$/);
      return m ? {w: m[1], kt: parseFloat(m[2])} : {w: part, kt: null as number | null};
    });

export const Subs: React.FC<{t: number}> = ({t}) => {
  const c = CHUNKS.find((x) => t >= x.s && t < x.e);
  if (!c) return null;
  const inP = prog(t, c.s, 0.18, easeOut);
  const outP = 1 - prog(t, c.e - 0.08, 0.08, (x) => x);
  const op = Math.min(inP, outP);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1380, height: 190, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT, opacity: op, transform: `translateY(${(1 - inP) * 14}px)`}}>
      <div
        style={{
          background: 'rgba(255,246,236,0.96)',
          borderRadius: 32,
          padding: '22px 38px 24px',
          maxWidth: 960,
          textAlign: 'center',
          fontSize: 56,
          lineHeight: 1.2,
          fontWeight: 700,
          color: INK,
          letterSpacing: '-0.012em',
          textWrap: 'balance' as any,
        }}
      >
        {parse(c.text).map((p, i) => {
          if (p.kt === null) return <React.Fragment key={i}>{p.w}</React.Fragment>;
          const on = t >= p.kt - 0.02;
          const u = prog(t, p.kt - 0.02, 0.4, easeIO);
          return (
            <span
              key={i}
              style={{
                color: on ? K.violet : INK,
                fontWeight: on ? 800 : 700,
                backgroundImage: `linear-gradient(${K.orange},${K.orange})`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '0 100%',
                backgroundSize: `${u * 100}% 7px`,
                paddingBottom: 2,
              }}
            >
              {p.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ───────────────────────── closing composition ─────────────────────────
export const Outro: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  if (t < t0) return null;
  const g = [
    [0, K.violet],
    [0.3, K.pink],
    [0.55, K.orange],
    [0.78, K.yellow],
    [1, K.green],
  ] as const;
  const btn = prog(t, t0 + 1.9, 0.6, easeOut);
  return (
    <div style={{position: 'absolute', inset: 0, background: CREAM, fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 0, top: 0, height: 16, width: 1080 * prog(t, t0 + 0.05, 0.9, easeIO), background: `linear-gradient(90deg, ${g.map(([o, c]) => `${c} ${o * 100}%`).join(',')})`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 260, display: 'flex', justifyContent: 'center'}}>
        <Wipe t={t} t0={t0 + 0.25} dur={0.7}>
          <Img src={staticFile('brand/logo-color.png')} style={{width: 400, height: 178, display: 'block'}} />
        </Wipe>
      </div>
      <L t={t} t0={t0 + 0.7} x={80} y={600} size={128} weight={300}>
        Taller para
      </L>
      <L t={t} t0={t0 + 0.95} x={80} y={724} size={128} weight={900} color={K.violet}>
        personas
      </L>
      <L t={t} t0={t0 + 1.2} x={80} y={848} size={128} weight={900} color={K.violet}>
        mayores
      </L>
      <Trazo t={t} t0={t0 + 1.55} left={80} top={980} w={460} gradient dur={0.9} id="tzo" />
      <L t={t} t0={t0 + 1.7} x={80} y={1170} size={54} weight={500} lh={1.25} ls="-0.01em">
        Escribinos para conocer
      </L>
      <L t={t} t0={t0 + 1.8} x={80} y={1236} size={54} weight={500} lh={1.25} ls="-0.01em">
        la propuesta
      </L>
      {btn > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 1384,
            padding: '0 56px',
            height: 112,
            borderRadius: 56,
            background: K.violet,
            color: K.white,
            fontSize: 44,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            opacity: btn,
            transform: `translateY(${(1 - btn) * 24}px)`,
          }}
        >
          Comentá&nbsp;<span style={{fontWeight: 900}}>INFO</span>
        </div>
      )}
    </div>
  );
};
