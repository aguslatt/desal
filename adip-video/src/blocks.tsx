import React from 'react';
import {BASE, CAP_TOP, back, clamp01, easeIn, easeIO, easeOut, fit, lerp, prog, tw} from './anim';
import {BlockChrome, BlockDef, CW, Pop, Rise, T, X0, frame, under, useBlockShape} from './kit';
import {C, FONT, css} from './theme';

const ink = '#000';

// ───────────────────────────── 1 · ¿Dónde estamos ubicados? (violeta) ─────────────────────────────
const SEDES: [number, string][] = [
  [8.5, 'Av. Córdoba 950'],
  [9.9, 'Paraguay 930'],
  [11.06, 'Niceto Vega 5140'],
];
export const Block1: React.FC<{t: number}> = ({t}) => {
  const col = C.violet;
  const bigS = 150;
  const bigW = tw('3 SEDES', bigS, 900);
  const rowY = (i: number) => 606 + i * 88;
  const l1 = 'TODA CABA';
  const l2 = 'Y GBA';
  const S2 = 118;
  const w2 = Math.max(tw(l1, S2, 900), tw(l2, S2, 900));
  const eyebrow = 'NUESTRAS PRESTACIONES CUBREN';
  const b: BlockDef = {
    i: 0,
    col,
    tq: 4.4333,
    ta: 5.7333,
    end: 16.2,
    q: ['¿Dónde estamos', 'ubicados?'],
    tag: '¿DÓNDE ESTAMOS UBICADOS?',
    tagOut: 6.68,
    keys: () => [
      {t: 6.72, dur: 0.4, ...under(X0, 362, bigS, bigW)},
      // the underline drops and becomes the line that links the three sedes
      {t: 8.3, dur: 0.4, x: X0 + 25, y: rowY(0) + 25, w: 10, h: 10, r: 5},
      {t: 9.75, dur: 0.4, h: 98},
      {t: 10.92, dur: 0.4, h: 186},
      // back on the wall: accent bar, then the frame for the coverage area
      {t: 12.56, dur: 0.45, x: X0, y: 346, w: 96, h: 10, r: 5},
      {t: 15.55, dur: 0.5, ...frame(X0, 372, S2, w2, 2, 118)},
    ],
  };
  const {shape} = useBlockShape(t, b);
  const out1 = 12.5;
  return (
    <>
      <BlockChrome t={t} b={b} shape={shape} />
      <T t={t} t0={7.0} t1={out1} x={X0} y={362} size={bigS} weight={900}>
        <span style={{color: css(col)}}>3</span> SEDES
      </T>
      <T t={t} t0={7.42} t1={out1} x={X0} y={532} size={40} weight={600}>
        en la Ciudad de Buenos Aires
      </T>
      {SEDES.map(([t0, label], i) => (
        <React.Fragment key={i}>
          <Pop t={t} t0={t0 - 0.05} t1={out1 + i * 0.03} x={X0} y={rowY(i)}>
            <div style={{width: 60, height: 60, borderRadius: 30, background: css(col), color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {i + 1}
            </div>
          </Pop>
          <T t={t} t0={t0} t1={out1 + i * 0.03} x={X0 + 84} y={rowY(i) - 1} size={62}>
            {label}
          </T>
        </React.Fragment>
      ))}
      {/* coverage */}
      <T t={t} t0={13.3} t1={16.05} x={X0} y={300} size={30} color={css(col)} tracking={0.06}>
        {eyebrow}
      </T>
      <T t={t} t0={14.5} t1={16.05} x={X0} y={372} size={S2} weight={900}>
        {l1}
      </T>
      <T t={t} t0={15.5} t1={16.05} x={X0} y={372 + 118} size={S2} weight={900}>
        {l2}
      </T>
    </>
  );
};

// ───────────────────────────── 2 · ¿Qué prestaciones brindan? (fucsia) ─────────────────────────────
export const Block2: React.FC<{t: number}> = ({t}) => {
  const col = C.pink;
  const NS = 184;
  const pS = 86;
  const pW = tw('PRESTACIONES', pS, 900);
  const pX = X0;
  const nY = 392;
  const pY = nY + BASE * NS + 4;
  const eyebrow = 'ADAPTADAS A';
  const eW = tw(eyebrow, 34, 800, 0.06);
  const S = 92;
  const w1 = tw('CADA PERSONA', S, 900);
  const w2 = tw('Y CADA FAMILIA', S, 900);
  const y1 = 436;
  const b: BlockDef = {
    i: 1,
    col,
    tq: 16.2,
    ta: 17.8667,
    end: 23.6,
    q: ['¿Qué prestaciones', 'brindan en', 'Equipo ADIP?'],
    tag: '¿QUÉ PRESTACIONES BRINDAN EN EQUIPO ADIP?',
    tagOut: 19.62,
    keys: () => [
      {t: 19.68, dur: 0.42, ...under(pX, pY, pS, pW, 12)},
      {t: 20.38, dur: 0.45, x: X0, y: 418, w: eW, h: 8, r: 4},
      {t: 22.34, dur: 0.45, ...frame(X0, y1, S, w1)},
      {t: 22.98, dur: 0.42, ...frame(X0, y1, S, Math.max(w1, w2), 2, 96)},
    ],
  };
  const {shape} = useBlockShape(t, b);
  const n = Math.round(lerp(1, 10, prog(t, 19.2, 0.5, easeOut)));
  const out1 = 20.3;
  return (
    <>
      <BlockChrome t={t} b={b} shape={shape} />
      <T t={t} t0={19.08} t1={out1} x={X0} y={372} size={34} color={css(col)} tracking={0.06}>
        MÁS DE
      </T>
      <Pop t={t} t0={19.16} t1={out1} x={X0} y={nY} origin="0% 80%">
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: NS, lineHeight: 1, color: css(col), whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>+{n}</div>
      </Pop>
      <T t={t} t0={19.62} t1={out1} x={pX} y={pY} size={pS} weight={900}>
        PRESTACIONES
      </T>
      <T t={t} t0={20.46} t1={23.45} x={X0} y={372} size={34} color={css(col)} tracking={0.06}>
        {eyebrow}
      </T>
      <T t={t} t0={22.3} t1={23.45} x={X0} y={y1} size={S} weight={900}>
        CADA PERSONA
      </T>
      <T t={t} t0={22.95} t1={23.45} x={X0} y={y1 + 96} size={S} weight={900}>
        Y CADA FAMILIA
      </T>
    </>
  );
};

// ───────────────────────────── 3 · ¿Cómo me puedo contactar? (naranja) ─────────────────────────────
const Icon: React.FC<{kind: 'chat' | 'mail' | 'phone'; col: string}> = ({kind, col}) => (
  <svg width={44} height={44} viewBox="0 0 48 48" fill="none" stroke="#000" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
    {kind === 'chat' ? (
      <>
        <path d="M9 9h30a4 4 0 0 1 4 4v17a4 4 0 0 1-4 4H23l-9 8v-8H9a4 4 0 0 1-4-4V13a4 4 0 0 1 4-4z" />
        <circle cx={16} cy={21.5} r={2.6} fill={col} stroke="none" />
        <circle cx={24} cy={21.5} r={2.6} fill={col} stroke="none" />
        <circle cx={32} cy={21.5} r={2.6} fill={col} stroke="none" />
      </>
    ) : kind === 'mail' ? (
      <>
        <rect x={5} y={10} width={38} height={28} rx={5} />
        <path d="M6 13l18 14 18-14" />
        <circle cx={40} cy={11} r={5.5} fill={col} stroke="none" />
      </>
    ) : (
      <>
        <path d="M15 6h-5a4 4 0 0 0-4 4c0 17.7 14.3 32 32 32a4 4 0 0 0 4-4v-5l-9-4-4 5c-6-2.6-10.4-7-13-13l5-4z" />
        <circle cx={34} cy={13} r={5.5} fill={col} stroke="none" />
      </>
    )}
  </svg>
);
const VIAS: [number, string, 'chat' | 'mail' | 'phone'][] = [
  [27.3, 'WhatsApp', 'chat'],
  [28.22, 'Email', 'mail'],
  [29.45, 'Teléfonos fijos', 'phone'],
];
export const Block3: React.FC<{t: number}> = ({t}) => {
  const col = C.orange;
  const S = 124;
  const bigW = tw('CONTACTO', S, 900);
  const rowY = (i: number) => 540 + i * 108;
  const RH = 92;
  const b: BlockDef = {
    i: 2,
    col,
    tq: 23.6,
    ta: 25.3667,
    end: 30.2333,
    q: ['¿Cómo me puedo', 'contactar con', 'el equipo?'],
    tag: '¿CÓMO ME PUEDO CONTACTAR CON EL EQUIPO?',
    tagOut: 25.72,
    keys: () => [
      {t: 25.78, dur: 0.42, ...under(X0, 372, S, bigW)},
      // the underline becomes the highlight that steps through the three channels
      {t: 27.26, dur: 0.4, x: X0, y: rowY(0), w: CW, h: RH, r: 32, fa: 1},
      {t: 28.18, dur: 0.36, y: rowY(1)},
      {t: 29.4, dur: 0.36, y: rowY(2)},
    ],
  };
  const {shape} = useBlockShape(t, b);
  const out = 30.1;
  return (
    <>
      {VIAS.map(([, , ], i) => {
        const p = prog(t, 26.5 + i * 0.09, 0.45, easeOut) * (1 - prog(t, out, 0.2));
        return p > 0 ? <div key={i} style={{position: 'absolute', left: X0, top: rowY(i) + (1 - p) * 30, width: CW, height: RH, borderRadius: 32, background: css(C.gray), opacity: p}} /> : null;
      })}
      <BlockChrome t={t} b={b} shape={shape} />
      <T t={t} t0={25.7} t1={out} x={X0} y={372} size={S} weight={900}>
        CONTACTO
      </T>
      {VIAS.map(([t0, label, kind], i) => {
        const p = prog(t, 26.5 + i * 0.09, 0.45, easeOut) * (1 - prog(t, out, 0.2));
        if (p <= 0) return null;
        const on = prog(t, t0, 0.25);
        return (
          <div key={i} style={{position: 'absolute', left: X0, top: rowY(i) + (1 - p) * 30, width: CW, height: RH, opacity: p, display: 'flex', alignItems: 'center', fontFamily: FONT}}>
            <div style={{marginLeft: 14, width: 66, height: 66, borderRadius: 33, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.12 * Math.sin(Math.PI * clamp01((t - t0) / 0.35))})`}}>
              <Icon kind={kind} col={css(col)} />
            </div>
            <div style={{marginLeft: 26, fontWeight: 800, fontSize: 50, lineHeight: 1, color: lerp(98, 0, on) < 1 ? '#000' : `rgb(${lerp(98, 0, on)},${lerp(97, 0, on)},${lerp(97, 0, on)})`}}>{label}</div>
          </div>
        );
      })}
    </>
  );
};

// ───────────────────────────── 4 · ¿Solo chicos o también adultos? (amarillo) ─────────────────────────────
export const Block4: React.FC<{t: number}> = ({t}) => {
  const col = C.yellow;
  const S = fit(['ETAPA DE LA VIDA'], CW, 90, 900);
  const wA2 = tw('ETAPA DE LA VIDA', S, 900);
  const yA1 = 372;
  const yA2 = 372 + S * 1.06;
  const lineY = yA2 + BASE * S + 13;
  const SR = 60;
  const wE = tw('ESPECÍFICO', S, 900);
  const b: BlockDef = {
    i: 3,
    col,
    tq: 30.2333,
    ta: 32.3667,
    end: 40.9333,
    q: ['¿Equipo ADIP es', 'solo de chicos o', 'también adultos?'],
    tag: '¿SOLO CHICOS O TAMBIÉN ADULTOS?',
    tagOut: 34.95,
    keys: () => [
      {t: 35.0, dur: 0.42, ...under(X0, yA2, S, wA2)},
      // the underline stretches into the line of life stages
      {t: 35.82, dur: 0.3, x: X0, w: 60},
      {t: 36.08, dur: 1.45, w: CW},
      // ...and folds into a marker behind the key word (yellow needs a fill, not an outline)
      {t: 38.3, dur: 0.4, x: X0, w: wE},
      {t: 39.08, dur: 0.45, x: X0 - 22, y: yA2 + CAP_TOP * S - 18, w: wE + 44, h: 0.7 * S + 36, r: 20, fa: 1},
    ],
  };
  const {shape} = useBlockShape(t, b);
  const outA = 35.72;
  const outB = 38.25;
  const end = 40.78;
  const sizes = [26, 36, 46, 56, 66];
  return (
    <>
      <BlockChrome t={t} b={b} shape={shape} />
      <T t={t} t0={34.24} t1={outA} x={X0} y={yA1} size={S} weight={900}>
        EN CUALQUIER
      </T>
      <T t={t} t0={34.9} t1={outA} x={X0} y={yA2} size={S} weight={900}>
        ETAPA DE LA VIDA
      </T>
      {/* range */}
      <T t={t} t0={35.95} t1={outB} x={X0} y={lineY - 132} size={28} tracking={0.06} color="#626161">
        DESDE
      </T>
      <T t={t} t0={36.02} t1={outB} x={X0} y={lineY - 96} size={SR + 16} weight={900}>
        BEBÉS
      </T>
      <T t={t} t0={36.6} t1={outB} x={X0 + CW} y={lineY - 196} size={28} tracking={0.06} color="#626161" right>
        HASTA
      </T>
      <T t={t} t0={37.22} t1={outB} x={X0 + CW} y={lineY - 160} size={SR + 4} weight={900} right>
        ADULTOS
      </T>
      <T t={t} t0={37.5} t1={outB} x={X0 + CW} y={lineY - 92} size={SR + 4} weight={900} right>
        MAYORES
      </T>
      {sizes.map((d, i) => {
        const t0 = 36.12 + i * 0.33;
        const p = prog(t, t0, 0.4, back) * (1 - prog(t, outB + 0.05, 0.2, easeIn));
        if (p <= 0) return null;
        const cx = X0 + 33 + (i * (CW - 66)) / 4;
        return (
          <div key={i} style={{position: 'absolute', left: cx - d / 2, top: lineY + 7 - d / 2, width: d, height: d, borderRadius: d / 2, background: css(col), border: '5px solid #000', boxSizing: 'border-box', transform: `scale(${p})`}} />
        );
      })}
      {/* no range */}
      <T t={t} t0={38.46} t1={end} x={X0} y={yA1} size={S} weight={900}>
        NO HAY UN RANGO
      </T>
      <T t={t} t0={39.0} t1={end} x={X0} y={yA2} size={S} weight={900}>
        ESPECÍFICO
      </T>
      <T t={t} t0={39.55} t1={end} x={X0} y={yA2 + S + 26} size={38} weight={600}>
        para recibir nuestras prestaciones
      </T>
    </>
  );
};

// ───────────────────────────── 5 · ¿Trabajan con obras sociales? (verde) ─────────────────────────────
export const Block5: React.FC<{t: number}> = ({t}) => {
  const col = C.green;
  const S = 210;
  const sW = tw('SÍ', S, 900);
  const y = 340;
  const BW = (CW - 20) / 2;
  const BY = 566;
  const BH = 112;
  const b: BlockDef = {
    i: 4,
    col,
    tq: 40.9333,
    ta: 42.1333,
    end: 44.9667,
    q: ['¿Trabajan con', 'obras sociales?'],
    tag: '¿TRABAJAN CON OBRAS SOCIALES?',
    tagOut: 42.4,
    keys: () => [
      {t: 42.45, dur: 0.36, ...under(X0, y, S, sW)},
      // the underline grows into the first of two comparable blocks
      {t: 43.18, dur: 0.45, x: X0, y: BY, w: BW, h: BH, r: 32, fa: 1},
    ],
  };
  const {shape} = useBlockShape(t, b);
  const out = 44.8;
  const label: React.CSSProperties = {fontFamily: FONT, fontWeight: 800, fontSize: 44, lineHeight: 1, letterSpacing: '0.01em', color: ink, whiteSpace: 'nowrap'};
  const pB = prog(t, 44.26, 0.45, back) * (1 - prog(t, out, 0.2, easeIn));
  const aOp = prog(t, 43.4, 0.25) * (1 - prog(t, out, 0.12));
  return (
    <>
      <BlockChrome t={t} b={b} shape={shape} />
      <Pop t={t} t0={42.2} t1={out} x={X0} y={y} origin="0% 85%">
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: S, lineHeight: 1, color: ink}}>SÍ</div>
      </Pop>
      <T t={t} t0={42.66} t1={out} x={X0 + sW + 30} y={y + BASE * S - BASE * 46} size={46} weight={700}>
        trabajamos con
      </T>
      {aOp > 0 ? (
        <div style={{position: 'absolute', left: X0, top: BY, width: BW, height: BH, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: aOp, ...label}}>OBRAS SOCIALES</div>
      ) : null}
      {pB > 0 ? (
        <div
          style={{position: 'absolute', left: X0 + BW + 20, top: BY, width: BW, height: BH, borderRadius: 32, background: '#fff', border: `7px solid ${css(col)}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pB})`, ...label}}
        >
          PARTICULAR
        </div>
      ) : null}
    </>
  );
};
