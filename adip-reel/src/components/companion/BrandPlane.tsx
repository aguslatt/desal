import React from "react";
import { Easing, interpolate } from "remotion";
import { COLORS } from "../../config/brand.ts";

/**
 * Planos gráficos de marca (alternativa a las fotos/videos reales de ADIP).
 * Formas abstractas inspiradas en el trazo del logo: arcos, bucles y círculos como "cabezas" abstractas,
 * trazos redondeados con degradé de la paleta oficial (violeta, rosa, naranja, amarillo, verde).
 * Sin figuras humanas realistas, sin caras, sin texto.
 *
 *  variante 0 · "equipo"   — tres arcos con su círculo (plano ancho, 840×430)
 *  variante 1 · "escucha"  — ondas concéntricas que nacen de un círculo (ventana en arco, 408×470)
 *  variante 2 · "a tu ritmo" — dos círculos que avanzan juntos sobre una ola calma (hoja, 408×470)
 *
 * Todo depende de `frame` (fotograma ABSOLUTO): el trazo se dibuja al entrar y luego hay una deriva lentísima.
 * El SVG usa `slice`: si el plano se reutiliza con otro tamaño, la composición se recorta sin deformarse.
 */
export const PLANE_SIZES = [
  { w: 840, h: 430 },
  { w: 408, h: 470 },
  { w: 408, h: 470 },
] as const;

export type BrandPlaneProps = {
  readonly variant: number;
  /** fotograma absoluto actual */
  readonly frame: number;
  /** fotograma absoluto en que el plano empieza a dibujarse */
  readonly start: number;
  /** progreso 0 → 1 de la deriva continua (parallax) */
  readonly drift: number;
};

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const DRAW_EASE = Easing.bezier(0.5, 0, 0.2, 1);
const POP_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** 0 → 1 con ease in-out suave. */
const draw = (frame: number, from: number, dur: number): number =>
  interpolate(frame, [from, from + dur], [0, 1], { ...CLAMP, easing: DRAW_EASE });
/** 0 → 1 con ease-out (aparición de círculos), sin rebote. */
const pop = (frame: number, from: number, dur: number): number =>
  interpolate(frame, [from, from + dur], [0, 1], { ...CLAMP, easing: POP_EASE });
/** oscilación lenta: periodo en fotogramas, fase en vueltas. */
const sway = (frame: number, period: number, phase: number): number => Math.sin(((frame / period) + phase) * Math.PI * 2);

/** Trazo con extremos redondeados que se "dibuja" de un extremo al otro (pathLength = 1). */
const Stroke: React.FC<{
  readonly d: string;
  readonly width: number;
  readonly stroke: string;
  readonly progress: number;
  readonly opacity?: number;
}> = ({ d, width, stroke, progress, opacity = 1 }) => (
  <path
    d={d}
    pathLength={1}
    fill="none"
    stroke={stroke}
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeDasharray="1 1"
    strokeDashoffset={1 - progress}
    opacity={progress > 0.002 ? opacity : 0}
  />
);

/** Círculo ("cabeza" abstracta) que aparece con escala suave. */
const Dot: React.FC<{
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly fill: string;
  readonly progress: number;
  readonly opacity?: number;
}> = ({ cx, cy, r, fill, progress, opacity = 1 }) => (
  <circle
    cx={cx}
    cy={cy}
    r={Math.max(0.001, r * (0.35 + 0.65 * progress))}
    fill={fill}
    opacity={opacity * Math.min(1, progress * 2.2)}
  />
);

/** Textura "gouache": bordes apenas irregulares + moteado de opacidad, fijos en el espacio del trazo. */
const PaintFilter: React.FC<{ readonly id: string; readonly w: number; readonly h: number; readonly seed: number }> = ({ id, w, h, seed }) => (
  <filter
    id={id}
    filterUnits="userSpaceOnUse"
    x={-60}
    y={-60}
    width={w + 120}
    height={h + 120}
    colorInterpolationFilters="sRGB"
  >
    <feTurbulence type="fractalNoise" baseFrequency="0.016 0.02" numOctaves="2" seed={seed} result="warp" />
    <feDisplacementMap in="SourceGraphic" in2="warp" scale="8" xChannelSelector="R" yChannelSelector="G" result="shape" />
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed={seed + 5} result="mottle" />
    <feColorMatrix
      in="mottle"
      type="matrix"
      values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.4 0 0 0 0.74"
      result="mottleAlpha"
    />
    <feComposite in="shape" in2="mottleAlpha" operator="in" />
  </filter>
);

/** Grano fino y fijo: evita el "banding" de los degradés al codificar en H.264 y da calidez de papel. */
const Grain: React.FC<{ readonly id: string; readonly seed: number }> = ({ id, seed }) => (
  <svg
    aria-hidden
    width="100%"
    height="100%"
    style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "overlay", opacity: 0.3, pointerEvents: "none" }}
  >
    <filter id={id} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#${id})`} />
  </svg>
);

/* ───────────────────────── variante 0 · equipo ───────────────────────── */

type FigureSpec = {
  readonly cx: number;
  readonly shoulderY: number;
  readonly archR: number;
  readonly armW: number;
  readonly headR: number;
  readonly headY: number;
  readonly body: string;
  readonly head: string;
  readonly delay: number;
  readonly phase: number;
};

const FIGURES: readonly FigureSpec[] = [
  { cx: 176, shoulderY: 350, archR: 80, armW: 52, headR: 44, headY: 170, body: COLORS.cream, head: COLORS.yellow, delay: 6, phase: 0.1 },
  { cx: 420, shoulderY: 300, archR: 102, armW: 60, headR: 58, headY: 92, body: COLORS.cream, head: COLORS.orange, delay: 0, phase: 0.45 },
  { cx: 664, shoulderY: 356, archR: 72, armW: 48, headR: 40, headY: 184, body: COLORS.cream, head: COLORS.yellow, delay: 12, phase: 0.8 },
];

const TeamPlane: React.FC<BrandPlaneProps> = ({ frame, start, drift }) => {
  const W = PLANE_SIZES[0].w;
  const H = PLANE_SIZES[0].h;
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <PaintFilter id="c4-paint-0" w={W} h={H} seed={3} />
        </defs>
        {/* halo grande y suave detrás: capa de fondo (deriva en sentido contrario) */}
        <g style={{ translate: `${10 * drift}px ${-4 * drift}px` }}>
          <circle cx={430} cy={330} r={262} fill="rgba(255,246,231,0.10)" opacity={pop(frame, start, 40)} />
          <circle cx={430} cy={330} r={176} fill="rgba(255,246,231,0.08)" opacity={pop(frame, start + 6, 40)} />
          <circle cx={744} cy={70} r={92} fill="rgba(255,203,1,0.28)" opacity={pop(frame, start + 10, 44)} />
        </g>
        {/* figuras: arco (cuerpo) + círculo (cabeza) */}
        <g style={{ translate: `${-16 * drift}px ${5 * drift}px` }}>
          <g filter="url(#c4-paint-0)">
            {FIGURES.map((f) => {
              const p = draw(frame, start + 4 + f.delay, 44);
              const bob = sway(frame, 84, f.phase);
              const headPop = pop(frame, start + 30 + f.delay, 26);
              const baseY = H + 44;
              const d = `M ${f.cx - f.archR} ${baseY} L ${f.cx - f.archR} ${f.shoulderY} A ${f.archR} ${f.archR} 0 0 1 ${f.cx + f.archR} ${f.shoulderY} L ${f.cx + f.archR} ${baseY}`;
              return (
                <g key={f.cx} style={{ translate: `0px ${bob * 4}px` }}>
                  <Stroke d={d} width={f.armW} stroke={f.body} progress={p} />
                  <g style={{ translate: `0px ${-bob * 3}px` }}>
                    <Dot cx={f.cx} cy={f.headY} r={f.headR} fill={f.head} progress={headPop} />
                  </g>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </>
  );
};

/* ───────────────────────── variante 1 · escucha ───────────────────────── */

const WAVES = [
  { r: 84, w: 24, color: COLORS.pink, delay: 10 },
  { r: 126, w: 24, color: COLORS.cream, delay: 18 },
  { r: 168, w: 24, color: COLORS.purple, delay: 26 },
] as const;

const ListenPlane: React.FC<BrandPlaneProps> = ({ frame, start, drift }) => {
  const W = PLANE_SIZES[1].w;
  const H = PLANE_SIZES[1].h;
  const cx = W / 2;
  const cy = 322;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <PaintFilter id="c4-paint-1" w={W} h={H} seed={11} />
      </defs>
      <g style={{ translate: `${-8 * drift}px ${8 * drift}px` }}>
        <circle cx={cx} cy={cy} r={252} fill="rgba(255,246,231,0.14)" opacity={pop(frame, start, 40)} />
      </g>
      <g style={{ translate: `${6 * drift}px ${-6 * drift}px` }}>
        <g filter="url(#c4-paint-1)">
          {WAVES.map((wv, i) => {
            const p = draw(frame, start + wv.delay, 34);
            // el eco se expande hacia afuera con un respirar casi imperceptible
            const breathe = 1 + 0.016 * sway(frame, 96, 0.18 - i * 0.12);
            return (
              <g key={wv.r} style={{ transformOrigin: `${cx}px ${cy}px`, scale: breathe }}>
                <Stroke d={`M ${cx - wv.r} ${cy} A ${wv.r} ${wv.r} 0 0 1 ${cx + wv.r} ${cy}`} width={wv.w} stroke={wv.color} progress={p} opacity={0.96} />
              </g>
            );
          })}
          <g style={{ translate: `0px ${sway(frame, 84, 0.3) * 3}px` }}>
            <Dot cx={cx} cy={cy + 10} r={36} fill={COLORS.purple} progress={pop(frame, start + 4, 28)} />
          </g>
        </g>
      </g>
    </svg>
  );
};

/* ───────────────────────── variante 2 · a tu ritmo ───────────────────────── */

const waveY = (x: number, base: number, amp: number, phase: number): number =>
  base + amp * Math.sin((x / 300) * Math.PI * 2 + phase);

const wavePath = (w: number, base: number, amp: number, phase: number): string => {
  const pts: string[] = [];
  for (let x = -40; x <= w + 40; x += 8) pts.push(`${x === -40 ? "M" : "L"} ${x} ${waveY(x, base, amp, phase).toFixed(2)}`);
  return pts.join(" ");
};

const RhythmPlane: React.FC<BrandPlaneProps> = ({ frame, start, drift }) => {
  const W = PLANE_SIZES[2].w;
  const H = PLANE_SIZES[2].h;
  // las dos "cabezas" avanzan juntas, muy despacio, sobre la ola principal
  const xBig = 128 + 70 * drift;
  const xSmall = 128 + 118 + 70 * drift;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <PaintFilter id="c4-paint-2" w={W} h={H} seed={19} />
        <linearGradient id="c4-wave-grad" gradientUnits="userSpaceOnUse" x1={-40} y1={0} x2={W + 40} y2={0}>
          <stop offset="0" stopColor={COLORS.purple} />
          <stop offset="0.5" stopColor={COLORS.pink} />
          <stop offset="1" stopColor={COLORS.orange} />
        </linearGradient>
      </defs>
      <g style={{ translate: `${12 * drift}px ${-6 * drift}px` }}>
        <circle cx={316} cy={116} r={82} fill="rgba(255,246,231,0.30)" opacity={pop(frame, start, 44)} />
      </g>
      <g style={{ translate: `${-8 * drift}px ${4 * drift}px` }}>
        <g filter="url(#c4-paint-2)">
          <Stroke d={wavePath(W, 392, 40, 1.1)} width={14} stroke={COLORS.cream} progress={draw(frame, start + 18, 44)} opacity={0.8} />
          <Stroke d={wavePath(W, 318, 58, 0)} width={36} stroke="url(#c4-wave-grad)" progress={draw(frame, start + 6, 48)} />
          <Dot cx={xBig} cy={waveY(xBig, 318, 58, 0) - 2} r={42} fill={COLORS.cream} progress={pop(frame, start + 36, 26)} />
          <Dot cx={xSmall} cy={waveY(xSmall, 318, 58, 0) - 2} r={28} fill={COLORS.purple} progress={pop(frame, start + 44, 26)} />
        </g>
      </g>
    </svg>
  );
};

/* ───────────────────────── contenedor ───────────────────────── */

/** Fondo en degradé de la paleta oficial por variante. */
const BACKGROUNDS = [
  "radial-gradient(circle at 82% 14%, rgba(255,203,1,0.34) 0%, rgba(255,203,1,0) 46%), linear-gradient(115deg, #8A00B7 0%, #C2189F 40%, #ED2995 66%, #FE801C 122%)",
  "radial-gradient(circle at 24% 96%, rgba(237,41,149,0.30) 0%, rgba(237,41,149,0) 55%), linear-gradient(180deg, #FFCB01 0%, #FFA70F 52%, #FE801C 100%)",
  "radial-gradient(circle at 10% 8%, rgba(255,246,231,0.30) 0%, rgba(255,246,231,0) 50%), linear-gradient(160deg, #94C920 0%, #BFCB14 54%, #FFCB01 112%)",
] as const;

export const BrandPlane: React.FC<BrandPlaneProps> = (props) => {
  const v = ((Math.round(props.variant) % 3) + 3) % 3;
  return (
    <div style={{ position: "absolute", inset: 0, backgroundImage: BACKGROUNDS[v], overflow: "hidden" }}>
      {v === 0 ? <TeamPlane {...props} /> : v === 1 ? <ListenPlane {...props} /> : <RhythmPlane {...props} />}
      <Grain id={`c4-grain-${v}`} seed={7 + v * 3} />
    </div>
  );
};
