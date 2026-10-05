import React from "react";
import { CHAT } from "../config/script.ts";
import { fontFamily } from "../lib/fonts.ts";
import { AvatarPerson, BackChevron, BatteryIcon, KebabIcon, SignalIcon, VideoIcon, WifiIcon } from "./icons.tsx";
import { CHAT_COLORS, HEADER, STATUS_BAR, mix } from "./geometry.ts";

const abs: React.CSSProperties = { position: "absolute" };
const statusInk = CHAT_COLORS.ink;

/** Barra de estado (solo íconos muy sutiles, sin texto ni hora) + cabecera del chat: ← avatar «Amiga» ⋮. */
export const Header: React.FC = React.memo(() => {
  const { avatar, presence } = HEADER;
  return (
    <>
      {/* fondo de barra de estado + cabecera */}
      <div
        style={{
          ...abs,
          left: 0,
          top: 0,
          width: 1080,
          height: HEADER.bottom,
          background: CHAT_COLORS.surface,
          borderBottom: `2px solid ${CHAT_COLORS.line}`,
          boxSizing: "border-box",
          boxShadow: "0 6px 20px rgba(7,68,52,0.07)",
        }}
      />

      {/* barra de estado: cámara frontal + señal / wifi / batería */}
      <div style={{ ...abs, left: 540 - 13, top: STATUS_BAR.h / 2 - 13, width: 26, height: 26, borderRadius: 13, background: mix(CHAT_COLORS.ink, "#000000", 0.55), opacity: 0.85 }} />
      <div style={{ ...abs, left: 830, top: STATUS_BAR.h / 2 - 15, display: "flex", alignItems: "center", gap: 18, color: statusInk, opacity: 0.5 }}>
        <SignalIcon size={36} />
        <WifiIcon size={40} />
        <BatteryIcon size={56} />
      </div>

      {/* atrás */}
      <div style={{ ...abs, left: HEADER.back.cx - 17, top: HEADER.back.cy - 27, color: CHAT_COLORS.ink }}>
        <BackChevron size={34} stroke={8} />
      </div>

      {/* avatar de «Amiga» (círculo simple + silueta) con puntito de presencia */}
      <div
        style={{
          ...abs,
          left: avatar.cx - avatar.d / 2,
          top: avatar.cy - avatar.d / 2,
          width: avatar.d,
          height: avatar.d,
          borderRadius: avatar.d / 2,
          background: CHAT_COLORS.avatar,
          overflow: "hidden",
        }}
      >
        <AvatarPerson size={avatar.d} />
      </div>
      <div
        style={{
          ...abs,
          left: avatar.cx + avatar.d * 0.36 - presence.d / 2,
          top: avatar.cy + avatar.d * 0.36 - presence.d / 2,
          width: presence.d,
          height: presence.d,
          borderRadius: "50%",
          background: CHAT_COLORS.presence,
          border: `5px solid ${CHAT_COLORS.surface}`,
          boxSizing: "content-box",
          marginLeft: -5,
          marginTop: -5,
        }}
      />

      {/* nombre del contacto (CHAT.contact) */}
      <div
        style={{
          ...abs,
          left: HEADER.name.x,
          top: HEADER.avatar.cy - 40,
          height: 80,
          lineHeight: "80px",
          fontFamily,
          fontSize: HEADER.name.fontSize,
          fontWeight: HEADER.name.weight,
          color: CHAT_COLORS.ink,
          whiteSpace: "pre",
        }}
      >
        {CHAT.contact}
      </div>

      {/* acciones (decorativas) */}
      <div style={{ ...abs, left: HEADER.actions.videoCx - 30, top: HEADER.actions.cy - 21, color: CHAT_COLORS.inkSoft }}>
        <VideoIcon size={60} />
      </div>
      <div style={{ ...abs, left: HEADER.actions.kebabCx - 6, top: HEADER.actions.cy - 24, color: CHAT_COLORS.inkSoft }}>
        <KebabIcon size={11} />
      </div>
    </>
  );
});
