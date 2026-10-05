import type React from "react";
import { Interactive, type InteractivitySchema, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../../config/brand.ts";
import { TEXT_ZONES } from "../../config/layout.ts";
import { COMPANION_UNITS } from "../../config/script.ts";
import "../../lib/fonts.ts";
import { ENTER, EXIT } from "./spans.ts";
import { TextPiece, type LineSpec } from "./TextPiece.tsx";
import { TYPE, stackBaselines } from "./typography.ts";

/**
 * S5 · FIRMA por unidades de sentido (COMPANION_UNITS; ventanas de SIGNATURE_TIMING.units): una pieza por unidad, máx. 2 líneas
 * simultáneas (60 px semibold), centradas en la franja superior TEXT_ZONES.message. Fundido corto entre unidades, SIN superposición
 * (cada unidad entra en `from` y termina de salir en `to`). Énfasis moderado en «escucharte», «acompañarte» y «a tu ritmo»:
 * marcador de crayón naranja dibujado a mano DETRÁS (el texto no se pinta de naranja).
 */
type Props = {
  /** índice de la unidad en COMPANION_UNITS */
  readonly unit: number;
  readonly marks?: boolean;
  readonly style?: React.CSSProperties;
};

/** Cuándo se dibuja el marcador de cada unidad (fotogramas LOCALES): después de que el texto ya se lee. */
const MARK_AT = [
  { from: 28, to: 48 },
  { from: 12, to: 30 },
  { from: 10, to: 28 },
] as const;

const Inner: React.FC<Props> = ({ unit, marks = true, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fontSize = typeof style?.fontSize === "number" ? style.fontSize : TYPE.signature.size;
  const color = typeof style?.color === "string" ? style.color : COLORS.ink;
  const u = COMPANION_UNITS[unit] ?? COMPANION_UNITS[0];
  const at = MARK_AT[unit] ?? MARK_AT[0];
  const word = u.emphasis[0];
  const last = u.lines[u.lines.length - 1];
  const { baselines } = stackBaselines({
    n: u.lines.length,
    fontSize,
    step: (TYPE.signature.step * fontSize) / TYPE.signature.size,
    zone: TEXT_ZONES.message,
    lastDescender: /[gjpqyç]/.test(last),
  });
  const lines: LineSpec[] = u.lines.map((text, i) => ({
    text,
    baseline: baselines[i],
    delay: i * 3,
    mark: marks && word && text.includes(word) ? { word, kind: "highlight", from: at.from, to: at.to, seed: 61 + unit * 7, opacity: 0.8 } : null,
  }));
  return (
    <TextPiece
      lines={lines}
      fontSize={fontSize}
      weight={TYPE.signature.weight}
      color={color}
      frame={frame}
      duration={durationInFrames}
      inLen={ENTER.signature}
      rise={8}
      outLen={EXIT.signature}
      outRise={0}
      style={style}
    />
  );
};

const schema = {
  "style.fontSize": { type: "number", default: TYPE.signature.size, min: 40, max: 100, step: 1, description: "Tamaño del texto", hiddenFromList: false },
  "style.color": { type: "color", default: COLORS.ink, description: "Color del texto" },
  marks: { type: "boolean", default: true, description: "Marcador de crayón en la palabra destacada" },
} as const satisfies InteractivitySchema;

export const SignatureUnit = Interactive.withSchema({
  Component: Inner,
  componentName: "<SignatureUnit>",
  schema,
  wrapInSequence: true,
});
