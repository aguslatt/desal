import { ImageResponse } from "next/og";

export const alt = "Umbral: cafés y planes con accesibilidad concreta, verificada y fechada";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Imagen() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg, #3b1fa8, #1e0f63)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="84" height="84" viewBox="0 0 40 40">
            <rect width="40" height="40" rx="11" fill="#fff" />
            <path d="M12 29V19a8 8 0 0 1 16 0v10" fill="none" stroke="#3b1fa8" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 29h24" stroke="#3b1fa8" strokeWidth="3.6" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 800 }}>Umbral</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>Elegí tu café sabiendo qué te espera.</div>
          <div style={{ fontSize: 34, color: "#e6e0ff" }}>Cafés y planes para el finde con accesibilidad concreta, verificada y fechada.</div>
        </div>
      </div>
    ),
    size,
  );
}
