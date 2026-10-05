import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { fontFamily } from "../lib/fonts.ts";
import { useAbsFrame } from "../lib/scene.ts";
import { Header } from "./Header.tsx";
import { InputBar } from "./InputBar.tsx";
import { Keyboard } from "./Keyboard.tsx";
import { Thread } from "./Thread.tsx";
import { CHAT_COLORS, CHAT_SCREEN } from "./geometry.ts";
import { chatStateAt } from "./state.ts";

export * from "./geometry.ts";
export { chatStateAt, getCursorAnchor, keyForChar } from "./state.ts";
export type { ChatState, CursorAnchor, Ghost } from "./state.ts";

type Props = {
  /** Radio de las esquinas de la pantalla (px nativos). 0 → pantalla completa sin redondeo. */
  readonly cornerRadius?: number;
  readonly style?: React.CSSProperties;
};

/**
 * Chat de celular, pantalla NATIVA 1080×1920 (el mundo la escala con PHONE_SCALE y la coloca en el celular).
 * Fotogramas ABSOLUTOS del reel (useAbsFrame(0): su `from` es 0). Se dibuja todo desde `chatStateAt(frame)`:
 * mensaje RECIBIDO «¿Cómo estás?», campo de escritura (los mensajes viven DENTRO del campo, nunca se envían),
 * teclado con teclas que se activan en sincronía con KEY_EVENTS, tecla ⌫ resaltada al borrar.
 */
const Inner: React.FC<Props> = ({ cornerRadius = CHAT_SCREEN.radius, style }) => {
  const frame = useAbsFrame(0);
  const s = chatStateAt(frame);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: CHAT_SCREEN.w,
        height: CHAT_SCREEN.h,
        overflow: "hidden",
        borderRadius: cornerRadius,
        background: CHAT_COLORS.thread,
        fontFamily,
        ...style,
      }}
    >
      <Thread />
      <Header />
      <InputBar s={s} />
      <Keyboard s={s} />
    </div>
  );
};

const schema = {
  cornerRadius: {
    type: "number",
    default: CHAT_SCREEN.radius,
    min: 0,
    max: 200,
    step: 1,
    description: "Radio de las esquinas de la pantalla",
    hiddenFromList: false,
  },
} as const satisfies InteractivitySchema;

export const PhoneChat = Interactive.withSchema({
  Component: Inner,
  componentName: "<PhoneChat>",
  schema,
  wrapInSequence: true,
});
