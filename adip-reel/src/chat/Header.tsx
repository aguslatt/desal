import React from "react";
import { CHAT } from "../config/script.ts";
import { fontFamily } from "../lib/fonts.ts";
import { AvatarPerson, BackChevron, BatteryIcon, KebabIcon, SignalIcon, VideoIcon, WifiIcon } from "./icons.tsx";
import { CHAT_COLORS, HEADER, STATUS_BAR } from "./geometry.ts";

/**
 * Barra de estado discreta (solo íconos, SIN texto ni isla) + encabezado naranja plano del chat: flecha atrás, avatar blanco con silueta,
 * «Amiga» (CHAT.contact, TYPE.body en Bold, negro: 8,3:1 sobre el naranja) y punto de presencia verde. Estático.
 */
export const Header: React.FC<{ readonly dy: number }> = ({ dy }) => {
  const { icons } = STATUS_BAR;
  const a = HEADER.avatar;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1080,
        height: HEADER.bottom,
        background: CHAT_COLORS.header,
        translate: `0px ${dy}px`,
        color: CHAT_COLORS.black,
        fontFamily,
      }}
    >
      {/* barra de estado: solo íconos (sin hora ni texto; sin isla) */}
      <div style={{ position: "absolute", right: 1080 - icons.right, top: icons.cy - 15, display: "flex", alignItems: "center", gap: 18, opacity: 0.88 }}>
        <SignalIcon size={34} />
        <WifiIcon size={36} />
        <BatteryIcon size={50} />
      </div>

      {/* fila del contacto */}
      <div style={{ position: "absolute", left: HEADER.back.cx - 20, top: HEADER.cy - 32 }}>
        <BackChevron size={40} stroke={8} />
      </div>
      <div style={{ position: "absolute", left: a.cx - a.d / 2, top: HEADER.cy - a.d / 2, width: a.d, height: a.d }}>
        <AvatarPerson size={a.d} tone={CHAT_COLORS.orange} />
      </div>
      <div
        style={{
          position: "absolute",
          left: a.cx + a.d / 2 - HEADER.presence.d + 2,
          top: HEADER.cy + a.d / 2 - HEADER.presence.d + 2,
          width: HEADER.presence.d,
          height: HEADER.presence.d,
          borderRadius: "50%",
          background: CHAT_COLORS.presence,
          boxShadow: `0 0 0 ${HEADER.presence.ring}px ${CHAT_COLORS.header}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: HEADER.name.x,
          top: HEADER.cy - 36,
          height: 72,
          lineHeight: "72px",
          fontSize: HEADER.name.fontSize,
          fontWeight: HEADER.name.weight,
          letterSpacing: 0,
          whiteSpace: "pre",
        }}
      >
        {CHAT.contact}
      </div>
      <div style={{ position: "absolute", left: HEADER.actions.videoCx - 32, top: HEADER.cy - 22 }}>
        <VideoIcon size={64} />
      </div>
      <div style={{ position: "absolute", left: HEADER.actions.kebabCx - 6, top: HEADER.cy - 26 }}>
        <KebabIcon size={12} />
      </div>
    </div>
  );
};
