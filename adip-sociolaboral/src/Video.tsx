import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, easeIO, easeIn, easeOut, kf, lerp, prog} from './ui';
import {Band, Box, Cam, Captions, Curtain, Logo, M, NameTag, PaletteBar, Rise, T1, Trazo, useT} from './parts';
import {T} from './timeline';

const W = 1080, H = 1920;
const full = (t: number, a: number, b: number) => t >= a && t < b;

// ───────── cámara de la entrevista (siempre rostros completos) ─────────
const speakerCam = (t: number) => {
  if (t < 5.98) return {px: 0.54, py: 0.4, Y: 1150, z: kf(t, [[0, 1.25], [5.98, 1.36]], easeIO), clip: 0};
  if (t < T.split) return {px: 0.5, py: 0.47, Y: 930, z: kf(t, [[5.98, 1.5], [T.split, 1.66]], easeIO), clip: 0};
  if (t < T.full2 + 0.7) {
    const k = prog(t, T.split, 0.6, easeIO);
    return {px: 0.5, py: 0.47, Y: lerp(930, 520, k), z: lerp(1.66, 1.22, k), clip: lerp(0, 100 - (920 / H) * 100, k)};
  }
  if (t < T.s7) return {px: 0.5, py: 0.47, Y: 900, z: kf(t, [[T.s6, 1.55], [T.s7, 1.7]], easeIO), clip: 0};
  if (t < T.s8) return {px: 0.5, py: 0.47, Y: 720, z: kf(t, [[T.s7, 1.82], [T.s8, 1.95]], easeIO), clip: 0};
  return {px: 0.5, py: 0.47, Y: 740, z: kf(t, [[T.s8, 1.7], [T.wipe2, 1.78]], easeIO), clip: 0};
};

// ───────── pila de dos fotos grandes (arriba / abajo) ─────────
const TwoPhotos: React.FC<{
  a: typeof M.f5; b: typeof M.f1; t0: number; tSplit: number; tGrow: number; // tGrow: A recupera todo el cuadro (si !bExpands) o B ocupa todo (bExpands)
  bExpands?: boolean; pa: [number, number]; pb: [number, number]; aWipe?: number;
}> = ({a, b, tSplit, tGrow, bExpands, pa, pb, t0, aWipe}) => {
  const t = useT();
  const sp = prog(t, tSplit, 0.65, easeIO);
  const HA = bExpands ? lerp(H, 960, sp) : kf(t, [[tSplit, H], [tSplit + 0.65, 960], [tGrow, 960], [tGrow + 0.65, H]], easeIO);
  const bIn = prog(t, tSplit + 0.12, 0.65, easeIO);
  const by = bExpands ? kf(t, [[tGrow, 960], [tGrow + 0.7, 0]], easeIO) : 960;
  const bh = bExpands ? kf(t, [[tGrow, 960], [tGrow + 0.7, H]], easeIO) : 960;
  const z = (s: number, e: number) => kf(t, [[t0, s], [t0 + 8, e]], easeIO);
  const clipA = aWipe !== undefined ? `inset(0 ${(1 - prog(t, aWipe, 0.55, easeIO)) * 100}% 0 0)` : undefined;
  return (
    <>
      {t > tSplit + 0.1 && (
        <Box x={lerp(W, 0, bIn)} y={by} w={W} h={bh}>
          <Cam m={b} w={W} h={bh} px={kf(t, [[tSplit, pb[0]], [tSplit + 5, pb[1]]], easeIO)} py={bExpands ? kf(t, [[tGrow, 0.36], [tGrow + 1.5, 0.43]], easeIO) : 0.5} Y={bExpands ? bh * 0.42 : bh * 0.4} z={bExpands ? kf(t, [[tGrow, 1.0], [tGrow + 2, 1.08]], easeIO) : z(1.0, 1.1)} />
        </Box>
      )}
      <Box x={0} y={0} w={W} h={HA} clip={clipA}>
        <Cam m={a} w={W} h={HA} px={kf(t, [[t0, pa[0]], [t0 + 7, pa[1]]], easeIO)} py={0.55} Y={HA * 0.5} z={z(1.0, 1.12)} />
      </Box>
    </>
  );
};

// ───────── composición ─────────
export const Video: React.FC = () => {
  const t = useT();
  const cam = speakerCam(t);
  const speakerHidden = full(t, T.s3 + 0.5, T.s4 - 0.05) || full(t, T.full2 + 0.7, T.s6 - 0.02);
  const logoOn = !(full(t, T.programa - 0.05, T.s3 + 0.2) || full(t, T.s3 + 0.5, T.s4) || full(t, T.split - 0.05, T.full2 + 0.5) || full(t, T.s5 - 0.3, T.s5) || full(t, T.s5, T.s6) || t > T.wipe2 - 0.1) && !full(t, 7.1, 8.6);
  const logoFade = 1 - prog(t, T.s3 - 0.2, 0.2);

  // — tamaños de pantalla dividida / panel de empresas
  const panelY = kf(t, [[T.split, H], [T.split + 0.6, 920], [T.full2, 920], [T.full2 + 0.65, 0]], easeIO);
  const kfull = prog(t, T.full2, 0.65, easeIO);
  const chartW = lerp(920, 1000, kfull), chartH = (chartW * 892) / 1800;

  // — banda amarilla del dato que se expande y deja entrar a Victoria
  const yTop = kf(t, [[5.5, 390], [5.95, 0], [6.0, 0], [6.55, H]], easeIO);
  const yBot = kf(t, [[5.5, 690], [5.95, H]], easeIO);
  // — banda naranja del programa que se expande y deja entrar a las fotos
  const oTop = kf(t, [[T.s3, 300], [T.s3 + 0.4, 0], [T.s3 + 0.45, 0], [T.s3 + 0.95, H]], easeIO);
  const oBot = kf(t, [[T.s3, 590], [T.s3 + 0.4, H]], easeIO);
  // — banda fucsia de cierre
  const fTop = kf(t, [[T.wipe2, 1040], [T.wipe2 + 0.4, 0]], easeIO);
  const fBot = kf(t, [[T.wipe2, 1250], [T.wipe2 + 0.4, H]], easeIO);
  const outroY = kf(t, [[T.outro, H], [T.outro + 0.6, 0]], easeIO);
  const o0 = T.outro + 0.5;

  return (
    <AbsoluteFill style={{background: C.white, fontFamily: FONT}}>
      {/* ── entrevista a pantalla completa ── */}
      {!speakerHidden && (
        <Box x={0} y={0} w={W} h={H} clip={cam.clip ? `inset(0 0 ${cam.clip}% 0)` : undefined}>
          <Cam m={M.speaker} w={W} h={H} px={cam.px} py={cam.py} Y={cam.Y} z={cam.z} />
        </Box>
      )}

      {/* ── 1 · EL DATO: bandas de color sobre Andy ── */}
      {t < 6.6 && (
        <>
          <Band y={390} h={300} color={C.yellow} p={prog(t, -0.05, 0.45, easeOut)} q={0}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36, opacity: 1 - prog(t, 5.3, 0.2)}}>
              <Rise p={prog(t, 0.05, 0.5)}><T1 size={290} ls={-0.05}>1</T1></Rise>
              <Rise p={prog(t, 0.15, 0.5)}><T1 size={64} weight={700} ls={-0.01}>{'de\ncada'}</T1></Rise>
              <Rise p={prog(t, 0.25, 0.5)}><T1 size={290} ls={-0.05}>10</T1></Rise>
            </div>
          </Band>
          <Band y={690} h={104} color={C.pink} p={prog(t, 4.45, 0.4, easeOut)} q={prog(t, 5.25, 0.25, easeIn)} from="right">
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 80}}>
              <Rise p={prog(t, 4.6, 0.4)}><T1 size={66} color={C.white} ls={-0.02}>trabajo registrado</T1></Rise>
            </div>
          </Band>
          <div style={{position: 'absolute', left: 0, top: yTop, width: W, height: Math.max(0, yBot - yTop), background: C.yellow, display: t >= 5.5 ? 'block' : 'none'}} />
        </>
      )}

      {/* ── 2 · PROGRAMA: logo, banda naranja con palabras ── */}
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 600, background: C.white, transform: `translateY(${-(1 - prog(t, T.callout, 0.5, easeIO) + prog(t, T.calloutEnd, 0.45, easeIn)) * 600}px)`, display: full(t, T.callout - 0.05, T.calloutEnd + 0.5) ? 'block' : 'none'}}>
        <Logo x={230} y={250} w={620} />
      </div>
      <Band y={300} h={290} color={C.orange} p={prog(t, T.programa, 0.45, easeOut)} q={prog(t, T.s3 - 0.1, 0.01)}>
        <div style={{position: 'absolute', left: 80, top: 0, bottom: 0, width: 920, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <div style={{position: 'absolute', top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
            <Rise p={prog(t, T.programa, 0.4)} out={prog(t, T.w1 - 0.05, 0.28, easeIn)}><T1 size={120} weight={900}>Programa</T1></Rise>
          </div>
          <div style={{position: 'absolute', top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
            <Rise p={prog(t, T.w1, 0.4)} out={prog(t, T.w2 - 0.05, 0.28, easeIn)}><T1 size={120} weight={300}>formación</T1></Rise>
          </div>
          <div style={{position: 'absolute', top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
            <Rise p={prog(t, T.w2, 0.4)} out={prog(t, T.w3 - 0.05, 0.28, easeIn)}><T1 size={120} weight={900}>sociolaboral</T1></Rise>
          </div>
          <div style={{position: 'absolute', top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
            <div>
              <Rise p={prog(t, T.w3, 0.4)} out={prog(t, T.s3 - 0.12, 0.2, easeIn)}><T1 size={84} weight={300}>y vida</T1></Rise>
              <Rise p={prog(t, T.w3 + 0.1, 0.4)} out={prog(t, T.s3 - 0.12, 0.2, easeIn)}><T1 size={96} weight={900}>independiente</T1></Rise>
            </div>
          </div>
        </div>
      </Band>
      <div style={{position: 'absolute', left: 0, top: oTop, width: W, height: Math.max(0, oBot - oTop), background: C.orange, display: t >= T.s3 && t < T.s3 + 1 ? 'block' : 'none'}} />

      {/* ── 3 · JÓVENES Y ADULTOS: foto a pantalla completa → dos fotos grandes → vuelve a una ── */}
      {full(t, T.s3 + 0.35, T.s4) && (
        <>
          <TwoPhotos a={M.f5} b={M.f1} t0={T.s3 + 0.35} tSplit={T.jov} tGrow={T.grow} pa={[0.5, 0.6]} pb={[0.38, 0.55]} />
          <Band y={900} h={124} color={C.yellow} p={prog(t, T.jov + 0.5, 0.4, easeOut)} q={prog(t, T.grow - 0.25, 0.25, easeIn)}>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 80}}>
              <Rise p={prog(t, T.jov + 0.6, 0.4)} out={prog(t, T.grow - 0.3, 0.2, easeIn)}><T1 size={80}>jóvenes y adultos</T1></Rise>
            </div>
          </Band>
        </>
      )}

      {/* ── 4 · EMPRESAS: pantalla dividida (voz arriba / actividad abajo) → la actividad ocupa todo ── */}
      {full(t, T.split, T.s5 + 0.6) && (
        <Box x={0} y={panelY} w={W} h={H} style={{background: C.white}}>
          <Band y={lerp(0, 400, kfull)} h={150} color={C.green} p={prog(t, T.split + 0.45, 0.4, easeOut)}>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 80}}>
              <Rise p={prog(t, T.split + 0.6, 0.45)}><T1 size={108}>empresas</T1></Rise>
            </div>
          </Band>
          <Box x={(W - chartW) / 2} y={lerp(170, 580, kfull)} w={chartW} h={chartH} clip={`inset(0 ${(1 - prog(t, T.split + 0.55, 0.55, easeIO)) * 100}% 0 0)`}>
            <Cam m={M.org} w={chartW} h={chartH} px={0.5} py={0.5} z={1} />
          </Box>
        </Box>
      )}

      {/* ── 5 · RED, ACOMPAÑAMIENTO, EMPLEO CON APOYO ── */}
      {full(t, T.s5, T.s6) && (
        <>
          <TwoPhotos a={M.f3} b={M.f2} t0={T.s5} tSplit={T.aco} tGrow={T.empleo} bExpands pa={[0.5, 0.5]} pb={[0.45, 0.46]} aWipe={T.s5} />
          <Band y={330} h={270} color={C.pink} p={prog(t, T.red, 0.4, easeOut)} q={prog(t, T.aco - 0.12, 0.25, easeIn)}>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 80}}>
              <div>
                <Rise p={prog(t, T.red + 0.1, 0.4)}><T1 size={96} color={C.white}>{'red de'}</T1></Rise>
                <Rise p={prog(t, T.red + 0.2, 0.4)}><T1 size={96} color={C.white}>{'contención'}</T1></Rise>
              </div>
            </div>
          </Band>
          <Band y={900} h={124} color={C.yellow} p={prog(t, T.aco + 0.25, 0.4, easeOut)} q={prog(t, T.empleo - 0.1, 0.25, easeIn)}>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 80}}>
              <Rise p={prog(t, T.aco + 0.35, 0.4)} out={prog(t, T.empleo - 0.15, 0.2, easeIn)}><T1 size={84}>acompañamiento</T1></Rise>
            </div>
          </Band>
          <Band y={330} h={250} color={C.orange} p={prog(t, T.empleo + 0.6, 0.4, easeOut)} q={prog(t, 29.4, 0.25, easeIn)} from="right">
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 80}}>
              <div>
                <Rise p={prog(t, T.empleo + 0.7, 0.4)}><T1 size={88}>{'empleo'}</T1></Rise>
                <Rise p={prog(t, T.empleo + 0.8, 0.4)}><T1 size={88} weight={600}>{'con apoyo'}</T1></Rise>
              </div>
            </div>
          </Band>
        </>
      )}

      {/* ── 7 · LLAMADO: lo que dicen, en dos bandas ── */}
      <Band y={1040} h={120} color={C.yellow} p={prog(t, T.comentar, 0.4, easeOut)} q={prog(t, T.s8 - 0.02, 0.25, easeIn)}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 80}}>
          <Rise p={prog(t, T.comentar + 0.08, 0.4)}><T1 size={60}>Comentá acá abajo</T1></Rise>
        </div>
      </Band>
      <Band y={1160} h={120} color={C.green} p={prog(t, T.escribir, 0.4, easeOut)} q={prog(t, T.s8 - 0.02, 0.25, easeIn)} from="right">
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 80}}>
          <Rise p={prog(t, T.escribir + 0.08, 0.4)}><T1 size={50}>Escribinos por mensaje privado</T1></Rise>
        </div>
      </Band>

      {/* ── 8 · TE ESPERAMOS ── */}
      <Band y={1040} h={220} color={C.pink} p={prog(t, T.te, 0.4, easeOut)} q={prog(t, T.wipe2 + 0.35, 0.01)}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 80, gap: 28}}>
          <Rise p={prog(t, T.te + 0.05, 0.4)}><T1 size={124} weight={300} color={C.white}>Te</T1></Rise>
          <Rise p={prog(t, T.te + 0.2, 0.45)}><T1 size={124} color={C.white}>esperamos.</T1></Rise>
        </div>
      </Band>
      {t >= T.wipe2 && t < T.outro + 0.1 && (
        <div style={{position: 'absolute', left: 0, top: fTop, width: W, height: Math.max(0, fBot - fTop), background: C.pink}} />
      )}

      {/* ── identidad: logo y nombres ── */}
      {logoOn && <Logo x={440} y={262} w={200} opacity={prog(t, 0.0, 0.3) * logoFade} />}
      <NameTag text="Andy" p={prog(t, 0.5, 0.3) * (1 - prog(t, 3.2, 0.25))} />
      <div style={{position: 'absolute', top: 118}}>
        <NameTag text="Victoria Primiterra" p={prog(t, 6.6, 0.3) * (1 - prog(t, 7.1, 0.01))} />
      </div>

      <Curtain color={C.green} t0={T.s4 - 0.3} />
      <Curtain color={C.orange} t0={T.s6 - 0.3} />

      {/* ── subtítulos (en la división de pantalla suben sobre la hablante) ── */}
      {t < T.wipe2 - 0.05 && !(t >= T.te) && <Captions bottom={full(t, T.split + 0.4, T.full2) ? H - 900 : 380} />}

      {/* ── 9 · CIERRE sobre blanco ── */}
      {t >= T.outro - 0.05 && (
        <AbsoluteFill style={{background: C.white, transform: `translateY(${outroY}px)`}}>
          <PaletteBar p={prog(t, o0, 0.7, easeIO)} />
          <div style={{opacity: prog(t, o0, 0.5), transform: `translateY(${(1 - prog(t, o0, 0.7)) * 30}px)`}}>
            <Logo x={190} y={300} w={700} />
          </div>
          <Trazo x={190} y={720} w={700} p={prog(t, o0 + 0.35, 0.9, easeIO)} />
          <Band y={930} h={430} color={C.orange} p={prog(t, o0 + 0.25, 0.5, easeOut)}>
            <div style={{position: 'absolute', left: 80, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
              <div>
                <Rise p={prog(t, o0 + 0.55, 0.5)}><T1 size={78} weight={300}>Programa de</T1></Rise>
                <Rise p={prog(t, o0 + 0.65, 0.5)}><T1 size={78}>Inclusión</T1></Rise>
                <Rise p={prog(t, o0 + 0.75, 0.5)}><T1 size={78}>Sociolaboral y</T1></Rise>
                <Rise p={prog(t, o0 + 0.85, 0.5)}><T1 size={78}>Vida Independiente</T1></Rise>
              </div>
            </div>
          </Band>
          <div style={{position: 'absolute', left: 0, right: 0, top: 1400, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 38, letterSpacing: '0.06em', color: '#626161', opacity: prog(t, o0 + 1.2, 0.5)}}>
            EQUIPOADIP.COM.AR · @EQUIPOADIP
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
