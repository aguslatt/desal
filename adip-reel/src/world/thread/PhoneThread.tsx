import type React from "react";
import { COLORS } from "../../config/brand.ts";
import { CrayonStroke, PHONE_SCALE } from "../../illustration/index.ts";
import { useCamera } from "../cameraContext.ts";
import { PHONE_AT, cursorBar } from "../stage.ts";
import { getThread } from "./path.ts";
import { THREAD_SEED } from "./ThreadLayer.tsx";
import { threadAt } from "./state.ts";

/**
 * Parte del hilo que vive DENTRO de la pantalla del celular: va en el slot `phone` de la Protagonista (encima del chat,
 * debajo de los pulgares), en coordenadas NATIVAS del chat, recortada por la pantalla. Dibuja:
 *  1) el hilo (la misma curva del mundo, transformada mundo → nativo, así coincide al píxel con la capa del mundo);
 *  2) el RECTÁNGULO del cursor, idéntico al del chat (6×56, naranja, extremos redondeados) → traspaso exacto en f410.
 */
export const PhoneThread: React.FC<{ frame: number }> = ({ frame }) => {
  const def = getThread();
  const st = threadAt(frame, def);
  const camera = useCamera();
  if (!st.alive) return null;
  const bar = cursorBar();
  const world2native = `translate(540 960) scale(${1 / PHONE_SCALE}) translate(${-PHONE_AT[0]} ${-PHONE_AT[1]})`;
  const points = def.anchors.map((a) => a.p);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "hidden", pointerEvents: "none" }}>
      <g transform={world2native}>
        <CrayonStroke points={points} progress={st.progress} from={Math.max(st.from, st.innerFrom)} width={st.width} seed={THREAD_SEED} camera={camera} />
      </g>
      {/* el chat dibuja su cursor con un div (el navegador lo ajusta al píxel): el rectángulo hace lo mismo para que el traspaso sea idéntico */}
      <rect x={Math.round(bar.left)} y={Math.round(bar.top)} width={bar.w} height={bar.h} rx={bar.w / 2} fill={COLORS.orange} opacity={st.barOpacity} />
    </svg>
  );
};
