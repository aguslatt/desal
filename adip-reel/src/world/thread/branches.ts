import { COLORS } from "../../config/brand.ts";
import { CAMERA_TIMING, COMPANION_TIMING, THREAD_TIMING } from "../../config/timeline.ts";
import { finalToWorld } from "../stage.ts";
import type { Pt } from "../../illustration/index.ts";

/**
 * RAMAS — curvas de crayón independientes que conectan a las demás personas (diseñadas en la pantalla del encuadre final).
 */
export type Branch = {
  readonly id: string;
  readonly color: string;
  /** color más oscuro de las motas de pigmento */
  readonly shade?: string;
  /** ancho en px de pantalla */
  readonly width: number;
  readonly points: readonly Pt[];
  readonly from: number;
  readonly to: number;
  readonly seed: number;
  readonly startWidth?: number;
  readonly endWidth?: number;
};

const P = (pts: readonly (readonly [number, number])[]): Pt[] => pts.map(([sx, sy]) => finalToWorld(sx, sy));
const W = (pts: readonly (readonly [number, number])[]): Pt[] => pts.map(([x, y]) => [x, y] as const);

/**
 *  embrace  (S4)  nace del hilo bajo el banco, sube por la derecha de la amiga, la rodea y termina junto al círculo de la protagonista:
 *                 los dos círculos casi se tocan (se dibuja cuando ella ya se sentó y ofrece la mano).
 *  canopyL  (S5)  entra por el borde izquierdo, cubre al grupo de la izquierda y termina cerca de la silla de ruedas.
 *  canopyR  (S6)  entra por el borde derecho y termina entre la mayor y la madre con el niño: es el trazo que «asienta» la composición.
 * Las dos de arriba empiezan cuando la cámara ya llegó al encuadre final (antes quedarían dentro de la franja del texto).
 */
export const BRANCHES: readonly Branch[] = [
  {
    id: "embrace",
    color: COLORS.orange,
    width: 12,
    points: W([[1160, 1630], [1222, 1500], [1245, 1250], [1215, 950], [1130, 740], [1010, 610], [890, 565], [800, 600], [770, 660]]),
    from: COMPANION_TIMING.friendSitFrom + 4,
    to: COMPANION_TIMING.friendGestureAt + 24,
    seed: 22,
  },
  {
    id: "canopyL",
    color: COLORS.orange,
    width: 12,
    points: P([[-30, 566], [60, 516], [170, 522], [250, 585], [290, 660], [300, 722]]),
    from: CAMERA_TIMING.finalTo + 14,
    to: CAMERA_TIMING.finalTo + 58,
    seed: 21,
  },
  {
    id: "canopyR",
    color: COLORS.orange,
    width: 12,
    points: P([[1120, 585], [1030, 548], [925, 572], [850, 620], [808, 672]]),
    from: THREAD_TIMING.settleFrom,
    to: THREAD_TIMING.settleTo,
    seed: 24,
  },
];
