import type React from "react";
import { COMPANION_TIMING } from "../config/timeline.ts";
import { Friend } from "../illustration/characters/cast-friend.tsx";
import { CAST_IDS, ElderWithCane, SeatedAndStanding, Walker, WalkingParentChild, WheelchairUser, type CastId } from "../illustration/characters/cast-others.tsx";
import { CAST_SCREEN, FRIEND_SEAT, castPlacement } from "./stage.ts";

/**
 * REPARTO — las demás personas. Se monta DENTRO del contenedor de la cámara (coordenadas de mundo), entre el banco y la
 * protagonista. `frame` = fotograma ABSOLUTO del reel.
 */
const appearAt = (id: CastId): number => COMPANION_TIMING.othersFrom + CAST_SCREEN[id].order * COMPANION_TIMING.othersStagger;

export const Cast: React.FC<{ frame: number }> = ({ frame }) => {
  const at = (id: CastId) => ({ frame, ...castPlacement(id), appearFrom: appearAt(id) });
  void CAST_IDS;
  return (
    <>
      <WalkingParentChild {...at("parentChild")} />
      <WheelchairUser {...at("wheelchair")} />
      <ElderWithCane {...at("elder")} />
      <Walker {...at("walker")} />
      <SeatedAndStanding {...at("pair")} />
      <Friend frame={frame} x={FRIEND_SEAT.x} y={FRIEND_SEAT.y} />
    </>
  );
};
