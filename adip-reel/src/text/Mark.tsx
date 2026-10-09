import React from "react";
import { mulberry32 } from "../lib/rng.ts";
import { baselineOffset, type TextStyleSpec } from "./style.ts";

/**
 * ÉNFASIS A MANO sobre una palabra (determinista: trazo sembrado con rng). Dos variantes:
 *  · "underline": subrayado fino de marcador (trazo redondeado, ligera pendiente y ondulación) debajo de la palabra y de sus
 *    descendentes; no toca el texto (S3, violeta sobre naranja: 3,01:1).
 *  · "marker": banda de marcador DETRÁS de la mitad inferior de la palabra; el texto sigue negro sobre el acento (S5, amarillo:
 *    13,8:1) y nunca choca con el renglón de abajo.
 * Se dibuja de izquierda a derecha según `progress` (0–1) recortando el SVG (sin dash ni filtros).
 * La palabra se envuelve en un inline-block: el ancho del trazo sale solo del ancho real del texto (sin medir).
 */
export type MarkVariant = "underline" | "marker";

type Props = {
  readonly children: string;
  readonly variant: MarkVariant;
  readonly color: string;
  /** 0 = sin trazo, 1 = trazo completo */
  readonly progress: number;
  /** estilo del texto de la línea (para ubicar el trazo respecto de la línea base) */
  readonly textStyle: TextStyleSpec;
  readonly seed: number;
};

/** Trazo del subrayado en un viewBox 100 × 16 (se estira solo en x; el grosor es constante: vector-effect). */
const underlinePath = (seed: number): string => {
  const r = mulberry32(seed);
  const j = () => (r() - 0.5) * 2;
  const y0 = 9.4 + j() * 0.8;
  const y1 = 7.4 + j() * 0.9;
  const y2 = 5.6 + j() * 0.8;
  return `M 2 ${y0.toFixed(2)} C 22 ${(y0 - 3 + j()).toFixed(2)}, 40 ${(y1 + 2.4 + j()).toFixed(2)}, 62 ${y1.toFixed(2)} S 92 ${(y2 + 1.8 + j()).toFixed(2)}, 98 ${y2.toFixed(2)}`;
};

/** Curva cerrada suave (Catmull-Rom → Bézier) por una lista de puntos. */
const smoothClosed = (pts: readonly (readonly [number, number])[]): string => {
  const n = pts.length;
  const p = (i: number) => pts[(i + n) % n];
  let d = `M ${p(0)[0].toFixed(2)} ${p(0)[1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return `${d} Z`;
};

/** Banda de marcador en un viewBox 100 × 100 (bordes irregulares, extremos redondeados). */
const markerPath = (seed: number): string => {
  const r = mulberry32(seed);
  const j = (a: number) => (r() - 0.5) * 2 * a;
  const top: [number, number][] = [];
  const bottom: [number, number][] = [];
  const N = 8;
  for (let i = 0; i <= N; i++) {
    const x = 3 + (94 * i) / N;
    top.push([x + j(0.8), 12 + j(5) + (i / N) * -4]);
    bottom.push([x + j(0.8), 90 + j(5) + (i / N) * -2]);
  }
  // extremos: puntas redondeadas (un punto de cada lado, algo hacia afuera)
  const pts: [number, number][] = [
    ...top,
    [100 + j(0.6), 36 + j(4)],
    [99 + j(0.6), 64 + j(4)],
    ...bottom.reverse(),
    [0 + j(0.6), 68 + j(4)],
    [0 + j(0.6), 34 + j(4)],
  ];
  return smoothClosed(pts);
};

export const Mark: React.FC<Props> = ({ children, variant, color, progress, textStyle, seed }) => {
  const { size } = textStyle;
  const base = baselineOffset(textStyle);
  const reveal = `inset(-20% ${((1 - Math.min(1, Math.max(0, progress))) * 100).toFixed(2)}% -20% -6%)`;

  let svg: React.ReactNode;
  if (variant === "underline") {
    // centro del trazo 0,30 em bajo la línea base (por debajo de los descendentes: 0,203 em); grosor 0,10 em
    const h = size * 0.2;
    const center = base + size * 0.3;
    svg = (
      <svg
        aria-hidden
        viewBox="0 0 100 16"
        preserveAspectRatio="none"
        style={{ position: "absolute", left: -size * 0.04, width: `calc(100% + ${size * 0.08}px)`, top: center - h / 2, height: h, overflow: "visible", clipPath: reveal, pointerEvents: "none" }}
      >
        <path d={underlinePath(seed)} fill="none" stroke={color} strokeWidth={size * 0.1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  } else {
    // banda detrás de la mitad inferior de la palabra: de 0,31 em sobre la línea base a 0,17 em bajo ella
    const top = base - size * 0.31;
    const h = size * 0.48;
    svg = (
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", left: -size * 0.06, width: `calc(100% + ${size * 0.17}px)`, top, height: h, overflow: "visible", clipPath: reveal, rotate: "-0.8deg", pointerEvents: "none" }}
      >
        <path d={markerPath(seed)} fill={color} />
      </svg>
    );
  }

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {svg}
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );
};

