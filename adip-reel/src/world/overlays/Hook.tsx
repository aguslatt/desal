import type React from "react";
import { Interactive, type InteractivitySchema, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../../config/brand.ts";
import { TEXT_ZONES } from "../../config/layout.ts";
import { HOOK } from "../../config/script.ts";
import { HOOK_TIMING } from "../../config/timeline.ts";
import "../../lib/fonts.ts";
import { TextPiece, type LineSpec } from "./TextPiece.tsx";
import { TYPE, stackBaselines } from "./typography.ts";

/**
 * S1 · GANCHO «¿Cuántas veces escribiste esto… y lo borraste?» — 3 líneas centradas (80 px semibold) en la franja
 * superior (TEXT_ZONES.big). Legible DESDE EL FOTOGRAMA 0: arranca al 78 % de opacidad y 14 px más abajo y asienta
 * en HOOK_TIMING.settle; queda quieto y COMPLETO hasta HOOK_TIMING.exitFrom (≈ 2,1 s desde que asienta) y sale con un fundido corto
 * hasta exitTo. NO hay velo de papel: la cámara (src/world/camera.ts, ZOOM_IN_CURVE) mantiene a la persona casi quieta y por debajo de
 * la franja del texto mientras el gancho está en pantalla, y el zoom acelera recién cuando ya salió: nada ilustrado pasa por detrás.
 * Detalle de marca: subrayado de crayón naranja, dibujado a mano, bajo «esto…» (≥ 14 px de las letras).
 * Fotogramas LOCALES: el nodo arranca en f0 y dura HOOK_TIMING.exitTo.
 */
type Props = {
  readonly marks?: boolean;
  readonly style?: React.CSSProperties;
};

/** El gancho se corta en 3 líneas por palabras: «¿Cuántas veces / escribiste esto… / y lo borraste?» */
const BREAKS = [2, 4] as const;
const MARK_WORD = "esto…";
const Inner: React.FC<Props> = ({ marks = true, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fontSize = typeof style?.fontSize === "number" ? style.fontSize : TYPE.hook.size;
  const color = typeof style?.color === "string" ? style.color : COLORS.ink;
  const words = HOOK.split(" ");
  const texts = [words.slice(0, BREAKS[0]).join(" "), words.slice(BREAKS[0], BREAKS[1]).join(" "), words.slice(BREAKS[1]).join(" ")];
  const { baselines } = stackBaselines({ n: 3, fontSize, step: (TYPE.hook.step * fontSize) / TYPE.hook.size, zone: TEXT_ZONES.big });
  const lines: LineSpec[] = texts.map((text, i) => ({
    text,
    baseline: baselines[i],
    mark: marks && i === 1 ? { word: MARK_WORD, kind: "underline", from: HOOK_TIMING.settle + 6, to: HOOK_TIMING.settle + 30, seed: 41, gap: 16 } : null,
  }));
  return (
    <TextPiece
      lines={lines}
      fontSize={fontSize}
      weight={TYPE.hook.weight}
      color={color}
      frame={frame}
      duration={durationInFrames}
      inLen={HOOK_TIMING.settle}
      rise={14}
      startOpacity={0.78}
      outLen={HOOK_TIMING.exitTo - HOOK_TIMING.exitFrom}
      outRise={12}
      style={style}
    />
  );
};

const schema = {
  "style.fontSize": { type: "number", default: TYPE.hook.size, min: 40, max: 120, step: 1, description: "Tamaño del texto", hiddenFromList: false },
  "style.color": { type: "color", default: COLORS.ink, description: "Color del texto" },
  marks: { type: "boolean", default: true, description: "Subrayado de crayón bajo «esto…»" },
} as const satisfies InteractivitySchema;

export const HookText = Interactive.withSchema({
  Component: Inner,
  componentName: "<HookText>",
  schema,
  wrapInSequence: true,
});
