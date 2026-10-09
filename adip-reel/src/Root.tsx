import React from "react";
import { Composition, Still } from "remotion";
import { Cover } from "./Cover";
import { Reel } from "./Reel";
import { CHAT_COMPOSITION, ChatScene } from "./chat";
import { COLORS } from "./config/brand.ts";
import { H, W } from "./config/layout.ts";
import { COMPANION_TIMING, FPS, TOTAL_FRAMES } from "./config/timeline.ts";
import { ListeningScene } from "./illustration";
import { Story } from "./story/Story";
import { Overlays, TEXT_COMPOSITION } from "./text";

/**
 * Composiciones registradas:
 *  · Reel      — la pieza final (historia + audio de 53 s).
 *  · Historia  — solo la imagen (sin audio): la misma <Story> que usa el Reel; más rápida para revisar.
 *  · Cover     — portada (Still).
 *  · Chat      — S1–S2 y la salida de la interfaz (931 f: incluye el f930).
 *  · Escucha   — la pareja de escucha sola (fotograma de escena = fotograma del reel − COMPANION_TIMING.drawFrom).
 *  · Textos    — capa de textos y logo (escenas 3–6) sobre transparente.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Reel" component={Reel} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES} />
      <Composition id="Historia" component={Story} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES} />
      <Still id="Cover" component={Cover} width={W} height={H} />
      <Composition {...CHAT_COMPOSITION} component={ChatScene} />
      <Composition
        id="Escucha"
        component={ListeningScene}
        width={W}
        height={H}
        fps={FPS}
        durationInFrames={TOTAL_FRAMES - COMPANION_TIMING.drawFrom}
        defaultProps={{ sceneFrom: COMPANION_TIMING.drawFrom, x: 540, y: 1560, scale: 1, topA: COLORS.purple, topB: COLORS.green }}
      />
      <Composition {...TEXT_COMPOSITION} component={Overlays} defaultProps={{ showLogo: true }} />
    </>
  );
};
