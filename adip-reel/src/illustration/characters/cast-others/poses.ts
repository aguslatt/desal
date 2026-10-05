import { wheelchairPose } from "../../props.tsx";
import type { PoseParams } from "../../rig.ts";

export { applyIdle, lerpPose, makePose, seated, standFront, standSide, walkFront, walkSide, type PoseParams } from "../../rig.ts";

/** Pose base de una persona sentada en la silla de ruedas del kit (RU; mismas proporciones a cualquier tamaño). */
export const wheelchairPoseRU = (o: Partial<PoseParams> = {}): PoseParams => wheelchairPose(1.05, o);
