"use client";

import Link from "next/link";
import { usePrefs } from "@/lib/prefs";
import { coincidencia, textoCoincidencia } from "@/lib/match";
import type { Lugar } from "@/lib/types";
import { Fila } from "./Fila";

export function TusCondiciones({ lugar, discrepa }: { lugar: Lugar; discrepa: string[] }) {
  const { necesidades } = usePrefs();
  const c = coincidencia(lugar, necesidades);
  return (
    <section aria-labelledby="tus-condiciones" className="card p-6">
      <h2 id="tus-condiciones" className="text-2xl font-bold">Tus condiciones</h2>
      {necesidades.length === 0 ? (
        <p className="mt-3 max-w-prose">
          Todavía no marcaste qué necesitás. <Link href="/necesidades">Marcá tus condiciones</Link> y vemos cómo le va a este lugar.
        </p>
      ) : (
        <>
          <p className="mt-2 text-lg font-bold">{textoCoincidencia(c)}</p>
          <ul className="mt-4 flex flex-col divide-y divide-[var(--border-soft)]">
            {necesidades.map((id) => (
              <li key={id} className="py-4 first:pt-0 last:pb-0">
                <Fila lugar={lugar} condicionId={id} discrepa={discrepa.includes(id)} />
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <Link href="/necesidades">Editar mis necesidades</Link>
          </p>
        </>
      )}
    </section>
  );
}
