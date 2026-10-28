"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Foto } from "@/components/ui/Foto";
import { Icon } from "@/components/ui/Icon";
import { track } from "@/lib/analytics";
import type { PasoRecorrido, Rubro } from "@/lib/types";

/** Recorrido visual paso a paso, de la vereda a la mesa y el baño. Con vista de texto completa como alternativa. */
export function Recorrido({ lugarId, nombre, pasos, rubro }: { lugarId: string; nombre: string; pasos: PasoRecorrido[]; rubro: Rubro }) {
  const [i, setI] = useState(0);
  const [todo, setTodo] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const montado = useRef(false);

  useEffect(() => { track("recorrido_abierto", { lugar: lugarId }); }, [lugarId]);
  useEffect(() => {
    if (montado.current) titulo.current?.focus();
    montado.current = true;
  }, [i]);

  const p = pasos[i];
  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/lugares/${lugarId}`} className="tap inline-flex items-center gap-1 font-bold">
        <span className="rotate-180"><Icon name="flecha" /></span> Volver a {nombre}
      </Link>
      <h1 className="mt-4 text-4xl leading-tight font-bold">
        Recorrido visual
        <span className="mt-1 block text-2xl text-muted">{nombre}</span>
      </h1>
      <p className="mt-3 max-w-prose text-muted">
        De la vereda a la mesa y el baño, paso por paso. Sirve para saber qué te espera antes de ir. Las fotos son de ejemplo en esta demostración.
      </p>

      <div className="mt-6">
        <button type="button" className="btn btn-ghost" aria-pressed={todo} onClick={() => setTodo(!todo)}>
          {todo ? "Ver paso por paso" : "Ver todo el recorrido como texto"}
        </button>
      </div>

      {todo ? (
        <ol className="mt-6 flex flex-col gap-8">
          {pasos.map((x, n) => (
            <li key={x.titulo} className="card p-5">
              <h2 className="text-2xl font-bold">Paso {n + 1}: {x.titulo}</h2>
              <Foto tipo={x.tipo} alt={x.alt} src={x.src} rubro={rubro} semilla={lugarId} className="mt-4 aspect-[16/9]" />
              <p className="mt-4 text-lg">{x.descripcion}</p>
            </li>
          ))}
        </ol>
      ) : (
        <section aria-labelledby="paso-titulo" className="card rise mt-6 p-5 sm:p-8">
          <p className="font-bold text-muted">Paso {i + 1} de {pasos.length}</p>
          <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-accent" style={{ width: `${((i + 1) / pasos.length) * 100}%` }} />
          </div>
          <h2 id="paso-titulo" ref={titulo} tabIndex={-1} className="mt-5 text-3xl font-bold outline-none">{p.titulo}</h2>
          <Foto tipo={p.tipo} alt={p.alt} src={p.src} rubro={rubro} semilla={lugarId} className="mt-5 aspect-[16/9]" />
          <p className="mt-5 text-xl">{p.descripcion}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="btn btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Paso anterior</button>
            <button type="button" className="btn" disabled={i === pasos.length - 1} onClick={() => setI(i + 1)}>
              Paso siguiente<Icon name="flecha" />
            </button>
          </div>
          <p role="status" aria-live="polite" className="sr-only">Paso {i + 1} de {pasos.length}: {p.titulo}</p>
        </section>
      )}

      <p className="mt-8">
        <Link href={`/lugares/${lugarId}`} className="btn btn-ghost">Volver a la ficha</Link>{" "}
        <Link href={`/lugares/${lugarId}/reporte`} className="btn">Contar cómo te fue</Link>
      </p>
    </div>
  );
}
