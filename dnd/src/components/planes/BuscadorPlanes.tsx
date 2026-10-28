"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CondicionesChecklist } from "@/components/necesidades/CondicionesChecklist";
import { track, trackCondicionesMarcadas } from "@/lib/analytics";
import { lugares, planes } from "@/lib/datos";
import { diaCorto, hoy } from "@/lib/fecha";
import { buscarPlanes, mensajePlanes, TIPOS_PLAN } from "@/lib/planes";
import { guardar, usePrefs } from "@/lib/prefs";
import type { TipoPlan } from "@/lib/types";
import { PlanCard } from "./PlanCard";

const dias = [...new Set(planes.filter((p) => p.fecha >= hoy().toISOString().slice(0, 10)).map((p) => p.fecha))].sort();

export function BuscadorPlanes() {
  const prefs = usePrefs();
  const [q, setQ] = useState({ dia: "", tipo: "" });
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setQ({ dia: p.get("dia") ?? "", tipo: p.get("tipo") ?? "" });
  }, []);

  const dia = dias.includes(q.dia) ? q.dia : undefined;
  const tipo = (TIPOS_PLAN as string[]).includes(q.tipo) ? (q.tipo as TipoPlan) : undefined;

  const cambiar = (clave: "dia" | "tipo", valor: string | null) => {
    setQ((x) => ({ ...x, [clave]: valor ?? "" }));
    const p = new URLSearchParams(location.search);
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    history.replaceState(null, "", `${location.pathname}${p.size ? `?${p}` : ""}`);
    track("filtro_usado", { filtro: clave === "dia" ? "dia_plan" : "tipo_plan", valor: valor ?? "todos" });
  };

  const res = useMemo(
    () => buscarPlanes(planes, lugares, { necesidades: prefs.necesidades, dia, tipo, ocultarNoDisponible: prefs.ocultarNoDisponible }),
    [prefs.necesidades, prefs.ocultarNoDisponible, dia, tipo],
  );
  const hayNec = prefs.necesidades.length > 0;

  return (
    <div>
      <p className="chip chip-mint">Este finde</p>
      <h1 className="mt-3 text-4xl leading-tight font-bold sm:text-6xl">Planes adaptados para el finde</h1>
      <p className="mt-4 max-w-prose text-xl text-muted">
        Música, talleres, charlas, catas, juegos, cine y más, en cafés de la Ciudad. Cada plan dice qué necesitás saber: intérprete de LSA, volumen, subtítulos, reserva.
      </p>

      {!hayNec && (
        <p className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="max-w-prose">Marcá lo que necesitás y vemos cuánto coincide cada plan.</span>
          <Link href="/necesidades" className="btn">Marcar mis necesidades</Link>
        </p>
      )}

      <section aria-labelledby="filtros-planes" className="mt-8">
        <h2 id="filtros-planes" className="sr-only">Filtros</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-dia" className="mb-1 block font-bold">Día</label>
            <select id="p-dia" className="field" value={dia ?? ""} onChange={(e) => cambiar("dia", e.target.value || null)}>
              <option value="">Todos los días</option>
              {dias.map((d) => <option key={d} value={d}>{diaCorto(d)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="p-tipo" className="mb-1 block font-bold">Tipo de plan</label>
            <select id="p-tipo" className="field" value={tipo ?? ""} onChange={(e) => cambiar("tipo", e.target.value || null)}>
              <option value="">Todos los planes</option>
              {TIPOS_PLAN.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <details className="card mt-4 p-4">
          <summary className="tap flex cursor-pointer items-center gap-2 font-bold">Condiciones que necesito ({prefs.necesidades.length})</summary>
          <div className="mt-6">
            <CondicionesChecklist
              idPrefix="pl"
              seleccion={prefs.necesidades}
              onChange={(next) => {
                trackCondicionesMarcadas(prefs.necesidades, next);
                guardar({ necesidades: next });
              }}
            />
          </div>
        </details>

        {hayNec && (
          <label className="tap mt-4 flex cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1 size-6 shrink-0 accent-[var(--accent)]" checked={prefs.ocultarNoDisponible} onChange={(e) => guardar({ ocultarNoDisponible: e.target.checked })} />
            <span>
              <span className="block font-bold">Ocultar planes con algo “No disponible” de lo que necesito</span>
              <span className="block text-sm text-muted">Si no, van al final de la lista.</span>
            </span>
          </label>
        )}
      </section>

      <p role="status" aria-live="polite" className="mt-8 text-xl font-bold">{mensajePlanes(res, hayNec)}</p>
      {res.ocultos > 0 && <p className="mt-1 text-muted">Ocultamos {res.ocultos} {res.ocultos === 1 ? "plan" : "planes"} con algo no disponible.</p>}

      <section aria-labelledby="lista-planes" className="mt-6">
        <h2 id="lista-planes" className="sr-only">Listado de planes</h2>
        {res.items.length === 0 ? (
          <p className="card p-6">Ningún plan cumple tus condiciones. Probá sacando alguna.</p>
        ) : (
          <ul className="stagger flex flex-col gap-6">
            {res.items.map((r, i) => (
              <li key={r.plan.id} style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                <PlanCard r={r} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
