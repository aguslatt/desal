import type React from "react";
import { AbsoluteFill, Interactive, type InteractivitySchema } from "remotion";
import { COLORS } from "../config/brand.ts";
import { H, THREAD, W } from "../config/layout.ts";
import { THREAD_FROM } from "../config/timeline.ts";
import { getFinalCursorAnchor } from "../lib/cursorAnchor.ts";
import { useAbsFrame } from "../lib/scene.ts";
import { glintStops, shadowAlpha, threadShape } from "../components/thread/geometry.ts";
import { ThreadStroke } from "../components/thread/ThreadStroke.tsx";
import { useThreadFonts } from "../components/thread/useThreadFonts.ts";
import "../lib/fonts.ts";

/**
 * Hilo gráfico — el recurso conductor (capa transparente 1080×1920 ENCIMA de las escenas, f 404 → fin).
 * El cursor naranja que titila al final del 3.er mensaje (idéntico al de la escena 2 en CURSOR_HANDOFF)
 * se acuesta y se extiende hasta ser una línea de THREAD.thickness px que acompaña las escenas 3–5
 * por los carriles THREAD.lanes y llega al cierre: se recoge hacia el centro y queda como un trazo corto
 * sobre el logo, estático hasta el último fotograma. Siempre separada de las letras: las escenas dejan
 * libre ±THREAD.clearance px alrededor de cada carril. Ver src/components/thread/geometry.ts.
 */
type Props = {
  readonly color?: string;
  readonly thickness?: number;
  readonly style?: React.CSSProperties;
};

const Inner: React.FC<Props> = ({ color = COLORS.orange, thickness = THREAD.thickness, style }) => {
  const frame = useAbsFrame(THREAD_FROM);
  const fontsReady = useThreadFonts();
  const anchor = fontsReady ? getFinalCursorAnchor() : null;
  const shape = anchor ? threadShape(frame, anchor, thickness) : null;

  return (
    <AbsoluteFill style={{ width: W, height: H, ...style }}>
      {shape ? <ThreadStroke shape={shape} color={color} glint={glintStops(frame, color)} shadow={shadowAlpha(frame)} /> : null}
    </AbsoluteFill>
  );
};

const schema = {
  color: {
    type: "color",
    default: COLORS.orange,
    description: "Color del hilo",
  },
  thickness: {
    type: "number",
    default: THREAD.thickness,
    min: 3,
    max: 12,
    step: 0.5,
    hiddenFromList: false,
    description: "Grosor del hilo (px)",
  },
} as const satisfies InteractivitySchema;

export const ThreadLine = Interactive.withSchema({
  Component: Inner,
  componentName: "<ThreadLine>",
  schema,
  wrapInSequence: true,
});
