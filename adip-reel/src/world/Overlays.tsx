import type React from "react";
import { AbsoluteFill, Interactive, type InteractivitySchema, useVideoConfig } from "remotion";
import { ClosingDate, ClosingMessage } from "./overlays/Closing.tsx";
import { CompanionText } from "./overlays/Companion.tsx";
import { HookText } from "./overlays/Hook.tsx";
import { SignatureUnit } from "./overlays/Signature.tsx";
import { SPANS } from "./overlays/spans.ts";
import { TurnPhrase } from "./overlays/Turn.tsx";
import { Logo } from "./Logo.tsx";

export { Logo, LOGO_BOX, logoBox, logoClearBox } from "./Logo.tsx";
export { TEXT_EXTENTS, TYPE, MONT, baselineIn, measureWidth, stackBaselines } from "./overlays/typography.ts";
export { WordMark } from "./overlays/WordMark.tsx";
export { TextPiece } from "./overlays/TextPiece.tsx";
export { SPANS as OVERLAY_SPANS } from "./overlays/spans.ts";

type Props = { readonly style?: React.CSSProperties };

/**
 * CAPA DE PANTALLA (no escala con la cámara): textos Montserrat estables + logo oficial. Cada pieza es su propio nodo JSX
 * con su `name` y su ventana (`from`/`durationInFrames`, fotogramas del reel salidos de src/config/timeline.ts), así se editan
 * por separado en el Studio. Dentro de cada pieza el fotograma es LOCAL (0 = su `from`).
 *
 *   S1  HookText        «¿Cuántas veces escribiste esto… y lo borraste?»          0 → HOOK_TIMING.exitTo
 *   S3  TurnPhrase      «Podés empezar / por ahí.» + «Por no saber / cómo empezar.»  firstIn / secondIn → exitFrom + 16
 *   S4  CompanionText   «No tenés que pasar por esto en soledad.»                 textIn → textExitFrom + 12
 *   S5  SignatureUnit   3 unidades de sentido de la firma + Logo                  SIGNATURE_TIMING.units / logoIn
 *   S6  ClosingMessage  «Si hoy te cuesta decirlo, / podés compartir este video.»  messageIn → último fotograma
 *       ClosingDate     «10 de octubre» / «Día Mundial de la Salud Mental»        dateIn → último fotograma
 */
const Inner: React.FC<Props> = ({ style }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", ...style }}>
      <HookText name="S1 · Gancho" from={SPANS.hook.from} durationInFrames={SPANS.hook.duration} premountFor={fps} />

      <TurnPhrase name="S3 · Podés empezar por ahí." part="first" from={SPANS.turnFirst.from} durationInFrames={SPANS.turnFirst.duration} premountFor={fps} />
      <TurnPhrase name="S3 · Por no saber cómo empezar." part="second" from={SPANS.turnSecond.from} durationInFrames={SPANS.turnSecond.duration} premountFor={fps} />

      <CompanionText name="S4 · No tenés que pasar por esto en soledad." from={SPANS.companion.from} durationInFrames={SPANS.companion.duration} premountFor={fps} />

      <SignatureUnit name="S5 · Firma 1 (escucharte)" unit={0} from={SPANS.signature[0].from} durationInFrames={SPANS.signature[0].duration} premountFor={fps} />
      <SignatureUnit name="S5 · Firma 2 (acompañarte)" unit={1} from={SPANS.signature[1].from} durationInFrames={SPANS.signature[1].duration} premountFor={fps} />
      <SignatureUnit name="S5 · Firma 3 (a tu ritmo)" unit={2} from={SPANS.signature[2].from} durationInFrames={SPANS.signature[2].duration} premountFor={fps} />

      <Logo name="Logo Equipo ADIP" from={SPANS.logo.from} durationInFrames={SPANS.logo.duration} premountFor={fps} />

      <ClosingMessage name="S6 · Si hoy te cuesta decirlo" from={SPANS.closingMessage.from} durationInFrames={SPANS.closingMessage.duration} premountFor={fps} />
      <ClosingDate name="S6 · 10 de octubre" from={SPANS.closingDate.from} durationInFrames={SPANS.closingDate.duration} premountFor={fps} />
    </AbsoluteFill>
  );
};

const schema = {} as const satisfies InteractivitySchema;

export const Overlays = Interactive.withSchema({
  Component: Inner,
  componentName: "<Overlays>",
  schema,
  wrapInSequence: true,
});
