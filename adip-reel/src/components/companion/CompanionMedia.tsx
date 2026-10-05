import React from "react";
import { MediaSlot } from "../MediaSlot.tsx";
import { SCENES } from "../../config/timeline.ts";
import { MOTION, PLANES, driftProgress, planeInFrom, planeMotion } from "./geometry.ts";

/**
 * Los tres planos de la escena 4 (mosaico en ZONES.s4.media, y 260–1184).
 * Entrada escalonada desde COMPANION_TIMING.mediaIn, deriva continua lentísima y salida suave en el tail.
 * Cada plano es un MediaSlot: si `sources[i]` es null muestra la composición gráfica de marca.
 */
export const CompanionMedia: React.FC<{
  /** fotograma ABSOLUTO */
  readonly frame: number;
  readonly sources: readonly (string | null)[];
}> = ({ frame, sources }) => {
  const t = driftProgress(frame);
  const a = planeMotion(frame, 0);
  const b = planeMotion(frame, 1);
  const c = planeMotion(frame, 2);

  return (
    <>
      <MediaSlot
        src={sources[0]}
        variant={0}
        width={PLANES[0].w}
        height={PLANES[0].h}
        radius={PLANES[0].radius}
        frame={frame}
        start={planeInFrom(0) + MOTION.drawDelay}
        sceneFrom={SCENES.s4.from}
        drift={t}
        style={{
          position: "absolute",
          left: PLANES[0].x,
          top: PLANES[0].y,
          opacity: a.opacity,
          translate: `0px ${a.lift}px`,
          scale: a.scale,
        }}
      />
      <MediaSlot
        src={sources[1]}
        variant={1}
        width={PLANES[1].w}
        height={PLANES[1].h}
        radius={PLANES[1].radius}
        frame={frame}
        start={planeInFrom(1) + MOTION.drawDelay}
        sceneFrom={SCENES.s4.from}
        drift={t}
        style={{
          position: "absolute",
          left: PLANES[1].x,
          top: PLANES[1].y,
          opacity: b.opacity,
          translate: `0px ${b.lift}px`,
          scale: b.scale,
        }}
      />
      <MediaSlot
        src={sources[2]}
        variant={2}
        width={PLANES[2].w}
        height={PLANES[2].h}
        radius={PLANES[2].radius}
        frame={frame}
        start={planeInFrom(2) + MOTION.drawDelay}
        sceneFrom={SCENES.s4.from}
        drift={t}
        style={{
          position: "absolute",
          left: PLANES[2].x,
          top: PLANES[2].y,
          opacity: c.opacity,
          translate: `0px ${c.lift}px`,
          scale: c.scale,
        }}
      />
    </>
  );
};
