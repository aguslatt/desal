import type React from "react";
import { AbsoluteFill, Interactive, useVideoConfig, type InteractivitySchema } from "remotion";
import { FPS, SIGNATURE_TIMING, THREAD_TIMING, TOTAL_FRAMES } from "../config/timeline.ts";
import { ClosingDate, ClosingMessage } from "./Closing.tsx";
import { CompanionText } from "./CompanionText.tsx";
import { Logo } from "./Logo.tsx";
import { LOGO_PLACEMENT, TEXT_EXTENTS } from "./layout.ts";
import { SignatureBlock1, SignatureBlock2 } from "./Signature.tsx";
import { TurnFirst, TurnSecond } from "./TurnPhrases.tsx";

/**
 * CAPA DE TEXTOS Y LOGO (escenas 3–6) en pantalla ESTABLE: se monta a pantalla completa con `from = 0` y
 * `durationInFrames = TOTAL_FRAMES` (los `from` de las piezas son fotogramas ABSOLUTOS del reel). Cada pieza es un nodo JSX propio
 * (Interactive.withSchema wrapInSequence) con su `name` y su timing de timeline.ts:
 *   S3  TurnFirst · TurnSecond          sobre NARANJA (display 88/800)
 *   S4  CompanionText                   sobre gris   (display 88/800, 3 líneas)
 *   S5  SignatureBlock1 · SignatureBlock2 + Logo (grande, S5)
 *   S6  ClosingMessage · ClosingDate    (mensaje title 68/700; pie body 52/600) + el mismo Logo, desplazado a su lugar de S6 en THREAD_TIMING.settleFrom → settleTo
 * El fondo (naranja / gris), la ilustración y las curvas los pone el montaje. `showLogo={false}` omite el logo (si el montaje lo
 * dibuja por su cuenta con <Logo/>).
 */
type Props = {
  /** incluye el logo oficial (revelado en SIGNATURE_TIMING.logoIn; estático en S5; desplazado a su lugar de S6) */
  readonly showLogo?: boolean;
  readonly style?: React.CSSProperties;
};

const OverlaysInner: React.FC<Props> = ({ showLogo = true, style }) => {
  const { fps } = useVideoConfig();
  const e = TEXT_EXTENTS;
  return (
    <AbsoluteFill style={style}>
      <TurnFirst name="S3 · Podés empezar por ahí." from={e.turnFirst.from} durationInFrames={e.turnFirst.to - e.turnFirst.from} premountFor={fps} />
      <TurnSecond name="S3 · Por no saber cómo empezar." from={e.turnSecond.from} durationInFrames={e.turnSecond.to - e.turnSecond.from} premountFor={fps} />
      <CompanionText name="S4 · No tenés que pasar por esto en soledad." from={e.companion.from} durationInFrames={e.companion.to - e.companion.from} premountFor={fps} />
      <SignatureBlock1 name="S5 · Firma, bloque 1" from={e.signature1.from} durationInFrames={e.signature1.to - e.signature1.from} premountFor={fps} />
      <SignatureBlock2 name="S5 · Firma, bloque 2" from={e.signature2.from} durationInFrames={e.signature2.to - e.signature2.from} premountFor={fps} />
      <ClosingMessage name="S6 · Si hoy te cuesta decirlo" from={e.closingMessage.from} durationInFrames={e.closingMessage.to - e.closingMessage.from} premountFor={fps} />
      <ClosingDate name="S6 · 10 de octubre · Día Mundial de la Salud Mental" from={e.closingDate.from} durationInFrames={e.closingDate.to - e.closingDate.from} premountFor={fps} />
      {showLogo ? (
        <Logo
          name="Logo Equipo ADIP"
          from={SIGNATURE_TIMING.logoIn}
          durationInFrames={TOTAL_FRAMES - SIGNATURE_TIMING.logoIn}
          premountFor={fps}
          left={LOGO_PLACEMENT.s5.left}
          top={LOGO_PLACEMENT.s5.top}
          width={LOGO_PLACEMENT.s5.width}
          moveTo={LOGO_PLACEMENT.s6}
          moveFrom={THREAD_TIMING.settleFrom - SIGNATURE_TIMING.logoIn}
          moveDuration={THREAD_TIMING.settleTo - THREAD_TIMING.settleFrom}
        />
      ) : null}
    </AbsoluteFill>
  );
};

const schema = {
  showLogo: { type: "boolean", default: true, description: "Incluir el logo" },
} as const satisfies InteractivitySchema;

export const Overlays = Interactive.withSchema({ Component: OverlaysInner, componentName: "<Overlays>", schema, wrapInSequence: true });

/** Registro sugerido como composición conectada «Textos» (1080×1920, 30 fps, todo el reel): <Composition {...TEXT_COMPOSITION} component={Overlays} defaultProps={{ showLogo: true }} />. */
export const TEXT_COMPOSITION = { id: "Textos", width: 1080, height: 1920, fps: FPS, durationInFrames: TOTAL_FRAMES } as const;
