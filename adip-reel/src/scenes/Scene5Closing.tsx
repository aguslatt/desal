import type React from "react";
import { AbsoluteFill, Interactive, type InteractivitySchema } from "remotion";
import { COLORS } from "../config/brand.ts";
import { H, W } from "../config/layout.ts";
import { fontFamily } from "../lib/fonts.ts";
import { ClosingBackground } from "../components/closing/ClosingBackground.tsx";
import { ClosingDate } from "../components/closing/ClosingDate.tsx";
import { ClosingLogo } from "../components/closing/ClosingLogo.tsx";
import { ClosingMessage } from "../components/closing/ClosingMessage.tsx";
import { LOGO_BOX } from "../components/closing/geometry.ts";

/**
 * Escena 5 · El cierre (28–35 s, f 840–1050).
 * Fondo crema que entra por fundido sobre la escena 4 → mensaje (revelado por líneas) → logo oficial
 * (fundido + escala 0.96→1) → «10 de octubre» + «Día Mundial de la Salud Mental».
 * Desde CLOSING_TIMING.allVisible hasta el último fotograma todo queda visible y ESTÁTICO.
 * La línea naranja del hilo (ThreadLine) es otra capa: acá se deja libre la franja carril ± THREAD.clearance.
 */
type Props = {
  /** Ancho del logo en px (620–680). El alto sale siempre de la relación original 734:326. */
  readonly logoWidth?: number;
  readonly style?: React.CSSProperties;
};

const Inner: React.FC<Props> = ({ logoWidth = LOGO_BOX.width, style }) => (
  <AbsoluteFill style={{ width: W, height: H, color: COLORS.ink, fontFamily, ...style }}>
    <ClosingBackground />
    <ClosingMessage />
    <ClosingLogo width={logoWidth} />
    <ClosingDate logoWidth={logoWidth} />
  </AbsoluteFill>
);

const schema = {
  logoWidth: {
    type: "number",
    default: LOGO_BOX.width,
    min: 560,
    max: 700,
    step: 2,
    hiddenFromList: false,
    description: "Ancho del logo (px)",
  },
} as const satisfies InteractivitySchema;

export const Scene5Closing = Interactive.withSchema({
  Component: Inner,
  componentName: "<Scene5Closing>",
  schema,
  wrapInSequence: true,
});
