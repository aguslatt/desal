import type React from "react";
import { Friend } from "../illustration/characters/cast-friend.tsx";
import { ElderWithCane, SeatedAndStanding, WalkingParentChild, WheelchairUser, type CastId } from "../illustration/characters/cast-others.tsx";
import { CAST_AT, FRIEND_SEAT } from "./stage.ts";

/**
 * REPARTO — las demás personas. Se monta DENTRO del contenedor de la cámara (coordenadas de mundo), entre el banco y la
 * protagonista. `frame` = fotograma ABSOLUTO del reel.
 */
export const Cast: React.FC<{ frame: number }> = ({ frame }) => {
  const at = (id: CastId) => {
    const s = CAST_AT[id]!;
    return { frame, x: s.x, y: s.y, scale: s.scale, facing: s.facing, appearFrom: s.appear };
  };
  /** inicio del movimiento (caminar / rodar) si el escenario lo fija; si no, al terminar de dibujarse */
  const from = (id: CastId): number | undefined => CAST_AT[id]?.moveFrom;
  return (
    <>
      {CAST_AT.parentChild ? <WalkingParentChild {...at("parentChild")} steps={1} walkFrom={from("parentChild")} /> : null}
      {CAST_AT.wheelchair ? <WheelchairUser {...at("wheelchair")} pushes={[{ at: 8, deg: 26 }, { at: 80, deg: 18 }]} moveFrom={from("wheelchair")} /> : null}
      {CAST_AT.elder ? <ElderWithCane {...at("elder")} walkFrom={from("elder")} /> : null}
      {CAST_AT.pair ? <SeatedAndStanding {...at("pair")} /> : null}
      <Friend frame={frame} x={FRIEND_SEAT.x} y={FRIEND_SEAT.y} />
    </>
  );
};
