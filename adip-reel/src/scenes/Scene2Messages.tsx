import type React from "react";
import { AbsoluteFill, Interactive, type InteractivitySchema } from "remotion";
import { MESSAGES } from "../config/script.ts";
import { CURSOR_HANDOFF, SCENES } from "../config/timeline.ts";
import { activeMessage, cursorOpacity } from "../config/typing.ts";
import { ComposerCursor } from "../components/chat/ComposerCursor.tsx";
import { ComposerText } from "../components/chat/ComposerText.tsx";
import { chatFadeOut } from "../components/chat/fade.ts";
import { cursorBox, visibleLines } from "../components/chat/typingLayout.ts";
import { useFontsReady } from "../components/chat/useFontsReady.ts";
import { useAbsFrame } from "../lib/scene.ts";
import "../lib/fonts.ts";

/**
 * Escena 2 · Los mensajes (fotogramas 90 → ~452). Lo que se ve en cada fotograma sale EXCLUSIVAMENTE de
 * activeMessage()/visibleChars() (src/config/typing.ts), la misma fuente que sincroniza el audio de teclado.
 * El cursor sigue al último carácter visible; desde CURSOR_HANDOFF lo dibuja ThreadLine (no se dibuja acá).
 */
type Props = { readonly style?: React.CSSProperties };

const Inner: React.FC<Props> = ({ style }) => {
  const frame = useAbsFrame(SCENES.s2.from);
  const fontsReady = useFontsReady();

  const { index, chars } = activeMessage(frame);
  const lines = visibleLines(MESSAGES[index].lines, chars);
  const box = fontsReady ? cursorBox(lines) : null;

  return (
    <AbsoluteFill style={style}>
      <Interactive.Div name="Texto del mensaje" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", opacity: chatFadeOut(frame) }}>
        <ComposerText lines={lines} />
      </Interactive.Div>
      {box && frame < CURSOR_HANDOFF ? <ComposerCursor left={box.left} top={box.top} opacity={cursorOpacity(frame)} /> : null}
    </AbsoluteFill>
  );
};

const schema = {} as const satisfies InteractivitySchema;

export const Scene2Messages = Interactive.withSchema({
  Component: Inner,
  componentName: "<Scene2Messages>",
  schema,
  wrapInSequence: true,
});
