import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { fontFamily } from "../lib/fonts.ts";
import { TEXT_MAX_W, TEXT_FX } from "./style.ts";
import type { TextExtent } from "./layout.ts";

/**
 * Bloque de texto en capa de pantalla ESTABLE: cada línea es un renglón absoluto (white-space: nowrap) en la posición exacta de su
 * `TextExtent`; el texto no se mueve mientras se lee. Solo anima:
 *  · ENTRADA: cada línea sube `rise` px y aparece (fundido + ascenso con curva de salida suave), con un desfase corto entre líneas;
 *  · SALIDA (opcional, `exitAt` = fotograma local): fundido + leve ascenso, todas las líneas juntas.
 * Sin énfasis a mano (v3): la jerarquía sale del tamaño, el peso y los cortes de línea, como en los titulares del manual de ADIP.
 * `useCurrentFrame()` es LOCAL a la pieza (cada pieza es una Interactive con su propio `from`).
 */
type Props = {
  readonly extent: TextExtent;
  /** px de ascenso inicial de la entrada */
  readonly rise: number;
  /** fotograma local en que empieza la salida; null/undefined = sin salida (queda hasta el final) */
  readonly exitAt?: number | null;
  readonly color: string;
  readonly style?: React.CSSProperties;
};

const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const INOUT = Easing.bezier(0.45, 0, 0.55, 1);

export const TextBlock: React.FC<Props> = ({ extent, rise, exitAt = null, color, style }) => {
  const frame = useCurrentFrame();
  const exit =
    exitAt === null
      ? 0
      : interpolate(frame, [exitAt, exitAt + TEXT_FX.exit], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: INOUT });

  return (
    <div
      data-text={extent.id}
      style={{ position: "absolute", left: extent.x, top: extent.y, width: TEXT_MAX_W, height: extent.h, color, fontFamily, ...style }}
    >
      {extent.lines.map((l, i) => {
        const t0 = i * TEXT_FX.lineStagger;
        const enter = interpolate(frame, [t0, t0 + TEXT_FX.lineIn], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: OUT });
        return (
          <div
            key={`${extent.id}-${i}`}
            style={{
              position: "absolute",
              left: 0,
              top: l.y - extent.y,
              height: l.h,
              whiteSpace: "nowrap",
              fontSize: l.size,
              fontWeight: l.weight,
              lineHeight: `${l.lineHeightPx}px`,
              letterSpacing: `${l.letterSpacing}px`,
              textAlign: "left",
              opacity: enter * (1 - exit),
              translate: `0px ${(1 - enter) * rise - exit * TEXT_FX.exitRise}px`,
            }}
          >
            {l.text}
          </div>
        );
      })}
    </div>
  );
};
