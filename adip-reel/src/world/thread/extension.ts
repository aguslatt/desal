import { THREAD_TIMING } from "../../config/timeline.ts";
import { finalToWorld } from "../stage.ts";
import type { ThreadAnchor } from "./path.ts";

/**
 * EXTENSIÓN DEL HILO (escenas 4–6) — la completa WORLD-B.
 * Se diseña en la PANTALLA del encuadre final (px) y se convierte al mundo con `finalToWorld`.
 *
 *  S4  la punta reaparece por el borde derecho mientras la cámara se abre y corre por debajo de la línea del suelo
 *      (bajo el banco, la amiga y el grupo de la derecha) hasta salir del encuadre.
 *  S5  baja por el margen derecho, se afina (@fino:0 → @fino:1) y pasa por DEBAJO del logo (entre el logo y la fecha) sin tocarlos;
 *      sube por el lado izquierdo y termina en punta.
 */
const { branchesFrom, branchesTo, logoFrom, logoTo } = THREAD_TIMING;
/** fotograma de la punta en el tramo del logo: k = 0…68 (de logoFrom a logoTo) */
const arm = (k: number): number => Math.round(logoFrom + ((logoTo - logoFrom) * k) / 68);
const F = (sx: number, sy: number, frame?: number, name?: string): ThreadAnchor => ({ p: finalToWorld(sx, sy), frame, name });

export const THREAD_EXTENSION: readonly ThreadAnchor[] = [
  F(800, 982, branchesFrom + 19, "la punta reaparece por el borde derecho mientras la cámara se abre"),
  F(900, 985, branchesFrom + 46),
  F(1012, 1002, branchesTo - 24, "sale del encuadre de S4 por la derecha (su punta queda fuera de cuadro hasta que la cámara se abre)"),
  F(1012, 1050, arm(10), "@fino:0"),
  F(1008, 1145, arm(22)),
  F(990, 1245, arm(34)),
  F(955, 1330, arm(44)),
  F(895, 1387, arm(52), "@fino:1"),
  F(810, 1408, arm(58)),
  F(690, 1413, arm(63)),
  F(540, 1413),
  F(400, 1412),
  F(300, 1415),
  F(235, 1412),
  F(188, 1393),
  F(155, 1343),
  F(142, 1262, logoTo),
];
