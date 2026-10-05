import type React from "react";
import { AbsoluteFill, Easing, Interactive, interpolate, type InteractivitySchema } from "remotion";
import { MESSAGE_SPECS } from "../config/timeline.ts";
import { ChatBackground } from "../components/chat/ChatBackground.tsx";
import { ChatHeader } from "../components/chat/ChatHeader.tsx";
import { ComposerShell } from "../components/chat/ComposerShell.tsx";
import { chatFadeOut } from "../components/chat/fade.ts";
import { useAbsFrame } from "../lib/scene.ts";
import "../lib/fonts.ts";

/**
 * Capa persistente de la interfaz de mensajería (fotogramas 0 → ~452): fondo crema con resplandores muy
 * suaves, encabezado decorativo y campo de redacción vacío (el texto y el cursor los dibujan las escenas 1 y 2).
 * La tarjeta y el encabezado se desvanecen entre CHAT_FADE.from y CHAT_FADE.to (la escena 3 pinta su fondo encima).
 */
type Props = { readonly style?: React.CSSProperties };

const Inner: React.FC<Props> = ({ style }) => {
  const frame = useAbsFrame(0);
  const fade = chatFadeOut(frame);
  // Al empezar a escribir el campo "se enfoca": la sombra y el borde ganan presencia de forma casi imperceptible.
  const firstKey = MESSAGE_SPECS[0].start;
  const elevation = interpolate(frame, [firstKey - 3, firstKey + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  // Deriva lenta de los resplandores del fondo (ambiente discreto).
  const drift = interpolate(frame, [0, 452], [0, 28], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={style}>
      <Interactive.Div name="Fondo crema" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
        <ChatBackground drift={drift} glow={fade} />
      </Interactive.Div>
      <Interactive.Div name="Encabezado" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", opacity: fade }}>
        <ChatHeader />
      </Interactive.Div>
      <Interactive.Div name="Campo de redacción" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", opacity: fade }}>
        <ComposerShell elevation={elevation} />
      </Interactive.Div>
    </AbsoluteFill>
  );
};

const schema = {} as const satisfies InteractivitySchema;

export const ChatEnvironment = Interactive.withSchema({
  Component: Inner,
  componentName: "<ChatEnvironment>",
  schema,
  wrapInSequence: true,
});
