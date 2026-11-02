import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Ribbons} from '../Ribbons';
import {K} from '../charla/kit';
import {OUTRO_AT} from '../taller/data';
import {videoLayer} from './camera3';
import {EndCard, H, IconRow, KeyTrazo, Logo, NumList, Subs, Tag, Veils} from './scenes3';
import {easeOut, prog} from '../ui';

const fontCss = [300, 400, 500, 600, 700, 800, 900]
  .map((w) => `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}') format('woff2');}`)
  .join('\n');

const TAG = 'TALLER PARA PERSONAS MAYORES';

const NEEDS = [
  {n: '1', text: 'Concentrarte', t0: 2.75},
  {n: '2', text: 'Seguirle el ritmo', t0: 4.6},
  {n: '3', text: 'Moverte más', t0: 6.1},
  {n: '4', text: 'Conectar', t0: 8.3},
];
const AREAS = [
  {n: '1', text: 'Memoria', t0: 19.6},
  {n: '2', text: 'Atención', t0: 20.46},
  {n: '3', text: 'Movimiento', t0: 21.44},
  {n: '4', text: 'Alimentación saludable', t0: 22.58},
];
const SPACE = [
  {n: '1', text: 'Interactuar', t0: 32.28},
  {n: '2', text: 'Conversación', t0: 34.28},
  {n: '3', text: 'Temas en común', t0: 35.1},
  {n: '4', text: 'Miedos e inquietudes', t0: 37.78},
];
const WEEK = [
  {n: '1', text: 'Aprender', t0: 44.34},
  {n: '2', text: 'Cuidarte', t0: 45.24},
  {n: '3', text: 'Conectar', t0: 45.98},
];

export const Taller3: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const v = videoLayer(t);
  const live = t < OUTRO_AT + 0.8;

  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <style>{fontCss}</style>
      {live && (
        <>
          <div style={{position: 'absolute', left: 0, top: v.y0, width: 1080, height: v.h, overflow: 'hidden'}}>
            <OffthreadVideo
              src={staticFile('taller/lu_4k.mp4')}
              muted
              style={{position: 'absolute', left: 0, top: 0, width: 2160, height: 3840, transformOrigin: '0 0', transform: `translate(${v.tx}px, ${v.ty}px) scale(${v.s})`}}
            />
          </div>
          <Veils two={v.y0 > 0} />

          {/* labels + logo */}
          <Logo t={t} t0={0.1} t1={2.55} />
          <Logo t={t} t0={9.85} t1={16.1} />
          <Tag t={t} t0={0.25} t1={18.4} text={TAG} />
          <Tag t={t} t0={18.55} t1={24.0} text="VAMOS A TRABAJAR" />
          <Tag t={t} t0={24.9} t1={29.4} text={TAG} />
          <Tag t={t} t0={29.9} t1={39.0} text={TAG} />
          <Tag t={t} t0={39.5} t1={51.5} text={TAG} />

          {/* 1 · hook */}
          <H t={t} t0={0.04} t1={2.5} y={400} size={100} weight={300}>
            ¿Te olvidás
          </H>
          <H t={t} t0={0.3} t1={2.57} y={506} size={100} weight={900}>
            dónde dejaste
          </H>
          <H t={t} t0={0.66} t1={2.64} y={612} size={100} weight={900} color={K.violet}>
            las cosas?
          </H>
          <KeyTrazo t={t} t0={1.0} t1={2.5} top={704} w={360} id="a1" />

          {/* 2 · what she feels */}
          <NumList t={t} t1={9.3} items={NEEDS} y={404} step={90} size={62} head={50} />

          {/* 3 · the workshop */}
          <H t={t} t0={10.84} t1={16.0} y={400} size={78} weight={300}>
            Un taller para el
          </H>
          <H t={t} t0={12.1} t1={16.05} y={486} size={112} weight={900}>
            bienestar
          </H>
          <H t={t} t0={12.5} t1={16.1} y={598} size={112} weight={900} color={K.violet}>
            integral
          </H>
          <KeyTrazo t={t} t0={13.0} t1={16.0} top={712} w={400} id="a3" />
          <H t={t} t0={13.38} t1={16.0} y={830} size={52} weight={700}>
            de las personas mayores
          </H>

          {/* 4 · professionals */}
          <H t={t} t0={16.62} t1={18.4} y={400} size={112} weight={900}>
            Profesionales
          </H>
          <H t={t} t0={17.3} t1={18.45} y={522} size={64} weight={700} color={K.violet}>
            de diferentes áreas
          </H>
          <KeyTrazo t={t} t0={17.75} t1={18.4} top={606} w={340} id="a4" />

          {/* 5 · what we work on */}
          <NumList t={t} t1={24.0} items={AREAS} y={410} step={106} size={60} />

          {/* 6 · technology */}
          <H t={t} t0={25.38} t1={29.4} y={400} size={104} weight={900}>
            Herramientas
          </H>
          <H t={t} t0={25.88} t1={29.45} y={508} size={104} weight={900} color={K.violet}>
            tecnológicas
          </H>
          <KeyTrazo t={t} t0={26.4} t1={29.4} top={606} w={400} id="a6" />
          <IconRow t={t} t0={28.5} t1={29.4} y={716} kind="phone" text="Celular" />
          <IconRow t={t} t0={29.14} t1={29.45} y={828} kind="tablet" text="Tablet" />

          {/* 7 · the space they create */}
          <H t={t} t0={30.5} t1={39.0} y={400} size={108} weight={900}>
            Un{' '}
            <span style={{color: K.violet}}>espacio</span>
          </H>
          <NumList t={t} t1={38.95} items={SPACE} y={548} step={98} size={56} head={50} />

          {/* 8 · the question */}
          <H t={t} t0={40.2} t1={42.55} y={400} size={104} weight={300}>
            Contame
          </H>
          <H t={t} t0={40.84} t1={42.6} y={506} size={104} weight={900} color={K.violet}>
            la dinámica
          </H>
          <KeyTrazo t={t} t0={41.35} t1={42.5} top={608} w={380} id="a8" />

          {/* 9 · the answer */}
          <H t={t} t0={43.06} t1={47.2} y={400} size={104} weight={300}>
            Encuentros
          </H>
          <H t={t} t0={43.5} t1={47.25} y={506} size={104} weight={900} color={K.violet}>
            semanales
          </H>
          <KeyTrazo t={t} t0={44.0} t1={47.2} top={608} w={410} id="a9" />
          <NumList t={t} t1={47.15} items={WEEK} y={752} step={98} size={58} />

          {/* 10 · call to action */}
          <H t={t} t0={47.34} t1={48.4} y={400} size={84} weight={300}>
            Si te gustaría
          </H>
          <H t={t} t0={47.78} t1={48.45} y={494} size={112} weight={900} color={K.violet}>
            participar
          </H>
          <KeyTrazo t={t} t0={48.1} t1={48.4} top={606} w={360} id="a10" />
          <H t={t} t0={48.74} t1={51.5} y={400} size={96} weight={900}>
            Dejanos tu
          </H>
          <H t={t} t0={49.1} t1={51.55} y={500} size={96} weight={900} color={K.violet}>
            comentario
          </H>
          <H t={t} t0={49.94} t1={51.5} y={618} size={46} weight={500} ls="0">
            con la palabra
          </H>
          {t >= 50.3 && t < 51.6 && (
            <div
              style={{
                position: 'absolute',
                left: 80,
                top: 680,
                height: 92,
                padding: '0 44px',
                borderRadius: 46,
                background: K.orange,
                color: K.ink,
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 42,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                opacity: prog(t, 50.34, 0.35, easeOut) * (1 - prog(t, 51.35, 0.2, easeOut)),
                transform: `scale(${0.85 + 0.15 * prog(t, 50.34, 0.5, easeOut)})`,
                transformOrigin: '0 50%',
              }}
            >
              Comentá&nbsp;<span style={{fontWeight: 900}}>INFO</span>
            </div>
          )}
          <H t={t} t0={50.92} t1={51.5} y={796} size={46} weight={700} ls="0">
            y te contactaremos
          </H>

          <Subs t={t} />
        </>
      )}

      {/* transitions: the brand ribbons, only where the scene really changes */}
      <Ribbons t0={9.2} dur={1.0} mode="pass" dir="lr" palette={[K.violet, K.orange, K.violet, K.orange, K.violet]} />
      <Ribbons t0={28.95} dur={1.0} mode="pass" dir="rl" palette={[K.orange, K.violet, K.orange, K.violet, K.orange]} />
      <Ribbons t0={OUTRO_AT} dur={0.9} mode="cover" dir="lr" palette={[K.violet, K.orange, K.violet, K.orange, K.violet]} />
      <EndCard t={t} t0={OUTRO_AT + 0.75} />
    </AbsoluteFill>
  );
};
