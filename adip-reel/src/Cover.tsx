import type React from "react";
import { AbsoluteFill, Interactive, type InteractivitySchema } from "remotion";
import { MESSAGES } from "./config/script.ts";
import { ComposerShell } from "./components/chat/ComposerShell.tsx";
import { ComposerCard } from "./components/chat/ComposerCard.tsx";
import { CoverBackground } from "./components/cover/CoverBackground.tsx";
import { CoverLogo } from "./components/cover/CoverLogo.tsx";
import { CoverSubtitle } from "./components/cover/CoverSubtitle.tsx";
import { CoverTitle } from "./components/cover/CoverTitle.tsx";
import { FIELD } from "./components/cover/geometry.ts";
import "./lib/fonts.ts";

/**
 * Portada independiente (Still 1080×1920, PNG). Misma dirección de arte que el reel: fondo crema con
 * resplandores suaves, el campo de redacción con «No sé por dónde empezar…» (MESSAGES[2]) y el cursor naranja
 * encendido (estático), con dos "borradores" apilados detrás (los mensajes que se borraron), y el subrayado
 * naranja bajo «borraste» como el del gancho del reel.
 * Jerarquía: título > mensaje > secundario > logo. Todo el contenido clave queda dentro del recorte 4:5
 * (y 285–1635) y de la zona segura (x 120–960, y 220–1580).
 */
type Props = { readonly style?: React.CSSProperties };

const Inner: React.FC<Props> = ({ style }) => {
  return (
    <AbsoluteFill style={style}>
      <Interactive.Div name="Fondo crema" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
        <CoverBackground />
      </Interactive.Div>
      <Interactive.Div name="Título" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
        <CoverTitle />
      </Interactive.Div>
      <Interactive.Div name="Borradores" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
        <ComposerShell elevation={0} style={{ translate: `0px ${FIELD.dy - 68}px`, scale: 0.88, opacity: 0.6 }} />
        <ComposerShell elevation={0} style={{ translate: `0px ${FIELD.dy - 34}px`, scale: 0.94, opacity: 0.85 }} />
      </Interactive.Div>
      <Interactive.Div name="Campo de redacción" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
        <ComposerCard
          lines={MESSAGES[2].lines}
          showCursor
          cursorOpacity={1}
          elevation={1}
          style={{ translate: `0px ${FIELD.dy}px` }}
        />
      </Interactive.Div>
      <Interactive.Div name="Texto secundario" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
        <CoverSubtitle />
      </Interactive.Div>
      <Interactive.Div name="Logo" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
        <CoverLogo />
      </Interactive.Div>
    </AbsoluteFill>
  );
};

const schema = {} as const satisfies InteractivitySchema;

export const Cover = Interactive.withSchema({
  Component: Inner,
  componentName: "<Cover>",
  schema,
  wrapInSequence: true,
});
