import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, easeIO, easeIn, easeOut, kf, lerp, prog} from './ui';
import {Cam, Captions, Card, Chip, Logo, M, PaletteBar, Rise, T1, TenBars, Trazo, useT} from './parts';
import {SPEECH_END, T, segIndex} from './timeline';

const W = 1080, H = 1920;
const span = (t: number, a: number, b: number) => t >= a && t < b;
const OUT_PHOTOS1 = T.photosOut + 0.45;

// ───────── cámara de la entrevista: rostros completos; cada corte cambia el encuadre ─────────
const speakerCam = (t: number) => {
  const punch = segIndex(t) % 2 ? 1.1 : 1.0;
  if (t < T.cut1) return {px: 0.54, py: 0.4, Y: 1150, z: kf(t, [[0, 1.25], [T.cut1, 1.34]], easeIO) * punch};
  const Y = kf(t, [[T.cut1, 1090], [T.emp - 0.3, 1090], [T.emp + 0.3, 640], [T.full2 + 0.9, 640], [T.si - 0.05, 900], [T.cta1 - 0.3, 900], [T.cta1, 740]], easeIO);
  const z = kf(t, [[T.cut1, 1.5], [T.emp - 0.3, 1.6], [T.emp + 0.3, 1.4], [T.full2 + 0.9, 1.4], [T.si, 1.5], [T.cta1 - 0.3, 1.66], [T.cta1, 1.8], [T.te, 1.92]], easeIO);
  return {px: 0.5, py: 0.47, Y, z: z * punch};
};

export const Video: React.FC = () => {
  const t = useT();
  const cam = speakerCam(t);

  // ── envolturas de transición ──
  const yTop = kf(t, [[T.cut1 - 0.5, 360], [T.cut1 - 0.06, 0], [T.cut1, 0], [T.cut1 + 0.55, H]], easeIO);
  const yBot = kf(t, [[T.cut1 - 0.5, 650], [T.cut1 - 0.06, H]], easeIO);
  const outroY = kf(t, [[T.outro, H], [T.outro + 0.6, 0]], easeIO);
  const o0 = T.outro + 0.5;

  // ── fotos: tarjetas que entran, se expanden y se componen ──
  // A (foto 5) y B (foto 1) en la primera secuencia
  const pA = prog(t, T.para, 0.55, easeOut);
  const pB = prog(t, T.para + 0.15, 0.55, easeOut);
  const expA = prog(t, T.jov, 0.65, easeIO);
  const colA = prog(t, T.ins, 0.65, easeIO);
  const out1 = prog(t, T.photosOut, 0.45, easeIn);
  const cardA = (() => {
    // posición inicial → pantalla completa → tarjeta de composición
    const x0 = lerp(1100, 690, pA), y0 = 770, w0 = 420, h0 = 560, r0 = 5;
    let x = lerp(x0, 0, expA), y = lerp(y0, 0, expA), w = lerp(w0, W, expA), h = lerp(h0, H, expA), rot = lerp(r0, 0, expA);
    x = lerp(x, -30, colA); y = lerp(y, 60, colA); w = lerp(w, 960, colA); h = lerp(h, 1010, colA); rot = lerp(rot, -3, colA);
    return {x, y: y - out1 * 2100, w, h, rot};
  })();
  const cardB = (() => {
    const bIn = prog(t, T.ins + 0.1, 0.65, easeIO);
    const showSmall = t < T.jov + 0.3;
    if (showSmall) return {x: lerp(-540, -70, pB), y: 1020, w: 460, h: 310, rot: -4};
    return {x: lerp(1100, 180, bIn), y: 880 - out1 * 2100, w: 900, h: 650, rot: 2.5};
  })();
  const photos1 = span(t, T.para, OUT_PHOTOS1);

  // organigrama (actividad de empresas)
  const empIn = prog(t, T.emp, 0.6, easeOut);
  const fullO = prog(t, T.full2, 0.6, easeIO);
  const orgCard = {
    x: lerp(lerp(110, 110, empIn), 20, fullO),
    y: lerp(lerp(1950, 930, empIn), 560, fullO),
    w: lerp(860, 1040, fullO), h: lerp(860, 1040, fullO) * (892 / 1800),
    rot: lerp(lerp(8, 1.5, empIn), 0, fullO),
  };

  // fotos 3 y 2 (red, acompañamiento, empleo con apoyo)
  const reveal3 = prog(t, T.red, 0.6, easeIO);
  const shrink3 = prog(t, T.aco, 0.65, easeIO);
  const in2 = prog(t, T.aco + 0.1, 0.65, easeIO);
  const exp2 = prog(t, T.fom, 0.7, easeIO);
  const out2 = prog(t, T.photos2Out, 0.4, easeIn);
  const card3 = {
    x: lerp(0, -40, shrink3), y: lerp(0, 70, shrink3), w: lerp(W, 1000, shrink3), h: lerp(H, 1000, shrink3), rot: lerp(0, -3, shrink3),
  };
  const card2 = (() => {
    let x = lerp(1150, 150, in2), y = lerp(1900, 900, in2), w = 940, h = 980, rot = lerp(6, 3, in2);
    x = lerp(x, 0, exp2); y = lerp(y, 0, exp2); w = lerp(w, W, exp2); h = lerp(h, H, exp2); rot = lerp(rot, 0, exp2);
    return {x: x - out2 * 1300, y, w, h, rot};
  })();
  const photos2 = span(t, T.red, T.photos2Out + 0.45);

  const logoOn = !(span(t, T.callout - 0.05, T.calloutEnd + 0.4) || span(t, T.para + 0.35, OUT_PHOTOS1) || span(t, T.full2, T.photos2Out + 0.4) || t > SPEECH_END - 0.5);

  return (
    <AbsoluteFill style={{background: C.white, fontFamily: FONT}}>
      {/* ── entrevista a pantalla completa ── */}
      <Cam m={M.speaker} w={W} h={H} px={cam.px} py={cam.py} Y={cam.Y} z={cam.z} />

      {/* ── 1 · EL DATO: tarjeta, barras y chip sobre Andy ── */}
      {t < T.cut1 + 0.7 && (
        <>
          <div style={{position: 'absolute', left: -40, top: 360, width: 800, height: 330, transform: `translateX(${(1 - prog(t, -0.05, 0.55, easeOut)) * -900}px) rotate(-2.5deg)`, background: C.yellow, boxShadow: '0 22px 50px rgba(0,0,0,0.18)', opacity: t < T.cut1 - 0.45 ? 1 : 0}}>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 100, gap: 30}}>
              <Rise p={prog(t, 0.1, 0.5)}><T1 size={280} ls={-0.05}>1</T1></Rise>
              <Rise p={prog(t, 0.2, 0.5)}><T1 size={64} weight={700} ls={-0.01}>{'de\ncada'}</T1></Rise>
              <Rise p={prog(t, 0.3, 0.5)}><T1 size={280} ls={-0.05}>10</T1></Rise>
            </div>
          </div>
          <div style={{opacity: t < T.cut1 - 0.45 ? 1 : 0}}>
            <TenBars x={500} y={560} p={prog(t, 0.5, 1.1, easeOut)} boost={prog(t, T.trab, 0.5, easeOut)} />
          </div>
          <Chip x={330} y={790} text="trabajo registrado" size={64} bg={C.pink} color={C.white} weight={800} rot={3} p={prog(t, T.trab + 0.1, 0.45, easeOut)} out={prog(t, T.cut1 - 0.55, 0.3, easeIn)} from="right" />
          <Chip x={30} y={282} text="ANDY" size={34} bg={C.yellow} weight={800} rot={-2} p={prog(t, 0.5, 0.35, easeOut)} out={prog(t, 3.2, 0.3, easeIn)} />
          <div style={{position: 'absolute', left: 0, top: yTop, width: W, height: Math.max(0, yBot - yTop), background: C.yellow, display: t >= T.cut1 - 0.5 ? 'block' : 'none'}} />
        </>
      )}

      {/* ── 2 · PROGRAMA: logo y nombre del programa, palabra por palabra ── */}
      <Chip x={30} y={282} text="VICTORIA PRIMITERRA" size={34} bg={C.yellow} weight={800} rot={-2} p={prog(t, T.cut1 + 0.35, 0.35, easeOut)} out={prog(t, T.calloutEnd + 0.3, 0.3, easeIn)} />
      <div style={{position: 'absolute', left: 40, top: 340, width: 640, height: 300, background: C.white, boxShadow: '0 24px 50px rgba(0,0,0,0.2)', transform: `translateX(${(1 - prog(t, T.callout, 0.5, easeOut)) * -760 + prog(t, T.calloutEnd, 0.45, easeIn) * -760}px)`, display: span(t, T.callout - 0.05, T.calloutEnd + 0.5) ? 'block' : 'none'}}>
        <Logo x={40} y={20} w={560} />
      </div>
      <Chip x={40} y={360} text="Programa" size={88} bg={C.yellow} rot={-2} p={prog(t, T.prog, 0.45, easeOut)} out={prog(t, T.para - 0.1, 0.3, easeIn)} />
      <Chip x={170} y={470} text="formación" size={88} bg={C.orange} weight={400} rot={1.5} p={prog(t, T.form, 0.45, easeOut)} out={prog(t, T.para - 0.05, 0.3, easeIn)} from="right" />
      <Chip x={60} y={580} text="sociolaboral" size={92} bg={C.green} rot={-1.5} p={prog(t, T.socio, 0.45, easeOut)} out={prog(t, T.para, 0.3, easeIn)} />
      <Chip x={50} y={700} text="y vida independiente" size={62} bg={C.pink} color={C.white} weight={800} rot={1.5} p={prog(t, T.vida, 0.45, easeOut)} out={prog(t, T.para + 0.05, 0.3, easeIn)} from="right" />

      {/* ── 3 · JÓVENES Y ADULTOS: tarjetas que se expanden y se componen ── */}
      {photos1 && (
        <>
          {t < T.jov + 0.4 && t >= T.para && (
            <Card {...cardB}><Cam m={M.f1} w={cardB.w} h={cardB.h} px={0.42} py={0.5} z={1.0} /></Card>
          )}
          {t >= T.ins + 0.1 && (
            <Card {...cardB}><Cam m={M.f1} w={cardB.w} h={cardB.h} px={kf(t, [[T.ins, 0.38], [T.ins + 2, 0.5]], easeIO)} py={0.5} z={1.0} /></Card>
          )}
          <Card {...cardA} shadow={expA < 0.99 || colA > 0.01}>
            <Cam m={M.f5} w={cardA.w} h={cardA.h} px={kf(t, [[T.para, 0.5], [T.ins, 0.6]], easeIO)} py={0.55} z={kf(t, [[T.para, 1.0], [T.ins + 1, 1.12]], easeIO)} />
          </Card>
          <Chip x={40} y={340} text="jóvenes y adultos" size={78} bg={C.yellow} rot={-2.5} p={prog(t, T.jov + 0.3, 0.45, easeOut)} out={prog(t, T.ins - 0.1, 0.3, easeIn)} />
          <Chip x={90} y={845} text="mundo laboral" size={92} bg={C.orange} rot={-2} p={prog(t, T.ins + 0.5, 0.45, easeOut)} out={prog(t, T.photosOut - 0.05, 0.3, easeIn)} from="right" />
        </>
      )}

      {/* ── 4 · EMPRESAS: la actividad entra sobre la entrevista y luego ocupa el cuadro ── */}
      <Chip x={50} y={385} text="capacitamos" size={100} bg={C.orange} rot={-2} p={prog(t, T.capa, 0.45, easeOut)} out={prog(t, T.emp - 0.05, 0.3, easeIn)} />
      {span(t, T.emp, T.red + 0.4) && (
        <>
          <div style={{position: 'absolute', inset: 0, background: C.white, opacity: fullO}} />
          <Card x={orgCard.x} y={orgCard.y} w={orgCard.w} h={orgCard.h} rot={orgCard.rot}><Cam m={M.org} w={orgCard.w} h={orgCard.h} px={0.5} py={0.5} z={1} /></Card>
          <Chip x={30} y={lerp(870, 440, fullO)} text="empresas" size={96} bg={C.green} rot={-3} p={prog(t, T.emp + 0.25, 0.45, easeOut)} />
        </>
      )}

      {/* ── 5 · RED, ACOMPAÑAMIENTO, EMPLEO CON APOYO ── */}
      {photos2 && (
        <>
          <Card {...card3} shadow={shrink3 > 0.02} clip={`inset(${(1 - reveal3) * 100}% 0 0 0)`}>
            <Cam m={M.f3} w={card3.w} h={card3.h} px={0.5} py={kf(t, [[T.red, 0.52], [T.aco, 0.56]], easeIO)} z={kf(t, [[T.red, 1.0], [T.aco + 1, 1.12]], easeIO)} />
          </Card>
          {t >= T.aco + 0.05 && (
            <Card {...card2} shadow={exp2 < 0.98}>
              <Cam m={M.f2} w={card2.w} h={card2.h} px={0.45} py={kf(t, [[T.aco, 0.42], [T.fom + 1.5, 0.48]], easeIO)} z={kf(t, [[T.aco, 1.0], [T.fom + 2, 1.1]], easeIO)} />
            </Card>
          )}
          <Chip x={40} y={340} text="red de" size={104} bg={C.pink} color={C.white} rot={-3} p={prog(t, T.redChip, 0.45, easeOut)} out={prog(t, T.aco - 0.1, 0.3, easeIn)} />
          <Chip x={140} y={470} text="contención" size={104} bg={C.pink} color={C.white} rot={2} p={prog(t, T.redChip + 0.12, 0.45, easeOut)} out={prog(t, T.aco - 0.05, 0.3, easeIn)} from="right" />
          <Chip x={30} y={930} text="acompañamiento" size={88} bg={C.yellow} rot={-2.5} p={prog(t, T.aco + 0.3, 0.45, easeOut)} out={prog(t, T.fom - 0.05, 0.3, easeIn)} />
          <Chip x={500} y={350} text="empleo" size={112} bg={C.orange} rot={3} p={prog(t, T.empleoChip, 0.45, easeOut)} out={prog(t, T.photos2Out - 0.1, 0.3, easeIn)} from="right" />
          <Chip x={430} y={490} text="con apoyo" size={100} bg={C.orange} weight={500} rot={-2} p={prog(t, T.empleoChip + 0.12, 0.45, easeOut)} out={prog(t, T.photos2Out - 0.05, 0.3, easeIn)} from="right" />
        </>
      )}

      {/* ── 7 · LLAMADO: lo que dicen, en dos chips escalonados ── */}
      <Chip x={30} y={1050} text="Comentá acá abajo" size={64} bg={C.yellow} rot={-2} p={prog(t, T.cta1, 0.45, easeOut)} out={prog(t, T.te - 0.5, 0.3, easeIn)} />
      <Chip x={60} y={1175} text="Escribinos por mensaje privado" size={50} bg={C.green} weight={800} rot={1.5} p={prog(t, T.cta2, 0.45, easeOut)} out={prog(t, T.te - 0.45, 0.3, easeIn)} from="right" />

      {/* ── 8 · TE ESPERAMOS ── */}
      <Chip x={40} y={1070} text="Te esperamos." size={118} bg={C.pink} color={C.white} rot={-2} p={prog(t, T.te, 0.4, easeOut)} />

      {/* ── identidad ── */}
      {logoOn && <Logo x={440} y={262} w={200} opacity={prog(t, 0.0, 0.3)} />}

      <Captions />

      {/* ── 9 · CIERRE sobre blanco ── */}
      {t >= T.outro - 0.05 && (
        <AbsoluteFill style={{background: C.white, transform: `translateY(${outroY}px)`}}>
          <PaletteBar p={prog(t, o0, 0.7, easeIO)} />
          <div style={{opacity: prog(t, o0, 0.5), transform: `translateY(${(1 - prog(t, o0, 0.7)) * 30}px)`}}>
            <Logo x={190} y={300} w={700} />
          </div>
          <Trazo x={190} y={720} w={700} p={prog(t, o0 + 0.35, 0.9, easeIO)} />
          <div style={{position: 'absolute', left: -40, top: 930, width: 1160, height: 430, background: C.orange, transform: `translateX(${(1 - prog(t, o0 + 0.25, 0.55, easeOut)) * 1200}px) rotate(-2deg)`, boxShadow: '0 24px 50px rgba(0,0,0,0.16)'}}>
            <div style={{position: 'absolute', left: 120, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
              <div>
                <Rise p={prog(t, o0 + 0.55, 0.5)}><T1 size={78} weight={300}>Programa de</T1></Rise>
                <Rise p={prog(t, o0 + 0.65, 0.5)}><T1 size={78}>Inclusión</T1></Rise>
                <Rise p={prog(t, o0 + 0.75, 0.5)}><T1 size={78}>Sociolaboral y</T1></Rise>
                <Rise p={prog(t, o0 + 0.85, 0.5)}><T1 size={78}>Vida Independiente</T1></Rise>
              </div>
            </div>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 1420, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 38, letterSpacing: '0.06em', color: '#626161', opacity: prog(t, o0 + 1.2, 0.5)}}>
            EQUIPOADIP.COM.AR · @EQUIPOADIP
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
