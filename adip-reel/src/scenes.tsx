import React from 'react';
import {Img, staticFile} from 'remotion';
import {T, TE} from './data';
import {C, FONT, easeIO, easeIn, easeOut, lerp, prog} from './ui';

// ---------- primitives ----------
const abs = (left: number, top: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute',
  left,
  top,
  fontFamily: FONT,
  whiteSpace: 'nowrap',
  ...extra,
});

/** A word that rises out of a mask at t0 and leaves upward at t1. */
const Rise: React.FC<{t: number; t0: number; t1?: number; children: React.ReactNode; style?: React.CSSProperties; dur?: number}> = ({
  t,
  t0,
  t1,
  children,
  style,
  dur = 0.6,
}) => {
  const p = prog(t, t0, dur, easeOut);
  const q = t1 ? prog(t, t1, 0.38, easeIn) : 0;
  if (p <= 0 || q >= 1) return null;
  const y = (1 - p) * 108 - q * 108;
  return (
    <span style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0.08em 0.04em 0.26em', margin: '-0.08em -0.04em -0.26em'}}>
      <span style={{display: 'inline-block', transform: `translateY(${y}%)`, ...style}}>{children}</span>
    </span>
  );
};

/** Colour block that wipes in behind a word. */
const Blocked: React.FC<{t: number; t0: number; t1?: number; color: string; pad?: [number, number]; children: React.ReactNode; textColor?: string; radius?: number}> = ({
  t,
  t0,
  t1,
  color,
  pad = [18, 8],
  children,
  textColor = C.white,
  radius = 14,
}) => {
  const p = prog(t, t0 - 0.12, 0.55, easeIO);
  const q = t1 ? prog(t, t1, 0.35, easeIn) : 0;
  if (p <= 0 || q >= 1) return null;
  return (
    <span style={{position: 'relative', display: 'inline-block', padding: `${pad[1]}px ${pad[0]}px`, color: textColor}}>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background: color,
          borderRadius: radius,
          transformOrigin: q > 0 ? '100% 50%' : '0% 50%',
          transform: `scaleX(${q > 0 ? 1 - q : p})`,
        }}
      />
      <span style={{position: 'relative'}}>
        <Rise t={t} t0={t0} t1={t1}>
          {children}
        </Rise>
      </span>
    </span>
  );
};

const Brand5: React.FC<{t: number; t0: number; t1?: number; left: number; top: number; width?: number; height?: number}> = ({t, t0, t1, left, top, width = 320, height = 10}) => {
  const p = prog(t, t0, 0.9, easeIO);
  const q = t1 ? prog(t, t1, 0.4, easeIn) : 0;
  if (p <= 0 || q >= 1) return null;
  const cols = [C.violet, C.pink, C.orange, C.yellow, C.green];
  const seg = width / 5;
  return (
    <div style={{position: 'absolute', left, top, width, height, display: 'flex', opacity: 1 - q}}>
      {cols.map((c, i) => {
        const k = prog(t, t0 + i * 0.07, 0.6, easeOut);
        return <div key={i} style={{width: seg, height, background: c, borderRadius: height, transformOrigin: '0 50%', transform: `scaleX(${k})`}} />;
      })}
    </div>
  );
};

const Kicker: React.FC<{t: number; t0: number; t1?: number; left: number; top: number; text: string; color?: string; dot?: string}> = ({
  t, t0, t1, left, top, text, color = C.ink, dot = C.orange,
}) => {
  const p = prog(t, t0, 0.5, easeOut);
  const q = t1 ? prog(t, t1, 0.3, easeIn) : 0;
  if (p <= 0 || q >= 1) return null;
  return (
    <div style={abs(left, top, {display: 'flex', alignItems: 'center', gap: 16, opacity: 1 - q})}>
      <div style={{width: 26, height: 26, borderRadius: 26, background: dot, transform: `scale(${easeOut(p)})`}} />
      <Rise t={t} t0={t0 + 0.05} t1={t1} style={{fontSize: 32, fontWeight: 800, letterSpacing: '0.2em', color}}>
        {text}
      </Rise>
    </div>
  );
};

const NameTag: React.FC<{t: number; t0: number; t1: number; name: string; left?: number; top?: number}> = ({t, t0, t1, name, left = 72, top = 262}) => {
  const p = prog(t, t0, 0.5, easeOut);
  const q = prog(t, t1, 0.35, easeIn);
  if (p <= 0 || q >= 1) return null;
  return (
    <div style={abs(left, top, {display: 'flex', alignItems: 'stretch', gap: 18})}>
      <div style={{width: 8, borderRadius: 8, background: C.orange, transformOrigin: '0 0', transform: `scaleY(${easeOut(p)})`, opacity: 1 - q}} />
      <div style={{lineHeight: 1.05}}>
        <div style={{fontSize: 56, fontWeight: 900, color: C.ink, letterSpacing: '-0.01em'}}>
          <Rise t={t} t0={t0 + 0.05} t1={t1}>{name}</Rise>
        </div>
        <div style={{fontSize: 26, fontWeight: 700, color: C.ink, letterSpacing: '0.18em', marginTop: 4, opacity: 0.75}}>
          <Rise t={t} t0={t0 + 0.18} t1={t1 + 0.05}>EQUIPO ADIP</Rise>
        </div>
      </div>
    </div>
  );
};

// ---------- timing (all derived from the aligned words) ----------
export const TM = {
  hookOut: TE('hacerlo') + 0.14,
  qOut: TE('adip') + 0.28,
  viasOut: TE('whatsapp') + 0.42,
  sedesOut: TE('admisiones') + 0.3,
  pOut: TE('microcentro') + 0.3,
  nOut: TE('5140') + 0.3,
  horOut: TE('variados') + 0.38,
  cobOut: TE('aires') + 0.32,
  closeOut: TE('contactarnos') + 0.3,
};
/** Windows in which type sits *behind* the speaker. */
export const BEHIND_WINDOWS: [number, number][] = [
  [T('930') - 0.2, TM.pOut + 0.6],
  [T('5140') - 0.2, TM.nOut + 0.6],
];

// ---------- scenes ----------
export const Hook: React.FC<{t: number}> = ({t}) => {
  const tInt = T('interesado');
  const tAco = T('acompañamiento');
  const tEste = T('este', 0);
  const out = TM.hookOut;
  return (
    <>
      <NameTag t={t} t0={0.0} t1={out} name="ANDY" />
      <Brand5 t={t} t0={0.3} t1={out} left={72} top={392} width={300} />
      {/* 1 */}
      <div style={abs(72, 450, {fontSize: 118, fontWeight: 900, color: C.ink, letterSpacing: '-0.035em', lineHeight: 1})}>
        <Rise t={t} t0={tInt - 0.12} t1={tAco - 0.06}>¿INTERESADO?</Rise>
      </div>
      {/* 2 */}
      <div style={abs(72, 450, {fontSize: 86, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1})}>
        <Rise t={t} t0={tAco - 0.1} t1={tEste - 0.06}>ACOMPAÑAMIENTO</Rise>
      </div>
      <div style={abs(72, 546, {fontSize: 156, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1})}>
        <Blocked t={t} t0={T('escolar') - 0.1} t1={tEste - 0.04} color={C.orange} pad={[26, 6]} radius={18}>ESCOLAR</Blocked>
      </div>
      {/* 3 */}
      <div style={abs(72, 440, {fontSize: 112, fontWeight: 900, color: C.ink, letterSpacing: '-0.035em', lineHeight: 1})}>
        <Rise t={t} t0={tEste - 0.08} t1={out}>ESTE ES</Rise>
      </div>
      <div style={abs(72, 556, {fontSize: 112, fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1})}>
        <Blocked t={t} t0={T('momento') - 0.12} t1={out + 0.05} color={C.orange} pad={[22, 4]} radius={16}>EL MOMENTO</Blocked>
      </div>
    </>
  );
};

export const Question: React.FC<{t: number}> = ({t}) => {
  const t0 = T('forma') - 0.12;
  const out = TM.qOut;
  return (
    <>
      <div style={abs(72, 300, {fontSize: 118, fontWeight: 900, color: C.ink, letterSpacing: '-0.03em', lineHeight: 1})}>
        <Rise t={t} t0={t0} t1={out}>¿CÓMO</Rise>
      </div>
      <div style={abs(72, 420, {fontSize: 118, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1})}>
        <Blocked t={t} t0={T('contactar', 0) - 0.05} t1={out + 0.04} color={C.orange} pad={[22, 4]} radius={16}>CONTACTAR</Blocked>
      </div>
      <div style={abs(72, 556, {fontSize: 118, fontWeight: 900, color: C.ink, letterSpacing: '-0.03em', lineHeight: 1})}>
        <Rise t={t} t0={TE('contactar', 0) + 0.0} t1={out + 0.08}>A ADIP?</Rise>
      </div>
    </>
  );
};

export const Vias: React.FC<{t: number}> = ({t}) => {
  const out = TM.viasOut;
  const rows = [
    {w: 'TELÉFONO', t0: T('telefónica') - 0.12, color: C.violet, txt: C.white, y: 410},
    {w: 'MAIL', t0: T('mail') - 0.12, color: C.green, txt: C.ink, y: 530},
    {w: 'WHATSAPP', t0: T('whatsapp') - 0.12, color: C.orange, txt: C.white, y: 650},
  ];
  return (
    <>
      <NameTag t={t} t0={T('nos') - 0.05} t1={T('nos') + 1.5} name="PAU" />
      {rows.map((r, i) => (
        <div key={i} style={abs(72, r.y, {fontSize: 100, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1})}>
          <Blocked t={t} t0={r.t0} t1={out + i * 0.07} color={r.color} textColor={r.txt} pad={[24, 6]} radius={16}>{r.w}</Blocked>
        </div>
      ))}
    </>
  );
};

export const Sedes: React.FC<{t: number}> = ({t}) => {
  const a0 = T('dos') - 0.05;
  const aOut = TM.sedesOut;
  const p0 = T('paraguay', 0);
  const pOut = TM.pOut;
  const n0 = T('niceto', 0);
  const nOut = TM.nOut;
  return (
    <>
      {t > a0 && t < aOut + 0.5 && (
        <>
          <div style={abs(72, 250, {fontSize: 430, fontWeight: 900, color: C.orange, letterSpacing: '-0.05em', lineHeight: 1})}>
            <Rise t={t} t0={a0} t1={aOut} dur={0.7}>2</Rise>
          </div>
          <div style={abs(380, 330, {fontSize: 128, fontWeight: 900, color: C.ink, letterSpacing: '-0.03em', lineHeight: 1})}>
            <Rise t={t} t0={T('sedes') - 0.05} t1={aOut + 0.05}>SEDES</Rise>
          </div>
          <div style={abs(386, 462, {fontSize: 40, fontWeight: 800, color: C.ink, letterSpacing: '0.2em'})}>
            <Rise t={t} t0={T('admisiones') - 0.45} t1={aOut + 0.1}>DE ADMISIÓN</Rise>
          </div>
          <Brand5 t={t} t0={a0 + 0.35} t1={aOut} left={386} top={520} width={300} />
        </>
      )}

      {/* Paraguay */}
      <Kicker t={t} t0={p0 - 0.45} t1={pOut} left={72} top={290} text="SEDE 01" />
      <div style={abs(72, 342, {fontSize: 122, fontWeight: 900, color: C.ink, letterSpacing: '-0.035em', lineHeight: 1})}>
        <Rise t={t} t0={p0 - 0.05} t1={pOut}>PARAGUAY</Rise>
      </div>
      <div style={abs(76, 486, {fontSize: 40, fontWeight: 800, color: C.ink, letterSpacing: '0.16em', display: 'flex', alignItems: 'center', gap: 18})}>
        <div style={{height: 6, width: 64 * prog(t, T('caba', 0) - 0.1, 0.5, easeIO), background: C.orange, borderRadius: 6, opacity: 1 - prog(t, pOut, 0.3, easeIn)}} />
        <Rise t={t} t0={T('caba', 0) - 0.05} t1={pOut}>CABA · MICROCENTRO</Rise>
      </div>

      {/* Niceto Vega */}
      <Kicker t={t} t0={n0 - 0.6} t1={nOut} left={72} top={290} text="SEDE 02" dot={C.violet} />
      <div style={abs(72, 342, {fontSize: 106, fontWeight: 900, color: C.ink, letterSpacing: '-0.035em', lineHeight: 1})}>
        <Rise t={t} t0={n0 - 0.05} t1={nOut}>NICETO VEGA</Rise>
      </div>
      <div style={abs(76, 470, {fontSize: 40, fontWeight: 800, color: C.violet, letterSpacing: '0.16em', display: 'flex', alignItems: 'center', gap: 18})}>
        <div style={{height: 6, width: 64 * prog(t, T('palermo') - 0.1, 0.5, easeIO), background: C.violet, borderRadius: 6, opacity: 1 - prog(t, nOut, 0.3, easeIn)}} />
        <Rise t={t} t0={T('palermo') - 0.05} t1={nOut}>PALERMO</Rise>
      </div>
    </>
  );
};

/** Big numerals that sit *behind* the speaker (rendered under the cut-out). */
export const BehindNumbers: React.FC<{t: number}> = ({t}) => (
  <>
    <div style={abs(58, 640, {fontSize: 440, fontWeight: 900, color: C.orange, letterSpacing: '-0.06em', lineHeight: 1})}>
      <Rise t={t} t0={T('930') - 0.12} t1={TM.pOut + 0.06} dur={0.75}>930</Rise>
    </div>
    <div style={abs(58, 725, {fontSize: 330, fontWeight: 900, color: C.violet, letterSpacing: '-0.06em', lineHeight: 1})}>
      <Rise t={t} t0={T('5140') - 0.12} t1={TM.nOut + 0.06} dur={0.75}>5140</Rise>
    </div>
  </>
);

export const Horarios: React.FC<{t: number}> = ({t}) => {
  const out = TM.horOut;
  const ta = T('amplios');
  const stretch = prog(t, ta - 0.05, 0.6, easeOut);
  const tv = T('variados');
  const widths = [0.5, 0.9, 0.32, 0.7, 0.55];
  const cols = [C.violet, C.pink, C.orange, C.yellow, C.green];
  return (
    <>
      <Kicker t={t} t0={T('horarios') - 0.3} t1={out} left={72} top={300} text="HORARIOS DE ADMISIÓN" />
      <div style={abs(72, 370, {fontSize: 128, fontWeight: 900, color: C.ink, lineHeight: 1, letterSpacing: `${lerp(-0.04, 0.14, stretch)}em`})}>
        <Rise t={t} t0={ta - 0.1} t1={out}>AMPLIOS</Rise>
      </div>
      <div style={abs(72, 520, {fontSize: 100, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1})}>
        <Blocked t={t} t0={tv - 0.25} t1={out + 0.05} color={C.orange} pad={[22, 4]} radius={16}>Y VARIADOS</Blocked>
      </div>
      <div style={{position: 'absolute', left: 72, top: 660, width: 936}}>
        {widths.map((w, i) => {
          const k = prog(t, tv - 0.1 + i * 0.07, 0.7, easeOut);
          const wob = 1 + 0.12 * Math.sin((t - tv) * 5 + i * 1.7) * (1 - prog(t, tv + 0.6, 0.8, easeOut));
          const q = prog(t, out - 0.05 + i * 0.04, 0.35, easeIn);
          return <div key={i} style={{height: 14, marginBottom: 12, width: `${w * 100 * k * wob}%`, background: cols[i], borderRadius: 14, opacity: 1 - q}} />;
        })}
      </div>
    </>
  );
};

const Ring: React.FC<{cx: number; cy: number; r: number; color: string; stroke?: number; fill?: boolean; label?: string; t: number; t0: number; t1: number; labelColor?: string}> = ({
  cx, cy, r, color, stroke = 14, fill, label, t, t0, t1, labelColor,
}) => {
  const p = prog(t, t0, 0.75, easeOut);
  const q = prog(t, t1, 0.4, easeIn);
  if (p <= 0 || q >= 1) return null;
  const rr = r * p;
  const pulse = prog(t, t0, 1.1, easeOut);
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - q}}>
        {!fill && <circle cx={cx} cy={cy} r={r * (0.82 + 0.38 * pulse)} fill="none" stroke={color} strokeWidth={4} opacity={0.35 * (1 - pulse)} />}
        <circle cx={cx} cy={cy} r={rr} fill={fill ? color : 'none'} stroke={fill ? 'none' : color} strokeWidth={stroke} />
      </svg>
      {label && (
        <div
          style={abs(cx - 200, fill ? cy - 20 : cy - r - 26, {
            width: 400, textAlign: 'center', fontSize: 30, fontWeight: 900, letterSpacing: '0.12em',
            color: labelColor ?? color, opacity: (1 - q) * prog(t, t0 + 0.25, 0.4, easeOut),
          })}
        >
          {!fill ? <span style={{background: C.cream, padding: '4px 14px', borderRadius: 10}}>{label}</span> : label}
        </div>
      )}
    </>
  );
};

export const Cobertura: React.FC<{t: number}> = ({t}) => {
  const out = TM.cobOut;
  const cx = 540;
  const cy = 655;
  return (
    <>
      <Kicker t={t} t0={T('acompañamientos') + 0.1} t1={out} left={72} top={262} text="ACOMPAÑAMOS EN" />
      <Ring t={t} cx={cx} cy={cy} r={86} color={C.orange} fill label="CABA" labelColor={C.white} t0={T('caba', 1) - 0.1} t1={out} />
      <Ring t={t} cx={cx} cy={cy} r={170} color={C.violet} label="CONURBANO" t0={T('conurbano') - 0.05} t1={out + 0.04} />
      <Ring t={t} cx={cx} cy={cy} r={250} color={C.green} label="GRAN BUENOS AIRES" t0={T('gran') - 0.05} t1={out + 0.08} labelColor="#5c8200" />
    </>
  );
};

export const Closing: React.FC<{t: number}> = ({t}) => {
  const out = TM.closeOut;
  const t27 = T('2027');
  return (
    <>
      <div style={abs(72, 290, {fontSize: 104, fontWeight: 900, color: C.ink, letterSpacing: '-0.035em', lineHeight: 1})}>
        <Rise t={t} t0={T('admisión', 1) - 0.1} t1={out}>ADMISIÓN</Rise>
      </div>
      <div style={abs(72, 400, {fontSize: 200, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1})}>
        <Blocked t={t} t0={t27 - 0.05} t1={out + 0.04} color={C.orange} pad={[30, 6]} radius={20}>2027</Blocked>
      </div>
      <div style={abs(72, 650, {fontSize: 84, fontWeight: 900, color: C.ink, letterSpacing: '-0.03em', lineHeight: 1})}>
        <Rise t={t} t0={T('contactarnos') - 0.05} t1={out + 0.08}>CONTACTANOS</Rise>
      </div>
      <Brand5 t={t} t0={T('contactarnos') + 0.1} t1={out} left={76} top={750} width={420} height={12} />
    </>
  );
};

export const Outro: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  const p = prog(t, t0 + 0.35, 0.8, easeOut);
  const dots = [C.violet, C.pink, C.yellow, C.green, C.white];
  if (t < t0 + 0.1) return null;
  const center = (top: number, size: number, weight: number, color: string, ls: string, delay: number, text: string) => (
    <div style={abs(0, top, {width: 1080, textAlign: 'center', fontSize: size, fontWeight: weight, color, letterSpacing: ls})}>
      <Rise t={t} t0={t0 + delay}>{text}</Rise>
    </div>
  );
  const phones = ['11 4393-9837', '11 4393-9839', '11 4393-9841', '11 4393-0172'];
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: C.orange, opacity: prog(t, t0 + 0.1, 0.2, (x) => x)}} />
      <Img
        src={staticFile('brand/logo-white.png')}
        style={{position: 'absolute', left: 540 - 270, top: 300, width: 540, opacity: p, transform: `translateY(${(1 - p) * 36}px) scale(${lerp(0.94, 1, p)})`}}
      />
      {center(610, 30, 800, C.ink, '0.22em', 0.8, 'ADMISIONES Y REQUISITOS')}
      {center(660, 96, 900, C.white, '-0.03em', 0.9, 'LLAMANOS')}
      {phones.map((ph, i) => (
        <div key={ph} style={abs(i % 2 === 0 ? 120 : 600, 800 + Math.floor(i / 2) * 78, {fontSize: 52, fontWeight: 800, color: C.white, letterSpacing: '-0.01em', width: 380, textAlign: 'center'})}>
          <Rise t={t} t0={t0 + 1.05 + i * 0.1}>{ph}</Rise>
        </div>
      ))}
      <div style={{position: 'absolute', left: 340, top: 985, width: 400 * prog(t, t0 + 1.5, 0.6, easeIO), height: 4, background: C.white, opacity: 0.55, borderRadius: 4}} />
      {center(1030, 28, 800, C.ink, '0.22em', 1.6, 'WHATSAPP DIRECTO')}
      {center(1078, 76, 900, C.white, '-0.02em', 1.7, '+54 9 11 2781 5279')}
      <div style={{position: 'absolute', left: 0, top: 1240, width: 1080, display: 'flex', justifyContent: 'center', gap: 22}}>
        {dots.map((c, i) => {
          const k = prog(t, t0 + 2.0 + i * 0.08, 0.5, easeOut);
          return <div key={i} style={{width: 26, height: 26, borderRadius: 26, background: c, transform: `scale(${k})`}} />;
        })}
      </div>
    </>
  );
};
