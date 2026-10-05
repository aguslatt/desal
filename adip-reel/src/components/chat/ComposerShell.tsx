import type React from "react";
import { COLORS } from "../../config/brand.ts";
import { COMPOSER } from "../../config/layout.ts";
import { lerp, mixHex } from "./color.ts";

/**
 * Campo de redacción (tarjeta blanca) SIN texto: borde y sombra muy suaves, y debajo del texto una barra
 * inferior con "+" (izquierda) y botón de envío circular INACTIVO (derecha; nunca naranja, nunca se "envía").
 * Ocupa exactamente COMPOSER (x120 y784 w840 h352, radio 56).
 *
 * `elevation` (0–1): 0 = reposo, 1 = "enfocado/escribiendo" (sombra y borde apenas más presentes).
 */
const BORDER = 2;
const BAR = 72; // diámetro de los botones de la barra inferior
const DIVIDER_Y = COMPOSER.textY + COMPOSER.lineHeight * 2 + 20; // 1020 (absoluto)
const BAR_CY = (DIVIDER_Y + COMPOSER.y + COMPOSER.h) / 2; // centro vertical de la barra (absoluto)

/** Coordenadas relativas al interior de la tarjeta (el borde de 2 px desplaza el origen). */
const relX = (absX: number) => absX - COMPOSER.x - BORDER;
const relY = (absY: number) => absY - COMPOSER.y - BORDER;

export const ComposerShell: React.FC<{
  readonly elevation?: number;
  readonly style?: React.CSSProperties;
}> = ({ elevation = 0, style }) => {
  const e = elevation;
  const ambient = `0 ${lerp(18, 26, e)}px ${lerp(48, 68, e)}px ${lerp(-14, -10, e)}px rgba(7, 68, 52, ${lerp(0.07, 0.1, e).toFixed(3)})`;
  const contact = `0 2px 6px rgba(7, 68, 52, ${lerp(0.035, 0.05, e).toFixed(3)})`;
  const plusCx = COMPOSER.textX + BAR / 2;
  const sendCx = COMPOSER.textX + COMPOSER.textW - BAR / 2;

  return (
    <div
      style={{
        position: "absolute",
        left: COMPOSER.x,
        top: COMPOSER.y,
        width: COMPOSER.w,
        height: COMPOSER.h,
        boxSizing: "border-box",
        borderRadius: COMPOSER.radius,
        backgroundColor: COLORS.surface,
        border: `${BORDER}px solid ${mixHex(COLORS.surfaceLine, "#DCCFB6", e)}`,
        boxShadow: `${ambient}, ${contact}`,
        ...style,
      }}
    >
      {/* Línea sutil que separa el texto de la barra inferior */}
      <div
        style={{
          position: "absolute",
          left: relX(COMPOSER.textX),
          top: relY(DIVIDER_Y),
          width: COMPOSER.textW,
          height: 2,
          borderRadius: 1,
          backgroundColor: COLORS.surfaceLine,
          opacity: 0.7,
        }}
      />

      {/* "+" (adjuntar): círculo crema con signo más */}
      <div
        style={{
          position: "absolute",
          left: relX(plusCx - BAR / 2),
          top: relY(BAR_CY - BAR / 2),
          width: BAR,
          height: BAR,
          borderRadius: BAR / 2,
          backgroundColor: "#F6EFE1",
        }}
      >
        <svg width={BAR} height={BAR} viewBox="0 0 72 72" style={{ display: "block" }}>
          <path d="M 36 22 L 36 50 M 22 36 L 50 36" stroke={COLORS.ink} strokeOpacity={0.62} strokeWidth={5} strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* Botón de envío: circular, gris, INACTIVO */}
      <div
        style={{
          position: "absolute",
          left: relX(sendCx - BAR / 2),
          top: relY(BAR_CY - BAR / 2),
          width: BAR,
          height: BAR,
          borderRadius: BAR / 2,
          backgroundColor: COLORS.grey,
        }}
      >
        <svg width={BAR} height={BAR} viewBox="0 0 72 72" style={{ display: "block" }}>
          <path d="M 36 49 L 36 24 M 25 35 L 36 24 L 47 35" stroke="#B3B8B1" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
    </div>
  );
};
