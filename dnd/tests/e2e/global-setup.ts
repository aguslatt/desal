import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** Cada corrida arranca con los datos de prueba (eventos, reportes, leads) vacíos. */
export default function limpiar() {
  fs.rmSync(path.join(os.tmpdir(), "umbral-e2e"), { recursive: true, force: true });
}
