import type React from "react";
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame, useVideoConfig, type InteractivitySchema } from "remotion";
import { COLORS, ROLE } from "../config/brand.ts";
import { H, W } from "../config/layout.ts";
import { ChatScene } from "../chat";
import {
  CLOSING_TIMING,
  COMPANION_TIMING,
  SIGNATURE_TIMING,
  THREAD_TIMING,
  TOTAL_FRAMES,
  TRANSITION_TIMING,
} from "../config/timeline.ts";
import { ListeningScene } from "../illustration";
import { ClosingDate, ClosingMessage, CompanionText, Logo, SignatureBlock1, SignatureBlock2, TEXT_EXTENTS } from "../text";
import { LIFT_EASING, LOGO_S5, PAIR_PLACE, S6_LIFT } from "./geometry.ts";
import { THREAD_NODE_FROM, Thread } from "./Thread.tsx";
import { REPLY_NODE_END, ReplyToTurn, TURN_WINDOWS, TurnPhraseFirst, TurnPhraseSecond } from "./Turn.tsx";
import { OrangeWipe, WIPE_FRAMES } from "./Wipe.tsx";

/**
 * LA HISTORIA COMPLETA (v3) — «El mensaje que borraste», 1080×1920 · 30 fps · 1590 f. Cada capa es un nodo con su `name` y su
 * timing (tiempos de src/config/timeline.ts; fotogramas ABSOLUTOS porque la historia arranca en el f0 del reel):
 *
 *   fondo gris (papel del manual) ─ Chat (S1–S2 + salida de la UI; la respuesta la dibuja `ReplyToTurn`)
 *   ─ grupo «cámara» [pareja de escucha · hilo naranja · logo] (S4–S6; sube S6_LIFT px en S5→S6, un movimiento vertical uniforme)
 *   ─ naranja de la transición (crece desde la burbuja de respuesta, se sostiene, se retira por el borde derecho)
 *   ─ textos: respuesta → «Podés empezar por ahí.» → «Por no saber cómo empezar.» (S3 sobre naranja) · acompañamiento (S4) ·
 *     firma en dos bloques (S5) · mensaje final y fecha (S6).
 *
 * Capas por encima del naranja: solo los textos de S3 (la respuesta que se transforma y las frases del giro).
 */
type Props = { readonly style?: React.CSSProperties };

const Inner: React.FC<Props> = ({ style }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const e = TEXT_EXTENTS;

  return (
    <AbsoluteFill style={{ backgroundColor: ROLE.paper, ...style }}>
      {/* S1–S2: primer plano del chat → tipeo, borrado, envío y respuesta; la UI sale en la transición */}
      <ChatScene name="S1–S2 · Chat" from={0} durationInFrames={TRANSITION_TIMING.wipeTo + 4} premountFor={fps} replyText={false} />

      {/* S4–S6: pareja, hilo y logo forman un solo cuerpo: en S5→S6 suben juntos (cámara vertical, sin cambios de tamaño) */}
      <Interactive.Div
        name="S4–S6 · Pareja + hilo + logo (cámara)"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          translate: interpolate(frame, [THREAD_TIMING.settleFrom, THREAD_TIMING.settleTo], ["0px 0px", `0px ${-S6_LIFT}px`], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: LIFT_EASING,
          }),
        }}
      >
        <ListeningScene
          name="S4 · Pareja de escucha"
          from={COMPANION_TIMING.drawFrom}
          sceneFrom={COMPANION_TIMING.drawFrom}
          durationInFrames={TOTAL_FRAMES - COMPANION_TIMING.drawFrom}
          premountFor={fps}
          x={PAIR_PLACE.x}
          y={PAIR_PLACE.y}
          scale={PAIR_PLACE.scale}
          topA={COLORS.purple}
          topB={COLORS.green}
        />
        <Thread name="Hilo naranja (S4–S5)" from={THREAD_NODE_FROM} durationInFrames={TOTAL_FRAMES - THREAD_NODE_FROM} premountFor={fps} />
        <Logo
          name="Logo Equipo ADIP"
          from={SIGNATURE_TIMING.logoIn}
          durationInFrames={TOTAL_FRAMES - SIGNATURE_TIMING.logoIn}
          premountFor={fps}
          left={LOGO_S5.left}
          top={LOGO_S5.top}
          width={LOGO_S5.width}
        />
      </Interactive.Div>

      {/* S3: el naranja nace de la burbuja de respuesta y se retira por la derecha */}
      <OrangeWipe name="S3 · Naranja (burbuja → página → retirada)" from={TRANSITION_TIMING.wipeFrom} durationInFrames={WIPE_FRAMES} premountFor={fps} />

      {/* S2→S3: el texto conserva su posición y se transforma */}
      <ReplyToTurn name="S2→S3 · Estoy acá. Te escucho. → Podés empezar por ahí." from={TURN_WINDOWS.reply.from} durationInFrames={REPLY_NODE_END - TURN_WINDOWS.reply.from} premountFor={fps} />
      <TurnPhraseFirst name="S3 · Podés empezar por ahí." from={TURN_WINDOWS.first.from} durationInFrames={TURN_WINDOWS.first.to - TURN_WINDOWS.first.from} premountFor={fps} />
      <TurnPhraseSecond name="S3 · Por no saber cómo empezar." from={TURN_WINDOWS.second.from} durationInFrames={TURN_WINDOWS.second.to - TURN_WINDOWS.second.from} premountFor={fps} />

      {/* S4–S6: textos */}
      <CompanionText name="S4 · No tenés que pasar por esto en soledad." from={e.companion.from} durationInFrames={e.companion.to - e.companion.from} premountFor={fps} />
      <SignatureBlock1 name="S5 · Firma, bloque 1" from={e.signature1.from} durationInFrames={e.signature1.to - e.signature1.from} premountFor={fps} />
      <SignatureBlock2 name="S5 · Firma, bloque 2" from={e.signature2.from} durationInFrames={e.signature2.to - e.signature2.from} premountFor={fps} />
      <ClosingMessage name="S6 · Si hoy te cuesta decirlo" from={CLOSING_TIMING.messageIn} durationInFrames={TOTAL_FRAMES - CLOSING_TIMING.messageIn} premountFor={fps} />
      <ClosingDate name="S6 · 10 de octubre · Día Mundial de la Salud Mental" from={CLOSING_TIMING.dateIn} durationInFrames={TOTAL_FRAMES - CLOSING_TIMING.dateIn} premountFor={fps} />
    </AbsoluteFill>
  );
};

const schema = {} as const satisfies InteractivitySchema;

export const Story = Interactive.withSchema({ Component: Inner, componentName: "<Story>", schema, wrapInSequence: true });
