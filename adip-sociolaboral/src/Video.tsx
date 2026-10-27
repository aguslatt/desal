import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, easeBack, easeIO, easeIn, easeOut, kf, lerp, prog} from './ui';
import {Block, Captions, Head, Logo, M, Media, PaletteBar, Pill, Rise, Trazo, Win, WinStroke, useT} from './parts';
import {OUTRO, SPEECH_END, T} from './timeline';

// geometría compartida
const SP = {x: 260, y: 830, w: 560, h: 480}; // ventana del/de la hablante
const CARD = {x: 0, y: 240, w: 1080, h: 1440}; // zona 3:4 del manual
const HEAD_ORIGIN = {x: 153, y: 760};

type R = {x: number; y: number; w: number; h: number; rt: number};
const mixR = (a: R, b: R, k: number): R => ({
  x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k), rt: lerp(a.rt, b.rt, k),
});
const rSP: R = {...SP, rt: 280};
const rSmall: R = {x: 80, y: 930, w: 400, h: 400, rt: 200};
const rSmall2: R = {x: 80, y: 960, w: 440, h: 380, rt: 220};
const rFull: R = {x: 0, y: 0, w: 1080, h: 1920, rt: 0};
const rCta: R = {x: 260, y: 420, w: 560, h: 640, rt: 280};
const rCard: R = {...CARD, rt: 0};

// ───────────────────────── ESCENA 1 · el dato ─────────────────────────
const Scene1: React.FC = () => {
  const t = useT();
  const heads = Array.from({length: 10}, (_, i) => i);
  const D = 64, GAP = 22, X0 = (1080 - (10 * D + 9 * GAP)) / 2;
  const pulse = kf(t, [[4.4, 1], [4.7, 1.32], [5.1, 1.12]], easeOut);
  const paleFade = 1 - prog(t, 4.6, 0.6) * 0.55;
  const num = (txt: string, t0: number) => (
    <Rise p={prog(t, t0, 0.55)} style={{lineHeight: 0.86}}>
      <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 330, letterSpacing: '-0.04em', color: C.black}}>{txt}</span>
    </Rise>
  );
  return (
    <AbsoluteFill style={{background: C.gray}}>
      <PaletteBar p={prog(t, 0, 0.7, easeIO)} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 392, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34}}>
        {num('1', -0.35)}
        <Rise p={prog(t, -0.25, 0.5)} style={{lineHeight: 1.06}}>
          <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 58, textAlign: 'left', color: C.black}}>
            de
            <br />
            cada
          </div>
        </Rise>
        {num('10', -0.2)}
      </div>
      {heads.map((i) => {
        const s = prog(t, 0.45 + 0.07 * i, 0.4, easeBack);
        const first = i === 0;
        return (
          <Head key={i} cx={X0 + D / 2 + i * (D + GAP)} cy={HEAD_ORIGIN.y} d={D} s={s * (first ? pulse : 1)}
            color={first ? C.orange : 'rgba(0,0,0,0.13)'} opacity={first ? 1 : paleFade} />
        );
      })}
      <Win {...SP} y={840} h={470} rt={280} reveal={prog(t, -0.2, 0.6, easeIO)}>
        {(w, h) => <Media m={M.speaker} w={w} h={h} fx={0.54} fy={0.5} z={kf(t, [[0, 1.45], [6, 1.62]], easeIO)} />}
      </Win>
      <WinStroke x={SP.x} y={840} w={SP.w} h={470} rt={280} p={prog(t, -0.2, 0.6, easeIO)} color={C.black} />
      <Pill x={236} y={1282} text="Andy" dot={C.orange} p={prog(t, 0.55, 0.35) * (1 - prog(t, 3.1, 0.3))} />
      <Logo file="logo_adip_color" x={440} y={262} w={200} opacity={prog(t, 0.0, 0.3)} />
    </AbsoluteFill>
  );
};

// ───────────────────────── ESCENAS 2 → 8 ─────────────────────────
const Main: React.FC = () => {
  const t = useT();

  // — rect de la ventana de la persona que habla
  let sp: R = rSP;
  if (t >= 33.42) sp = mixR(rFull, rCta, prog(t, T.s7, 0.6, easeIO));
  else if (t >= T.s6 - 0.4) sp = rFull;
  else if (t >= T.emp - 0.1) sp = mixR(rSP, rSmall2, prog(t, T.emp - 0.1, 0.6, easeIO));
  else if (t >= T.s3 - 0.0 && t < T.back) sp = mixR(rSP, rSmall, prog(t, T.s3, 0.6, easeIO));
  const speakerVisible = !(t > 14.2 && t < 16.6) && !(t > 24.9 && t < 29.5);
  const who = {fx: 0.5, fy: 0.48, z: 2.1};
  const full = t >= T.s6 - 0.4 && t < T.s7;
  const zoom = full ? kf(t, [[T.s6, 1.55], [T.s7, 1.7]], easeIO) : t >= T.s7 ? kf(t, [[T.s7, 1.7], [T.s7 + 0.6, 2.0]], easeIO) : who.z;
  const fy = full ? 0.52 : who.fy;

  // — logo persistente (vuela al centro cuando se dice "Equipo ADIP")
  const call = prog(t, T.callout, 0.55, easeIO) * (1 - prog(t, T.calloutEnd, 0.55, easeIO));
  const lx = lerp(440, 270, call), ly = lerp(262, 420, call), lw = lerp(200, 540, call);
  const onPhoto = (prog(t, 13.6, 0.3) * (1 - prog(t, 17.0, 0.3))) + (prog(t, 24.1, 0.3) * (1 - prog(t, 29.5, 0.2)));

  return (
    <AbsoluteFill style={{background: C.tintOrange}}>
      {/* S2: trazo que abre la escena y cabeza grande del programa */}
      <Trazo x={80} y={470} w={620} p={prog(t, 6.15, 1.0, easeIO)} q={prog(t, T.callout - 0.1, 0.4, easeIn)} color={C.orange} sw={16} />
      <Head cx={920} cy={500} d={560} color={C.orange} s={prog(t, T.programa - 0.15, 0.6, easeBack) * (1 - prog(t, T.s3 - 0.05, 0.35, easeIn))} />
      <Pill x={80} y={405} text="Programa" bg={C.black} color={C.white} p={prog(t, T.programa, 0.4) * (1 - prog(t, T.w1 - 0.05, 0.2))} />
      <div style={{position: 'absolute', left: 80, top: 440, width: 920}}>
        <Rise p={prog(t, T.w1, 0.45)} out={prog(t, T.w2 - 0.05, 0.3, easeIn)} style={{height: 150}}>
          <span style={{fontFamily: FONT, fontWeight: 300, fontSize: 112, letterSpacing: '-0.03em', lineHeight: 1.1}}>Formación</span>
        </Rise>
        <div style={{position: 'absolute', top: 0, left: 0}}>
          <Rise p={prog(t, T.w2, 0.45)} out={prog(t, T.w3 - 0.05, 0.3, easeIn)} style={{height: 150}}>
            <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 112, letterSpacing: '-0.035em', lineHeight: 1.1}}>sociolaboral</span>
          </Rise>
          <Trazo x={0} y={126} w={420} p={prog(t, T.w2 + 0.25, 0.6, easeIO)} color={C.black} sw={13} opacity={1 - prog(t, T.w3 - 0.05, 0.15)} />
        </div>
        <div style={{position: 'absolute', top: 0, left: 0}}>
          <Rise p={prog(t, T.w3, 0.45)} out={prog(t, T.s3 - 0.05, 0.3, easeIn)} style={{height: 125}}>
            <span style={{fontFamily: FONT, fontWeight: 300, fontSize: 104, letterSpacing: '-0.03em', lineHeight: 1.1}}>y vida</span>
          </Rise>
          <Rise p={prog(t, T.w3 + 0.12, 0.45)} out={prog(t, T.s3 - 0.05, 0.3, easeIn)} style={{height: 140}}>
            <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 104, letterSpacing: '-0.035em', lineHeight: 1.1}}>independiente</span>
          </Rise>
        </div>
      </div>

      {/* S3: dos ventanas (hablante + actividad) */}
      <WinStroke x={80} y={400} w={920} h={480} rt={120} p={prog(t, T.s3 + 0.05, 0.5, easeIO)} color={C.black} opacity={1 - prog(t, 13.8, 0.2)} />
      <Win x={80} y={400} w={920} h={480} rt={120} reveal={prog(t, T.s3 + 0.4, 0.55, easeIO)} opacity={t < 14.1 && t > T.s3 ? 1 : 0}>
        {(w, h) => <Media m={M.f1} w={w} h={h} fx={kf(t, [[T.s3, 0.5], [14, 0.4]], easeIO)} fy={0.5} z={kf(t, [[T.s3, 1.0], [14, 1.14]], easeIO)} />}
      </Win>
      <Head cx={760} cy={1130} d={300} color={C.orange} s={prog(t, T.s3 + 0.45, 0.5, easeBack) * (1 - prog(t, T.jov, 0.01))} />
      <Trazo x={520} y={1020} w={400} p={prog(t, T.s3 + 0.6, 0.7, easeIO)} q={prog(t, T.jov - 0.2, 0.2, easeIn)} color={C.black} sw={13} opacity={prog(t, 13.2, 0.01, easeIn) < 1 ? 1 : 0} />

      {/* ventana del hablante (por debajo de las fotos) */}
      {speakerVisible && (
        <>
          <WinStroke x={sp.x} y={sp.y} w={sp.w} h={sp.h} rt={sp.rt} p={prog(t, 6.2, 0.6, easeIO)} color={C.black} opacity={full ? 0 : t > T.s8 + 0.9 ? 0 : 1} />
          <Win x={sp.x} y={sp.y} w={sp.w} h={sp.h} rt={sp.rt} opacity={1}>
            {(w, h) => <Media m={M.speaker} w={w} h={h} fx={full ? 0.5 : who.fx} fy={fy} z={zoom} />}
          </Win>
        </>
      )}

      {/* S3 → card de la foto 5 (la cabeza se vuelve ventana) */}
      {t >= T.jov && t < 17.7 && (() => {
        const k = prog(t, T.jov, 0.75, easeIO);
        const back = prog(t, T.back, 0.65, easeIO);
        const r0: R = {x: 610, y: 980, w: 300, h: 300, rt: 150};
        let r = mixR(r0, rCard, k);
        if (back > 0) r = mixR(rCard, {...rSP, rt: 280}, back);
        const fade = 1 - prog(t, T.back + 0.6, 0.12);
        return (
          <Win x={r.x} y={r.y} w={r.w} h={r.h} rt={r.rt} opacity={fade}>
            {(w, h) => (
              <>
                <div style={{position: 'absolute', inset: 0, background: C.orange}} />
                <div style={{opacity: prog(t, T.jov + 0.25, 0.4)}}>
                  <Media m={M.f5} w={w} h={h} fx={kf(t, [[T.jov, 0.5], [T.back, 0.58]], easeIO)} fy={kf(t, [[T.jov, 0.5], [T.back, 0.62]], easeIO)} z={kf(t, [[T.jov, 1.0], [T.back, 1.16]], easeIO)} />
                </div>
              </>
            )}
          </Win>
        );
      })()}

      {/* S4: capacitamos */}
      {t > 17.7 && t < 19.5 && (
        <div style={{position: 'absolute', left: 80, top: 430}}>
          <Rise p={prog(t, 18.45, 0.5)} out={prog(t, T.emp - 0.12, 0.25, easeIn)} style={{height: 150}}>
            <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 112, letterSpacing: '-0.035em', lineHeight: 1.1}}>Capacitamos</span>
          </Rise>
          <Trazo x={0} y={118} w={440} p={prog(t, 18.75, 0.6, easeIO)} color={C.orange} sw={13} opacity={1 - prog(t, T.emp - 0.12, 0.2)} />
        </div>
      )}

      {/* S4: empresas — organigrama (segunda ventana, dos áreas máximo) */}
      {t >= T.emp - 0.1 && t < 24.9 && (
        <>
          <WinStroke x={80} y={400} w={920} h={456} rt={110} p={prog(t, T.emp, 0.5, easeIO)} color={C.black} opacity={1 - prog(t, 24.0, 0.1)} />
          <Win x={80} y={400} w={920} h={456} rt={110} reveal={prog(t, T.emp + 0.35, 0.5, easeIO)}>
            {(w, h) => <Media m={M.org} w={w} h={h} fx={0.5} fy={kf(t, [[T.emp, 0.3], [T.s5, 0.7]], easeIO)} z={1.0} />}
          </Win>
          <Block x={548} y={1040} text="empresas" size={74} p={prog(t, T.emp + 0.2, 0.5, easeBack)} />
          <Trazo x={560} y={1170} w={400} p={prog(t, T.emp + 0.6, 0.8, easeIO)} color={C.black} sw={13} />
        </>
      )}

      {/* S5: red, acompañamiento, empleo con apoyo — secuencia editorial de fotos */}
      {t >= T.s5 && t < 30.1 && (() => {
        const open = prog(t, T.s5, 0.8, easeIO);
        const split = prog(t, T.aco - 0.1, 0.65, easeIO); // foto 3 se pliega en arco, entra foto 2
        const grow = prog(t, T.empleo - 0.05, 0.75, easeIO); // foto 2 ocupa la pantalla
        const exit = prog(t, 29.62, 0.4, easeIn);
        const L: R = {x: 80, y: 430, w: 440, h: 660, rt: 220};
        const Rr: R = {x: 560, y: 530, w: 440, h: 660, rt: 220};
        const r3 = mixR(rCard, L, split);
        const r2 = mixR(Rr, rCard, grow);
        return (
          <div style={{position: 'absolute', inset: 0, transform: `translateY(${-exit * 1920}px)`}}>
            <Win x={r3.x} y={r3.y} w={r3.w} h={r3.h} rt={r3.rt} circle={t < T.aco ? lerp(0, 1800, open) : undefined} opacity={grow > 0.3 ? 0 : 1}>
              {(w, h) => <Media m={M.f3} w={w} h={h} fx={0.5} fy={lerp(0.5, 0.58, split)} z={kf(t, [[T.s5, 1.0], [T.aco, 1.1], [T.aco + 0.7, 1.3]], easeIO)} />}
            </Win>
            {t >= T.aco - 0.1 && (
              <Win x={r2.x} y={r2.y} w={r2.w} h={r2.h} rt={r2.rt} reveal={prog(t, T.aco, 0.6, easeIO)}>
                {(w, h) => <Media m={M.f2} w={w} h={h} fx={kf(t, [[T.aco, 0.42], [T.empleo + 0.9, 0.5]], easeIO)} fy={kf(t, [[T.aco, 0.36], [T.empleo, 0.4], [29.6, 0.62]], easeIO)} z={kf(t, [[T.aco, 1.15], [T.empleo + 0.7, 1.0], [29.6, 1.12]], easeIO)} />}
              </Win>
            )}
            <Block x={80} y={410} text={'red de\ncontención'} size={80} p={prog(t, 25.0, 0.5, easeBack) * (1 - prog(t, T.aco - 0.15, 0.2))} />
            <Head cx={955} cy={520} d={150} color={C.orange} s={prog(t, T.aco + 0.2, 0.5, easeBack) * (1 - grow)} />
            <Block x={80} y={1215} text="acompañamiento" size={74} p={prog(t, T.aco + 0.1, 0.5, easeBack) * (1 - prog(t, T.empleo - 0.1, 0.2))} />
            <Block x={560} y={410} text={'empleo\ncon apoyo'} size={70} p={prog(t, T.empleo + 0.45, 0.5, easeBack)} />
          </div>
        );
      })()}

      {/* S7: llamado a la acción tomado de lo que dicen */}
      <Head cx={850} cy={1010} d={400} color={C.orange} s={prog(t, T.s7 + 0.2, 0.6, easeBack) * (1 - prog(t, T.s8 + 0.1, 0.3, easeIn))} />
      {t >= T.s7 && (
        <>
          <WinStroke x={rCta.x} y={rCta.y} w={rCta.w} h={rCta.h} rt={280} p={prog(t, T.s7 + 0.3, 0.5, easeIO)} color={C.black} opacity={t < T.s8 + 0.9 ? 1 : 0} />
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 1150, display: 'flex', justifyContent: 'center',
            opacity: prog(t, T.comentar, 0.3) * (1 - prog(t, T.s8 - 0.05, 0.2)), transform: `translateY(${(1 - prog(t, T.comentar, 0.4, easeOut)) * 30}px)`,
          }}>
            <div style={{background: C.black, color: C.white, borderRadius: 999, padding: '26px 52px 30px', fontFamily: FONT, fontWeight: 700, fontSize: 40, whiteSpace: 'nowrap', position: 'relative', height: 40 + 56, minWidth: 560, textAlign: 'center'}}>
              <span style={{position: 'absolute', left: 0, right: 0, top: 26, opacity: 1 - prog(t, T.escribir - 0.08, 0.15)}}>Comentá acá abajo</span>
              <span style={{position: 'absolute', left: 0, right: 0, top: 26, opacity: prog(t, T.escribir, 0.2)}}>Escribinos por privado</span>
            </div>
          </div>
        </>
      )}

      {/* S8: Te esperamos. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1130, display: 'flex', justifyContent: 'center', gap: 22, alignItems: 'baseline'}}>
        <Rise p={prog(t, T.te, 0.4)} style={{height: 150}}>
          <span style={{fontFamily: FONT, fontWeight: 300, fontSize: 116, letterSpacing: '-0.03em', lineHeight: 1.12}}>Te</span>
        </Rise>
        <Rise p={prog(t, T.te + 0.18, 0.45)} style={{height: 150}}>
          <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 116, letterSpacing: '-0.04em', lineHeight: 1.12}}>esperamos.</span>
        </Rise>
      </div>
      <Trazo x={300} y={1265} w={480} p={prog(t, T.te + 0.3, 0.6, easeIO)} color={C.orange} sw={15} />

      {/* nombres */}
      <Pill x={236} y={1282} text="Victoria Primiterra" dot={C.orange} p={prog(t, 6.45, 0.35) * (1 - prog(t, 8.8, 0.3))} />

      {/* logo (principal sobre tinte; pastilla blanca cuando va sobre foto) */}
      <div style={{position: 'absolute', left: 400, top: 238, width: 280, height: 140, borderRadius: 70, background: C.white, opacity: onPhoto}} />
      <Logo file="logo_adip_color" x={lx} y={ly} w={lw} opacity={prog(t, 6.2, 0.3)} />
    </AbsoluteFill>
  );
};

// ───────────────────────── CIERRE ─────────────────────────
const Outro: React.FC = () => {
  const t = useT();
  const t0 = T.outro;
  const line = (s: string, i: number) => (
    <Rise key={s} p={prog(t, t0 + 0.55 + i * 0.12, 0.5)}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 68, letterSpacing: '-0.025em', lineHeight: 1.1, color: C.white, textAlign: 'center'}}>{s}</div>
    </Rise>
  );
  return (
    <AbsoluteFill style={{background: 'transparent'}}>
      <PaletteBar p={prog(t, t0 + 0.1, 0.8, easeIO)} />
      <div style={{opacity: prog(t, t0 + 0.1, 0.5), transform: `scale(${lerp(0.94, 1, prog(t, t0 + 0.1, 0.9))})`, position: 'absolute', inset: 0}}>
        <Logo file="logo_adip_negativo" x={220} y={470} w={640} />
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 900}}>
        {['Programa de Inclusión', 'Sociolaboral y', 'Vida Independiente'].map(line)}
      </div>
      <Trazo x={190} y={1190} w={700} p={prog(t, t0 + 1.0, 0.9, easeIO)} color="gradient" sw={15} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1420, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 34, letterSpacing: '0.08em', color: C.gray, opacity: prog(t, t0 + 1.5, 0.5)}}>
        EQUIPOADIP.COM.AR · @EQUIPOADIP
      </div>
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => {
  const t = useT();
  const orange = prog(t, T.wipe1, 0.55, easeIO);
  const tint = prog(t, T.wipe1 + 0.5, 0.75, easeIO);
  const black = prog(t, T.wipe2, 0.65, easeIO);
  return (
    <AbsoluteFill style={{background: C.gray, fontFamily: FONT}}>
      {t < T.wipe1 + 1.3 && <Scene1 />}
      {t >= T.wipe1 && t < T.wipe1 + 0.9 && (
        <AbsoluteFill style={{background: C.orange, clipPath: `circle(${lerp(32, 1600, orange)}px at ${HEAD_ORIGIN.x}px ${HEAD_ORIGIN.y}px)`}} />
      )}
      {t >= T.wipe1 + 0.5 && (
        <AbsoluteFill style={{clipPath: tint < 1 ? `circle(${lerp(0, 1600, tint)}px at ${HEAD_ORIGIN.x}px ${HEAD_ORIGIN.y}px)` : undefined}}>
          <Main />
        </AbsoluteFill>
      )}
      {t >= T.wipe2 && (
        <AbsoluteFill style={{background: C.black, clipPath: black < 1 ? `circle(${lerp(0, 1700, black)}px at 540px 740px)` : undefined}} />
      )}
      {t >= T.outro - 0.1 && <Outro />}
      {t < T.wipe2 + 0.2 && <Captions />}
    </AbsoluteFill>
  );
};
