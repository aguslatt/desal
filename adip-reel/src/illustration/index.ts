/**
 * KIT DE ILUSTRACIÓN — punto de entrada único. Ver src/illustration/README.md (API y convenciones).
 *   import { Person, CrayonCurve, Bench, Protagonist, Paper, … } from "../illustration";
 */
export * from "./geom.ts";
export { noise1, fbm1, hash01 } from "./noise.ts";
export * from "./palette.ts";
export { InkStroke, InkEllipse, InkSvg, inkPath, inkOutline, handEllipsePoints, type InkOptions } from "./ink.tsx";
export { ScribbleFill, scribblePath, scribbleRuns, Blob, blobPoly, type ScribbleOptions } from "./scribble.tsx";
export { CrayonCurve, CrayonStroke, makeCurve, crayonPolys, type CrayonData, type CrayonOptions, type CrayonSource } from "./crayon.tsx";
export { Paper } from "./paper.tsx";
export { GrainDefs } from "./texture.tsx";
export * from "./rig.ts";
export {
  Person,
  buildPerson,
  personScale,
  heightOf,
  rigToWorld,
  worldToRig,
  jointWorld,
  INK_WIDTH,
  type PersonSpec,
  type PersonProps,
  type PersonLayers,
  type BuildOptions,
  type Placement,
  type HairStyle,
  type GarmentType,
  type AccessoryType,
} from "./person.tsx";
export { Bench, Wheelchair, Cane, wheelchairPose, benchSeat, BENCH, BENCH_SLOTS, SEAT_H, WHEELCHAIR } from "./props.tsx";
export {
  Protagonist,
  PROTAGONIST_SPEC,
  PROTAGONIST_HEIGHT,
  PROTAGONIST_HEAD_TOP,
  S1_HIP_Y,
  PHONE_SCALE,
  PHONE_NATIVE,
  PHONE_SIZE,
  PHONE_CENTER,
  PHONE_RECT,
  phoneToWorld,
  phoneCenterWorld,
  phoneState,
  phoneNativeToLocal,
  defaultControls,
  thumbsAt,
  protagonistPose,
  type ProtagonistProps,
  type ProtagonistControls,
  type PhoneState,
  type ThumbState,
} from "./characters/protagonist.tsx";
