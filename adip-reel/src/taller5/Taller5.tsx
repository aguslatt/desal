import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Ribbons} from '../Ribbons';
import {FONT, GRADIENT, K, Rise, Trazo, Wipe, abs} from '../charla/kit';
import {CHUNKS, OUTRO_AT} from '../taller/data';
import {easeIO, easeIn, easeOut, lerp, prog} from '../ui';
import {videoLayer} from './camera5';
import {iconSet} from './icons5';

const fontCss = [300, 400, 500, 600, 700, 800, 900]
  .map((w) => `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}') format('woff2');}`)
  .join('\n');
const CREAM = '#FFE6D2';
type Key = 'o' | 'v' | 'c';
const COL: Record<Key, string> = {o: K.orange, v: K.violet, c: CREAM};
const TH: Record<Key, {ink: string; kw: string; track: string; tile: string; tileInk: string}> = {
  o: {ink: '#000', kw: '#000', track: 'rgba(0,0,0,0.2)', tile: '#fff', tileInk: '#000'},
  v: {ink: '#fff', kw: K.yellow, track: 'rgba(255,255,255,0.3)', tile: '#fff', tileInk: '#000'},
  c: {ink: '#000', kw: K.violet, track: 'rgba(0,0,0,0.15)', tile: '#fff', tileInk: '#000'},
};
type Sc = {from: number; key: Key; H: number};
const SC: Sc[] = [
  {from: 0, key: 'o', H: 745},
  {from: 2.6, key: 'v', H: 770},
  {from: 9.67, key: 'c', H: 750},
  {from: 16.37, key: 'o', H: 700},
  {from: 18.5, key: 'v', H: 880},
  {from: 24.3, key: 'o', H: 850},
  {from: 29.5, key: 'v', H: 660},
  {from: 39.33, key: 'c', H: 700},
  {from: 42.87, key: 'o', H: 810},
  {from: 47.3, key: 'v', H: 800},
  {from: 51.7, key: 'o', H: 0},
];
const idxAt = (t: number) => SC.reduce((k, s, i) => (t >= s.from ? i : k), 0);
const blockH = (t: number) => {
  const i = idxAt(t);
  if (i === 0) return prog(t, 0, 0.7, easeOut) * SC[0].H;
  const m = prog(t, SC[i].from - 0.15, 0.7, easeIO);
  return lerp(SC[i - 1].H, SC[i].H, m);
};

const H: React.FC<{t: number; t0: number; t1?: number; y: number; size: number; weight: number; color: string; x?: number; ls?: string; children: React.ReactNode}> = ({t, t0, t1, y, size, weight, color, x = 80, ls = '-0.02em', children}) => (
  <div style={abs(x, y, {fontSize: size, fontWeight: weight, color, lineHeight: 1.04, letterSpacing: ls})}>
    <Rise t={t} t0={t0} t1={t1}>
      {children}
    </Rise>
  </div>
);
const Tag: React.FC<{t: number; t0: number; t1: number; text: string; k: Key}> = ({t, t0, t1, text, k}) => {
  const a = prog(t, t0, 0.5, easeOut);
  const b = prog(t, t1, 0.3, easeIn);
  if (a <= 0 || b >= 1) return null;
  return (
    <div style={abs(80, 278, {display: 'flex', alignItems: 'center', gap: 14, opacity: (1 - b) * a, transform: `translateY(${(1 - a) * 10}px)`})}>
      <div style={{width: 14, height: 14, borderRadius: 14, background: k === 'v' ? K.orange : k === 'o' ? K.violet : K.orange}} />
      <div style={{fontSize: 24, fontWeight: 800, letterSpacing: '0.1em', color: TH[k].ink}}>{text}</div>
    </div>
  );
};
const TAG = 'TALLER PARA PERSONAS MAYORES';

const Progress: React.FC<{t: number; k: Key}> = ({t, k}) => {
  const b = [0, 9.67, 29.5, 47.3, 52.7];
  const op = 1 - prog(t, 51.6, 0.4);
  return (
    <div style={{position: 'absolute', left: 80, top: 234, width: 920, height: 6, display: 'flex', gap: 12, opacity: op * prog(t, 0.1, 0.5)}}>
      {[0, 1, 2, 3].map((i) => {
        const f = Math.min(1, Math.max(0, (t - b[i]) / (b[i + 1] - b[i])));
        return (
          <div key={i} style={{flex: 1, height: 6, borderRadius: 6, background: TH[k].track, overflow: 'hidden'}}>
            <div style={{width: `${f * 100}%`, height: 6, background: TH[k].ink}} />
          </div>
        );
      })}
    </div>
  );
};

// chip: flat rounded tag
const Chip: React.FC<{t: number; t0: number; t1: number; x: number; y: number; text: string; bg: string; fg: string}> = ({t, t0, t1, x, y, text, bg, fg}) => {
  const a = prog(t, t0 - 0.05, 0.5, easeOut);
  const b = prog(t, t1, 0.3, easeIn);
  if (a <= 0 || b >= 1) return null;
  return (
    <div style={abs(x, y, {height: 76, padding: '0 34px', borderRadius: 38, background: bg, color: fg, fontSize: 40, fontWeight: 800, display: 'flex', alignItems: 'center', opacity: (1 - b) * a, transform: `translateY(${(1 - a) * 30}px)`})}>{text}</div>
  );
};
const NumTile: React.FC<{t: number; t0: number; t1: number; x: number; y: number; n: string; text: string; k: Key; size?: number}> = ({t, t0, t1, x, y, n, text, k, size = 62}) => {
  const a = prog(t, t0 - 0.1, 0.45, easeOut);
  const b = prog(t, t1, 0.3, easeIn);
  if (a <= 0 || b >= 1) return null;
  return (
    <div style={abs(x, y, {display: 'flex', alignItems: 'center', gap: 24, opacity: 1 - b})}>
      <div style={{width: 62, height: 62, borderRadius: 18, background: k === 'v' ? '#fff' : '#000', color: k === 'v' ? K.violet : '#fff', fontSize: 30, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${a})`}}>{n}</div>
      <div style={{fontSize: size, fontWeight: 800, color: TH[k].ink, letterSpacing: '-0.015em', lineHeight: 1}}>
        <Rise t={t} t0={t0} t1={t1}>
          {text}
        </Rise>
      </div>
    </div>
  );
};
// icon tile (white card, radius 32, flat)
const Tile: React.FC<{t: number; t0: number; t1: number; x: number; y: number; w: number; h: number; active: boolean; title: string; icon: keyof typeof iconSet; iconT0: number; sz?: number}> = ({t, t0, t1, x, y, w, h, active, title, icon, iconT0, sz = 100}) => {
  const a = prog(t, t0, 0.6, easeOut);
  const b = prog(t, t1, 0.35, easeIn);
  if (a <= 0 || b >= 1) return null;
  const I = iconSet[icon];
  const bg = active ? K.orange : '#fff';
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 32, background: bg, transform: `translateY(${(1 - a) * 70 - b * 90}px)`, opacity: a * (1 - b)}}>
      <div style={{position: 'absolute', left: 30, top: 24}}>
        <I t={t} t0={iconT0} ink="#000" accent={active ? '#fff' : K.violet} size={sz} />
      </div>
      <div style={{position: 'absolute', left: 30, bottom: 26, right: 20, fontFamily: FONT, fontSize: 38, lineHeight: 1.05, fontWeight: 900, color: '#000', letterSpacing: '-0.02em'}}>{title}</div>
    </div>
  );
};

// ───────────── subtitles on a flat card ─────────────
const parse = (text: string) =>
  text
    .split(/(\[[^\]]+\])/)
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^\[(.+)\|([\d.]+)\]$/);
      return m ? {w: m[1], kt: parseFloat(m[2])} : {w: part, kt: null as number | null};
    });
const Subs: React.FC<{t: number}> = ({t}) => {
  const c = CHUNKS.find((x) => t >= x.s && t < x.e);
  if (!c) return null;
  const inP = prog(t, c.s, 0.2, easeOut);
  const outP = 1 - prog(t, c.e - 0.08, 0.08, (x) => x);
  const op = Math.min(inP, outP);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1424, display: 'flex', justifyContent: 'center', fontFamily: FONT, opacity: op, transform: `translateY(${(1 - inP) * 16}px)`}}>
      <div style={{background: '#fff', borderRadius: 32, padding: '22px 40px 24px', maxWidth: 960, textAlign: 'center', fontSize: 48, lineHeight: 1.16, fontWeight: 700, color: '#000', letterSpacing: '-0.012em', textWrap: 'balance' as any}}>
        {parse(c.text).map((p, i) => {
          if (p.kt === null) return <React.Fragment key={i}>{p.w}</React.Fragment>;
          const on = t >= p.kt - 0.02;
          return (
            <span key={i} style={on ? {color: K.violet, fontWeight: 800} : {}}>
              {p.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const Taller5: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const v = videoLayer(t);
  const i = idxAt(t);
  const k = SC[i].key;
  const live = t < OUTRO_AT + 0.8;
  const BH = blockH(t);

  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <style>{fontCss}</style>
      {live && (
        <>
          <div style={{position: 'absolute', left: 0, top: v.y0, width: 1080, height: v.h, overflow: 'hidden', background: '#EDEDED'}}>
            <OffthreadVideo src={staticFile('taller/lu_4k.mp4')} muted style={{position: 'absolute', left: 0, top: 0, width: 2160, height: 3840, transformOrigin: '0 0', transform: `translate(${v.tx}px, ${v.ty}px) scale(${v.s})`}} />
          </div>

          {/* colour block that owns the top of the frame */}
          <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: BH, overflow: 'hidden', borderRadius: '0 0 56px 56px'}}>
            {SC.map((s, j) => {
              if (j > i) return null;
              const p = j === 0 ? 1 : prog(t, s.from - 0.15, 0.6, easeIO);
              return <div key={j} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1000, background: COL[s.key], clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}} />;
            })}
          </div>
          <Progress t={t} k={k} />

          <Tag t={t} t0={0.2} t1={2.55} text={TAG} k="o" />
          <Tag t={t} t0={2.8} t1={9.5} text={TAG} k="v" />
          <Tag t={t} t0={9.9} t1={16.2} text={TAG} k="c" />
          <Tag t={t} t0={16.6} t1={18.4} text={TAG} k="o" />
          <Tag t={t} t0={18.65} t1={24.1} text="VAMOS A TRABAJAR" k="v" />
          <Tag t={t} t0={24.5} t1={29.4} text={TAG} k="o" />
          <Tag t={t} t0={29.9} t1={39.0} text={TAG} k="v" />
          <Tag t={t} t0={39.6} t1={42.6} text={TAG} k="c" />
          <Tag t={t} t0={43.0} t1={47.1} text={TAG} k="o" />
          <Tag t={t} t0={47.4} t1={51.5} text={TAG} k="v" />

          {/* 1 · hook */}
          <H t={t} t0={0.04} t1={2.5} y={326} size={100} weight={300} color="#000">¿Te olvidás</H>
          <H t={t} t0={0.3} t1={2.57} y={428} size={100} weight={900} color="#000">dónde dejaste</H>
          <H t={t} t0={0.66} t1={2.64} y={530} size={100} weight={900} color="#000">las cosas?</H>
          <Trazo t={t} t0={1.0} t1={2.5} left={80} top={604} w={330} color={K.violet} dur={0.7} id="t5a" />

          {/* 2 · what she feels */}
          {[
            ['1', 'Concentrarte', 2.75],
            ['2', 'Seguirle el ritmo', 4.5],
            ['3', 'Moverte más', 6.1],
            ['4', 'Conectar', 8.3],
          ].map(([n, w, t0], j) => (
            <NumTile key={n as string} t={t} t0={t0 as number} t1={9.3 + j * 0.04} x={80} y={338 + j * 102} n={n as string} text={w as string} k="v" />
          ))}

          {/* 3 · the workshop */}
          {t >= 9.85 && t < 16.3 && (
            <div style={abs(780, 292, {})}>
              <Wipe t={t} t0={9.85} t1={16.0} dur={0.6}>
                <Img src={staticFile('brand/logo-color.png')} style={{width: 200, height: 89, display: 'block'}} />
              </Wipe>
            </div>
          )}
          <H t={t} t0={10.84} t1={16.0} y={330} size={70} weight={300} color="#000">Un taller para el</H>
          <H t={t} t0={12.1} t1={16.05} y={408} size={112} weight={900} color="#000">bienestar</H>
          <H t={t} t0={12.5} t1={16.1} y={522} size={112} weight={900} color={K.violet}>integral</H>
          <Trazo t={t} t0={13.0} t1={16.0} left={80} top={634} w={380} gradient dur={0.8} id="t5b" />

          {/* 4 · professionals */}
          <H t={t} t0={16.62} t1={18.4} y={326} size={108} weight={900} color="#000">Profesionales</H>
          <H t={t} t0={17.3} t1={18.45} y={444} size={60} weight={700} color="#000">de diferentes áreas</H>
          {[0, 1, 2, 3].map((j) => {
            const a = prog(t, 17.3 + j * 0.22, 0.45, easeOut);
            const b = prog(t, 18.38, 0.3, easeIn);
            if (a <= 0 || b >= 1) return null;
            return <div key={j} style={{position: 'absolute', left: 80 + j * 92, top: 566, width: 64, height: 64, borderRadius: 64, background: j % 2 ? '#fff' : K.violet, transform: `scale(${a})`, opacity: 1 - b}} />;
          })}
          {t > 17.3 && t < 18.5 && <div style={{position: 'absolute', left: 80 + 32, top: 596, width: 276 * prog(t, 17.3, 1.0, easeIO) * (1 - prog(t, 18.38, 0.3)), height: 6, background: '#000', borderRadius: 6, zIndex: 0}} />}

          {/* 5 · four areas */}
          {([
            ['Memoria', 19.6, 80, 336, 'mem'],
            ['Atención', 20.46, 560, 336, 'att'],
            ['Movimiento', 21.44, 80, 596, 'mov'],
            ['Alimentación saludable', 22.58, 560, 596, 'food'],
          ] as [string, number, number, number, keyof typeof iconSet][]).map(([title, t0, x, y, icon], j, arr) => {
            const next = arr[j + 1]?.[1] ?? 99;
            return <Tile key={title} t={t} t0={t0 - 0.15} t1={24.05 + j * 0.05} x={x} y={y} w={440} h={240} active={t >= t0 && t < next} title={title} icon={icon} iconT0={t0} sz={96} />;
          })}

          {/* 6 · technology */}
          <H t={t} t0={25.38} t1={29.4} y={326} size={100} weight={900} color="#000">Herramientas</H>
          <H t={t} t0={25.88} t1={29.45} y={428} size={100} weight={900} color="#000">tecnológicas</H>
          <Tile t={t} t0={26.2} t1={29.4} x={80} y={576} w={440} h={236} active={t >= 28.5 && t < 29.14} title="Celular" icon="phone" iconT0={26.5} sz={104} />
          <Tile t={t} t0={26.45} t1={29.45} x={560} y={576} w={440} h={236} active={t >= 29.14} title="Tablet" icon="tablet" iconT0={26.8} sz={104} />

          {/* 7 · conversation */}
          <H t={t} t0={30.5} t1={39.0} y={326} size={104} weight={900} color="#fff">Un espacio</H>
          {([
            ['Interactuar', 32.28, 33.95],
            ['Conversación', 34.28, 34.9],
            ['Temas en común', 35.1, 37.3],
            ['Miedos e inquietudes', 37.78, 39.0],
          ] as [string, number, number][]).map(([w, a, b]) => (
            <H key={w} t={t} t0={a} t1={b} y={440} size={Math.min(100, Math.round(900 / (w.length * 0.66)))} weight={900} color={K.yellow}>
              {w}
            </H>
          ))}
          {t > 32.2 && t < 39.2 && <div style={{position: 'absolute', left: 80, top: 568, width: 140, height: 8, borderRadius: 8, background: K.orange, opacity: 1 - prog(t, 38.95, 0.25)}} />}

          {/* 8 · the question */}
          <H t={t} t0={40.2} t1={42.55} y={326} size={100} weight={300} color="#000">Contame</H>
          <H t={t} t0={40.84} t1={42.6} y={428} size={100} weight={900} color={K.violet}>la dinámica</H>
          <Trazo t={t} t0={41.35} t1={42.5} left={80} top={510} w={360} color={K.orange} dur={0.7} id="t5c" />
          {t > 40 && t < 42.9 && (
            <div style={{position: 'absolute', left: 780, top: 270, fontFamily: FONT, fontWeight: 900, fontSize: 460, lineHeight: 1, color: K.orange, opacity: prog(t, 40.1, 0.6, easeOut) * (1 - prog(t, 42.5, 0.3, easeIn)), transform: `translateY(${(1 - prog(t, 40.1, 0.7, easeOut)) * 80}px)`}}>?</div>
          )}

          {/* 9 · the answer */}
          <H t={t} t0={43.06} t1={47.2} y={326} size={100} weight={300} color="#000">Encuentros</H>
          <H t={t} t0={43.5} t1={47.25} y={428} size={100} weight={900} color="#000">semanales</H>
          {Array.from({length: 7}).map((_, j) => {
            const a = prog(t, 43.7 + j * 0.05, 0.45, easeOut);
            const b = prog(t, 47.1, 0.3, easeIn);
            if (a <= 0 || b >= 1) return null;
            const lit = j === 3 && t >= 44.1;
            return (
              <div key={j} style={{position: 'absolute', left: 80 + j * 133, top: 570, width: 118, height: 92, borderRadius: 24, background: lit ? K.violet : '#fff', transform: `scale(${a})`, opacity: 1 - b, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {lit && (
                  <svg width={56} height={44} viewBox="0 0 56 44">
                    <path d="M6 24 L22 38 L50 6" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${prog(t, 44.1, 0.4, easeIO)} 2`} />
                  </svg>
                )}
              </div>
            );
          })}
          <Chip t={t} t0={44.34} t1={47.1} x={80} y={702} text="Aprender" bg="#fff" fg="#000" />
          <Chip t={t} t0={45.24} t1={47.12} x={344} y={702} text="Cuidarte" bg="#000" fg="#fff" />
          <Chip t={t} t0={45.98} t1={47.14} x={598} y={702} text="Conectar" bg="#fff" fg="#000" />

          {/* 10 · call to action */}
          <H t={t} t0={47.34} t1={48.4} y={326} size={78} weight={300} color="#fff">Si te gustaría</H>
          <H t={t} t0={47.78} t1={48.45} y={410} size={108} weight={900} color={K.yellow}>participar</H>
          <H t={t} t0={48.74} t1={51.5} y={326} size={92} weight={900} color="#fff">Dejanos tu</H>
          <H t={t} t0={49.1} t1={51.55} y={422} size={92} weight={900} color={K.yellow}>comentario</H>
          <H t={t} t0={49.94} t1={51.5} y={534} size={44} weight={500} color="#fff" ls="0">con la palabra</H>
          {t >= 50.3 && t < 51.6 && (
            <>
              {[0, 0.25].map((d, j) => {
                const a = prog(t, 50.4 + d, 0.9, easeOut);
                if (a <= 0 || a >= 1) return null;
                return <div key={j} style={{position: 'absolute', left: 80 - a * 30, top: 596 - a * 30, width: 340 + a * 60, height: 118 + a * 60, borderRadius: 30 + a * 30, border: `5px solid rgba(255,255,255,${1 - a})`}} />;
              })}
              <div style={{position: 'absolute', left: 80, top: 596, width: 340, height: 118, borderRadius: 30, background: K.orange, color: '#000', fontFamily: FONT, fontWeight: 900, fontSize: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: prog(t, 50.34, 0.3, easeOut) * (1 - prog(t, 51.4, 0.15, easeOut)), transform: `scale(${0.85 + 0.15 * prog(t, 50.34, 0.5, easeOut)})`, transformOrigin: '0 50%'}}>INFO</div>
            </>
          )}
          <H t={t} t0={50.92} t1={51.5} y={740} size={42} weight={700} color="#fff" ls="0">y te contactaremos</H>

          <Subs t={t} />
        </>
      )}

      <Ribbons t0={OUTRO_AT} dur={0.9} mode="cover" dir="lr" palette={[K.violet, K.orange, K.violet, K.orange, K.violet]} />
      <EndCard t={t} t0={OUTRO_AT + 0.75} />
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  if (t < t0) return null;
  const btn = prog(t, t0 + 2.2, 0.6, easeOut);
  const arch = prog(t, t0 + 1.3, 0.9, easeOut);
  const circ = prog(t, t0 + 0.5, 0.9, easeOut);
  return (
    <div style={{position: 'absolute', inset: 0, background: CREAM, fontFamily: FONT, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080 * prog(t, t0 + 0.05, 0.9, easeIO), height: 14, background: `linear-gradient(90deg, ${GRADIENT.map(([o, c]) => `${c} ${o * 100}%`).join(',')})`}} />
      <div style={{position: 'absolute', left: 640, top: -400, width: 600, height: 600, borderRadius: 600, background: K.orange, transform: `scale(${circ})`, transformOrigin: '50% 80%'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 262, display: 'flex', justifyContent: 'center'}}>
        <Wipe t={t} t0={t0 + 0.25} dur={0.7}>
          <Img src={staticFile('brand/logo-color.png')} style={{width: 240, height: 107, display: 'block'}} />
        </Wipe>
      </div>
      <H t={t} t0={t0 + 0.7} y={440} size={100} weight={300} color="#000">Taller para</H>
      <H t={t} t0={t0 + 0.95} y={544} size={86} weight={900} color={K.violet}>personas mayores</H>
      <Trazo t={t} t0={t0 + 1.35} left={80} top={640} w={440} gradient dur={0.9} id="t5o" />
      <div style={{position: 'absolute', left: 280, top: 770, width: 520, height: 560, opacity: arch, transform: `translateY(${(1 - arch) * 40}px)`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 520, height: 560, borderRadius: '260px 260px 32px 32px', overflow: 'hidden', background: '#fff'}}>
          <Freeze frame={Math.round(52.3 * 30)}>
            <div style={{position: 'absolute', left: 0, top: 0, width: 2160, height: 3840, transformOrigin: '0 0', transform: 'translate(-141px, -598px) scale(0.4)'}}>
              <OffthreadVideo src={staticFile('taller/lu_4k.mp4')} muted style={{width: 2160, height: 3840}} />
            </div>
          </Freeze>
        </div>
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 1366, textAlign: 'center', fontSize: 52, fontWeight: 700, lineHeight: 1.18, color: '#000', letterSpacing: '-0.012em'}}>
        <Rise t={t} t0={t0 + 1.8}>Escribinos para conocer</Rise>
        <br />
        <Rise t={t} t0={t0 + 1.95}>la propuesta</Rise>
      </div>
      {btn > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1486, display: 'flex', justifyContent: 'center', opacity: btn, transform: `translateY(${(1 - btn) * 24}px)`}}>
          <div style={{height: 96, padding: '0 54px', borderRadius: 48, background: K.violet, color: '#fff', fontSize: 42, fontWeight: 700, display: 'flex', alignItems: 'center'}}>
            Comentá&nbsp;<span style={{fontWeight: 900, color: K.yellow}}>INFO</span>
          </div>
        </div>
      )}
    </div>
  );
};
