import React from 'react';
import {easeIO, easeIn, easeOut, lerp, prog} from '../ui';
import {FONT, K, Rise, Trazo, abs} from '../charla/kit';
import {IconAlimentacion, IconAtencion, IconCelular, IconMemoria, IconMovimiento, IconTablet} from './icons';

const INK = K.ink;
const L: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; size: number; weight: number; color?: string; ls?: string; children: React.ReactNode}> = ({
  t,
  t0,
  t1,
  x,
  y,
  size,
  weight,
  color = INK,
  ls = '-0.02em',
  children,
}) => (
  <div style={abs(x, y, {fontSize: size, fontWeight: weight, color, lineHeight: 1.02, letterSpacing: ls})}>
    <Rise t={t} t0={t0} t1={t1}>
      {children}
    </Rise>
  </div>
);

/** white rounded card (brand: radius 32, flat); turns violet when its idea is being said */
export const Card: React.FC<{t: number; t0: number; t1: number; x: number; y: number; w: number; h: number; active: boolean; title: string; children: React.ReactNode}> = ({
  t,
  t0,
  t1,
  x,
  y,
  w,
  h,
  active,
  title,
  children,
}) => {
  const a = prog(t, t0, 0.65, easeOut);
  const b = prog(t, t1, 0.4, easeIn);
  if (a <= 0 || b >= 1) return null;
  const k = prog(t, t0, 0.3, easeOut);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 32,
        background: K.white,
        boxShadow: active ? `inset 0 0 0 8px ${K.violet}` : 'none',
        transform: `translateY(${(1 - a) * 90 - b * 120}px) scale(${lerp(0.94, 1, a)})`,
        opacity: k * (1 - b),
        fontFamily: FONT,
        transition: 'none',
        overflow: 'hidden',
      }}
    >
      <div style={{position: 'absolute', left: 0, right: 0, top: 26, display: 'flex', justifyContent: 'center'}}>{children}</div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 30, textAlign: 'center', fontSize: 50, fontWeight: 900, letterSpacing: '-0.02em', color: active ? K.violet : INK}}>{title}</div>
      <div style={{position: 'absolute', left: w / 2 - 50, bottom: 16, width: 100 * prog(t, t0 + 0.3, 0.6, easeIO), height: 7, borderRadius: 7, background: K.orange}} />
    </div>
  );
};

// ───────────── S4: the team (heads linked by one stroke) ─────────────
export const TeamHeads: React.FC<{t: number}> = ({t}) => {
  const t0 = 17.3;
  const out = 18.4;
  const q = prog(t, out, 0.4, easeIn);
  if (t < t0 || q >= 1) return null;
  const xs = [130, 300, 470, 640];
  const draw = prog(t, t0, 1.1, easeIO);
  return (
    <svg width={1080} height={700} viewBox="0 0 1080 700" style={{position: 'absolute', left: 0, top: 0, opacity: 1 - q, overflow: 'visible'}}>
      <path d="M130 500 C 190 420, 240 580, 300 500 S 410 420, 470 500 S 580 580, 640 500" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 2`} />
      {xs.map((x, i) => {
        const p = prog(t, t0 + 0.15 + i * 0.22, 0.45, easeOut);
        return <circle key={i} cx={x} cy={500} r={38 * p} fill={i % 2 === 0 ? K.violet : K.orange} stroke={INK} strokeWidth={6} />;
      })}
    </svg>
  );
};

// ───────────── S5: the four areas ─────────────
const AREAS: [string, number, 'mem' | 'att' | 'mov' | 'food'][] = [
  ['Memoria', 19.6, 'mem'],
  ['Atención', 20.46, 'att'],
  ['Movimiento', 21.44, 'mov'],
  ['Alimentación saludable', 22.58, 'food'],
];
const POS: [number, number][] = [
  [60, 120],
  [560, 120],
  [60, 520],
  [560, 520],
];
export const Areas: React.FC<{t: number}> = ({t}) => {
  if (t < 18.5 || t > 24.8) return null;
  const out = 24.05;
  return (
    <>
      <div style={abs(80, 52, {display: 'flex', alignItems: 'center', gap: 16})}>
        <div style={{height: 6, width: 56 * prog(t, 18.7, 0.5, easeOut), background: K.orange, borderRadius: 6}} />
        <Rise t={t} t0={18.75} t1={out} style={{fontSize: 28, fontWeight: 800, letterSpacing: '0.2em'}}>
          VAMOS A TRABAJAR
        </Rise>
      </div>
      {AREAS.map(([title, t0, kind], i) => {
        const next = AREAS[i + 1]?.[1] ?? 99;
        const active = t >= t0 && t < next;
        const IconC = {mem: IconMemoria, att: IconAtencion, mov: IconMovimiento, food: IconAlimentacion}[kind];
        return (
          <Card key={title} t={t} t0={t0 - 0.18} t1={out + i * 0.05} x={POS[i][0]} y={POS[i][1]} w={460} h={380} active={active} title={title === 'Alimentación saludable' ? 'Alimentación' : title}>
            <IconC t={t} t0={t0} size={236} on={active} />
          </Card>
        );
      })}
    </>
  );
};

// ───────────── S6: technology ─────────────
export const Tech: React.FC<{t: number}> = ({t}) => {
  if (t < 24.9 || t > 30.0) return null;
  const out = 29.55;
  return (
    <>
      <L t={t} t0={25.38} t1={out} x={80} y={96} size={100} weight={900}>
        Herramientas
      </L>
      <L t={t} t0={25.88} t1={out + 0.05} x={80} y={202} size={100} weight={900} color={K.violet}>
        tecnológicas
      </L>
      <Trazo t={t} t0={26.5} t1={out} left={80} top={290} w={300} color={K.orange} dur={0.7} id="tzt" />
      <Card t={t} t0={26.2} t1={out} x={60} y={400} w={460} h={450} active={t >= 28.5 && t < 29.14} title="Celular">
        <IconCelular t={t} t0={26.5} size={290} on={t >= 28.5 && t < 29.14} />
      </Card>
      <Card t={t} t0={26.45} t1={out + 0.05} x={560} y={400} w={460} h={450} active={t >= 29.14} title="Tablet">
        <IconTablet t={t} t0={26.8} size={290} on={t >= 29.14} />
      </Card>
    </>
  );
};

// ───────────── S7: conversation – link between the two speakers ─────────────
const PINGS = [32.28, 34.28, 35.1, 37.78];
export const ConvLink: React.FC<{t: number}> = ({t}) => {
  if (t < 29.8 || t > 39.2) return null;
  const out = 39.0;
  const q = prog(t, out, 0.3, easeIn);
  const draw = prog(t, 30.0, 1.2, easeIO);
  return (
    <svg width={1080} height={800} viewBox="0 0 1080 800" style={{position: 'absolute', left: 0, top: 0, opacity: 1 - q, overflow: 'visible'}}>
      <path d="M300 390 C 360 90, 720 90, 780 390" fill="none" stroke={K.white} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 2`} />
      {PINGS.map((p, i) => {
        const a = prog(t, p, 1.0, easeOut);
        if (a <= 0 || a >= 1) return null;
        return <circle key={i} cx={540} cy={165} r={14 + a * 110} fill="none" stroke={K.white} strokeWidth={8 * (1 - a)} opacity={1 - a} />;
      })}
      <circle cx={540} cy={165} r={16 * draw} fill={K.white} />
    </svg>
  );
};

// ───────────── S8: giant question mark behind the host ─────────────
export const BigQ: React.FC<{t: number}> = ({t}) => {
  const a = prog(t, 40.1, 0.7, easeOut);
  const b = prog(t, 42.55, 0.4, easeIn);
  if (a <= 0 || b >= 1) return null;
  return (
    <div style={{position: 'absolute', left: 500, top: 300, fontFamily: FONT, fontWeight: 900, fontSize: 1100, lineHeight: 1, color: K.orange, transform: `translateY(${(1 - a) * 120 + b * -120}px) scale(${lerp(0.85, 1, a)})`, opacity: a * (1 - b), transformOrigin: '50% 50%'}}>?</div>
  );
};
export const AskHead2: React.FC<{t: number}> = ({t}) => {
  if (t < 40 || t > 43.2) return null;
  const out = 42.55;
  return (
    <>
      <L t={t} t0={40.2} t1={out} x={80} y={130} size={112} weight={300}>
        Contame
      </L>
      <L t={t} t0={40.84} t1={out + 0.07} x={80} y={246} size={112} weight={900} color={K.violet}>
        la dinámica
      </L>
      <Trazo t={t} t0={41.35} t1={out} left={80} top={346} w={360} color={K.orange} dur={0.7} id="tzq2" />
    </>
  );
};

// ───────────── S9: weekly meetings ─────────────
export const Weekly: React.FC<{t: number}> = ({t}) => {
  if (t < 42.9 || t > 47.6) return null;
  const out = 47.15;
  const rows = 3;
  const hot = 3; // same column every week
  return (
    <>
      <L t={t} t0={43.06} t1={out} x={80} y={110} size={104} weight={300}>
        Encuentros
      </L>
      <L t={t} t0={43.5} t1={out + 0.06} x={80} y={222} size={104} weight={900} color={K.violet}>
        semanales
      </L>
      {/* weeks: one lit day per row, repeating */}
      <div style={{position: 'absolute', left: 60, top: 372, width: 520, height: 330, borderRadius: 32, background: K.white, opacity: prog(t, 43.6, 0.5, easeOut) * (1 - prog(t, out, 0.4, easeIn)), transform: `translateY(${(1 - prog(t, 43.6, 0.6, easeOut)) * 60 - prog(t, out, 0.4, easeIn) * 80}px)`}}>
        {Array.from({length: rows}).map((_, r) =>
          Array.from({length: 7}).map((__, c) => {
            const lit = c === hot;
            const tl = 43.9 + r * 0.45;
            const on = lit && t >= tl;
            const pop = prog(t, tl, 0.4, easeOut);
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  position: 'absolute',
                  left: 40 + c * 66,
                  top: 50 + r * 96,
                  width: 44,
                  height: 44,
                  borderRadius: 44,
                  background: on ? K.orange : '#FFE6D2',
                  transform: `scale(${on ? lerp(0.6, 1.18, pop) - (pop > 0.9 ? 0.18 * prog(t, tl + 0.3, 0.3) : 0) : 1})`,
                }}
              />
            );
          }),
        )}
      </div>
      {/* what happens in each meeting */}
      {(
        [
          ['Aprender', 44.34, K.violet, K.white],
          ['Cuidarte', 45.24, K.orange, INK],
          ['Conectar', 45.98, K.violet, K.white],
        ] as [string, number, string, string][]
      ).map(([w, t0, bg, fg], i) => {
        const a = prog(t, t0 - 0.05, 0.55, easeOut);
        const b = prog(t, out + i * 0.05, 0.35, easeIn);
        if (a <= 0 || b >= 1) return null;
        return (
          <div key={w} style={{position: 'absolute', left: 60, top: 740 + i * 96, height: 76, padding: '0 36px', borderRadius: 18, background: bg, color: fg, fontFamily: FONT, fontWeight: 900, fontSize: 46, display: 'flex', alignItems: 'center', transform: `translateX(${(1 - a) * -520 - b * 520}px)`, letterSpacing: '-0.01em'}}>
            {w}
          </div>
        );
      })}
    </>
  );
};

// ───────────── S10: ripples when INFO is said ─────────────
export const InfoRipple: React.FC<{t: number}> = ({t}) => {
  if (t < 50.3 || t > 52.5) return null;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
      {[0, 0.28, 0.56].map((d, i) => {
        const a = prog(t, 50.34 + d, 1.1, easeOut);
        if (a <= 0 || a >= 1) return null;
        return <circle key={i} cx={209} cy={471} r={80 + a * 330} fill="none" stroke={K.orange} strokeWidth={10 * (1 - a)} opacity={1 - a} />;
      })}
    </svg>
  );
};
