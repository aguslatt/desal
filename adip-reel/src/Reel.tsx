import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { COLORS } from "./config/brand.ts";
import { AUDIO_FILES, SFX_CUES, TOTAL_FRAMES, VOICEOVER } from "./config/timeline.ts";
import { Overlays } from "./world/Overlays";
import { World } from "./world/World";

/**
 * «El mensaje que borraste» v2 — reel 1080×1920 · 30 fps · 1140 f (38 s).
 * Capas (de abajo hacia arriba): mundo ilustrado con cámara continua (papel, personajes, chat en el celular,
 * hilo naranja) → textos Montserrat (overlay estable) → audio (stems de 38 s alineados al reel).
 */
export const Reel: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream }}>
      <World name="Mundo" from={0} durationInFrames={TOTAL_FRAMES} premountFor={fps} />
      <Overlays name="Textos" from={0} durationInFrames={TOTAL_FRAMES} premountFor={fps} />

      <Audio name="Ambiente" src={staticFile(AUDIO_FILES.ambience)} premountFor={fps} volume={interpolate(frame, [0, SFX_CUES.musicIn, SFX_CUES.musicIn + 60, TOTAL_FRAMES - 45, TOTAL_FRAMES], [0.8, 0.8, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Audio name="Teclado" src={staticFile(AUDIO_FILES.keys)} premountFor={fps} volume={1} />
      <Audio name="Música" src={staticFile(AUDIO_FILES.music)} premountFor={fps} volume={interpolate(frame, [SFX_CUES.musicIn, SFX_CUES.musicIn + 75, SFX_CUES.musicOutFrom, TOTAL_FRAMES], [0, 0.9, 0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Audio name="SFX" src={staticFile(AUDIO_FILES.sfx)} premountFor={fps} volume={1} />
      {VOICEOVER.enabled ? <Audio name="Locución" src={staticFile(VOICEOVER.file)} premountFor={fps} volume={1} /> : null}
    </AbsoluteFill>
  );
};
