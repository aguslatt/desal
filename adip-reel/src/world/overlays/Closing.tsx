import type React from "react";
import { Interactive, type InteractivitySchema, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../../config/brand.ts";
import { FINAL, TEXT_ZONES } from "../../config/layout.ts";
import { CLOSING } from "../../config/script.ts";
import "../../lib/fonts.ts";
import { ENTER } from "./spans.ts";
import { TextPiece, type LineSpec } from "./TextPiece.tsx";
import { TYPE, stackBaselines } from "./typography.ts";

/**
 * S6 · CIERRE. Dos piezas independientes que quedan quietas hasta el último fotograma (sin fundido final):
 *  · ClosingMessage — «Si hoy te cuesta decirlo, / podés compartir este video.» (58 px semibold, 2 líneas centradas en la franja
 *    superior; la cláusula más larga mide ≈ 831 px y cabe en los 840 px de la zona segura). Entra en CLOSING_TIMING.messageIn.
 *  · ClosingDate — «10 de octubre» (bold 64) y «Día Mundial de la Salud Mental» (medium 52, una línea de ≈ 819 px), abajo,
 *    dentro de FINAL.date (y 1450–1580). Entra en CLOSING_TIMING.dateIn y está completa antes de CLOSING_TIMING.allVisible.
 */
type MessageProps = {
  readonly style?: React.CSSProperties;
};

const MessageInner: React.FC<MessageProps> = ({ style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fontSize = typeof style?.fontSize === "number" ? style.fontSize : TYPE.closing.size;
  const color = typeof style?.color === "string" ? style.color : COLORS.ink;
  const { baselines } = stackBaselines({
    n: CLOSING.message.length,
    fontSize,
    step: (TYPE.closing.step * fontSize) / TYPE.closing.size,
    zone: TEXT_ZONES.message,
  });
  const lines: LineSpec[] = CLOSING.message.map((text, i) => ({ text, baseline: baselines[i], delay: i * 10 }));
  return (
    <TextPiece
      lines={lines}
      fontSize={fontSize}
      weight={TYPE.closing.weight}
      color={color}
      frame={frame}
      duration={durationInFrames}
      inLen={ENTER.closingLine}
      rise={16}
      outLen={0}
      style={style}
    />
  );
};

const messageSchema = {
  "style.fontSize": { type: "number", default: TYPE.closing.size, min: 40, max: 100, step: 1, description: "Tamaño del texto (máx. ≈ 58 para que quepa en 840 px)", hiddenFromList: false },
  "style.color": { type: "color", default: COLORS.ink, description: "Color del texto" },
} as const satisfies InteractivitySchema;

export const ClosingMessage = Interactive.withSchema({
  Component: MessageInner,
  componentName: "<ClosingMessage>",
  schema: messageSchema,
  wrapInSequence: true,
});

type DateProps = {
  readonly style?: React.CSSProperties;
};

const DateInner: React.FC<DateProps> = ({ style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const color = typeof style?.color === "string" ? style.color : COLORS.ink;
  const { baselines } = stackBaselines({
    n: 2,
    fontSize: TYPE.date.size,
    step: TYPE.date.step,
    zone: FINAL.date,
    lastDescender: false,
  });
  const lines: LineSpec[] = [
    { text: CLOSING.dateLine, baseline: baselines[0], size: TYPE.date.size, weight: TYPE.date.weight },
    { text: CLOSING.campaign, baseline: baselines[1], size: TYPE.campaign.size, weight: TYPE.campaign.weight, delay: 10 },
  ];
  return (
    <TextPiece
      lines={lines}
      fontSize={TYPE.date.size}
      weight={TYPE.date.weight}
      color={color}
      frame={frame}
      duration={durationInFrames}
      inLen={ENTER.closingDate}
      rise={14}
      outLen={0}
      style={style}
    />
  );
};

const dateSchema = {
  "style.color": { type: "color", default: COLORS.ink, description: "Color del texto" },
} as const satisfies InteractivitySchema;

export const ClosingDate = Interactive.withSchema({
  Component: DateInner,
  componentName: "<ClosingDate>",
  schema: dateSchema,
  wrapInSequence: true,
});
