import type React from "react";
import { CrayonCurve, clamp01, easeInOut } from "../../illustration/index.ts";
import { BRANCHES } from "./branches.ts";
import { getThread, type ThreadDef } from "./path.ts";
import { threadAt, WIDTH_THIN, type ThreadState } from "./state.ts";

/** Semilla de la «mano» del crayón (grosor irregular y grano): una sola para todo el hilo. */
export const THREAD_SEED = 7;

/** Número de tramos con que se afina el trazo (cada uno un poco más fino; se solapan, así no se nota el escalón). */
const TAPER_STEPS = 8;

/**
 * El hilo principal. Es UNA curva; cuando llega a acompañar al logo se afina (WIDTH_THIN) de forma gradual: se dibuja en
 * tramos de la MISMA curva (mismas coordenadas y mismo ruido de arco: no hay costura) con anchos decrecientes.
 */
const MainThread: React.FC<{ def: ThreadDef; st: ThreadState }> = ({ def, st }) => {
  const points = def.anchors.map((a) => a.p);
  const { s0, s1 } = def.taper;
  const L = def.length;
  if (s1 <= s0 || st.progress * L <= s0) return <CrayonCurve points={points} progress={st.progress} from={st.from} width={st.width} seed={THREAD_SEED} endWidth={1} />;
  const segs: React.ReactNode[] = [];
  // tramo de ancho pleno, hasta el inicio del afinado (se extiende un poco bajo el siguiente)
  segs.push(<CrayonCurve key="full" points={points} progress={Math.min(st.progress, (s0 + (s1 - s0) / TAPER_STEPS) / L)} from={st.from} width={st.width} seed={THREAD_SEED} endWidth={1} />);
  for (let k = 0; k < TAPER_STEPS; k++) {
    const a = s0 + ((s1 - s0) * k) / TAPER_STEPS;
    const b = k === TAPER_STEPS - 1 ? L : s0 + ((s1 - s0) * (k + 1.4)) / TAPER_STEPS;
    if (st.progress * L <= a) break;
    const w = st.width + (WIDTH_THIN - st.width) * ((k + 1) / TAPER_STEPS);
    segs.push(<CrayonCurve key={k} points={points} from={Math.max(st.from, a / L)} progress={Math.min(st.progress, b / L)} width={w} seed={THREAD_SEED} startWidth={1} endWidth={0.5} />);
  }
  return <>{segs}</>;
};

/**
 * El hilo en el MUNDO: la curva principal (continua, de crayón naranja, dibujada progresivamente; ./path.ts parte A y ./extension.ts
 * S4–S6) más las ramas (./branches.ts: el abrazo a la amiga, los dos aleros). Va DEBAJO de las personas y del celular (el hilo está
 * sobre el papel; las figuras están delante), dentro del contenedor de la cámara.
 */
export const ThreadLayer: React.FC<{ frame: number }> = ({ frame }) => {
  const def = getThread();
  const st = threadAt(frame, def);
  return (
    <>
      {BRANCHES.map((b) => {
        const t = easeInOut(clamp01((frame - b.from) / (b.to - b.from)));
        return t > 0 ? <CrayonCurve key={b.id} points={b.points} progress={t} width={b.width} color={b.color} shade={b.shade} seed={b.seed} startWidth={b.startWidth} endWidth={b.endWidth} /> : null;
      })}
      {st.alive && st.progress > 0 ? <MainThread def={def} st={st} /> : null}
    </>
  );
};
