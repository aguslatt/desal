import type React from "react";
import { AbsoluteFill, Easing, Interactive, interpolate, type InteractivitySchema } from "remotion";
import { COLORS } from "../config/brand.ts";
import { H, W } from "../config/layout.ts";
import { MEDIA, SCENES } from "../config/timeline.ts";
import { fontFamily } from "../lib/fonts.ts";
import { useAbsFrame } from "../lib/scene.ts";
import { MOTION } from "../components/turn/geometry.ts";
import { TurnBackground } from "../components/turn/TurnBackground.tsx";
import { TurnTypography } from "../components/turn/TurnTypography.tsx";
import { TurnSubtitles, TurnVideo } from "../components/turn/TurnVideo.tsx";

/**
 * Escena 3 · El giro (14–21 s).
 * Versión alternativa por falta de grabación: fondo cálido de marca + las dos oraciones en tipografía animada.
 * Lista para la grabación: si hay `videoSrc` (o MEDIA.turnVideo), muestra el video a pantalla completa
 * con la misma frase como subtítulos en la zona baja. La línea naranja del hilo es otra capa (ThreadLine).
 */
type Props = {
  /** Ruta relativa a public/ (p. ej. "media/giro.mp4"). Vacío = versión de tipografía animada. */
  readonly videoSrc?: string;
  readonly style?: React.CSSProperties;
};

const Inner: React.FC<Props> = ({ videoSrc, style }) => {
  const frame = useAbsFrame(SCENES.s3.from);
  const src = videoSrc || MEDIA.turnVideo;

  return (
    <AbsoluteFill style={{ width: W, height: H, fontFamily, color: COLORS.ink, ...style }}>
      <Interactive.Div
        name="Fondo"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          // el fondo entra por fundido sobre el chat durante el solape, desde el primer fotograma de la escena
          opacity: interpolate(frame, [SCENES.s3.from, SCENES.s3.from + MOTION.bgFade], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          }),
        }}
      >
        {src ? <TurnVideo src={src} /> : <TurnBackground />}
      </Interactive.Div>
      {src ? <TurnSubtitles /> : <TurnTypography />}
    </AbsoluteFill>
  );
};

const schema = {
  videoSrc: {
    type: "asset",
    assetType: "video",
    default: MEDIA.turnVideo ?? undefined,
    description: "Grabación de la escena (vacío = tipografía animada)",
  },
} as const satisfies InteractivitySchema;

export const Scene3Turn = Interactive.withSchema({
  Component: Inner,
  componentName: "<Scene3Turn>",
  schema,
  wrapInSequence: true,
});
