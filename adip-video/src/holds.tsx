import React from 'react';
import {AbsoluteFill} from 'remotion';
import {back, clamp01, easeIO, easeOut5, fit, prog, tw} from './anim';
import {Icon, PRESTACIONES} from './blocks';
import {CW, X0} from './kit';
import {C, FONT, css} from './theme';
import {HOLDS, holdStart} from './timeline';

/** Reading pauses: after the answer ends, the information gets the whole screen and stays long enough to read. */
const Shell: React.FC<{T: number; i: number; children: (L: number) => React.ReactNode}> = ({T, i, children}) => {
  const cs = holdStart(i);
  const L = T - cs;
  const dur = HOLDS[i].dur;
  if (L < -0.32 || L >= dur) return null;
  const p = prog(L, -0.3, 0.3, easeIO);
  const q = prog(L, dur - 0.36, 0.36, easeIO);
  return (
    <AbsoluteFill style={{background: '#fff', clipPath: `circle(${p * 1300}px at 540px 900px)`, transform: `translateY(${-q * 1920}px)`}}>{children(L)}</AbsoluteFill>
  );
};

const Title: React.FC<{L: number; eyebrow: string; text: string; col: string}> = ({L, eyebrow, text, col}) => {
  const S = fit([text], CW, 116, 900);
  const p = prog(L, 0.0, 0.5, easeOut5);
  return (
    <>
      <div style={{position: 'absolute', left: X0, top: 318, fontFamily: FONT, fontWeight: 800, fontSize: 34, letterSpacing: '0.06em', color: col, opacity: p}}>{eyebrow}</div>
      <div style={{position: 'absolute', left: X0, top: 366, fontFamily: FONT, fontWeight: 900, fontSize: S, lineHeight: 1, color: '#000', whiteSpace: 'nowrap', transform: `translateY(${(1 - p) * 40}px)`, opacity: p}}>{text}</div>
      <div style={{position: 'absolute', left: X0, top: 366 + S + 4, width: tw(text, S, 900) * prog(L, 0.25, 0.5, easeIO), height: 14, borderRadius: 7, background: col}} />
    </>
  );
};

export const HoldPrestaciones: React.FC<{T: number}> = ({T}) => (
  <Shell T={T} i={0}>
    {(L) => {
      let y = 536;
      return (
        <>
          <Title L={L} eyebrow="NUESTRAS" text="PRESTACIONES" col={css(C.pink)} />
          {PRESTACIONES.map(([label, bg, fg], i) => {
            const two = label.length > 36;
            const h = two ? 128 : 80;
            const top = y;
            y += h + 12;
            const p = prog(L, 0.3 + i * 0.1, 0.45, back);
            if (p <= 0) return null;
            const lines = two ? ['Inclusión sociolaboral', 'y vida independiente'] : [label];
            return (
              <div key={i} style={{position: 'absolute', left: X0, top, height: h, padding: '0 36px', borderRadius: 40, background: bg, color: fg, fontFamily: FONT, fontWeight: 800, fontSize: 40, lineHeight: 1.16, display: 'flex', flexDirection: 'column', justifyContent: 'center', whiteSpace: 'nowrap', transform: `translateX(${(1 - p) * -70}px)`, opacity: clamp01(p * 2)}}>
                {lines.map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>
            );
          })}
        </>
      );
    }}
  </Shell>
);

const FIJOS: [string, string][] = [
  ['Av. Córdoba 950', '11 4393-9837'],
  ['Paraguay 930', '11 4326-4141'],
  ['Niceto Vega 5140', '11 4771-1806'],
];
const Card: React.FC<{L: number; t0: number; top: number; h: number; kind: 'chat' | 'mail' | 'phone'; label: string; children: React.ReactNode}> = ({L, t0, top, h, kind, label, children}) => {
  const p = prog(L, t0, 0.5, back);
  if (p <= 0) return null;
  return (
    <div style={{position: 'absolute', left: X0, top: top + (1 - p) * 60, width: CW, height: h, borderRadius: 32, background: css(C.gray), opacity: clamp01(p * 2), fontFamily: FONT, color: '#000'}}>
      <div style={{position: 'absolute', left: 32, top: 28, display: 'flex', alignItems: 'center', gap: 18}}>
        <div style={{width: 72, height: 72, borderRadius: 36, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Icon kind={kind} col={css(C.orange)} />
        </div>
        <div style={{fontWeight: 800, fontSize: 40}}>{label}</div>
      </div>
      <div style={{position: 'absolute', left: 36, right: 36, top: 116}}>{children}</div>
    </div>
  );
};
export const HoldContacto: React.FC<{T: number}> = ({T}) => (
  <Shell T={T} i={1}>
    {(L) => (
      <>
        <Title L={L} eyebrow="ESCRIBINOS O LLAMANOS" text="CONTACTO" col={css(C.orange)} />
        <Card L={L} t0={0.3} top={540} h={232} kind="chat" label="WhatsApp">
          <div style={{fontWeight: 900, fontSize: 86, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>11 2781-5279</div>
        </Card>
        <Card L={L} t0={0.5} top={792} h={212} kind="mail" label="Email">
          <div style={{fontWeight: 900, fontSize: fit(['info@equipoadip.com.ar'], CW - 72, 64, 900), lineHeight: 1}}>info@equipoadip.com.ar</div>
        </Card>
        <Card L={L} t0={0.7} top={1024} h={348} kind="phone" label="Teléfonos fijos">
          {FIJOS.map(([sede, num]) => (
            <div key={num} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', height: 72}}>
              <span style={{fontWeight: 600, fontSize: 36}}>{sede}</span>
              <span style={{fontWeight: 900, fontSize: 54, fontVariantNumeric: 'tabular-nums'}}>{num}</span>
            </div>
          ))}
        </Card>
        <div style={{position: 'absolute', left: X0, top: 1400, height: 84, padding: '0 40px', borderRadius: 42, background: '#000', color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 40, display: 'flex', alignItems: 'center', transform: `scale(${prog(L, 1.0, 0.45, back)})`, transformOrigin: '10% 50%'}}>equipoadip.com.ar</div>
      </>
    )}
  </Shell>
);
