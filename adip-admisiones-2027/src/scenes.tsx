import React from 'react';
import {FONT, H, K, W, clamp, easeInCubic, easeInOutCubic, easeInOutSine, easeOutExpo, lerp, lin, prog} from './tokens';
import {Head, Label, Logo, Rise, Thread, fit} from './kit';
import {closeCam} from './camera';
import type {Seg, Timeline} from './types';

// ---------------------------------------------------------------- utilidades
const mk = (tl: Timeline, name: string, seg: Seg): number | undefined => {
  const a = seg.outF0 / tl.fps - 0.05;
  const b = seg.outF1 / tl.fps + 0.05;
  return (tl.marks[name] || []).find((v) => v >= a && v <= b);
};
const segOf = (tl: Timeline, id: string) => tl.segments.find((s) => s.id === id);
const t0Of = (s: Seg) => s.outF0 / 30;
const t1Of = (s: Seg) => s.outF1 / 30;

const HEAD_COLORS = [K.violet, K.pink, K.orange, K.yellow, K.green, K.violet, K.pink];
const HEAD_INK = [K.white, K.white, K.ink, K.ink, K.ink, K.white, K.white];

// ---------------------------------------------------------------- subtítulos (una frase a la vez, sin resaltar palabra por palabra)
export const Subtitles: React.FC<{tl: Timeline; t: number; dark?: boolean; fadeP?: number; fadeBefore?: number}> = ({tl, t, dark, fadeP = 0, fadeBefore = -1}) => {
  const sub = tl.subs.find((s) => t >= s.s && t < s.e);
  if (!sub) return null;
  const inP = clamp((t - sub.s) / 0.14);
  const outP = clamp((sub.e - t) / 0.08);
  // al encogerse el video hacia el arco, la frase que ya dice "Admisiones 2027" se retira (el titular la reemplaza)
  const arcFade = sub.s < fadeBefore ? 1 - clamp(fadeP / 0.25) : 1;
  const op = Math.min(inP, outP) * arcFade;
  const size = Math.min(...sub.lines.map((l) => fit(l, 700, 54, 900, 40)));
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        width: 900,
        top: 1510 - size * 1.2 * sub.lines.length,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: op,
        transform: `translateY(${(1 - easeOutExpo(inP)) * 12}px)`,
      }}
    >
      {sub.lines.map((l, i) => (
        <div
          key={i}
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: size,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            color: dark ? K.ink : K.white,
            textShadow: dark ? 'none' : '0 2px 14px rgba(0,0,0,0.38)',
          }}
        >
          {l}
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- GANCHO A: "7"
const HookA: React.FC<{tl: Timeline; t: number; seg: Seg}> = ({t, seg}) => {
  const a = t0Of(seg);
  const e = t1Of(seg);
  const out = e - 0.34;
  const big = {fontWeight: 900, lineHeight: 1, fontFamily: FONT};
  return (
    <>
      <Rise t={t} t0={a + 0.0} t1={out} dur={0.75} style={{left: 62, top: 440}}>
        <div style={{...big, fontSize: 420, color: K.violet, letterSpacing: '-0.03em'}}>7</div>
      </Rise>
      {['tipos de', 'terapias', 'diferentes'].map((w, i) => (
        <Rise key={w} t={t} t0={a + 0.3 + i * 0.11} t1={out + i * 0.04} dur={0.6} style={{left: 330, top: 470 + i * 104}}>
          <div style={{...big, fontSize: 92, color: K.ink, letterSpacing: '-0.02em'}}>{w}</div>
        </Rise>
      ))}
      <Thread
        t={t}
        id="thA"
        d="M80 878 C 250 900, 420 902, 560 876 C 640 860, 700 826, 676 808 C 652 792, 616 826, 656 858 C 706 892, 830 898, 960 868"
        t0={a + 0.75}
        dur={0.95}
        t1={out - 0.1}
        outDur={0.45}
        w={15}
      />
    </>
  );
};

// ---------------------------------------------------------------- GANCHO C: urgencia
const HookC: React.FC<{tl: Timeline; t: number; seg: Seg}> = ({t, seg}) => {
  const a = t0Of(seg);
  const out = t1Of(seg) - 0.34;
  return (
    <>
      <Rise t={t} t0={a} t1={out} dur={0.7} style={{left: 76, top: 440}}>
        <div style={{fontFamily: FONT, fontWeight: 300, fontSize: 128, lineHeight: 1, color: K.ink, letterSpacing: '-0.02em'}}>Es hoy</div>
      </Rise>
      <Rise t={t} t0={a + 0.14} t1={out + 0.04} dur={0.7} style={{left: 76, top: 566}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 128, lineHeight: 1, color: K.violet, letterSpacing: '-0.025em'}}>el momento.</div>
      </Rise>
      <Thread t={t} id="thC" d="M80 740 C 300 764, 520 764, 700 738 C 780 726, 830 700, 812 684 C 794 670, 764 700, 800 728 C 840 756, 930 752, 1000 730" t0={a + 0.7} dur={0.9} t1={out - 0.1} outDur={0.45} w={15} />
    </>
  );
};

// ---------------------------------------------------------------- INTRO: "2027 empieza con una conversación"
const Intro: React.FC<{tl: Timeline; t: number; seg: Seg}> = ({t, seg}) => {
  const a = t0Of(seg);
  const out = t1Of(seg) - 0.2;
  const lu = a + 0.8;
  const role = a + 1.4;
  const h = {fontFamily: FONT, fontWeight: 900, fontSize: 100, lineHeight: 1, letterSpacing: '-0.025em'} as const;
  return (
    <>
      <Rise t={t} t0={a + 0.1} t1={out} style={{left: 78, top: 430}}>
        <div style={{...h, color: K.ink}}>2027 empieza</div>
      </Rise>
      <Rise t={t} t0={a + 0.22} t1={out + 0.04} style={{left: 78, top: 532}}>
        <div style={{...h, color: K.ink}}>con una</div>
      </Rise>
      <Rise t={t} t0={a + 0.34} t1={out + 0.08} style={{left: 78, top: 634}}>
        <div style={{...h, color: K.violet}}>conversación.</div>
      </Rise>
      <Thread t={t} id="thI" d="M84 776 C 280 794, 520 794, 700 778 C 790 770, 850 772, 880 792 C 898 808, 884 832, 858 826 C 832 820, 838 790, 872 778 C 904 768, 950 772, 996 782" t0={a + 0.9} dur={1.0} t1={out - 0.1} outDur={0.45} w={14} />
      <Rise t={t} t0={lu} t1={out} dur={0.5} style={{left: 80, top: 806}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 54, lineHeight: 1, color: K.ink}}>Lu</div>
      </Rise>
      <Rise t={t} t0={role} t1={out} dur={0.5} style={{left: 160, top: 812}}>
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 32, lineHeight: 1.25, color: K.ink}}>Coordinadora del área</div>
      </Rise>
      <Rise t={t} t0={role + 0.1} t1={out + 0.04} dur={0.5} style={{left: 160, top: 846}}>
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 32, lineHeight: 1.25, color: K.ink}}>de Rehabilitación</div>
      </Rise>
    </>
  );
};

// ---------------------------------------------------------------- LISTA: las terapias, una por una
const ITEMS: {key: string; text: string}[] = [
  {key: 'psico', text: 'Psicología'},
  {key: 'psicoped', text: 'Psicopedagogía'},
  {key: 'ocupacional', text: 'Terapia ocupacional'},
  {key: 'fono', text: 'Fonoaudiología'},
  {key: 'kine', text: 'Kinesiología'},
  {key: 'musico', text: 'Musicoterapia'},
  {key: 'psicomot', text: 'Psicomotricidad'},
];
const ROW0 = 400;
const PITCH = 80;
const LIST_X = 108;
const List: React.FC<{tl: Timeline; t: number; seg: Seg}> = ({tl, t, seg}) => {
  const times = ITEMS.map((it) => mk(tl, it.key, seg) ?? t0Of(seg));
  const out = t1Of(seg) - 0.3;
  const withOri = seg.id === 'LI';
  const tAd = mk(tl, 'ademas', seg);
  const tOri = mk(tl, 'orientacion', seg);
  const yOri = ROW0 + 6 * PITCH + 98;
  const tFirst = times[0];
  const tLast = times[6];
  const d = `M${LIST_X} ${ROW0} C ${LIST_X - 22} ${ROW0 + 120}, ${LIST_X + 22} ${ROW0 + 340}, ${LIST_X} ${ROW0 + 6 * PITCH} S ${LIST_X + 20} ${ROW0 + 6 * PITCH + 60}, ${LIST_X} ${yOri}`;
  return (
    <>
      {/* hilo que une las cabezas */}
      <Thread
        t={t}
        id="thL"
        d={d}
        t0={tFirst - 0.1}
        dur={withOri && tOri ? tOri - tFirst + 0.5 : tLast - tFirst + 0.4}
        t1={out}
        outDur={0.5}
        w={11}
        gx={[0, ROW0, 0, yOri]}
        ease={lin}
      />
      {ITEMS.map((it, i) => (
        <React.Fragment key={it.key}>
          <Head t={t} t0={times[i] - 0.08} t1={out} cx={LIST_X} cy={ROW0 + i * PITCH} r={31} color={HEAD_COLORS[i]} label={String(i + 1)} ink={HEAD_INK[i]} size={30} />
          <Rise t={t} t0={times[i] - 0.02} t1={out} dur={0.55} style={{left: 168, top: ROW0 + i * PITCH - 28}}>
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 60, lineHeight: "60px", color: K.ink, letterSpacing: '-0.015em'}}>{it.text}</div>
          </Rise>
        </React.Fragment>
      ))}
      {withOri && tAd && tOri && (
        <>
          <Head t={t} t0={tOri - 0.25} t1={out} cx={LIST_X} cy={yOri} r={31} color={K.orange} label="+" ink={K.ink} size={40} />
          <Rise t={t} t0={tOri - 0.05} t1={out} dur={0.55} style={{left: 168, top: yOri - 28}}>
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 60, lineHeight: "60px", color: K.ink, letterSpacing: '-0.015em'}}>Orientación a padres</div>
          </Rise>
        </>
      )}
    </>
  );
};

// ---------------------------------------------------------------- PREGUNTA (titular) → respuesta
const Q: React.FC<{t: number; t0: number; t1?: number; lines: string[]; top?: number; size?: number}> = ({t, t0, t1, lines, top = 420, size = 118}) => (
  <>
    {lines.map((l, i) => (
      <Rise key={l} t={t} t0={t0 + i * 0.1} t1={t1 === undefined ? undefined : t1 + i * 0.05} dur={0.6} style={{left: 76, top: top + i * (size + 4)}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1, color: K.ink, letterSpacing: '-0.025em'}}>{l}</div>
      </Rise>
    ))}
  </>
);

/** 0 → 100: el hilo une dos cabezas, sincronizado con "desde el nacimiento hasta aproximadamente 100 años". */
const Age: React.FC<{tl: Timeline; t: number; seg: Seg; qT0: number; qOut: number; hook?: boolean}> = ({tl, t, seg, qT0, qOut, hook}) => {
  const tNac = mk(tl, 'nacimiento', seg) ?? t0Of(seg);
  const tApr = (mk(tl, 'aprox', seg) ?? tNac + 1.1);
  const tCien = mk(tl, 'cien', seg) ?? tNac + 1.9;
  const tAn = mk(tl, 'anios', seg) ?? tCien + 0.35;
  const out = t1Of(seg) - 0.05;
  const cy = hook ? 800 : 700;
  return (
    <>
      {hook ? (
        <Rise t={t} t0={qT0} t1={out} dur={0.6} style={{left: 76, top: 436}}>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 84, lineHeight: 1, color: K.ink, letterSpacing: '-0.025em'}}>¿Para qué edades?</div>
        </Rise>
      ) : (
        <>
          <Q t={t} t0={qT0} t1={qOut} lines={['¿Para qué', 'edades?']} />
          <Rise t={t} t0={qOut + 0.15} t1={out} dur={0.5} style={{left: 80, top: 396}}>
            <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 40, lineHeight: 1.1, color: K.ink}}>¿Para qué edades?</div>
          </Rise>
        </>
      )}
      <Head t={t} t0={tNac - 0.12} t1={out} cx={150} cy={cy} r={68} color={K.violet} label="0" size={72} />
      <Rise t={t} t0={tNac - 0.05} t1={out} dur={0.5} style={{left: 80, top: cy + 88}}>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 36, lineHeight: 1.1, color: K.ink}}>nacimiento</div>
      </Rise>
      <Thread
        t={t}
        id="thAge"
        d={`M222 ${cy} C 300 ${cy + 8}, 352 ${cy - 44}, 394 ${cy - 76} C 424 ${cy - 100}, 444 ${cy - 136}, 420 ${cy - 146} C 396 ${cy - 154}, 380 ${cy - 112}, 410 ${cy - 76} C 442 ${cy - 40}, 520 ${cy + 4}, 660 ${cy}`}
        t0={tNac}
        dur={tCien - tNac - 0.1}
        t1={out - 0.1}
        outDur={0.4}
        w={15}
        ease={easeInOutSine}
      />
      <Rise t={t} t0={tApr} t1={out} dur={0.45} style={{left: 700, top: cy - 206}}>
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 36, lineHeight: 1.1, color: K.ink}}>aprox.</div>
      </Rise>
      <Head t={t} t0={tCien - 0.1} t1={out} cx={820} cy={cy} r={150} color={K.orange} label="100" ink={K.ink} size={118} dur={0.7} />
      <Rise t={t} t0={tAn} t1={out} dur={0.5} style={{left: 760, top: cy + 168}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 52, lineHeight: 1.1, color: K.ink}}>años</div>
      </Rise>
    </>
  );
};

/** Grupal o individual: la respuesta se queda con una sola palabra y el hilo la rodea. */
const Individual: React.FC<{tl: Timeline; t: number; seg: Seg; qT0: number}> = ({tl, t, seg, qT0}) => {
  const tUnic = mk(tl, 'unicamente', seg) ?? t0Of(seg) + 1.5;
  const tInd = mk(tl, 'individualA', seg) ?? tUnic + 0.9;
  const out = t1Of(seg) - 0.05;
  const size = 118;
  // "individual?" sube a la 1ª línea y pierde el signo
  const mv = prog(t, tUnic, 0.6, easeInOutCubic);
  const topInd = lerp(420 + size + 4, 520, mv);
  const sz = lerp(size, 138, mv);
  const qMark = 1 - prog(t, tUnic, 0.25, lin);
  return (
    <>
      <Rise t={t} t0={qT0} t1={tUnic - 0.05} dur={0.6} outDur={0.4} style={{left: 76, top: 420}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1, color: K.ink, letterSpacing: '-0.025em'}}>¿Grupal o</div>
      </Rise>
      <Rise t={t} t0={qT0 + 0.1} t1={out} dur={0.6} style={{left: 76, top: topInd}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: sz, lineHeight: 1, color: mv > 0.5 ? K.violet : K.ink, letterSpacing: '-0.025em', display: 'flex'}}>
          <span>individual</span>
          <span style={{opacity: qMark, width: qMark > 0 ? 'auto' : 0}}>?</span>
        </div>
      </Rise>
      <Label t={t} t0={tUnic + 0.4} t1={out} x={80} y={436} dot={K.orange}>ÚNICAMENTE</Label>
      <Thread
        t={t}
        id="thInd"
        d="M150 530 C 330 498, 640 496, 800 526 C 890 546, 886 640, 770 670 C 600 708, 280 708, 130 678 C 40 652, 40 566, 170 530 C 300 500, 520 494, 720 512"
        t0={tInd - 0.15}
        dur={0.9}
        t1={out - 0.05}
        outDur={0.4}
        w={13}
        color={K.orange}
      />
    </>
  );
};

// ---------------------------------------------------------------- CIERRE: Admisiones 2027 + WhatsApp
const Phone: React.FC = () => (
  <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
    {/* globo de chat (ícono duotono): trazo + detalle en naranja */}
    <path d="M23 5C13.6 5 6 11.6 6 19.7c0 4.3 2.1 8.1 5.5 10.8L10 39l8-3.3c1.6.4 3.3.6 5 .6 9.4 0 17-6.600 17-14.600S32.400 5 23 5z" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="16" cy="20.500" r="2.400" fill={K.orange} />
    <circle cx="23" cy="20.500" r="2.400" fill={K.orange} />
    <circle cx="30" cy="20.500" r="2.400" fill={K.orange} />
  </svg>
);

const Close: React.FC<{tl: Timeline; t: number; seg: Seg}> = ({tl, t, seg}) => {
  const tAdm = mk(tl, 'admisiones', seg) ?? t0Of(seg) + 1.5;
  const tDos = mk(tl, 'dosmil', seg) ?? tAdm + 0.7;
  const end = tl.totalFrames / 30;
  const tCta = t1Of(seg) + 0.02;
  const pill = prog(t, tCta, 0.55, easeInOutCubic);
  return (
    <>
      <Rise t={t} t0={tAdm} dur={0.65} style={{left: 76, top: 398}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 112, lineHeight: 1, color: K.ink, letterSpacing: '-0.03em'}}>Admisiones</div>
      </Rise>
      <Rise t={t} t0={tDos} dur={0.75} style={{left: 66, top: 508}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 250, lineHeight: 1, color: K.violet, letterSpacing: '-0.04em'}}>2027</div>
      </Rise>
      <Thread
        t={t}
        id="thClose"
        d="M84 768 C 300 784, 540 784, 720 764 C 800 754, 842 732, 824 718 C 806 706, 778 732, 812 756 C 850 782, 930 780, 1000 758"
        t0={tDos + 0.45}
        dur={0.9}
        w={14}
      />
      {/* llamado a la acción único */}
      <div
        style={{
          position: 'absolute',
          left: 105,
          top: 1370,
          width: 870,
          height: 96,
          borderRadius: 48,
          background: K.ink,
          clipPath: `inset(0 ${(1 - pill) * 100}% 0 0 round 48px)`,
          opacity: pill > 0.001 ? 1 : 0,
        }}
      >
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, fontFamily: FONT, fontWeight: 700, fontSize: 40, color: K.white, whiteSpace: 'nowrap'}}>
          <Phone />
          Consultanos por WhatsApp
        </div>
      </div>
      <Rise t={t} t0={tCta + 0.2} dur={0.6} style={{left: 0, width: W, top: 1480, textAlign: 'center'}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 74, lineHeight: 1, color: K.ink, letterSpacing: '-0.01em'}}>11 2781-5279</div>
      </Rise>
    </>
  );
};

// ---------------------------------------------------------------- orquestador de capas gráficas
export const Scenes: React.FC<{tl: Timeline; t: number}> = ({tl, t}) => {
  const segs = tl.segments;
  const first = segs[0];
  const close = segs.find((s) => s.kind === 'close')!;
  const tAdm = mk(tl, 'admisiones', close) ?? t0Of(close) + 1.5;
  const p = closeCam(t, tAdm).p; // avance de la transición al arco
  const inClose = t >= t0Of(close) - 0.05;
  const intro = segOf(tl, 'IN');
  const logoOutAt = intro ? t1Of(intro) - 0.15 : t1Of(first);
  const labelY = t < logoOutAt ? 372 : lerp(372, 292, easeInOutCubic(clamp((t - logoOutAt) / 0.5)));
  return (
    <>
      {/* velo blanco arriba: la pared de la sala se funde con el lienzo y queda aire para los titulares */}
      <div style={{position: 'absolute', inset: 0, opacity: 1 - p, background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0px, rgba(255,255,255,0.96) 520px, rgba(255,255,255,0) 960px)'}} />
      
      {segs.map((s) => {
        switch (s.kind) {
          case 'hook':
            return <HookA key={s.id} tl={tl} t={t} seg={s} />;
          case 'hookB': {
            return <Age key={s.id} tl={tl} t={t} seg={s} qT0={t0Of(s)} qOut={0} hook />;
          }
          case 'hookC':
            return <HookC key={s.id} tl={tl} t={t} seg={s} />;
          case 'intro':
            return <Intro key={s.id} tl={tl} t={t} seg={s} />;
          case 'list':
            return <List key={s.id} tl={tl} t={t} seg={s} />;
          case 'beatQ2': {
            const a2 = segOf(tl, 'A2');
            return a2 ? <Age key={s.id} tl={tl} t={t} seg={a2} qT0={t0Of(s) + 0.05} qOut={t0Of(a2) - 0.05} /> : null;
          }
          case 'beatQ3': {
            const a3 = segOf(tl, 'A3');
            return a3 ? <Individual key={s.id} tl={tl} t={t} seg={a3} qT0={t0Of(s) + 0.05} /> : null;
          }
          case 'close':
            return <Close key={s.id} tl={tl} t={t} seg={s} />;
          default:
            return null;
        }
      })}

      <Label t={t} t0={0.12} t1={tAdm - 0.1} x={80} y={labelY} dot={K.pink}>ADMISIONES 2027 · REHABILITACIÓN</Label>
      <Logo t={t} t0={first.kind === 'hook' ? 0.9 : 0.6} t1={logoOutAt} />
      <Logo t={t} t0={tAdm + 0.25} />
      <Subtitles tl={tl} t={t} dark={inClose && p > 0.6} fadeP={p} fadeBefore={tAdm} />
    </>
  );
};
