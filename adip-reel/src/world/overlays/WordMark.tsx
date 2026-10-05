import React from "react";
import { COLORS } from "../../config/brand.ts";
import { CrayonStroke } from "../../illustration/crayon.tsx";
import { MONT, baselineIn } from "./typography.ts";

/**
 * Énfasis a mano con crayón naranja (el mismo trazo granulado del hilo): un MARCADOR detrás de la parte baja de la
 * palabra o un SUBRAYADO por debajo. Se dibuja con `progress` (0..1) y queda quieto: no mueve el texto, que sigue oscuro.
 *
 * Va DENTRO de un <span> inline-block que envuelve la palabra (la caja de la palabra define el ancho real) y su origen es
 * la esquina superior izquierda de la caja de línea (alto `lineHeight`); la línea base cae en `baselineIn(fontSize, lineHeight)`.
 * El <svg> se estira al ancho real de la palabra (preserveAspectRatio="none" solo estira a lo largo del trazo: el grosor no cambia).
 */
export type MarkKind = "highlight" | "underline";

type Props = {
  readonly kind: MarkKind;
  /** ancho medido de la palabra (px) */
  readonly wordWidth: number;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly progress: number;
  readonly seed: number;
  /** opacidad del trazo (el marcador deja ver el papel: el texto conserva ≥ 4,5:1) */
  readonly opacity?: number;
  /** subrayado: separación (px) entre la línea base y el borde superior del trazo */
  readonly gap?: number;
};

/** motas de pigmento más claras que el naranja del hilo: sobre el marcador el texto oscuro conserva ≥ 4,5:1 */
const SHADE = "#F58A2B";
const CAMERA = { scale: 1, cx: 540, cy: 960 } as const; // capa de pantalla: 1 u = 1 px

export const WordMark: React.FC<Props> = ({ kind, wordWidth, fontSize, lineHeight, progress, seed, opacity = 1, gap = 16 }) => {
  if (progress <= 0.001) return null;
  const base = baselineIn(fontSize, lineHeight);
  const w = Math.max(wordWidth, 10);

  let points: [number, number][];
  let strokeWidth: number;
  let startWidth: number;
  let endWidth: number;
  if (kind === "highlight") {
    // marcador-subrayado grueso, DETRÁS: una pincelada pegada a la línea base (cubre el pie de las letras y asoma un poco por
    // debajo); no cruza la altura de x (así no se lee como un tachado). Los extremos redondeados asoman ≈ 0,05 em por los
    // costados: el eje se acorta media tapa para que sobresalga el borde visible y no el centro del trazo.
    const t = fontSize * 0.46;
    const yc = base - fontSize * 0.05;
    const out = fontSize * 0.05;
    const x0 = -out + t * 0.5;
    const x1 = w + out - t * 0.5;
    points = [
      [x0, yc + fontSize * 0.022],
      [(x0 + x1) / 2, yc - fontSize * 0.012],
      [x1, yc - fontSize * 0.03],
    ];
    strokeWidth = t / 1.2;
    startWidth = 0.95;
    endWidth = 0.85;
  } else {
    // subrayado: línea de crayón algo ondulada, separada de las letras
    const t = Math.max(11, fontSize * 0.16);
    const yc = base + gap + t / 2;
    const out = fontSize * 0.03;
    const x0 = -out + t * 0.5;
    const x1 = w + out - t * 0.5;
    const L = x1 - x0;
    points = [
      [x0, yc + 2.5],
      [x0 + L * 0.28, yc - 2.5],
      [x0 + L * 0.62, yc + 2],
      [x1, yc - 3],
    ];
    strokeWidth = t / 1.2;
    startWidth = 0.8;
    endWidth = 0.7;
  }

  return (
    <svg
      viewBox={`0 0 ${w} ${lineHeight}`}
      preserveAspectRatio="none"
      style={{ position: "absolute", left: 0, top: 0, width: "100%", height: lineHeight, overflow: "visible", zIndex: -1, pointerEvents: "none" }}
    >
      <CrayonStroke
        points={points}
        progress={progress}
        width={strokeWidth}
        seed={seed}
        camera={CAMERA}
        color={COLORS.orange}
        shade={SHADE}
        startWidth={startWidth}
        endWidth={endWidth}
        opacity={opacity}
      />
    </svg>
  );
};
