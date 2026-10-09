import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ROLE } from "./config/brand.ts";
import { AUDIO_FILES, SFX_CUES, TOTAL_FRAMES, VOICEOVER } from "./config/timeline.ts";
import { Story } from "./story/Story";

/**
 * «El mensaje que borraste» v3 — reel 1080×1920 · 30 fps · 1590 f (53 s).
 * Capas: historia (chat → transición → ilustración, textos y logo) → audio (stems de 53 s alineados al reel).
 */
export const Reel: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: ROLE.paper }}>
      <Story name="Historia" from={0} durationInFrames={TOTAL_FRAMES} premountFor={fps} />

      <Audio name="Ambiente" src={staticFile(AUDIO_FILES.ambience)} premountFor={fps} volume={interpolate(frame, [0, SFX_CUES.musicIn, SFX_CUES.musicIn + 60, TOTAL_FRAMES - 45, TOTAL_FRAMES], [0.8, 0.8, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Audio name="Teclado" src={staticFile(AUDIO_FILES.keys)} premountFor={fps} volume={1} />
      <Audio name="Música" src={staticFile(AUDIO_FILES.music)} premountFor={fps} volume={interpolate(frame, [SFX_CUES.musicIn, SFX_CUES.musicIn + 75, SFX_CUES.musicOutFrom, TOTAL_FRAMES], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Audio name="SFX" src={staticFile(AUDIO_FILES.sfx)} premountFor={fps} volume={1} />
      {VOICEOVER.enabled ? <Audio name="Locución" src={staticFile(VOICEOVER.file)} premountFor={fps} volume={1} /> : null}
    </AbsoluteFill>
  );
};
