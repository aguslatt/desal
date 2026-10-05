import React from "react";
import { H, W } from "../../config/layout.ts";
import { type GlintStop, type ThreadShape, pathData } from "./geometry.ts";

/**
 * Dibuja la cinta del hilo: un único trazo SVG (extremos y uniones redondos).
 * Con `glint` el color del trazo es un degradado en coordenadas absolutas (x 0 → W) cuya banda
 * más luminosa recorre la línea; sin él, el trazo es del color plano de marca.
 */
export const ThreadStroke: React.FC<{
  readonly shape: ThreadShape;
  readonly color: string;
  readonly glint: readonly GlintStop[] | null;
  /** opacidad (0–0.3) de la sombra cálida; 0 en el traspaso del cursor para que sea idéntico al de la escena 2 */
  readonly shadow: number;
}> = ({ shape, color, glint, shadow }) => (
  <svg
    width={W}
    height={H}
    viewBox={`0 0 ${W} ${H}`}
    aria-hidden
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      overflow: "visible",
      // sombra cálida muy fina: separa el trazo del fondo durazno sin ensuciar el naranja
      filter: shadow > 0 ? `drop-shadow(0px 2px 2.5px rgba(214, 90, 0, ${shadow.toFixed(3)}))` : undefined,
    }}
  >
    {glint ? (
      <defs>
        <linearGradient id="thread-glint" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={W} y2={0}>
          {glint.map((s, i) => (
            <stop key={i} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
    ) : null}
    <path
      d={pathData(shape.points)}
      fill="none"
      stroke={glint ? "url(#thread-glint)" : color}
      strokeWidth={shape.width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
