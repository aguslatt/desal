import type React from "react";
import { Img, Interactive, type InteractivitySchema, staticFile, useCurrentFrame } from "remotion";
import { LOGO } from "../config/brand.ts";
import { FINAL } from "../config/layout.ts";
import { EASE_OUT, prog } from "./overlays/typography.ts";

/**
 * LOGO OFICIAL de Equipo ADIP (public/brand/logo-equipo-adip.png, 734×326). Nunca se deforma, recolorea ni lleva efectos
 * (sin halo ni sombra): solo un fundido limpio con una escala sutil 0,97 → 1 (sin rebote) al aparecer y queda estático.
 *
 * Posición por defecto = composición final (FINAL.logo): centrado en x = 540, borde superior en y = 1120, 560 px de ancho
 * (alto 248,7). `LOGO_BOX` es esa caja en coordenadas de pantalla: el mundo debe dejar `FINAL.clearance` px de aire a su
 * alrededor y la línea naranja lo acompaña por debajo (FINAL.logoLineY) sin tocarlo.
 * Reutilizable (portada): `animated={false}` lo muestra completo desde el fotograma 0; `width`/`cx`/`top` lo reubican.
 */
export const logoBox = (width: number = FINAL.logo.width, cx: number = FINAL.logo.cx, top: number = FINAL.logo.top) => {
  const height = width / LOGO.ratio;
  return { left: cx - width / 2, top, width, height, right: cx + width / 2, bottom: top + height, cx, cy: top + height / 2 } as const;
};

/** Caja del logo en la composición final (pantalla 1080×1920). */
export const LOGO_BOX = logoBox();

/** Caja del logo ampliada por el aire mínimo (FINAL.clearance): zona prohibida para curvas y figuras. */
export const logoClearBox = (clearance: number = FINAL.clearance, box: ReturnType<typeof logoBox> = LOGO_BOX) =>
  ({ left: box.left - clearance, top: box.top - clearance, right: box.right + clearance, bottom: box.bottom + clearance }) as const;

/** Duración (fotogramas) del fundido + escala de entrada. */
export const LOGO_FADE_FRAMES = 18;

type Props = {
  readonly width?: number;
  /** x del centro (px de pantalla) */
  readonly cx?: number;
  /** borde superior (px de pantalla) */
  readonly top?: number;
  /** false → completo y quieto desde el primer fotograma (portada, vistas fijas) */
  readonly animated?: boolean;
  readonly style?: React.CSSProperties;
};

const Inner: React.FC<Props> = ({ width = FINAL.logo.width, cx = FINAL.logo.cx, top = FINAL.logo.top, animated = true, style }) => {
  const frame = useCurrentFrame();
  const box = logoBox(width, cx, top);
  const p = animated ? prog(frame, 0, LOGO_FADE_FRAMES, EASE_OUT) : 1;
  return (
    <Img
      src={staticFile(LOGO.file)}
      alt="Equipo ADIP"
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        opacity: p,
        scale: 0.97 + 0.03 * p,
        transformOrigin: "50% 50%",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
};

const schema = {
  width: { type: "number", default: FINAL.logo.width, min: 100, max: 1000, step: 1, description: "Ancho del logo (alto proporcional)", hiddenFromList: false },
  animated: { type: "boolean", default: true, description: "Fundido de entrada" },
} as const satisfies InteractivitySchema;

export const Logo = Interactive.withSchema({
  Component: Inner,
  componentName: "<Logo>",
  schema,
  wrapInSequence: true,
});
