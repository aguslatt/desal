import type React from "react";
import { Interactive, type InteractivitySchema, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../../config/brand.ts";
import { TEXT_ZONES } from "../../config/layout.ts";
import { TURN } from "../../config/script.ts";
import "../../lib/fonts.ts";
import { ENTER, EXIT } from "./spans.ts";
import { TextPiece, type LineSpec } from "./TextPiece.tsx";
import { TYPE, stackBaselines } from "./typography.ts";

/**
 * S3 · FRASE en dos momentos (80 px bold, centrada, franja superior TEXT_ZONES.big):
 *   part="first"  → «Podés empezar / por ahí.»        entra en TURN_TIMING.firstIn
 *   part="second" → «Por no saber / cómo empezar.»    entra en TURN_TIMING.secondIn, DEBAJO de la primera
 * Las dos salen juntas desde TURN_TIMING.exitFrom (EXIT.turn f). El bloque completo (4 líneas) cabe en y 230–650.
 * Énfasis sutil en «empezar» y «ahí» (primera oración): marcador de crayón naranja dibujado a mano DETRÁS de la
 * parte baja de la palabra; el texto sigue oscuro. Ambas piezas usan las MISMAS líneas base (se calculan del bloque completo).
 */
type Props = {
  readonly part: "first" | "second";
  readonly marks?: boolean;
  readonly style?: React.CSSProperties;
};

const Inner: React.FC<Props> = ({ part, marks = true, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fontSize = typeof style?.fontSize === "number" ? style.fontSize : TYPE.turn.size;
  const color = typeof style?.color === "string" ? style.color : COLORS.ink;
  const k = fontSize / TYPE.turn.size;
  const { baselines } = stackBaselines({
    n: 4,
    fontSize,
    step: TYPE.turn.step * k,
    gapAfter: [0, TYPE.turn.pairGap * k, 0],
    zone: TEXT_ZONES.big,
  });
  const first = part === "first";
  const texts = first ? TURN.firstLines : TURN.secondLines;
  const off = first ? 0 : 2;
  const lines: LineSpec[] = texts.map((text, i) => ({
    text,
    baseline: baselines[off + i],
    delay: i * 5,
    mark:
      marks && first
        ? i === 0
          ? { word: "empezar", kind: "highlight", from: 16, to: 38, seed: 5, opacity: 0.8 }
          : { word: "ahí", kind: "highlight", from: 28, to: 46, seed: 9, opacity: 0.8 }
        : null,
  }));
  return (
    <TextPiece
      lines={lines}
      fontSize={fontSize}
      weight={TYPE.turn.weight}
      color={color}
      frame={frame}
      duration={durationInFrames}
      inLen={ENTER.turn}
      rise={16}
      outLen={EXIT.turn}
      outRise={10}
      style={style}
    />
  );
};

const schema = {
  "style.fontSize": { type: "number", default: TYPE.turn.size, min: 40, max: 120, step: 1, description: "Tamaño del texto", hiddenFromList: false },
  "style.color": { type: "color", default: COLORS.ink, description: "Color del texto" },
  marks: { type: "boolean", default: true, description: "Marcador de crayón en «empezar» y «ahí»" },
} as const satisfies InteractivitySchema;

export const TurnPhrase = Interactive.withSchema({
  Component: Inner,
  componentName: "<TurnPhrase>",
  schema,
  wrapInSequence: true,
});
