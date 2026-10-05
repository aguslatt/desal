import type React from "react";
import { COLORS } from "../../config/brand.ts";
import { SAFE } from "../../config/layout.ts";

/**
 * Encabezado decorativo de la mensajería (SIN texto, sin nombres): flecha atrás, avatar neutro monocromo,
 * dos barras de relleno y menú de tres puntos. Cápsula blanca flotante de 840 px en la zona segura.
 */
export const HEADER = { x: SAFE.x0, y: 224, w: SAFE.width, h: 96 } as const;

export const ChatHeader: React.FC<{ readonly style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      position: "absolute",
      left: HEADER.x,
      top: HEADER.y,
      width: HEADER.w,
      height: HEADER.h,
      boxSizing: "border-box",
      borderRadius: HEADER.h / 2,
      backgroundColor: COLORS.surface,
      border: `2px solid ${COLORS.surfaceLine}`,
      boxShadow: "0 10px 30px -12px rgba(7, 68, 52, 0.08), 0 2px 5px rgba(7, 68, 52, 0.035)",
      ...style,
    }}
  >
    {/* flecha atrás */}
    <svg width={40} height={40} viewBox="0 0 40 40" style={{ position: "absolute", left: 30, top: 24 }}>
      <path d="M 25 8 L 12 20 L 25 32" stroke={COLORS.ink} strokeOpacity={0.7} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>

    {/* avatar neutro monocromo */}
    <svg width={60} height={60} viewBox="0 0 60 60" style={{ position: "absolute", left: 92, top: 16 }}>
      <defs>
        <clipPath id="chat-avatar-clip">
          <circle cx={30} cy={30} r={30} />
        </clipPath>
      </defs>
      <circle cx={30} cy={30} r={30} fill="#E4DBC9" />
      <g clipPath="url(#chat-avatar-clip)" fill="#FFFFFF" fillOpacity={0.92}>
        <circle cx={30} cy={23} r={10.5} />
        <ellipse cx={30} cy={58} rx={21} ry={16} />
      </g>
    </svg>

    {/* barras de relleno (sin texto) */}
    <div style={{ position: "absolute", left: 170, top: 28, width: 188, height: 18, borderRadius: 9, backgroundColor: COLORS.ink, opacity: 0.16 }} />
    <div style={{ position: "absolute", left: 170, top: 56, width: 112, height: 12, borderRadius: 6, backgroundColor: COLORS.ink, opacity: 0.09 }} />

    {/* menú de tres puntos */}
    <svg width={12} height={44} viewBox="0 0 12 44" style={{ position: "absolute", right: 38, top: 22 }}>
      <circle cx={6} cy={6} r={5} fill={COLORS.ink} fillOpacity={0.62} />
      <circle cx={6} cy={22} r={5} fill={COLORS.ink} fillOpacity={0.62} />
      <circle cx={6} cy={38} r={5} fill={COLORS.ink} fillOpacity={0.62} />
    </svg>
  </div>
);
