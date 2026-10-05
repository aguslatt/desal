import type React from "react";
import { CrayonCurve } from "../../illustration/index.ts";
import { getThread } from "./path.ts";
import { threadAt } from "./state.ts";

/** Semilla de la «mano» del crayón (grosor irregular y grano): una sola para todo el hilo. */
export const THREAD_SEED = 7;

/**
 * El hilo en el MUNDO: una sola curva continua de crayón naranja dibujada progresivamente. Va DEBAJO de las personas y del
 * celular (el hilo está sobre el papel; las figuras están delante), dentro del contenedor de la cámara.
 * Punto de extensión: las anclas del hilo están en ./path.ts (parte A) y ./extension.ts (S4–S6, WORLD-B).
 */
export const ThreadLayer: React.FC<{ frame: number }> = ({ frame }) => {
  const def = getThread();
  const st = threadAt(frame, def);
  if (!st.alive || st.progress <= 0) return null;
  return <CrayonCurve points={def.anchors.map((a) => a.p)} progress={st.progress} from={st.from} width={st.width} seed={THREAD_SEED} />;
};
