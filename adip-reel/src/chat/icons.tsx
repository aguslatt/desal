import type React from "react";
import { COLORS } from "../config/brand.ts";

/**
 * Íconos del chat dibujados a mano (SVG de trazo redondeado, `currentColor`). Neutros: sin marcas ni logos.
 */
type IconProps = { readonly size?: number; readonly stroke?: number; readonly style?: React.CSSProperties };

const base = (w: number, h: number, size: number | undefined, style?: React.CSSProperties) => ({
  width: size ?? w,
  height: size ? (size * h) / w : h,
  viewBox: `0 0 ${w} ${h}`,
  fill: "none",
  style: { display: "block", overflow: "visible", ...style },
});

const round = { strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Flecha «atrás» (chevron izquierdo). */
export const BackChevron: React.FC<IconProps> = ({ size, stroke = 8, style }) => (
  <svg {...base(40, 64, size, style)} stroke="currentColor" strokeWidth={stroke} {...round}>
    <path d="M32 6 L8 32 L32 58" />
  </svg>
);

/** Símbolo «+» (adjuntar). */
export const Plus: React.FC<IconProps> = ({ size, stroke = 7, style }) => (
  <svg {...base(40, 40, size, style)} stroke="currentColor" strokeWidth={stroke} {...round}>
    <path d="M20 4 V36 M4 20 H36" />
  </svg>
);

/** Flecha hacia arriba (enviar). */
export const ArrowUp: React.FC<IconProps> = ({ size, stroke = 8, style }) => (
  <svg {...base(48, 52, size, style)} stroke="currentColor" strokeWidth={stroke} {...round}>
    <path d="M24 48 V6 M6 24 L24 6 L42 24" />
  </svg>
);

/** Borrar (⌫): etiqueta apuntando a la izquierda con una cruz. */
export const BackspaceIcon: React.FC<IconProps> = ({ size, stroke = 6, style }) => (
  <svg {...base(84, 60, size, style)} stroke="currentColor" strokeWidth={stroke} {...round}>
    <path d="M30 5 H74 A8 8 0 0 1 82 13 V47 A8 8 0 0 1 74 55 H30 A9 9 0 0 1 22.6 51 L4 30 L22.6 9 A9 9 0 0 1 30 5 Z" />
    <path d="M40 20 L62 40 M62 20 L40 40" />
  </svg>
);

/** Mayúsculas (⇧). `fill` 0–1 rellena la flecha cuando está activa. */
export const ShiftIcon: React.FC<IconProps & { readonly fill?: number }> = ({ size, stroke = 6, style, fill = 0 }) => (
  <svg {...base(56, 60, size, style)} stroke="currentColor" strokeWidth={stroke} {...round}>
    <path d="M28 5 L4 30 H17 V53 H39 V30 H52 Z" fill="currentColor" fillOpacity={fill} />
  </svg>
);

/** Carita (tecla de emojis), dibujada (no es un emoji del sistema). */
export const SmileIcon: React.FC<IconProps> = ({ size, stroke = 5.5, style }) => (
  <svg {...base(60, 60, size, style)} stroke="currentColor" strokeWidth={stroke} {...round}>
    <circle cx="30" cy="30" r="25" />
    <circle cx="21.5" cy="24" r="2.6" fill="currentColor" stroke="none" />
    <circle cx="38.5" cy="24" r="2.6" fill="currentColor" stroke="none" />
    <path d="M18.5 35 Q30 46.5 41.5 35" />
  </svg>
);

/** Retorno (↵) de la tecla Enter. */
export const EnterIcon: React.FC<IconProps> = ({ size, stroke = 6, style }) => (
  <svg {...base(64, 52, size, style)} stroke="currentColor" strokeWidth={stroke} {...round}>
    <path d="M58 6 V30 A8 8 0 0 1 50 38 H8" />
    <path d="M22 24 L8 38 L22 52" transform="translate(0 -6)" />
  </svg>
);

/** Cámara de video (acción de cabecera). */
export const VideoIcon: React.FC<IconProps> = ({ size, stroke = 5.5, style }) => (
  <svg {...base(64, 44, size, style)} stroke="currentColor" strokeWidth={stroke} {...round}>
    <rect x="4" y="4" width="38" height="36" rx="9" />
    <path d="M42 17 L58 8 V36 L42 27" />
  </svg>
);

/** Menú de tres puntos (acción de cabecera). */
export const KebabIcon: React.FC<IconProps> = ({ size, style }) => (
  <svg {...base(12, 52, size, style)} fill="currentColor">
    <circle cx="6" cy="6" r="5" />
    <circle cx="6" cy="26" r="5" />
    <circle cx="6" cy="46" r="5" />
  </svg>
);

/** Avatar: círculo blanco con silueta simple (cabeza y hombros) en `tone`. */
export const AvatarPerson: React.FC<{ readonly size: number; readonly tone: string }> = ({ size, tone }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
    <circle cx="50" cy="50" r="50" fill={COLORS.white} />
    <circle cx="50" cy="38" r="15" fill={tone} />
    <path d="M22 84 C22 64 34 57 50 57 C66 57 78 64 78 84 C70 92 30 92 22 84 Z" fill={tone} />
  </svg>
);

// ───────────────────────── barra de estado (solo íconos, sin texto)
export const SignalIcon: React.FC<IconProps> = ({ size, style }) => (
  <svg {...base(40, 30, size, style)} fill="currentColor">
    <rect x="0" y="20" width="7" height="10" rx="2" />
    <rect x="11" y="14" width="7" height="16" rx="2" />
    <rect x="22" y="7" width="7" height="23" rx="2" />
    <rect x="33" y="0" width="7" height="30" rx="2" />
  </svg>
);

export const WifiIcon: React.FC<IconProps> = ({ size, style }) => (
  <svg {...base(42, 30, size, style)} fill="currentColor">
    <path d="M21 30 L14.5 22.5 A9.2 9.2 0 0 1 27.5 22.5 Z" />
    <path d="M9.4 16.6 A16.5 16.5 0 0 1 32.6 16.6" fill="none" stroke="currentColor" strokeWidth="4.6" strokeLinecap="round" />
    <path d="M3.4 10.4 A25 25 0 0 1 38.6 10.4" fill="none" stroke="currentColor" strokeWidth="4.6" strokeLinecap="round" />
  </svg>
);

export const BatteryIcon: React.FC<IconProps> = ({ size, style }) => (
  <svg {...base(58, 30, size, style)}>
    <rect x="1.5" y="1.5" width="48" height="27" rx="8" stroke="currentColor" strokeWidth="3" />
    <rect x="6.5" y="6.5" width="31" height="17" rx="4" fill="currentColor" />
    <rect x="52.5" y="10" width="4" height="10" rx="2" fill="currentColor" />
  </svg>
);
