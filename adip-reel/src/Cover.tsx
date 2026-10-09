import type React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { LOGO, ROLE, TYPE } from "./config/brand.ts";
import { COVER } from "./config/script.ts";
import { H, W } from "./config/layout.ts";
import { Listening, OpenCurve } from "./illustration/index.ts";
import { fontFamily } from "./lib/fonts.ts";
import { THREAD_POINTS } from "./story/geometry.ts";
import type { TextStyleSpec } from "./text/style.ts";

/**
 * PORTADA v3 — mismo lenguaje que el reel: fondo gris del manual (#EFEFEF), titular negro a la izquierda (x = 120) en Montserrat
 * ExtraBold (sin adornos: la misma voz que los titulares del reel), la pareja de escucha ya asentada, el hilo naranja abierto y el logo oficial
 * (≤ 734 px, sin recolorear). Todo lo importante queda dentro de la franja central 4:5 (y 285–1635) que recorta el perfil de Instagram.
 */
const HEADLINE_SIZE = 108;
const HEADLINE: TextStyleSpec = {
  size: HEADLINE_SIZE,
  weight: TYPE.display.weight,
  lineHeight: TYPE.display.lineHeight,
  lineHeightPx: HEADLINE_SIZE * TYPE.display.lineHeight,
  letterSpacing: TYPE.display.letterSpacing,
  color: ROLE.text,
};
const HEAD_TOP = 330;
const HEAD_LINES = ["El mensaje", "que borraste"] as const;

/** el suelo de la pareja y del hilo suben juntos (en el reel el suelo está en 1560) */
const GROUND = 1500;
const RISE = 1560 - GROUND;

const LOGO_W = 440;
const LOGO_TOP = 760;

const line = (s: TextStyleSpec): React.CSSProperties => ({
  position: "absolute",
  left: 120,
  whiteSpace: "nowrap",
  color: s.color,
  fontFamily,
  fontSize: s.size,
  fontWeight: s.weight,
  lineHeight: `${s.lineHeightPx}px`,
  letterSpacing: `${s.letterSpacing}px`,
  fontKerning: "normal",
  willChange: "transform",
});

export const Cover: React.FC = () => {
  const sub = TYPE.body;
  const subTop = HEAD_TOP + 2 * HEADLINE.lineHeightPx + 26;
  return (
    <AbsoluteFill style={{ backgroundColor: ROLE.paper }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <OpenCurve points={THREAD_POINTS.map(([x, y]) => [x, y - RISE] as const)} progress={1} width={14} seed={7} />
      </svg>
      <Listening frame={1_000_000} x={540} y={GROUND} scale={1} drawProgress={1} />

      <div style={{ ...line(HEADLINE), top: HEAD_TOP }}>{HEAD_LINES[0]}</div>
      <div style={{ ...line(HEADLINE), top: HEAD_TOP + HEADLINE.lineHeightPx }}>{HEAD_LINES[1]}</div>
      <div
        style={{
          position: "absolute",
          left: 120,
          top: subTop,
          fontFamily,
          fontSize: sub.size,
          fontWeight: sub.weight,
          lineHeight: `${sub.size * sub.lineHeight}px`,
          letterSpacing: sub.letterSpacing,
          color: ROLE.text,
          whiteSpace: "nowrap",
          willChange: "transform",
        }}
      >
        {COVER.subtitle}
      </div>

      <Img
        src={staticFile(LOGO.file)}
        alt="Equipo ADIP"
        draggable={false}
        style={{ position: "absolute", left: 120, top: LOGO_TOP, width: LOGO_W, height: LOGO_W / LOGO.ratio }}
      />
    </AbsoluteFill>
  );
};
