import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Ribbons} from '../Ribbons';
import {FONT, GRADIENT, K, Rise, Trazo, Wipe, abs} from '../charla/kit';
import {CHUNKS, OUTRO_AT} from '../taller/data';
import {easeIO, easeIn, easeOut, lerp, prog} from '../ui';
import {
  ArrowTo,
  Boil,
  HeadsLink,
  Ink,
  KeyTrail,
  PathDraw,
  PhoneDraw,
  PictoApple,
  PictoFocus,
  PictoMemory,
  PictoMove,
  QuestionDraw,
  SpiralDraw,
  StepsDraw,
  TabletDraw,
  TeamDraw,
  Underline,
  WeekDraw,
  loopAround,
} from './hand';
import {BG, THEME, bgLayers, cropTransform, rectsAt, sceneIdx, SCENES, Theme} from './layout';

const fontCss = [300, 400, 500, 600, 700, 800, 900]
  .map((w) => `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}') format('woff2');}`)
  .join('\n');
const inR = (t: number, a: number, b: number) => t >= a && t < b;
const TINT = '#FFE6D2';

const H: React.FC<{t: number; t0: number; t1?: number; y: number; size: number; weight: number; color: string; x?: number; ls?: string; children: React.ReactNode}> = ({t, t0, t1, y, size, weight, color, x = 80, ls = '-0.02em', children}) => (
  <div style={abs(x, y, {fontSize: size, fontWeight: weight, color, lineHeight: 1.04, letterSpacing: ls})}>
    <Rise t={t} t0={t0} t1={t1}>
      {children}
    </Rise>
  </div>
);
const Tag: React.FC<{t: number; t0: number; t1?: number; text: string; th: Theme; y?: number}> = ({t, t0, t1, text, th, y = 250}) => {
  const a = prog(t, t0, 0.5, easeOut);
  const b = t1 !== undefined ? prog(t, t1, 0.3, easeIn) : 0;
  if (a <= 0 || b >= 1) return null;
  return (
    <div style={abs(80, y, {display: 'flex', alignItems: 'center', gap: 14, opacity: (1 - b) * a, transform: `translateY(${(1 - a) * 10}px)`})}>
      <div style={{width: 16, height: 16, borderRadius: 16, background: th.a1}} />
      <div style={{fontSize: 26, fontWeight: 800, letterSpacing: '0.1em', color: th.ink}}>{text}</div>
    </div>
  );
};

/** numbered heads joined by a line */
const NumList: React.FC<{t: number; t1: number; items: {n: string; text: string; t0: number}[]; y: number; step: number; size: number; head?: number; th: Theme; c1: string; c2: string; n1?: string; n2?: string}> = ({t, t1, items, y, step, size, head = 50, th, c1, c2, n1 = '#fff', n2 = '#000'}) => (
  <>
    {items.map((it, i) => {
      if (i === 0) return null;
      const seg = prog(t, it.t0 - 0.05, 0.45, easeIO);
      const q = prog(t, t1, 0.35, easeIn);
      return <div key={`l${i}`} style={{position: 'absolute', left: 80 + head / 2 - 2, top: y + (i - 1) * step + head, width: 4, height: (step - head) * seg * (1 - q), background: th.ink, borderRadius: 4}} />;
    })}
    {items.map((it, i) => {
      const a = prog(t, it.t0 - 0.1, 0.45, easeOut);
      const b = prog(t, t1 + i * 0.04, 0.3, easeIn);
      if (a <= 0 || b >= 1) return null;
      const col = i % 2 ? c2 : c1;
      return (
        <div key={it.n} style={abs(80, y + i * step, {display: 'flex', alignItems: 'center', gap: 22, opacity: 1 - b})}>
          <div style={{width: head, height: head, borderRadius: head, background: col, color: i % 2 ? n2 : n1, fontSize: head * 0.52, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${a})`}}>{it.n}</div>
          <div style={{fontSize: size, fontWeight: 800, color: th.ink, letterSpacing: '-0.015em', lineHeight: 1}}>
            <Rise t={t} t0={it.t0} t1={t1 + i * 0.04}>
              {it.text}
            </Rise>
          </div>
        </div>
      );
    })}
  </>
);

// ───────────────── subtitles ─────────────────
const parse = (text: string) =>
  text
    .split(/(\[[^\]]+\])/)
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^\[(.+)\|([\d.]+)\]$/);
      return m ? {w: m[1], kt: parseFloat(m[2])} : {w: part, kt: null as number | null};
    });
const Subs: React.FC<{t: number; bg: keyof typeof BG}> = ({t, bg}) => {
  const c = CHUNKS.find((x) => t >= x.s && t < x.e);
  if (!c) return null;
  const th = THEME[bg];
  const inP = prog(t, c.s, 0.18, easeOut);
  const outP = 1 - prog(t, c.e - 0.08, 0.08, (x) => x);
  const op = Math.min(inP, outP);
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 1408, height: 170, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontFamily: FONT, opacity: op, transform: `translateY(${(1 - inP) * 12}px)`}}>
      <div style={{textAlign: 'center', fontSize: 52, lineHeight: 1.16, fontWeight: 700, color: th.sub, letterSpacing: '-0.012em', textWrap: 'balance' as any}}>
        {parse(c.text).map((p, i) => {
          if (p.kt === null) return <React.Fragment key={i}>{p.w}</React.Fragment>;
          const on = t >= p.kt - 0.02;
          const style: React.CSSProperties = on
            ? bg === 'o'
              ? {fontWeight: 900, textDecoration: 'underline', textDecorationColor: K.violet, textDecorationThickness: 6, textUnderlineOffset: 6}
              : {fontWeight: 800, color: th.kw}
            : {};
          return (
            <span key={i} style={style}>
              {p.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ───────────────── window outline (drawn by hand, a little off-register) ─────────────────
const archPath = (x: number, y: number, w: number, h: number, e = 14) => {
  const x0 = x - e;
  const x1 = x + w + e;
  const y0 = y - e;
  const y1 = y + h + e;
  const r = Math.min((w + 2 * e) / 2, h * 0.6);
  return `M${x0} ${y1} V${y0 + r} A${r} ${r} 0 0 1 ${x0 + r} ${y0} H${x1 - r} A${r} ${r} 0 0 1 ${x1} ${y0 + r} V${y1}`;
};

export const Taller4: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const idx = sceneIdx(t);
  const sc = SCENES[idx];
  const bg = sc.bg;
  const th = THEME[bg];
  const rects = rectsAt(t);
  const live = t < OUTRO_AT + 0.8;
  const TAG = 'TALLER PARA PERSONAS MAYORES';

  return (
    <AbsoluteFill style={{background: BG.o}}>
      <style>{fontCss}</style>
      {live && (
        <>
          {/* colour backgrounds that open like a circle from the next window */}
          {bgLayers(t).map((l) => l.R > 1 && <div key={l.i} style={{position: 'absolute', inset: 0, background: l.color, clipPath: `circle(${l.R}px at ${l.cx}px ${l.cy}px)`}} />)}
          {/* the big circle ("head") that leaves the edge */}
          {SCENES.map((s, i) => {
            if (!s.circle || i !== idx) return null;
            const p = prog(t, s.from + 0.35, 0.8, easeOut);
            return <div key={i} style={{position: 'absolute', left: s.circle.cx - s.circle.r, top: s.circle.cy - s.circle.r, width: s.circle.r * 2, height: s.circle.r * 2, borderRadius: s.circle.r, background: s.circle.color, transform: `scale(${p})`}} />;
          })}

          {/* video windows */}
          {rects.map((r, j) => {
            const c = cropTransform(j, t, r.w, r.h);
            const rt = Math.min(r.w / 2, r.h * 0.6);
            return (
              <div key={j} style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: `${rt}px ${rt}px 28px 28px`, overflow: 'hidden', transformOrigin: '50% 100%', transform: `scale(${lerp(0.85, 1, r.grow)})`, opacity: Math.min(1, r.grow * 2)}}>
                <OffthreadVideo src={staticFile('taller/lu_4k.mp4')} muted style={{position: 'absolute', left: 0, top: 0, width: 2160, height: 3840, transformOrigin: '0 0', transform: `translate(${c.tx}px, ${c.ty}px) scale(${c.s})`}} />
              </div>
            );
          })}

          {/* hand-drawn layer */}
          <Boil frame={frame}>
            {rects.map((r, j) => (
              <Ink key={`o${j}`} t={t} t0={sc.from + 0.15} color={th.ink} w={7} d={archPath(r.x, r.y, r.w, r.h)} dur={0.9} />
            ))}
            {/* 1 · hook */}
            <KeyTrail t={t} t0={0.7} t1={2.5} x={80} y={622} ink="#000" accent="#fff" trail={K.violet} s={1.08} />
            <Ink t={t} t0={1.25} t1={2.5} color={K.violet} w={8} d={loopAround(292, 548, 252, 54, 1.1)} dur={0.7} />
            {/* 2 · what she feels */}
            <SpiralDraw t={t} t0={2.7} t1={4.5} x={840} y={430} ink="#000" accent={K.orange} s={1.05} />
            <StepsDraw t={t} t0={4.5} t1={6.0} x={690} y={330} ink="#000" accent={K.violet} />
            <PathDraw t={t} t0={6.1} t1={8.2} x={650} y={370} ink="#000" accent={K.violet} s={0.95} />
            <HeadsLink t={t} t0={8.3} t1={9.4} x={620} y={400} ink="#000" a={K.violet} b={K.orange} s={0.9} />
            {/* 3 · the workshop (violet) */}
            <Underline t={t} t0={12.6} t1={16.0} x={84} y={706} w={390} color={K.yellow} sw={10} />
            {/* 4 · professionals */}
            <TeamDraw t={t} t0={17.0} t1={18.4} x={80} y={540} ink="#000" c1={K.violet} c2="#fff" s={0.88} />
            {/* 6 · technology */}
            <Ink t={t} t0={26.3} t1={29.4} color={K.violet} w={8} d={loopAround(300, 470, 285, 54, 1.1)} dur={0.7} />
            <PhoneDraw t={t} t0={28.0} t1={29.4} x={120} y={620} ink="#000" accent={K.violet} s={0.95} />
            <TabletDraw t={t} t0={28.8} t1={29.4} x={100} y={960} ink="#000" accent={K.violet} s={1.0} />
            {/* 7 · conversation: the stroke that joins them */}
            <Ink t={t} t0={30.0} t1={39.0} color="#fff" w={9} d="M285 640 C 330 500, 750 500, 795 640" dur={1.1} />
            {[32.28, 34.28, 35.1, 37.78].map((p, i) => {
              const a = prog(t, p, 0.9, easeOut);
              if (a <= 0 || a >= 1 || t > 39) return null;
              return <circle key={i} cx={540} cy={546} r={14 + a * 120} fill="none" stroke={K.yellow} strokeWidth={8 * (1 - a)} opacity={1 - a} />;
            })}
            {/* 8 · the question */}
            <QuestionDraw t={t} t0={40.0} t1={42.5} x={800} y={270} ink={K.orange} s={1.0} w={30} />
            <Underline t={t} t0={41.3} t1={42.5} x={84} y={520} w={470} color={K.orange} sw={10} />
            {/* 9 · weekly */}
            <WeekDraw t={t} t0={43.3} t1={47.1} x={80} y={548} ink="#000" accent={K.violet} />
            {/* 10 · call to action */}
            <Ink t={t} t0={50.6} t1={51.5} color="#fff" w={8} d={loopAround(260, 665, 240, 92, 1.1)} dur={0.7} />
          </Boil>

          {/* labels + headlines */}
          <Tag t={t} t0={0.2} t1={9.5} text={TAG} th={THEME.o} />
          <Tag t={t} t0={2.8} t1={9.5} text={TAG} th={THEME.c} />
          <Tag t={t} t0={9.9} t1={16.2} text={TAG} th={THEME.v} />
          <Tag t={t} t0={18.6} t1={24.1} text="VAMOS A TRABAJAR" th={THEME.c} />
          <Tag t={t} t0={24.5} t1={29.4} text={TAG} th={THEME.o} />
          <Tag t={t} t0={29.9} t1={39.0} text={TAG} th={THEME.v} />
          <Tag t={t} t0={39.6} t1={42.6} text={TAG} th={THEME.c} />
          <Tag t={t} t0={43.0} t1={47.1} text={TAG} th={THEME.o} />
          <Tag t={t} t0={47.4} t1={51.5} text={TAG} th={THEME.v} />

          {/* 1 */}
          <H t={t} t0={0.04} t1={2.5} y={296} size={96} weight={300} color="#000">¿Te olvidás</H>
          <H t={t} t0={0.3} t1={2.57} y={392} size={96} weight={900} color="#000">dónde dejaste</H>
          <H t={t} t0={0.66} t1={2.64} y={488} size={96} weight={900} color="#000">las cosas?</H>
          {/* 2 */}
          <NumList t={t} t1={9.3} th={THEME.c} y={290} step={92} size={62} c1={K.violet} c2={K.orange} items={[
            {n: '1', text: 'Concentrarte', t0: 2.75},
            {n: '2', text: 'Seguirle el ritmo', t0: 4.5},
            {n: '3', text: 'Moverte más', t0: 6.1},
            {n: '4', text: 'Conectar', t0: 8.3},
          ]} />
          {/* 3 */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 236, display: 'flex', justifyContent: 'center', opacity: 0}} />
          {t >= 9.85 && t < 16.3 && (
            <div style={abs(780, 236, {})}>
              <Wipe t={t} t0={9.85} t1={16.0} dur={0.6}>
                <Img src={staticFile('brand/logo-white.png')} style={{width: 210, height: 94, display: 'block'}} />
              </Wipe>
            </div>
          )}
          <H t={t} t0={10.84} t1={16.0} y={308} size={70} weight={300} color="#fff">Un taller para el</H>
          <H t={t} t0={12.1} t1={16.05} y={384} size={112} weight={900} color="#fff">bienestar</H>
          <H t={t} t0={12.5} t1={16.1} y={500} size={112} weight={900} color={K.yellow}>integral</H>
          {/* 4 */}
          <H t={t} t0={16.62} t1={18.4} y={296} size={108} weight={900} color="#000">Profesionales</H>
          <H t={t} t0={17.3} t1={18.45} y={414} size={60} weight={700} color="#000">de diferentes áreas</H>
          {/* 5 · four areas as coloured tiles */}
          {([
            {title: 'Memoria', t0: 19.6, x: 90, y: 300, c: K.orange, ink: '#000', fill: K.violet, P: PictoMemory},
            {title: 'Atención', t0: 20.46, x: 550, y: 300, c: K.violet, ink: '#fff', fill: K.orange, P: PictoFocus},
            {title: 'Movimiento', t0: 21.44, x: 90, y: 610, c: K.violet, ink: '#fff', fill: K.orange, P: PictoMove},
            {title: 'Alimentación', t0: 22.58, x: 550, y: 610, c: K.orange, ink: '#000', fill: K.violet, P: PictoApple},
          ] as const).map((tl, i) => {
            const a = prog(t, tl.t0 - 0.15, 0.55, easeOut);
            const b = prog(t, 24.05 + i * 0.05, 0.35, easeIn);
            if (a <= 0 || b >= 1) return null;
            const P: any = tl.P;
            return (
              <React.Fragment key={tl.title}>
                <div style={{position: 'absolute', left: tl.x, top: tl.y, width: 440, height: 290, borderRadius: 32, background: tl.c, transform: `scale(${lerp(0.82, 1, a) * (1 - b * 0.2)})`, opacity: a * (1 - b)}} />
                <div style={abs(tl.x + 28, tl.y + 222, {fontSize: 42, fontWeight: 900, color: tl.ink, letterSpacing: '-0.02em', opacity: a * (1 - b)})}>{tl.title}</div>
                <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: 1 - b}}>
                  <g>
                    {tl.title === 'Alimentación' ? (
                      <PictoApple t={t} t0={tl.t0} x={tl.x + 255} y={tl.y + 28} ink={tl.ink} accent={tl.fill} leaf={K.violet} s={0.9} />
                    ) : tl.title === 'Memoria' ? (
                      <PictoMemory t={t} t0={tl.t0} x={tl.x + 245} y={tl.y + 40} ink={tl.ink} accent={tl.fill} s={0.62} />
                    ) : tl.title === 'Atención' ? (
                      <PictoFocus t={t} t0={tl.t0} x={tl.x + 330} y={tl.y + 110} ink={tl.ink} accent={tl.fill} s={0.85} />
                    ) : (
                      <PictoMove t={t} t0={tl.t0} x={tl.x + 190} y={tl.y + 46} ink={tl.ink} accent={tl.fill} s={0.82} />
                    )}
                  </g>
                </svg>
              </React.Fragment>
            );
          })}
          {/* 6 */}
          <H t={t} t0={25.38} t1={29.4} y={300} size={100} weight={900} color="#000">Herramientas</H>
          <H t={t} t0={25.88} t1={29.45} y={408} size={100} weight={900} color="#000">tecnológicas</H>
          <H t={t} t0={28.5} t1={29.4} y={898} size={54} weight={900} color="#000">Celular</H>
          <H t={t} t0={29.14} t1={29.45} y={1218} size={54} weight={900} color="#000">Tablet</H>
          {/* 7 · one word at a time */}
          <H t={t} t0={30.5} t1={39.0} y={296} size={104} weight={900} color="#fff">Un espacio</H>
          {([
            ['Interactuar', 32.28, 33.95],
            ['Conversación', 34.28, 34.9],
            ['Temas en común', 35.1, 37.3],
            ['Miedos e inquietudes', 37.78, 39.0],
          ] as [string, number, number][]).map(([w, a, b]) => (
            <H key={w} t={t} t0={a} t1={b} y={420} size={Math.min(100, Math.round(900 / (w.length * 0.66)))} weight={900} color={K.yellow}>
              {w}
            </H>
          ))}
          {/* 8 */}
          <H t={t} t0={40.2} t1={42.55} y={296} size={100} weight={300} color="#000">Contame</H>
          <H t={t} t0={40.84} t1={42.6} y={400} size={100} weight={900} color={K.violet}>la dinámica</H>
          {/* 9 */}
          <H t={t} t0={43.06} t1={47.2} y={296} size={100} weight={300} color="#000">Encuentros</H>
          <H t={t} t0={43.5} t1={47.25} y={400} size={100} weight={900} color="#000">semanales</H>
          <NumList t={t} t1={47.15} th={THEME.o} y={700} step={98} size={54} c1={K.violet} c2="#000" items={[
            {n: '1', text: 'Aprender', t0: 44.34},
            {n: '2', text: 'Cuidarte', t0: 45.24},
            {n: '3', text: 'Conectar', t0: 45.98},
          ]} />
          {/* 10 */}
          <H t={t} t0={47.34} t1={48.4} y={296} size={78} weight={300} color="#fff">Si te gustaría</H>
          <H t={t} t0={47.78} t1={48.45} y={380} size={108} weight={900} color={K.yellow}>participar</H>
          <H t={t} t0={48.74} t1={51.5} y={296} size={92} weight={900} color="#fff">Dejanos tu</H>
          <H t={t} t0={49.1} t1={51.55} y={392} size={92} weight={900} color={K.yellow}>comentario</H>
          <H t={t} t0={49.94} t1={51.5} y={496} size={44} weight={500} color="#fff" ls="0">con la palabra</H>
          {inR(t, 50.3, 51.6) && (
            <div style={{position: 'absolute', left: 80, top: 600, width: 360, height: 130, borderRadius: 24, background: K.orange, color: '#000', fontFamily: FONT, fontWeight: 900, fontSize: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: prog(t, 50.34, 0.3, easeOut) * (1 - prog(t, 51.4, 0.15, easeOut)), transform: `scale(${0.8 + 0.2 * prog(t, 50.34, 0.5, easeOut)})`, transformOrigin: '0 50%'}}>
              INFO
            </div>
          )}
          <H t={t} t0={50.92} t1={51.5} y={766} size={42} weight={700} color="#fff" ls="0">y te contactaremos</H>

          <Subs t={t} bg={bg} />
        </>
      )}

      <Ribbons t0={OUTRO_AT} dur={0.9} mode="cover" dir="lr" palette={[K.violet, K.orange, K.violet, K.orange, K.violet]} />
      <EndCard t={t} t0={OUTRO_AT + 0.75} frame={frame} />
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{t: number; t0: number; frame: number}> = ({t, t0, frame}) => {
  if (t < t0) return null;
  const btn = prog(t, t0 + 2.2, 0.6, easeOut);
  const arch = prog(t, t0 + 1.3, 0.9, easeOut);
  const circ = prog(t, t0 + 0.5, 0.9, easeOut);
  return (
    <div style={{position: 'absolute', inset: 0, background: TINT, fontFamily: FONT, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080 * prog(t, t0 + 0.05, 0.9, easeIO), height: 14, background: `linear-gradient(90deg, ${GRADIENT.map(([o, c]) => `${c} ${o * 100}%`).join(',')})`}} />
      <div style={{position: 'absolute', left: 640, top: -400, width: 600, height: 600, borderRadius: 600, background: K.orange, transform: `scale(${circ})`, transformOrigin: '50% 80%'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 262, display: 'flex', justifyContent: 'center'}}>
        <Wipe t={t} t0={t0 + 0.25} dur={0.7}>
          <Img src={staticFile('brand/logo-color.png')} style={{width: 240, height: 107, display: 'block'}} />
        </Wipe>
      </div>
      <H t={t} t0={t0 + 0.7} y={440} size={100} weight={300} color="#000">Taller para</H>
      <H t={t} t0={t0 + 0.95} y={544} size={86} weight={900} color={K.violet}>personas mayores</H>
      <Trazo t={t} t0={t0 + 1.35} left={80} top={640} w={440} gradient dur={0.9} id="tz4o" />
      <div style={{position: 'absolute', left: 280, top: 770, width: 520, height: 560, opacity: arch}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 520, height: 560, borderRadius: '260px 260px 28px 28px', overflow: 'hidden', background: '#fff', transform: `translateY(${(1 - arch) * 40}px)`}}>
          <Freeze frame={Math.round(52.3 * 30)}>
            <div style={{position: 'absolute', left: 0, top: 0, width: 2160, height: 3840, transformOrigin: '0 0', transform: 'translate(-141px, -598px) scale(0.4)'}}>
              <OffthreadVideo src={staticFile('taller/lu_4k.mp4')} muted style={{width: 2160, height: 3840}} />
            </div>
          </Freeze>
        </div>
      </div>
      <Boil frame={frame}>
        <Ink t={t} t0={t0 + 1.6} color="#000" w={8} d={archPath(280, 770, 520, 560, 14)} dur={1.0} />
        <ArrowTo t={t} t0={t0 + 2.6} color={K.violet} d="M760 1530 C 700 1470, 640 1500, 600 1540" head={[598, 1542, 2.6]} />
      </Boil>
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
