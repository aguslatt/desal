import type React from "react";
import { AbsoluteFill, Interactive, type InteractivitySchema } from "remotion";
import { FPS } from "../config/timeline.ts";
import { fontFamily } from "../lib/fonts.ts";
import { useAbsFrame } from "../lib/scene.ts";
import { Header } from "./Header.tsx";
import { FieldBack, FieldFront } from "./InputBar.tsx";
import { Keyboard } from "./Keyboard.tsx";
import { SentBubble, Thread } from "./Thread.tsx";
import { CHAT_COLORS } from "./geometry.ts";
import { chatStateAt } from "./state.ts";

type Props = {
  /** Dibuja el texto de la respuesta dentro de su burbuja (el montaje puede apagarlo y dibujarlo él sobre el naranja). */
  readonly replyText?: boolean;
  readonly style?: React.CSSProperties;
};

/**
 * EL CHAT (S1–S2 y salida de la interfaz en la transición), v3. Pantalla NATIVA 1080×1920 a pantalla completa y ESTÁTICA: el
 * encuadre, el campo de escritura y el tamaño del texto no se mueven ni cambian entre f116 y f892.
 * Fotogramas ABSOLUTOS del reel (useAbsFrame(0): su `from` es 0). Todo se dibuja desde `chatStateAt(frame)`:
 *  · S1 (0–116): mensaje recibido «¿Cómo estás?» + pregunta de la campaña (HOOK) en display, legible desde el f0.
 *  · S2 (116–892): M1 y M2 se tipean, quedan completos ≈ 3 s y se borran carácter por carácter desde el final; M3 se tipea, queda ≈ 3 s,
 *    se ENVÍA (pulsación, texto del campo → burbuja violeta), «Amiga» escribe y llega «Estoy acá. Te escucho.» (se sostiene).
 *  · Salida (892–920): encabezado hacia arriba; campo y teclado hacia abajo (opacos). Los mensajes enviado y recibido NO se mueven
 *    ni se atenúan: quedan completos junto a la burbuja de respuesta (REPLY_BUBBLE) hasta que el naranja de la transición los cubre.
 * Capas: hilo → fondo del campo → texto/íconos del campo y teclado → burbuja enviada (despega del campo POR ENCIMA de «+» y del botón,
 * opaca) → encabezado.
 */
const Inner: React.FC<Props> = ({ replyText = true, style }) => {
  const frame = useAbsFrame(0);
  const s = chatStateAt(frame);
  const bottom: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: 1080, height: 1920, translate: `0px ${s.exit.bottomDy}px` };

  return (
    <AbsoluteFill style={{ backgroundColor: CHAT_COLORS.paper, fontFamily, overflow: "hidden", ...style }}>
      <Thread s={s} replyText={replyText} />
      <div style={bottom}>
        <FieldBack />
      </div>
      <div style={bottom}>
        <FieldFront s={s} />
        <Keyboard s={s} />
      </div>
      {s.send.shown ? <SentBubble s={s} /> : null}
      <Header dy={s.exit.headerDy} />
    </AbsoluteFill>
  );
};

const schema = {} as const satisfies InteractivitySchema;

export const ChatScene = Interactive.withSchema({
  Component: Inner,
  componentName: "<ChatScene>",
  schema,
  wrapInSequence: true,
});

/** Composición registrable «Chat» (frames 0–930): <Composition {...CHAT_COMPOSITION} component={ChatScene} />. */
export const CHAT_COMPOSITION = { id: "Chat", width: 1080, height: 1920, fps: FPS, durationInFrames: 931 } as const;
