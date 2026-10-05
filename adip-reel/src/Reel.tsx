import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { COLORS } from "./config/brand.ts";
import {
  AUDIO_FILES,
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

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream }}>
      <ChatEnvironment name="Chat" from={0} durationInFrames={SCENES.s3.from + OVERLAP + 20} premountFor={fps} />
      <Scene1Hook name="Escena 1 · El inicio" from={SCENES.s1.from} durationInFrames={SCENES.s1.to - SCENES.s1.from + OVERLAP} premountFor={fps} />
      <Scene2Messages name="Escena 2 · Los mensajes" from={SCENES.s2.from} durationInFrames={SCENES.s2.to - SCENES.s2.from + OVERLAP + 20} premountFor={fps} />
      <Scene3Turn name="Escena 3 · El giro" from={SCENES.s3.from} durationInFrames={SCENES.s3.to - SCENES.s3.from + OVERLAP} premountFor={fps} />
      <Scene4Companion name="Escena 4 · El acompañamiento" from={SCENES.s4.from} durationInFrames={SCENES.s4.to - SCENES.s4.from + OVERLAP} premountFor={fps} />
      <Scene5Closing name="Escena 5 · El cierre" from={SCENES.s5.from} durationInFrames={SCENES.s5.to - SCENES.s5.from} premountFor={fps} />
      <ThreadLine name="Hilo gráfico" from={SFX_CUES.threadBorn - 6} durationInFrames={TOTAL_FRAMES - (SFX_CUES.threadBorn - 6)} premountFor={fps} />

      {/* Audio: stems de 35 s ya alineados al reel (scripts/build-audio.ts). */}
      <Audio name="Ambiente" src={staticFile(AUDIO_FILES.ambience)} premountFor={fps} volume={interpolate(frame, [0, 20, SFX_CUES.musicIn, SFX_CUES.musicIn + 60, TOTAL_FRAMES - 45, TOTAL_FRAMES], [0.0, 0.5, 0.5, 0.3, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Audio name="Teclado" src={staticFile(AUDIO_FILES.keys)} premountFor={fps} volume={0.9} />
      <Audio name="Música" src={staticFile(AUDIO_FILES.music)} premountFor={fps} volume={interpolate(frame, [SFX_CUES.musicIn, SFX_CUES.musicIn + 75, SFX_CUES.musicOutFrom, TOTAL_FRAMES], [0, 0.55, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Audio name="SFX hilo" src={staticFile(AUDIO_FILES.sfx)} premountFor={fps} volume={0.8} />
      {VOICEOVER.enabled ? <Audio name="Locución" src={staticFile(VOICEOVER.file)} premountFor={fps} volume={1} /> : null}
    </AbsoluteFill>
  );
};
