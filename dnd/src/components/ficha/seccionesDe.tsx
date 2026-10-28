import { condicionesDe, dimensiones } from "@/lib/catalogo";
import { coincidencia } from "@/lib/match";
import type { Lugar } from "@/lib/types";
import { Fila } from "./Fila";
import type { SeccionDim } from "./Secciones";

/** Las siete dimensiones con sus condiciones ya renderizadas en el servidor (para cafés y para planes). */
export function seccionesDe(lugar: Lugar, discrepa: string[]): SeccionDim[] {
  return dimensiones.map((d) => {
    const lista = condicionesDe(d.id);
    const c = coincidencia(lugar, lista.map((x) => x.id));
    return {
      id: d.id,
      nombre: d.nombre,
      resumen: `${c.cumple} confirmadas · ${c.noDisponible} no disponibles · ${c.sinInfo} sin información`,
      contenido: (
        <ul className="flex flex-col divide-y divide-[var(--border-soft)]">
          {lista.map((x) => (
            <li key={x.id} className="py-4 first:pt-0 last:pb-0">
              <Fila lugar={lugar} condicionId={x.id} discrepa={discrepa.includes(x.id)} />
            </li>
          ))}
        </ul>
      ),
    };
  });
}
