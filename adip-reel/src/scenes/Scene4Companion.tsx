import type React from "react";
import { AbsoluteFill, Easing, Interactive, interpolate, type InteractivitySchema } from "remotion";
import { COLORS } from "../config/brand.ts";
import { H, W } from "../config/layout.ts";
import { MEDIA, SCENES } from "../config/timeline.ts";
import { fontFamily } from "../lib/fonts.ts";
import { useAbsFrame } from "../lib/scene.ts";
import { CompanionBackground } from "../components/companion/CompanionBackground.tsx";
import { CompanionMedia } from "../components/companion/CompanionMedia.tsx";
import { CompanionSubtitles } from "../components/companion/CompanionSubtitles.tsx";
import { MOTION } from "../components/companion/geometry.ts";

/**
 * Escena 4 · El acompañamiento (21–28 s).
 * Versión alternativa por falta de fotos/videos reales de ADIP: tres planos gráficos de marca
 * (formas orgánicas abstractas, paleta oficial) en ZONES.s4.media + subtítulos exactos por unidades de sentido
 * en ZONES.s4.subtitles. Los planos son `MediaSlot`: cuando haya material autorizado, completar
 * MEDIA.companionClips en src/config/timeline.ts (rutas relativas a public/, p. ej. "media/consultorio-1.mp4"),
 * o pasar `clip1`/`clip2`/`clip3` (Studio) o `clips` (--props) para probar. Fotos o videos: se detecta por extensión.
 * La línea naranja del hilo es otra capa (ThreadLine, y = 1240): esta escena no la dibuja.
 */
type Props = {
  /** Planos por prop (p. ej. --props='{"clips":["media/a.mp4","media/b.png",null]}'). null = plano gráfico de marca. */
  readonly clips?: readonly (string | null)[];
  /** Plano 1 (ancho): ruta relativa a public/ — video o imagen. Vacío = composición gráfica. */
  readonly clip1?: string;
  /** Plano 2 (arco). */
  readonly clip2?: string;
  /** Plano 3 (hoja). */
  readonly clip3?: string;
  readonly style?: React.CSSProperties;
};

const Inner: React.FC<Props> = ({ clips, clip1, clip2, clip3, style }) => {
  const frame = useAbsFrame(SCENES.s4.from);
  const byProp = [clip1, clip2, clip3];
  const sources = [0, 1, 2].map((i) => byProp[i] || clips?.[i] || MEDIA.companionClips[i] || null);

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
          // el fondo crema entra por fundido sobre la escena 3 durante el solape, desde el primer fotograma de la escena
          opacity: interpolate(frame, [SCENES.s4.from, SCENES.s4.from + MOTION.bgFade], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          }),
        }}
      >
        <CompanionBackground />
      </Interactive.Div>
      <CompanionMedia frame={frame} sources={sources} />
      <CompanionSubtitles />
    </AbsoluteFill>
  );
};

const schema = {
  clip1: {
    type: "asset",
    default: MEDIA.companionClips[0] ?? undefined,
    description: "Plano 1 · ancho (video o imagen; vacío = gráfico de marca)",
  },
  clip2: {
    type: "asset",
    default: MEDIA.companionClips[1] ?? undefined,
    description: "Plano 2 · arco (video o imagen; vacío = gráfico de marca)",
  },
  clip3: {
    type: "asset",
    default: MEDIA.companionClips[2] ?? undefined,
    description: "Plano 3 · hoja (video o imagen; vacío = gráfico de marca)",
  },
} as const satisfies InteractivitySchema;

export const Scene4Companion = Interactive.withSchema({
  Component: Inner,
  componentName: "<Scene4Companion>",
  schema,
  wrapInSequence: true,
});
