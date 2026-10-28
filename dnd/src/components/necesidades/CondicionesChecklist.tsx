"use client";

import { Picto } from "@/components/ui/Picto";
import { condicionesDe, dimensiones } from "@/lib/catalogo";

/** Condiciones concretas agrupadas por dimensión. No se pide ningún diagnóstico. */
export function CondicionesChecklist({
  seleccion,
  onChange,
  idPrefix,
}: {
  seleccion: string[];
  onChange: (next: string[]) => void;
  idPrefix: string;
}) {
  const alternar = (id: string, on: boolean) => onChange(on ? [...seleccion, id] : seleccion.filter((x) => x !== id));
  return (
    <div className="flex flex-col gap-8">
      {dimensiones.map((d) => (
        <fieldset key={d.id} className="min-w-0">
          <legend className="max-w-full text-xl font-bold">{d.nombre}</legend>
          <p className="mb-3 text-muted">{d.descripcion}</p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {condicionesDe(d.id).map((c) => {
              const id = `${idPrefix}-${c.id}`;
              return (
                <li key={c.id} className="min-w-0">
                  <label
                    htmlFor={id}
                    className="tap flex h-full cursor-pointer items-start gap-3 rounded-xl border-2 border-soft bg-surface p-3 has-[:checked]:border-accent has-[:checked]:bg-ok-bg"
                  >
                    <input
                      id={id}
                      type="checkbox"
                      className="mt-0.5 size-6 shrink-0 accent-[var(--accent)]"
                      checked={seleccion.includes(c.id)}
                      onChange={(e) => alternar(c.id, e.target.checked)}
                    />
                    <Picto palabra={c.picto} />
                    <span className="min-w-0">
                      <span className="solo-completo">{c.etiqueta}</span>
                      <span className="solo-facil font-bold">{c.facil}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}
    </div>
  );
}
