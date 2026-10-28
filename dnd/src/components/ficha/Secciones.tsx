"use client";

import { Accordion } from "radix-ui";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { condicionesDe, dimensiones } from "@/lib/catalogo";
import { coincidencia } from "@/lib/match";
import { usePrefs } from "@/lib/prefs";
import type { Lugar } from "@/lib/types";
import { Fila } from "./Fila";

/** Todas las dimensiones, desplegables. Se abren solas las que tienen condiciones que marcaste. */
export function Secciones({ lugar, discrepa }: { lugar: Lugar; discrepa: string[] }) {
  const { necesidades } = usePrefs();
  const [abiertas, setAbiertas] = useState<string[]>([]);
  const claveNec = necesidades.join(",");

  useEffect(() => {
    const conNec = dimensiones.filter((d) => condicionesDe(d.id).some((c) => necesidades.includes(c.id))).map((d) => d.id);
    setAbiertas(conNec.length ? conNec : [dimensiones[0].id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveNec]);

  const todas = dimensiones.map((d) => d.id);
  return (
    <section aria-labelledby="toda-info">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="toda-info" className="text-2xl font-bold">Toda la información</h2>
        <button type="button" className="btn btn-ghost" onClick={() => setAbiertas(abiertas.length === todas.length ? [] : todas)}>
          {abiertas.length === todas.length ? "Cerrar todo" : "Abrir todo"}
        </button>
      </div>
      <Accordion.Root type="multiple" value={abiertas} onValueChange={setAbiertas} className="mt-4 flex flex-col gap-3">
        {dimensiones.map((d) => {
          const lista = condicionesDe(d.id);
          const c = coincidencia(lugar, lista.map((x) => x.id));
          return (
            <Accordion.Item key={d.id} value={d.id} className="card overflow-hidden">
              <Accordion.Header asChild>
                <h3>
                  <Accordion.Trigger className="tap group flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left text-xl font-bold">
                    <span className="min-w-0">
                      {d.nombre}
                      <span className="mt-1 block text-base font-normal text-muted">
                        {c.cumple} confirmadas · {c.noDisponible} no disponibles · {c.sinInfo} sin información
                      </span>
                    </span>
                    <span className="shrink-0 transition-transform group-data-[state=open]:rotate-180">
                      <Icon name="chevron" size={1.4} />
                    </span>
                  </Accordion.Trigger>
                </h3>
              </Accordion.Header>
              <Accordion.Content className="border-t border-soft px-5 py-4">
                <ul className="flex flex-col divide-y divide-[var(--border-soft)]">
                  {lista.map((x) => (
                    <li key={x.id} className="py-4 first:pt-0 last:pb-0">
                      <Fila lugar={lugar} condicionId={x.id} discrepa={discrepa.includes(x.id)} />
                    </li>
                  ))}
                </ul>
              </Accordion.Content>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
    </section>
  );
}
