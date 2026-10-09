/**
 * KIT DE ILUSTRACIÓN LIVIANO — punto de entrada único. Ver src/illustration/README.md (API y convenciones).
 *   import { Listening, OpenCurve, connectionPoints, extendCurve, settledAnchors } from "../illustration";
 */
export * from "./geom.ts";
export { noise1, fbm1, hash01 } from "./noise.ts";
export { InkStroke, Flat, inkPath, inkOutline, handCirclePoints, INK_WIDTH, type InkOptions } from "./ink.tsx";
export { BODY, makePose, lerpPose, solveSeated, type SeatedPose, type Skeleton } from "./rig.ts";
export { Figure, defaultStyle, handPolygon, type FigureStyle, type FigureProps } from "./figure.tsx";
export { Bench, Phone, Shadow, WheelchairFrame, WheelchairWheel } from "./props.tsx";
export { rimPoint, BENCH, WHEELCHAIR, PHONE, SEAT_TOP } from "./dims.ts";
export { OpenCurve, OpenCurveSvg, makeOpenCurve, crayonRibbon, CURVE_WIDTH, type OpenCurveProps, type OpenCurveGeometry } from "./curve.tsx";
export { connectionPoints, extendCurve, curveClearance, inflate, distToBox, type Box, type ExtendOptions, type ConnectionOptions } from "./connect.ts";
export { A_HIP_X, B_AXLE_FINAL, LISTENING_TIMING, sceneAt, type SceneState, type SceneParams } from "./motion.ts";
export {
  Listening,
  ListeningScene,
  listeningAnchors,
  settledAnchors,
  autoEnterDx,
  FIGURE_HEIGHT,
  SCENE_K,
  INK_SCREEN,
  FLOOR_Y,
  BAND,
  type ListeningProps,
  type ListeningPlacement,
  type ListeningAnchors,
} from "./Listening.tsx";
