import type React from "react";
import { AbsoluteFill, Easing, Interactive, interpolate, type InteractivitySchema } from "remotion";
import { COLORS } from "../config/brand.ts";
import { HOOK_TIMING, SCENES } from "../config/timeline.ts";
import { cursorOpacity } from "../config/typing.ts";
import { ComposerCursor } from "../components/chat/ComposerCursor.tsx";
import { HOOK_STYLE, HookText, underlineSpan } from "../components/chat/HookText.tsx";
import { cursorBox } from "../components/chat/typingLayout.ts";
import { useFontsReady } from "../components/chat/useFontsReady.ts";
import { useAbsFrame } from "../lib/scene.ts";
import "../lib/fonts.ts";

/**
 * Escena 1 · El inicio (fotogramas 0 → ~102). Desde el fotograma 0 ya se ven el entorno de chat (capa ChatEnvironment)
 * y el gancho legible; el campo de redacción está vacío y el cursor naranja titila. Sin logo.
 * Entrada: HOOK_TIMING.settle f desde 75 % de opacidad (≥ 4,5:1 ya en el fotograma 0; con 55 % el contraste caía a 3,1:1) y 14 px de desplazamiento. Salida suave entre exitFrom y exitTo.
 * El cursor lo dibuja esta escena hasta SCENES.s2.from; desde ahí lo dibuja Scene2Messages (misma posición y curva).
 */
type Props = { readonly style?: React.CSSProperties };

const UNDERLINE_THICKNESS = 6;

const Inner: React.FC<Props> = ({ style }) => {
  const frame = useAbsFrame(SCENES.s1.from);
  const fontsReady = useFontsReady();

  const box = fontsReady ? cursorBox([""]) : null;
  const span = fontsReady ? underlineSpan() : null;
  // Línea 2 del gancho: baseline ≈ top de línea + 79 px; el subrayado queda ~17 px bajo la base, separado de las letras.
  const underlineTop = HOOK_STYLE.top + HOOK_STYLE.lineHeight + 96;

  return (
    <AbsoluteFill style={style}>
      <Interactive.Div
        name="Gancho"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          opacity: interpolate(frame, [0, HOOK_TIMING.settle, HOOK_TIMING.exitFrom, HOOK_TIMING.exitTo], [0.75, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: [Easing.bezier(0.16, 1, 0.3, 1), Easing.linear, Easing.bezier(0.4, 0, 0.2, 1)],
          }),
          translate: interpolate(frame, [0, HOOK_TIMING.settle, HOOK_TIMING.exitFrom, HOOK_TIMING.exitTo], ["0px 14px", "0px 0px", "0px 0px", "0px -12px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: [Easing.bezier(0.16, 1, 0.3, 1), Easing.linear, Easing.bezier(0.4, 0, 0.2, 1)],
          }),
        }}
      >
        <HookText />
        {span ? (
          <div
            style={{
              position: "absolute",
              left: span.left,
              top: underlineTop,
              width: interpolate(frame, [HOOK_TIMING.settle + 2, HOOK_TIMING.settle + 26], [0, span.width], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.65, 0, 0.35, 1),
              }),
              height: UNDERLINE_THICKNESS,
              borderRadius: UNDERLINE_THICKNESS / 2,
              backgroundColor: COLORS.orange,
            }}
          />
        ) : null}
      </Interactive.Div>
      {box && frame < SCENES.s2.from ? <ComposerCursor left={box.left} top={box.top} opacity={cursorOpacity(frame)} /> : null}
    </AbsoluteFill>
  );
};

const schema = {} as const satisfies InteractivitySchema;

export const Scene1Hook = Interactive.withSchema({
  Component: Inner,
  componentName: "<Scene1Hook>",
  schema,
  wrapInSequence: true,
});
