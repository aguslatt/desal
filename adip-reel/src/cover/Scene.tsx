import React from "react";
import { AbsoluteFill } from "remotion";
import { PhoneChat } from "../chat/PhoneChat";
import { COLORS } from "../config/brand.ts";
import { Bench, CrayonStroke, Paper, Protagonist } from "../illustration/index.ts";
import { ElderWithCane, WalkingParentChild, WheelchairUser } from "../illustration/characters/cast-others.tsx";
import { CameraContext, type CameraState } from "../world/cameraContext.ts";
import { BENCH_ON_SCREEN, BODY_FRAME, CAST, CHAT_FRAME, HERO_K, PHONE_K, PHONE_ON_SCREEN, SEAT, type CastSpot } from "./layout.ts";
import { getCoverThread, type StrokeDef } from "./thread.ts";

/** Cámara de pantalla: 1 u = 1 px (la capa de pantalla y el hilo). */
const SCREEN: CameraState = { scale: 1, cx: 540, cy: 960 };
/** Tiempo «asentado» para el reparto (fotograma absoluto lejano: ya se dibujaron y terminaron de caminar). */
const SETTLED = 100000;

/** El banco queda recortado detrás del brazo derecho de la protagonista (cuando termina el dibujo, el papel queda libre). Caja en u del mundo héroe. */
const BENCH_BOX = { hw: 430, up: 340, clipX: -10 } as const;

/** Contenedor que pone un «mundo» local (origen = suelo de la figura) en la pantalla con `k` px por unidad. */
const Placed: React.FC<{ x: number; y: number; k: number; children: React.ReactNode }> = ({ x, y, k, children }) => (
  <CameraContext.Provider value={{ scale: k, cx: -x / k + 540 / k, cy: -y / k + 960 / k }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transform: `translate(${x}px, ${y}px) scale(${k})` }}>{children}</div>
  </CameraContext.Provider>
);

const CastFigure: React.FC<{ spot: CastSpot }> = ({ spot }) => {
  const common = { frame: SETTLED, x: 0, y: 0, scale: 1, facing: spot.facing, appearFrom: 0 } as const;
  return (
    <Placed x={spot.x} y={spot.y} k={spot.k}>
      {spot.id === "parentChild" ? <WalkingParentChild {...common} steps={1} /> : null}
      {spot.id === "elder" ? <ElderWithCane {...common} /> : null}
      {spot.id === "wheelchair" ? <WheelchairUser {...common} /> : null}
    </Placed>
  );
};

const Stroke: React.FC<{ def: StrokeDef }> = ({ def }) => (
  <CrayonStroke points={def.points} progress={1} width={def.width} startWidth={def.startWidth} endWidth={def.endWidth} seed={def.seed} camera={SCREEN} />
);

/**
 * Parte del hilo que vive DENTRO de la pantalla del celular (encima del chat, debajo de los pulgares), en coordenadas nativas del chat:
 * la misma curva de pantalla pasada a nativo. El traspaso desde el cursor es exacto.
 */
const PhoneThread: React.FC = () => {
  const thread = getCoverThread();
  const toNative = `translate(540 960) scale(${1 / PHONE_K}) translate(${-PHONE_ON_SCREEN[0]} ${-PHONE_ON_SCREEN[1]})`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "hidden", pointerEvents: "none" }}>
      <g transform={toNative}>
        <Stroke def={thread.inner} />
      </g>
    </svg>
  );
};

export type SceneLayers = { readonly paper?: boolean; readonly thread?: boolean; readonly figures?: boolean; readonly hero?: boolean; readonly cast?: boolean };

/** `layers` solo sirve para pruebas (medir distancias capa por capa); la portada usa todas. */
export const CoverScene: React.FC<{ layers?: SceneLayers }> = ({ layers }) => {
  const { paper = true, thread: showThread = true, figures = true, hero: heroOn = true, cast: castOn = true } = layers ?? {};
  const showFigures = figures && castOn;
  const showHero = figures && heroOn;
  const thread = getCoverThread();
  const heroCam: CameraState = { scale: HERO_K, cx: (540 - BENCH_ON_SCREEN.x) / HERO_K, cy: (960 - BENCH_ON_SCREEN.y) / HERO_K };
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream, overflow: "hidden" }}>
      {paper ? (
        <CameraContext.Provider value={SCREEN}>
          <Paper grain={1} parallax={0} />
        </CameraContext.Provider>
      ) : null}

      {/* el hilo: sobre el papel, debajo de las figuras */}
      {showThread ? (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
          {thread.strokes.map((def) => (
            <Stroke key={def.id} def={def} />
          ))}
        </svg>
      ) : null}

      {showFigures
        ? CAST.map((spot) => (
            <CastFigure key={spot.id} spot={spot} />
          ))
        : null}

      {/* héroe: la protagonista en su banco, con el chat del mensaje sin enviar */}
      {showHero ? (
      <Placed x={BENCH_ON_SCREEN.x} y={BENCH_ON_SCREEN.y} k={HERO_K}>
        <CameraContext.Provider value={heroCam}>
          <div style={{ position: "absolute", left: -BENCH_BOX.hw, top: -BENCH_BOX.up, width: BENCH_BOX.hw + BENCH_BOX.clipX, height: BENCH_BOX.up + 40, overflow: "hidden" }}>
            <Bench x={BENCH_BOX.hw} y={BENCH_BOX.up} />
          </div>
          <Protagonist
            frame={BODY_FRAME}
            x={SEAT.x}
            y={SEAT.y}
            controls={{ phoneTilt: 0, phoneLower: 0, phoneScale: 1, thumbsOpacity: 1 }}
            phone={
              <>
                <PhoneChat from={-CHAT_FRAME} />
                {showThread ? <PhoneThread /> : null}
              </>
            }
          />
        </CameraContext.Provider>
      </Placed>
      ) : null}
    </AbsoluteFill>
  );
};
