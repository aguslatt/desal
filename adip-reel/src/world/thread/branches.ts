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
 *                 los dos círculos casi se tocan (se dibuja cuando ella ya se sentó y ofrece la mano). Su parte alta (y 655) queda a ≥ 40 px
 *                 de la franja de texto con la cámara del gesto (0,63×) y a ≈ 24 px de la cabeza de la amiga con la cámara final.
 *  canopyL  (S5)  entra por el borde izquierdo, cubre al grupo de la izquierda (pareja y silla de ruedas) y termina cerca de la silla.
 *  canopyR  (S6)  entra por el borde derecho, pasa sobre la madre con el niño (fila de atrás) y termina junto a la mayor: es el trazo
 *                 que «asienta» la composición.
 * Las dos de arriba empiezan cuando la cámara ya llegó al encuadre final (antes quedarían dentro de la franja del texto).
 */
export const BRANCHES: readonly Branch[] = [
  {
    id: "embrace",
    color: COLORS.orange,
    width: 12,
    points: W([[1160, 1578], [1226, 1500], [1252, 1280], [1228, 1010], [1152, 820], [1042, 702], [922, 657], [834, 664], [764, 674], [712, 694]]),
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
    points: P([[1120, 520], [1040, 488], [945, 490], [860, 528], [800, 590], [776, 650]]),
    from: THREAD_TIMING.settleFrom,
    to: THREAD_TIMING.settleTo,
    seed: 24,
  },
];
