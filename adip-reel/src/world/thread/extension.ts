import type { ThreadAnchor } from "./path.ts";

/**
 * EXTENSIÓN DEL HILO (escenas 4–6) — la completa WORLD-B.
 *
 * Son anclas en coordenadas de MUNDO que continúan la curva desde el último punto de la parte A
 * (≈ (1650, 1380), saliendo del encuadre hacia la derecha) hacia las demás personas y el logo. Es la MISMA curva continua:
 * cada ancla con `frame` fija el fotograma en que la punta llega ahí (ver THREAD_TIMING.branchesFrom…settleTo).
 * Si necesitás cambiar el final de la parte A, editá `OUTSIDE` en ./path.ts.
 */
export const THREAD_EXTENSION: readonly ThreadAnchor[] = [];
