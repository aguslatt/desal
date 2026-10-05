import React from "react";
import { CanvasImage, staticFile, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { COLORS } from "../config/brand.ts";
import { BrandPlane } from "./companion/BrandPlane.tsx";

/**
 * MediaSlot · plano reutilizable "listo para reemplazar".
 *  - `src` termina en .mp4 / .mov / .webm / .m4v → <Video> de @remotion/media (cover, silenciado, en bucle).
 *  - `src` es una imagen (.png, .jpg, .webp…)    → <CanvasImage fit="cover">.
 *  - `src` es null / vacío                       → composición gráfica de marca (BrandPlane, variante `variant`).
 * `src` es una ruta relativa a public/ (p. ej. "media/consultorio.mp4") o una URL absoluta.
 *
 * El componente no anima su propia entrada: quien lo usa le pasa `style` (posición, opacidad, escala…).
 * Todo lo que depende del tiempo usa fotogramas ABSOLUTOS (`frame`, `start`); `sceneFrom` es el fotograma absoluto
 * en que arranca la secuencia padre (para que el video empiece exactamente cuando entra el plano).
 */
export type MediaSlotProps = {
  readonly src: string | null | undefined;
  /** variante gráfica de marca cuando no hay medio real (0 = ancho, 1 = arco, 2 = hoja) */
  readonly variant: number;
  readonly width: number;
  readonly height: number;
  /** border-radius CSS (número en px o cadena de 1–4 valores) */
  readonly radius: number | string;
  /** fotograma absoluto actual */
  readonly frame: number;
  /** fotograma absoluto en que el plano entra (arranca el trazo gráfico / el video) */
  readonly start: number;
  /** fotograma absoluto en que empieza la secuencia padre (0 si el medio se usa solo) */
  readonly sceneFrom: number;
  /** progreso 0 → 1 de la deriva continua (parallax / paseo lentísimo) */
  readonly drift: number;
  readonly style?: React.CSSProperties;
};

const VIDEO_EXT = /\.(mp4|mov|webm|m4v)(\?.*)?(#.*)?$/iu;
const ABSOLUTE_URL = /^(https?:|data:|blob:)/u;

export const isVideoSrc = (src: string): boolean => VIDEO_EXT.test(src);
export const resolveMediaSrc = (src: string): string => (ABSOLUTE_URL.test(src) ? src : staticFile(src));

export const MediaSlot: React.FC<MediaSlotProps> = ({
  src,
  variant,
  width,
  height,
  radius,
  frame,
  start,
  sceneFrom,
  drift,
  style,
}) => {
  const { fps } = useVideoConfig();
  const hasMedia = typeof src === "string" && src.trim() !== "";

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: radius,
        // sombra muy suave (ink al 6–10 %): el plano "flota" sobre el crema sin ensuciarlo
        boxShadow: "0 22px 44px -22px rgba(7, 68, 52, 0.10), 0 2px 8px rgba(7, 68, 52, 0.06)",
        backgroundColor: COLORS.cream,
        ...style,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: radius, overflow: "hidden", backgroundColor: COLORS.grey }}>
        {!hasMedia ? (
          <BrandPlane variant={variant} frame={frame} start={start} drift={drift} />
        ) : isVideoSrc(src) ? (
          <Video
            name="Medio"
            src={resolveMediaSrc(src)}
            from={start - sceneFrom}
            premountFor={fps}
            objectFit="cover"
            muted
            loop
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              // paseo muy lento (Ken Burns) para que el plano respire
              scale: 1 + 0.06 * drift,
            }}
          />
        ) : (
          <CanvasImage
            name="Medio"
            src={resolveMediaSrc(src)}
            width={width}
            height={height}
            fit="cover"
            premountFor={fps}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              scale: 1 + 0.06 * drift,
            }}
          />
        )}
      </div>
    </div>
  );
};
