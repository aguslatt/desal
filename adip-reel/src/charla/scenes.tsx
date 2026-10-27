import React from 'react';
import {Img, staticFile} from 'remotion';
import {H, HE, T, TE, OUTRO_AT} from './data';
import {Icon, K, Label, Marker, PaletteBar, Rise, Trazo, Wipe, abs} from './kit';
import {INFO_OUT, INFO_SWAP} from './camera';
import {easeIO, easeIn, easeOut, lerp, prog} from '../ui';

// =====================================================================
// 0 · HOOK (real phrase, taken from the middle of the interview)
//   "esa etapa tan turbulenta de la adolescencia"
// =====================================================================
export const HOOK_END = 3.56;

/** Letters that arrive one by one and shake while the word is "turbulent". */
const Shaky: React.FC<{t: number; t0: number; calm: number; text: string; style?: React.CSSProperties; amp?: number}> = ({
  t,
  t0,
  calm,
  text,
  style,
  amp = 8,
}) => {
  const a = amp * (1 - prog(t, calm - 0.5, 0.5, easeOut));
  return (
    <span style={{display: 'inline-block', whiteSpace: 'nowrap', ...style}}>
      {text.split('').map((ch, i) => {
        const k = prog(t, t0 + i * 0.035, 0.45, easeOut);
        const dx = Math.sin(t * 26 + i * 1.9) * a * (1 - k * 0.0);
        const dy = Math.cos(t * 21 + i * 2.4) * a * 0.8 + (1 - k) * 90;
        const rot = Math.sin(t * 17 + i) * a * 0.18;
        return (
          <span key={i} style={{display: 'inline-block', transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: k > 0 ? 1 : 0}}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/** Animated turbulence line: it thrashes, then settles into a straight line. */
const Wave: React.FC<{t: number; t0: number; calm: number; end: number; y: number; x0?: number; x1?: number; color?: string; stroke?: number}> = ({
  t,
  t0,
  calm,
  end,
  y,
  x0 = 80,
  x1 = 1000,
  color = K.pink,
  stroke = 14,
}) => {
  const p = prog(t, t0, 0.5, easeOut);
  const q = prog(t, end, 0.35, easeIn);
  if (p <= 0 || q >= 1) return null;
  const amp = lerp(10, 46, prog(t, t0, 0.8, easeOut)) * (1 - prog(t, calm, 0.7, easeIO));
  const pts: string[] = [];
  const N = 90;
  const reveal = prog(t, t0, 0.55, easeIO);
  for (let i = 0; i <= N * reveal; i++) {
    const u = i / N;
    const x = lerp(x0, x1, u);
    const env = Math.sin(u * Math.PI);
    const yy = y + env * amp * (Math.sin(u * 17 - t * 11) * 0.7 + Math.sin(u * 7.3 + t * 6.3) * 0.5);
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${yy.toFixed(1)}`);
  }
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - q}}>
      <path d={pts.join(' ')} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const HookTop: React.FC<{t: number}> = ({t}) => {
  const out = HOOK_END - 0.12;
  const tEsa = H('esa');
  const tTan = H('tan');
  const tTurb = H('turbulenta');
  const tDe = H('de');
  return (
    <>
      <div style={abs(80, 300, {fontSize: 80, fontWeight: 800, color: K.ink, letterSpacing: '-0.02em', lineHeight: 1})}>
        <Rise t={t} t0={tEsa} t1={out}>
          ESA ETAPA
        </Rise>
        <span style={{display: 'inline-block', width: 22}} />
        <Rise t={t} t0={tTan} t1={out} style={{fontWeight: 300}}>
          TAN
        </Rise>
      </div>
      <Wave t={t} t0={tTurb - 0.1} calm={H('adolescencia') - 0.1} end={out} y={520} />
      <div style={abs(80, 400, {fontSize: 58, fontWeight: 800, color: K.ink, letterSpacing: '0.02em', lineHeight: 1})}>
        <Marker t={t} t0={tDe} t1={out} color={K.yellow} pad={[18, 6]}>
          DE LA ADOLESCENCIA
        </Marker>
      </div>
    </>
  );
};

/** "TURBULENTA": sits BEHIND the speaker (rendered under the cut-out). */
export const HookBehind: React.FC<{t: number}> = ({t}) => {
  const tTurb = H('turbulenta');
  const out = HOOK_END - 0.12;
  const q = prog(t, out, 0.3, easeIn);
  if (t < tTurb - 0.1 || q >= 1) return null;
  return (
    <div style={abs(48, 612, {fontSize: 140, fontWeight: 900, color: K.pink, letterSpacing: '-0.045em', lineHeight: 1, opacity: 1 - q})}>
      <Shaky t={t} t0={tTurb - 0.05} calm={H('adolescencia')} text="TURBULENTA" />
    </div>
  );
};

// =====================================================================
// 1 · INTRO: date, workshop, speaker
// =====================================================================
export const INTRO_DATE_OUT = T('participar') - 0.15;
/** "24" sits BEHIND the speaker (rendered under the cut-out). */
export const IntroBehind: React.FC<{t: number}> = ({t}) => {
  const t24 = T('24');
  return (
    <div style={abs(36, 372, {fontSize: 372, fontWeight: 900, color: K.pink, letterSpacing: '-0.07em', lineHeight: 1})}>
      <Rise t={t} t0={t24 - 0.1} t1={INTRO_DATE_OUT} dur={0.75}>
        24
      </Rise>
    </div>
  );
};

export const Intro: React.FC<{t: number}> = ({t}) => {
  const tNov = T('noviembre');
  const out1 = INTRO_DATE_OUT;
  const tTaller = T('taller');
  const tLic = T('licenciado');
  const out2 = T('para') - 0.18;
  return (
    <>
      {/* date */}
      <div style={abs(600, 396, {fontSize: 44, fontWeight: 300, color: K.ink, letterSpacing: '0.06em', lineHeight: 1})}>
        <Rise t={t} t0={tNov - 0.35} t1={out1 + 0.05}>
          DE
        </Rise>
      </div>
      <div style={abs(600, 446, {fontSize: 46, fontWeight: 900, color: K.ink, letterSpacing: '-0.005em', lineHeight: 1})}>
        <Rise t={t} t0={tNov - 0.12} t1={out1 + 0.1}>
          NOVIEMBRE
        </Rise>
      </div>
      <Trazo t={t} t0={tNov + 0.1} t1={out1 + 0.1} left={620} top={512} w={250} color={K.pink} dur={0.8} id="tz1" />

      {/* workshop */}
      <div style={abs(76, 346, {fontSize: 136, fontWeight: 900, color: K.ink, letterSpacing: '-0.045em', lineHeight: 1})}>
        <Rise t={t} t0={tTaller - 0.08} t1={out2} dur={0.7}>
          TALLER
        </Rise>
      </div>
      <Trazo t={t} t0={tTaller + 0.25} t1={out2} left={690} top={340} w={290} color={K.pink} dur={0.9} id="tz2" />
      {/* guest */}
      <div style={abs(82, 484, {fontSize: 32, fontWeight: 600, color: K.ink, letterSpacing: '0.22em', lineHeight: 1})}>
        <Rise t={t} t0={tLic - 0.5} t1={out2}>
          CON EL LIC.
        </Rise>
      </div>
      <div style={abs(80, 528, {fontSize: 76, fontWeight: 900, color: K.ink, letterSpacing: '-0.025em', lineHeight: 1})}>
        <Marker t={t} t0={T('alejandro') - 0.15} t1={out2} color={K.yellow} pad={[18, 4]}>
          ALEJANDRO
        </Marker>
      </div>
    </>
  );
};

// =====================================================================
// 2 · ARC: "para familiares de niños y adolescentes"
// =====================================================================
export const ArcText: React.FC<{t: number}> = ({t}) => {
  const out = TE('adolescentes') + 0.2;
  return (
    <>
      <div style={abs(80, 272, {fontSize: 52, fontWeight: 600, color: K.ink, letterSpacing: '0.2em', lineHeight: 1})}>
        <Rise t={t} t0={T('para') - 0.1} t1={out}>
          PARA FAMILIAS
        </Rise>
      </div>
      <div style={abs(76, 340, {fontSize: 124, fontWeight: 900, color: K.ink, letterSpacing: '-0.04em', lineHeight: 1})}>
        <Rise t={t} t0={T('niños') - 0.12} t1={out} dur={0.65}>
          NIÑOS
        </Rise>
        <span style={{display: 'inline-block', width: 26}} />
        <Rise t={t} t0={T('niños') + 0.2} t1={out} style={{fontWeight: 300}}>
          Y
        </Rise>
      </div>
      <div style={abs(80, 466, {fontSize: 88, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1})}>
        <Marker t={t} t0={T('adolescentes') - 0.12} t1={out} color={K.yellow} pad={[16, 4]}>
          ADOLESCENTES
        </Marker>
      </div>
    </>
  );
};

export const ArcShapes: React.FC<{t: number; w: number}> = ({t, w}) => {
  if (w <= 0.01) return null;
  const k = easeOut(w);
  return (
    <>
      {/* head from the brand system: a big circle leaving the border, plus a small one */}
      <div style={{position: 'absolute', left: 660 + (1 - k) * 360, top: 540, width: 470, height: 470, borderRadius: 470, background: K.pink}} />
      <div style={{position: 'absolute', left: 90 - (1 - k) * 200, top: 1230, width: 112, height: 112, borderRadius: 112, background: K.yellow}} />
    </>
  );
};

// =====================================================================
// 3 · STAGE: viviendo y transitando esa etapa tan turbulenta de la adolescencia
// =====================================================================
export const Stage: React.FC<{t: number}> = ({t}) => {
  const tViv = T('viviendo');
  const tTrans = T('transitando');
  const tEsa = T('esa');
  const tTurb = T('turbulenta');
  const tAdo = T('adolescencia');
  const out1 = tEsa - 0.12;
  const out2 = TE('adolescencia') + 0.45;
  return (
    <>
      <div style={abs(80, 300, {fontSize: 82, fontWeight: 300, color: K.ink, letterSpacing: '-0.01em', lineHeight: 1})}>
        <Rise t={t} t0={tViv - 0.12} t1={out1}>
          VIVIENDO
        </Rise>
      </div>
      <div style={abs(80, 398, {fontSize: 92, fontWeight: 900, color: K.ink, letterSpacing: '-0.03em', lineHeight: 1})}>
        <Rise t={t} t0={tTrans - 0.5} t1={out1}>
          Y TRANSITANDO
        </Rise>
      </div>
      <Trazo t={t} t0={tTrans - 0.3} t1={out1} left={78} top={500} w={470} color={K.pink} dur={1.1} id="tz3" />

      <div style={abs(80, 292, {fontSize: 72, fontWeight: 800, color: K.ink, letterSpacing: '-0.02em', lineHeight: 1})}>
        <Rise t={t} t0={tEsa - 0.05} t1={out2}>
          ESA ETAPA
        </Rise>
        <span style={{display: 'inline-block', width: 20}} />
        <Rise t={t} t0={T('tan') - 0.05} t1={out2} style={{fontWeight: 300}}>
          TAN
        </Rise>
      </div>
      <div style={abs(40, 372, {fontSize: 142, fontWeight: 900, color: K.pink, letterSpacing: '-0.045em', lineHeight: 1})}>
        <Shaky t={t} t0={tTurb - 0.1} calm={tAdo + 0.2} text="TURBULENTA" amp={7} style={{opacity: 1 - prog(t, out2, 0.3, easeIn)}} />
      </div>
      <Wave t={t} t0={tTurb} calm={tAdo + 0.25} end={out2} y={600} />
      <div style={abs(84, 540, {fontSize: 40, fontWeight: 600, color: K.ink, letterSpacing: '0.34em', lineHeight: 1})}>
        <Rise t={t} t0={tAdo - 0.05} t1={out2}>
          DE LA ADOLESCENCIA
        </Rise>
      </div>
    </>
  );
};

// =====================================================================
// 4 · SIN HERRAMIENTAS / determinadas situaciones
// =====================================================================
export const PanelBg: React.FC<{h: number}> = ({h}) =>
  h > 1 ? <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: h, background: K.yellow}} /> : null;

export const Tools: React.FC<{t: number}> = ({t}) => {
  const tSin = T('sin');
  const tHer = T('herramientas');
  const out1 = T('para', 1) - 0.06;
  const tPara = T('para', 1);
  const out2 = T('determinadas') - 0.08;
  const tDet = T('determinadas');
  const out3 = TE('situaciones') + 0.22;
  return (
    <>
      <div style={abs(80, 282, {fontSize: 112, fontWeight: 300, color: K.ink, letterSpacing: '-0.02em', lineHeight: 1})}>
        <Rise t={t} t0={tSin - 0.1} t1={out1}>
          SIN
        </Rise>
      </div>
      <div style={abs(76, 410, {fontSize: 100, fontWeight: 900, color: K.ink, letterSpacing: '-0.04em', lineHeight: 1})}>
        <Wipe t={t} t0={tHer - 0.1} t1={out1} dur={0.5}>
          HERRAMIENTAS
        </Wipe>
      </div>
      <Trazo t={t} t0={tHer + 0.2} t1={out1} left={78} top={520} w={420} color={K.ink} dur={0.9} id="tz4" />

      <div style={abs(80, 282, {fontSize: 96, fontWeight: 300, color: K.ink, letterSpacing: '-0.02em', lineHeight: 1})}>
        <Rise t={t} t0={tPara - 0.05} t1={out2}>
          PARA PODER
        </Rise>
      </div>
      <div style={abs(80, 394, {fontSize: 112, fontWeight: 900, color: K.ink, letterSpacing: '-0.04em', lineHeight: 1})}>
        <Rise t={t} t0={T('manejar') - 0.1} t1={out2}>
          MANEJAR
        </Rise>
      </div>

      <div style={abs(80, 282, {fontSize: 98, fontWeight: 900, color: K.ink, letterSpacing: '-0.04em', lineHeight: 1})}>
        <Rise t={t} t0={tDet - 0.08} t1={out3}>
          DETERMINADAS
        </Rise>
      </div>
      <div style={abs(80, 394, {fontSize: 98, fontWeight: 300, color: K.ink, letterSpacing: '-0.02em', lineHeight: 1})}>
        <Rise t={t} t0={T('situaciones') - 0.12} t1={out3}>
          SITUACIONES
        </Rise>
      </div>
    </>
  );
};

// =====================================================================
// 5 · LÍMITES / PROBLEMAS CONDUCTUALES / día a día
// =====================================================================
const Num: React.FC<{t: number; t0: number; t1: number; n: string; top: number; color: string}> = ({t, t0, t1, n, top, color}) => {
  const p = prog(t, t0, 0.5, easeOut);
  const q = prog(t, t1, 0.3, easeIn);
  if (p <= 0 || q >= 1) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        top,
        width: 68,
        height: 68,
        borderRadius: 68,
        background: color,
        color: K.white,
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 800,
        fontSize: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${easeOut(p) * (1 - q)})`,
      }}
    >
      {n}
    </div>
  );
};

export const Limits: React.FC<{t: number}> = ({t}) => {
  const tLim = T('límites');
  const tProb = T('problemas');
  const tCond = T('conductuales');
  const out = T('que', 2) - 0.1;
  const tDia = T('día', 1);
  const out2 = TE('hijos') + 0.3;
  return (
    <>
      <Num t={t} t0={tLim - 0.2} t1={out} n="01" top={294} color={K.pink} />
      <div style={abs(176, 270, {fontSize: 140, fontWeight: 900, color: K.ink, letterSpacing: '-0.045em', lineHeight: 1})}>
        <Rise t={t} t0={tLim - 0.1} t1={out} dur={0.65}>
          LÍMITES
        </Rise>
      </div>
      <Trazo t={t} t0={tLim + 0.3} t1={out} left={176} top={398} w={230} color={K.pink} dur={0.8} id="tz5" />
      <Num t={t} t0={tProb - 0.2} t1={out} n="02" top={500} color={K.violet} />
      <div style={abs(176, 486, {fontSize: 100, fontWeight: 900, color: K.ink, letterSpacing: '-0.04em', lineHeight: 1})}>
        <Rise t={t} t0={tProb - 0.1} t1={out}>
          PROBLEMAS
        </Rise>
      </div>
      <div style={abs(80, 590, {fontSize: 100, fontWeight: 300, color: K.ink, letterSpacing: '-0.04em', lineHeight: 1})}>
        <Wipe t={t} t0={tCond - 0.1} t1={out} dur={0.5}>
          CONDUCTUALES
        </Wipe>
      </div>

      <div style={abs(80, 286, {fontSize: 128, fontWeight: 900, color: K.ink, letterSpacing: '-0.045em', lineHeight: 1})}>
        <Marker t={t} t0={tDia - 0.1} t1={out2} color={K.yellow} pad={[20, 4]}>
          DÍA A DÍA
        </Marker>
      </div>
      <div style={abs(84, 446, {fontSize: 62, fontWeight: 300, color: K.ink, letterSpacing: '-0.01em', lineHeight: 1})}>
        <Rise t={t} t0={T('con') - 0.05} t1={out2}>
          CON SUS HIJOS
        </Rise>
      </div>
    </>
  );
};

export const Wait: React.FC<{t: number}> = ({t}) => {
  const t0 = T('esperamos');
  const out = INFO_SWAP + 0.05;
  return (
    <>
      <div style={abs(80, 292, {fontSize: 112, fontWeight: 900, color: K.ink, letterSpacing: '-0.04em', lineHeight: 1})}>
        <Rise t={t} t0={t0 - 0.35} t1={out}>
          LOS
        </Rise>
        <span style={{display: 'inline-block', width: 26}} />
        <Rise t={t} t0={t0 - 0.05} t1={out}>
          ESPERAMOS
        </Rise>
      </div>
      <Trazo t={t} t0={t0 + 0.1} t1={out} left={78} top={410} w={460} color={K.pink} dur={0.9} id="tz6" />
    </>
  );
};

// =====================================================================
// 6 · INFO: date / time / online, as a clean card under the speaker
// =====================================================================
export const InfoCard: React.FC<{t: number}> = ({t}) => {
  const tIn = INFO_SWAP;
  const p = prog(t, tIn, 0.55, easeOut);
  const q = prog(t, INFO_OUT - 0.05, 0.45, easeIn);
  if (p <= 0 || q >= 1) return null;
  const rows = [
    {kind: 'calendar' as const, color: K.pink, t0: T('el', 2) + 0.05, parts: ['24 ', 'DE NOVIEMBRE'], y: 950},
    {kind: 'clock' as const, color: K.yellow, t0: T('19') - 0.1, parts: ['19 A 20:30 ', 'HS'], y: 1100},
    {kind: 'screen' as const, color: K.orange, t0: T('manera') - 0.15, parts: ['', 'ONLINE'], y: 1250},
  ];
  return (
    <div style={{opacity: 1 - q, transform: `translateY(${(1 - p) * 120 + q * 160}px)`}}>
      <div style={{position: 'absolute', left: 40, top: 830, width: 1000, height: 560, borderRadius: 32, background: K.white}} />
      <Label t={t} t0={tIn + 0.15} left={80} top={868} text="TALLER PARA FAMILIAS" size={28} rule={K.pink} />
      <PaletteBar t={t} t0={tIn + 0.3} left={80} top={914} width={920} height={8} />
      {rows.map((r, i) => {
        const k = prog(t, r.t0, 0.55, easeOut);
        const ip = prog(t, r.t0 - 0.05, 0.4, easeOut);
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: 80, top: r.y + 6, width: 112, height: 112, borderRadius: 112, background: K.gray, opacity: ip}} />
            <div style={{position: 'absolute', left: 80 + 8, top: r.y + 14, opacity: ip}}>
              <Icon kind={r.kind} color={r.color} size={96} p={ip} />
            </div>
            <div style={abs(232, r.y + 14, {fontSize: 68, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, color: K.ink, opacity: k > 0 ? 1 : 0})}>
              <Rise t={t} t0={r.t0} dur={0.6}>
                <span style={{color: K.pink}}>{r.parts[0]}</span>
                {r.parts[1]}
              </Rise>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// =====================================================================
// 7 · CTA: "pongan INFO en los comentarios"
// =====================================================================
export const CtaTop: React.FC<{t: number}> = ({t}) => {
  const tMas = T('más');
  const tInfo = T('información');
  const out1 = T('pongan') - 0.15;
  const tPon = T('pongan');
  const tInf = T('info');
  const out = OUTRO_AT - 0.2;
  const typed = Math.max(0, Math.min(1, (t - (tInf - 0.05)) / 0.35));
  const pillP = prog(t, tPon - 0.15, 0.5, easeOut);
  const pillQ = prog(t, out, 0.3, easeIn);
  return (
    <>
      <div style={abs(80, 290, {fontSize: 100, fontWeight: 300, color: K.ink, letterSpacing: '-0.02em', lineHeight: 1})}>
        <Rise t={t} t0={tMas - 0.1} t1={out1}>
          MÁS
        </Rise>
      </div>
      <div style={abs(80, 396, {fontSize: 92, fontWeight: 900, color: K.ink, letterSpacing: '-0.04em', lineHeight: 1})}>
        <Wipe t={t} t0={tInfo - 0.15} t1={out1} dur={0.55}>
          INFORMACIÓN
        </Wipe>
      </div>
      {pillP > 0 && pillQ < 1 && (
        <div
          style={abs(80, 300, {
            padding: '16px 40px',
            background: K.ink,
            color: K.white,
            borderRadius: 100,
            fontSize: 54,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            transform: `scale(${easeOut(pillP) * (1 - pillQ)})`,
            transformOrigin: '0 50%',
          })}
        >
          Comentá{' '}
          <span style={{color: K.yellow, fontWeight: 800}}>{'INFO'.slice(0, Math.ceil(typed * 4))}</span>
        </div>
      )}
    </>
  );
};

/** "INFO" sits behind the speaker. */
export const CtaBehind: React.FC<{t: number}> = ({t}) => {
  const tInf = T('info');
  const out = OUTRO_AT - 0.2;
  const q = prog(t, out, 0.3, easeIn);
  if (t < tInf - 0.1 || q >= 1) return null;
  const p = prog(t, tInf - 0.12, 0.7, easeOut);
  return (
    <div style={abs(60, 360, {fontSize: 336, fontWeight: 900, color: K.pink, letterSpacing: '-0.06em', lineHeight: 1, opacity: 1 - q})}>
      <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 140}px)`, opacity: p}}>INFO</span>
    </div>
  );
};

// =====================================================================
// 8 · OUTRO (institutional: white + palette bar + official logo)
// =====================================================================
export const Outro: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  if (t < t0 - 0.02) return null;
  const p = prog(t, t0 + 0.15, 0.8, easeOut);
  const c = (top: number, size: number, weight: number, color: string, ls: string, delay: number, text: string) => (
    <div style={abs(0, top, {width: 1080, textAlign: 'center', fontSize: size, fontWeight: weight, color, letterSpacing: ls, lineHeight: 1})}>
      <Rise t={t} t0={t0 + delay}>
        {text}
      </Rise>
    </div>
  );
  const btn = prog(t, t0 + 1.35, 0.6, easeOut);
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: K.white}} />
      <PaletteBar t={t} t0={t0 + 0.05} left={0} top={0} width={1080} height={30} />
      <Img
        src={staticFile('brand/logo-color.png')}
        style={{position: 'absolute', left: 260, top: 380, width: 560, opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${lerp(0.95, 1, p)})`}}
      />
      {c(760, 32, 800, K.pink, '0.26em', 0.55, 'TALLER PARA FAMILIAS')}
      {c(826, 100, 900, K.ink, '-0.04em', 0.7, '24 DE NOVIEMBRE')}
      {c(948, 56, 700, K.ink, '-0.01em', 0.85, '19 A 20:30 HS · ONLINE')}
      <Trazo t={t} t0={t0 + 1.0} left={340} top={1020} w={400} gradient dur={0.9} id="tzo" />
      <div
        style={abs(240, 1190, {
          width: 600,
          height: 124,
          borderRadius: 100,
          background: K.ink,
          color: K.white,
          fontSize: 54,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          letterSpacing: '-0.01em',
          opacity: btn,
          transform: `scale(${lerp(0.9, 1, easeOut(btn))})`,
        })}
      >
        Comentá&nbsp;<span style={{color: K.yellow, fontWeight: 800}}>INFO</span>
      </div>
      {c(1380, 34, 500, K.ink, '0', 1.75, 'Acompañar con amor hace la diferencia')}
      {c(1436, 32, 700, K.pink, '0.04em', 1.9, '@equipoadip')}
    </>
  );
};

export const LogoBug: React.FC<{t: number; t0: number; t1: number}> = ({t, t0, t1}) => {
  const p = prog(t, t0, 0.6, easeOut);
  const q = prog(t, t1, 0.35, easeIn);
  if (p <= 0 || q >= 1) return null;
  return (
    <Img
      src={staticFile('brand/logo-color.png')}
      style={{position: 'absolute', left: 540 - 100, top: 232, width: 200, opacity: p * (1 - q), transform: `translateY(${(1 - p) * -16}px)`}}
    />
  );
};
