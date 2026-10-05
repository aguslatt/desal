import type React from "react";
import { Interactive, type InteractivitySchema, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../../config/brand.ts";
import { TEXT_ZONES } from "../../config/layout.ts";
import { COMPANION_TEXT_LINES } from "../../config/script.ts";
import "../../lib/fonts.ts";
import { ENTER, EXIT } from "./spans.ts";
import { TextPiece, type LineSpec } from "./TextPiece.tsx";
import { TYPE, stackBaselines } from "./typography.ts";

/**
 * S4 · «No tenés que pasar por esto en soledad.» — 2 líneas (64 px semibold), centradas en TEXT_ZONES.message (240–470).
 * Entra en COMPANION_TIMING.textIn (fundido + leve subida, líneas escalonadas) y sale desde COMPANION_TIMING.textExitFrom.
 * Estable durante la lectura; sin énfasis.
 */
type Props = {
  readonly style?: React.CSSProperties;
};

const Inner: React.FC<Props> = ({ style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fontSize = typeof style?.fontSize === "number" ? style.fontSize : TYPE.companion.size;
  const color = typeof style?.color === "string" ? style.color : COLORS.ink;
  const { baselines } = stackBaselines({
    n: COMPANION_TEXT_LINES.length,
    fontSize,
    step: (TYPE.companion.step * fontSize) / TYPE.companion.size,
    zone: TEXT_ZONES.message,
  });
  const lines: LineSpec[] = COMPANION_TEXT_LINES.map((text, i) => ({ text, baseline: baselines[i], delay: i * 5 }));
  return (
    <TextPiece
      lines={lines}
      fontSize={fontSize}
      weight={TYPE.companion.weight}
      color={color}
      frame={frame}
      duration={durationInFrames}
      inLen={ENTER.companion}
      rise={16}
      outLen={EXIT.companion}
      outRise={8}
      style={style}
    />
  );
};

const schema = {
  "style.fontSize": { type: "number", default: TYPE.companion.size, min: 40, max: 100, step: 1, description: "Tamaño del texto", hiddenFromList: false },
  "style.color": { type: "color", default: COLORS.ink, description: "Color del texto" },
} as const satisfies InteractivitySchema;

export const CompanionText = Interactive.withSchema({
  Component: Inner,
  componentName: "<CompanionText>",
  schema,
  wrapInSequence: true,
});
