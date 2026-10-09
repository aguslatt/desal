import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { fontFamily } from "../lib/fonts.ts";
import { Mark, type MarkVariant } from "./Mark.tsx";
import { TEXT_MAX_W, TEXT_FX, type TextStyleSpec } from "./style.ts";
import type { LineBox, TextExtent } from "./layout.ts";

/**
 * Bloque de texto en capa de pantalla ESTABLE: cada línea es un renglón absoluto (white-space: nowrap) en la posición exacta de su
 * `TextExtent`; el texto no se mueve mientras se lee. Solo anima:
 *  · ENTRADA: cada línea sube `rise` px y aparece (fundido + ascenso con curva de salida suave), con un desfase corto entre líneas;
 *  · ÉNFASIS puntual: el trazo a mano de cada palabra enfatizada se dibuja DESPUÉS de que la línea quedó quieta;
 *  · SALIDA (opcional, `exitAt` = fotograma local): fundido + leve ascenso, todas las líneas juntas.
 * `useCurrentFrame()` es LOCAL a la pieza (cada pieza es una Interactive con su propio `from`).
 */
type Props = {
  readonly extent: TextExtent;
  /** px de ascenso inicial de la entrada */
  readonly rise: number;
  /** palabras a enfatizar (cada una debe estar contenida en alguna línea) */
  readonly emphasis?: readonly string[];
  readonly variant?: MarkVariant;
  readonly accent?: string;
  /** fotograma local en que empieza la salida; null/undefined = sin salida (queda hasta el final) */
  readonly exitAt?: number | null;
  readonly seed?: number;
  readonly color: string;
  readonly style?: React.CSSProperties;
};

const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const INOUT = Easing.bezier(0.45, 0, 0.55, 1);

const lineStyle = (l: LineBox): TextStyleSpec => ({
  size: l.size,
  weight: l.weight,
  lineHeight: l.lineHeightPx / l.size,
  lineHeightPx: l.lineHeightPx,
  letterSpacing: l.letterSpacing,
  color: "",
});

const renderLine = (
  l: LineBox,
  emphasis: readonly string[],
  variant: MarkVariant,
  accent: string,
  progress: number,
  seed: number,
): React.ReactNode => {
  const words = emphasis.filter((w) => l.text.includes(w));
  if (words.length === 0) return l.text;
  const nodes: React.ReactNode[] = [];
  let rest = l.text;
  words.forEach((w, k) => {
    const at = rest.indexOf(w);
    if (at < 0) return;
    if (at > 0) nodes.push(rest.slice(0, at));
    nodes.push(
      <Mark key={`${w}-${k}`} variant={variant} color={accent} progress={progress} textStyle={lineStyle(l)} seed={seed + k * 17}>
        {w}
      </Mark>,
    );
    rest = rest.slice(at + w.length);
  });
  if (rest) nodes.push(rest);
  return nodes;
};

export const TextBlock: React.FC<Props> = ({ extent, rise, emphasis = [], variant = "underline", accent = "#000", exitAt = null, seed = 1, color, style }) => {
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
        const markP = interpolate(frame, [t0 + TEXT_FX.lineIn + TEXT_FX.markDelay, t0 + TEXT_FX.lineIn + TEXT_FX.markDelay + TEXT_FX.markDraw], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.33, 1, 0.68, 1),
        });
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
            {renderLine(l, emphasis, variant, accent, markP, seed + i * 31)}
          </div>
        );
      })}
    </div>
  );
};
