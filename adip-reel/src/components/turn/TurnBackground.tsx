import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { COLORS } from "../../config/brand.ts";
import { H, W } from "../../config/layout.ts";
import { OVERLAP, SCENES } from "../../config/timeline.ts";
import { useAbsFrame } from "../../lib/scene.ts";

/**
 * Fondo cálido de la escena 3 (versión alternativa sin grabación).
 * Crema → durazno, con formas orgánicas grandes y desenfocadas en naranja y amarillo de la paleta
 * oficial que casi no se mueven, y un halo crema detrás del texto que garantiza contraste ≥ 7:1.
 * Las manchas de color viven en la periferia; el centro (donde está el texto) queda claro.
 */

/** Siluetas orgánicas (viewBox 400×400). */
const BLOB_A =
  "M200 18 C300 8 392 98 382 208 C372 320 282 396 182 382 C80 368 14 292 24 190 C34 90 108 28 200 18 Z";
const BLOB_B =
  "M214 24 C318 34 384 124 372 228 C360 326 272 388 170 370 C70 352 20 266 34 170 C48 78 126 14 214 24 Z";
const BLOB_C =
  "M190 30 C290 14 380 84 378 190 C376 300 300 388 196 376 C92 364 22 300 26 200 C30 104 96 44 190 30 Z";

type BlobProps = {
  readonly path: string;
  readonly color: string;
  readonly cx: number;
  readonly cy: number;
  readonly size: number;
  readonly blur: number;
  /** deriva lentísima [dx, dy] en px a lo largo de la escena */
  readonly drift: readonly [number, number];
  readonly spin: number;
  readonly grow: number;
  readonly t: number;
};

const Blob: React.FC<BlobProps> = ({ path, color, cx, cy, size, blur, drift, spin, grow, t }) => (
  <svg
    viewBox="0 0 400 400"
    aria-hidden
    style={{
      position: "absolute",
      left: cx - size / 2,
      top: cy - size / 2,
      width: size,
      height: size,
      overflow: "visible",
      filter: `blur(${blur}px)`,
      translate: `${drift[0] * t}px ${drift[1] * t}px`,
      rotate: `${spin * t}deg`,
      scale: 1 + grow * t,
    }}
  >
    <path d={path} fill={color} />
  </svg>
);

export const TurnBackground: React.FC = () => {
  const frame = useAbsFrame(SCENES.s3.from);
  // t: 0 → 1 a lo largo de la ventana de la escena (+ solape); movimiento casi imperceptible
  const t = interpolate(frame, [SCENES.s3.from, SCENES.s3.to + OVERLAP], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });

  return (
    <AbsoluteFill
      style={{
        width: W,
        height: H,
        backgroundColor: COLORS.cream,
        backgroundImage:
          "linear-gradient(180deg, #FFF6E7 0%, #FFEACB 46%, #FFDDB6 100%)",
        overflow: "hidden",
      }}
    >
      {/* Manchas periféricas (naranja y amarillo oficiales) */}
      <Blob path={BLOB_A} color="rgba(254, 128, 28, 0.78)" cx={1010} cy={1700} size={980} blur={110} drift={[-46, -34]} spin={9} grow={0.06} t={t} />
      <Blob path={BLOB_B} color="rgba(255, 203, 1, 0.72)" cx={70} cy={250} size={900} blur={110} drift={[40, 36]} spin={-8} grow={0.05} t={t} />
      <Blob path={BLOB_C} color="rgba(254, 128, 28, 0.46)" cx={-40} cy={1760} size={640} blur={100} drift={[34, -28]} spin={-7} grow={0.05} t={t} />
      <Blob path={BLOB_A} color="rgba(255, 203, 1, 0.55)" cx={1090} cy={150} size={560} blur={100} drift={[-30, 30]} spin={6} grow={0.04} t={t} />

      {/* Halo crema detrás del texto: mantiene el contraste del bloque central */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(ellipse 760px 640px at 50% 50%, rgba(255, 246, 231, 0.94) 0%, rgba(255, 246, 231, 0.78) 55%, rgba(255, 246, 231, 0) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
