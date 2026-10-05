import type React from "react";
import { AbsoluteFill, Interactive, useVideoConfig, type InteractivitySchema } from "remotion";
import { PhoneChat } from "../chat/PhoneChat";
import { COLORS } from "../config/brand.ts";
import { CAMERA_TIMING } from "../config/timeline.ts";
import { Bench, Paper, Protagonist, clamp01, easeInOut } from "../illustration/index.ts";
import { useAbsFrame } from "../lib/scene.ts";
import { Cast } from "./Cast.tsx";
import { cameraAt } from "./camera.ts";
import { CameraContext } from "./cameraContext.ts";
import { BENCH_AT, PROTAGONIST_SEAT } from "./stage.ts";
import { PhoneThread, ThreadLayer, WIPE } from "./thread/index.ts";

const ramp = (f: number, a: number, b: number): number => easeInOut(clamp01((f - a) / (b - a)));

/**
 * Inclinación del celular: −4° que se enderezan durante el acercamiento (como en la Protagonista) y se MANTIENE en 0°
 * mientras el hilo vive dentro de la pantalla (así el hilo del mundo y el de la pantalla coinciden); la inclinación suelta
 * de −2,5° vuelve cuando el hilo ya se soltó del celular.
 */
const phoneTilt = (frame: number): number => -4 * (1 - ramp(frame, CAMERA_TIMING.zoomInFrom + 10, CAMERA_TIMING.zoomInTo)) - 2.5 * ramp(frame, WIPE.to, WIPE.to + 60);

/**
 * Pulgares: se retiran pronto, durante el acercamiento (con el celular grande, unos pulgares a medio opacar sobre las
 * teclas se ven fantasmales) y vuelven DESPUÉS de que la cámara ya se alejó.
 */
const thumbsOpacity = (frame: number): number => 1 - ramp(frame, CAMERA_TIMING.zoomInFrom + 22, CAMERA_TIMING.zoomInFrom + 52) + ramp(frame, CAMERA_TIMING.pullOutFrom + 30, CAMERA_TIMING.pullOutFrom + 62);

type Props = { readonly paperGrain?: number; readonly style?: React.CSSProperties };

const Inner: React.FC<Props> = ({ paperGrain = 1, style }) => {
  const frame = useAbsFrame(0);
  const { fps } = useVideoConfig();
  const camera = cameraAt(frame);

  return (
    <CameraContext.Provider value={camera}>
      <AbsoluteFill style={{ backgroundColor: COLORS.cream, overflow: "hidden", ...style }}>
        {/* papel: fijo a la pantalla (el grano casi no sigue a la cámara) */}
        <Paper grain={paperGrain} />
        {/* MUNDO: pantalla = (mundo − c)·scale + (540, 960) */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            transform: `translate(540px, 960px) scale(${camera.scale}) translate(${-camera.cx}px, ${-camera.cy}px)`,
          }}
        >
          {/* el hilo está sobre el papel: debajo de las figuras */}
          <ThreadLayer frame={frame} />
          <Bench x={BENCH_AT.x} y={BENCH_AT.y} />
          <Cast frame={frame} />
          <Protagonist
            frame={frame}
            x={PROTAGONIST_SEAT.x}
            y={PROTAGONIST_SEAT.y}
            controls={{ phoneTilt: phoneTilt(frame), thumbsOpacity: thumbsOpacity(frame) }}
            phone={
              <>
                <PhoneChat name="Chat" premountFor={fps} />
                <PhoneThread frame={frame} />
              </>
            }
          />
        </div>
      </AbsoluteFill>
    </CameraContext.Provider>
  );
};

const schema = {
  paperGrain: { type: "number", default: 1, min: 0, max: 1, step: 0.05, description: "Grano del papel", hiddenFromList: false },
} as const satisfies InteractivitySchema;

export const World = Interactive.withSchema({
  Component: Inner,
  componentName: "<World>",
  schema,
  wrapInSequence: true,
});
