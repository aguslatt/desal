import React from "react";
import { Easing, interpolate, staticFile, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { COLORS, FONT } from "../../config/brand.ts";
import { H, W } from "../../config/layout.ts";
import { TURN } from "../../config/script.ts";
import { SCENES, TURN_TIMING } from "../../config/timeline.ts";
import { useAbsFrame } from "../../lib/scene.ts";
import { FIRST_SUBTITLE_OUT, lastWord } from "./geometry.ts";
import { TurnSentence } from "./TurnSentence.tsx";

/** Ruta relativa a public/ (o URL absoluta) → fuente utilizable por <Video>. */
export const resolveSrc = (src: string): string => (/^(https?:|data:|blob:)/u.test(src) ? src : staticFile(src));

/** Subtítulos: 56 px semibold, zona baja (y 1180–1560), máx. 2 líneas por momento. */
const SUB = { fontSize: 56, lineHeight: 70, centerY: 1370 } as const;
const SUB_TOP = SUB.centerY - SUB.lineHeight; // bloque de 2 líneas centrado en la zona 1180–1560
const VEIL_FROM = 1090;

/** Grabación a pantalla completa (objectFit cover). Se funde sobre el chat con el fondo de la escena. */
export const TurnVideo: React.FC<{ readonly src: string }> = ({ src }) => {
  const { fps } = useVideoConfig();
  return (
    <Video
      name="Grabación · escena 3"
      src={resolveSrc(src)}
      premountFor={fps}
      objectFit="cover"
      style={{ position: "absolute", left: 0, top: 0, width: W, height: H }}
    />
  );
};

/**
 * Subtítulos de la misma frase en dos momentos sobre un velo suave de crema (no tapa el rostro:
 * el velo arranca bajo el plano medio y el texto vive en y 1180–1560). Ink sobre crema ≥ 0.88 de opacidad
 * → contraste ≥ 7:1 incluso sobre un fondo negro.
 */
export const TurnSubtitles: React.FC = () => {
  const frame = useAbsFrame(SCENES.s3.from);
  const veil = interpolate(
    frame,
    [TURN_TIMING.firstIn - 10, TURN_TIMING.firstIn + 8, TURN_TIMING.exitFrom, TURN_TIMING.exitFrom + 14],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 0.2, 1) },
  );
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: VEIL_FROM,
          height: H - VEIL_FROM,
          opacity: veil,
          backgroundImage:
            "linear-gradient(180deg, rgba(255,246,231,0) 0%, rgba(255,246,231,0.5) 12%, rgba(255,246,231,0.9) 24%, rgba(255,246,231,0.94) 100%)",
        }}
      />
      <TurnSentence
        lines={TURN.firstLines}
        emphasis={lastWord(TURN.first)}
        top={SUB_TOP}
        inFrom={TURN_TIMING.firstIn}
        outFrom={FIRST_SUBTITLE_OUT}
        fontSize={SUB.fontSize}
        lineHeight={SUB.lineHeight}
        weight={FONT.weight.semibold}
        emphasisWeight={FONT.weight.bold}
        letterSpacing={-0.4}
        color={COLORS.ink}
        markerColor={null}
      />
      <TurnSentence
        lines={TURN.secondLines}
        emphasis={lastWord(TURN.second)}
        top={SUB_TOP}
        inFrom={TURN_TIMING.secondIn}
        outFrom={TURN_TIMING.exitFrom}
        fontSize={SUB.fontSize}
        lineHeight={SUB.lineHeight}
        weight={FONT.weight.semibold}
        emphasisWeight={FONT.weight.bold}
        letterSpacing={-0.4}
        color={COLORS.ink}
        markerColor={null}
      />
    </>
  );
};

