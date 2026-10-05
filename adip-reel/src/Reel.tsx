import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { COLORS } from "./config/brand.ts";
import {
  AUDIO_FILES,
  CHAT_LAYER_FRAMES,
  COMPANION_TIMING,
  MEDIA,
  THREAD_FROM,
  THREAD_LAYER_FRAMES,
  TURN_TIMING,
  OVERLAP,
  SCENES,
  SFX_CUES,
  TOTAL_FRAMES,
  VOICEOVER,
} from "./config/timeline.ts";
import { ChatEnvironment } from "./scenes/ChatEnvironment";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Messages } from "./scenes/Scene2Messages";
import { Scene3Turn } from "./scenes/Scene3Turn";
import { Scene4Companion } from "./scenes/Scene4Companion";
import { Scene5Closing } from "./scenes/Scene5Closing";
import { ThreadLine } from "./scenes/ThreadLine";
import { staticFile } from "remotion";

/**
 * "El mensaje que borraste" — reel 1080×1920 · 30 fps · 1050 f (35 s).
 * Orden de capas (de abajo hacia arriba): chat → escenas 1–5 → hilo gráfico → audio.
 * Cada escena pinta su propio fondo (fundido de entrada en el solape) y su propia salida.
 */
export const Reel: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Con locución real o con la grabación de la escena 3, la música baja ~6 dB bajo la voz (escenas 3–4) y vuelve para el cierre.
  const musicDuck =
    VOICEOVER.enabled || MEDIA.turnVideo
      ? interpolate(frame, [TURN_TIMING.firstIn - 8, TURN_TIMING.firstIn + 8, COMPANION_TIMING.units[2].to, COMPANION_TIMING.units[2].to + 24], [1, 0.5, 0.5, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream }}>
      <ChatEnvironment name="Chat" from={0} durationInFrames={CHAT_LAYER_FRAMES} premountFor={fps} />
      <Scene1Hook name="Escena 1 · El inicio" from={SCENES.s1.from} durationInFrames={SCENES.s1.to - SCENES.s1.from + OVERLAP} premountFor={fps} />
      <Scene2Messages name="Escena 2 · Los mensajes" from={SCENES.s2.from} durationInFrames={SCENES.s2.to - SCENES.s2.from + OVERLAP + 20} premountFor={fps} />
      <Scene3Turn name="Escena 3 · El giro" from={SCENES.s3.from} durationInFrames={SCENES.s3.to - SCENES.s3.from + OVERLAP} premountFor={fps} />
      <Scene4Companion name="Escena 4 · El acompañamiento" from={SCENES.s4.from} durationInFrames={SCENES.s4.to - SCENES.s4.from + OVERLAP} premountFor={fps} />
      <Scene5Closing name="Escena 5 · El cierre" from={SCENES.s5.from} durationInFrames={SCENES.s5.to - SCENES.s5.from} premountFor={fps} />
      <ThreadLine name="Hilo gráfico" from={THREAD_FROM} durationInFrames={THREAD_LAYER_FRAMES} premountFor={fps} />

      {/* Audio: stems de 35 s ya alineados al reel (scripts/build-audio.ts). */}
      <Audio name="Ambiente" src={staticFile(AUDIO_FILES.ambience)} premountFor={fps} volume={interpolate(frame, [0, 20, SFX_CUES.musicIn, SFX_CUES.musicIn + 60, TOTAL_FRAMES - 45, TOTAL_FRAMES], [0.0, 0.8, 0.8, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Audio name="Teclado" src={staticFile(AUDIO_FILES.keys)} premountFor={fps} volume={1} />
      <Audio name="Música" src={staticFile(AUDIO_FILES.music)} premountFor={fps} volume={interpolate(frame, [SFX_CUES.musicIn, SFX_CUES.musicIn + 75, SFX_CUES.musicOutFrom, TOTAL_FRAMES], [0, 0.9, 0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * musicDuck} />
      <Audio name="SFX hilo" src={staticFile(AUDIO_FILES.sfx)} premountFor={fps} volume={1} />
      {VOICEOVER.enabled ? <Audio name="Locución" src={staticFile(VOICEOVER.file)} premountFor={fps} volume={1} /> : null}
    </AbsoluteFill>
  );
};
