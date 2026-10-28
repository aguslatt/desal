"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CondicionesChecklist } from "@/components/necesidades/CondicionesChecklist";
import { Icon } from "@/components/ui/Icon";
import { RUBROS } from "@/lib/catalogo";
import { barrios, lugares, reportesDemo } from "@/lib/datos";
import { discrepancias } from "@/lib/discrepancia";
import { track, trackCondicionesMarcadas } from "@/lib/analytics";
import { buscar, mensajeResultado } from "@/lib/match";
import { guardar, usePrefs } from "@/lib/prefs";
import type { Rubro } from "@/lib/types";
import { TarjetaLugar } from "./TarjetaLugar";

const Mapa = dynamic(() => import("./Mapa"), {
  ssr: false,
  loading: () => <p className="card p-6">Cargando el mapa…</p>,
});

const conDiscrepancia = new Set(lugares.filter((l) => discrepancias(l, reportesDemo).length > 0).map((l) => l.id));

export function Buscador() {
  const prefs = usePrefs();
  // La URL guarda vista, rubro y barrio para poder compartirlos. Se lee al montar (la página se genera en el
  // servidor con los valores por defecto, así no aparece vacía ni se corre al cargar).
  const [q, setQ] = useState({ vista: "lista", rubro: "", barrio: "" });
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setQ({ vista: p.get("vista") === "mapa" ? "mapa" : "lista", rubro: p.get("rubro") ?? "", barrio: p.get("barrio") ?? "" });
  }, []);

  const vista = q.vista;
  const rubro = q.rubro in RUBROS ? (q.rubro as Rubro) : undefined;
  const barrio = barrios.includes(q.barrio) ? q.barrio : undefined;

  const cambiar = (clave: "vista" | "rubro" | "barrio", valor: string | null, evento?: string) => {
    setQ((x) => ({ ...x, [clave]: valor ?? (clave === "vista" ? "lista" : "") }));
    const p = new URLSearchParams(location.search);
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    history.replaceState(null, "", `${location.pathname}${p.size ? `?${p}` : ""}`);
    if (evento) track("filtro_usado", { filtro: evento, valor: valor ?? "todos" });
  };

  const resultado = useMemo(
    () => buscar(lugares, { necesidades: prefs.necesidades, rubro, barrio, ocultarNoDisponible: prefs.ocultarNoDisponible }),
    [prefs.necesidades, prefs.ocultarNoDisponible, rubro, barrio],
  );
  const hayNec = prefs.necesidades.length > 0;
  const mensaje = mensajeResultado(resultado, hayNec);

  return (
    <div>
      <h1 className="text-4xl font-bold sm:text-5xl">Lugares</h1>

      {!hayNec && (
        <p className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="max-w-prose">Marcá lo que necesitás y vemos cuánto coincide cada lugar.</span>
          <Link href="/necesidades" className="btn">Marcar mis necesidades</Link>
        </p>
      )}

      <section aria-labelledby="filtros" className="mt-8">
        <h2 id="filtros" className="sr-only">Filtros</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="f-rubro" className="mb-1 block font-bold">Rubro</label>
            <select id="f-rubro" className="field" value={rubro ?? ""} onChange={(e) => cambiar("rubro", e.target.value || null, "rubro")}>
              <option value="">Todos</option>
              {Object.entries(RUBROS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-barrio" className="mb-1 block font-bold">Barrio</label>
            <select id="f-barrio" className="field" value={barrio ?? ""} onChange={(e) => cambiar("barrio", e.target.value || null, "barrio")}>
              <option value="">Todos</option>
              {barrios.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <details className="card mt-4 p-4" onToggle={() => undefined}>
          <summary className="tap flex cursor-pointer items-center gap-2 font-bold">
            Condiciones que necesito ({prefs.necesidades.length})
          </summary>
          <div className="mt-6">
            <CondicionesChecklist
              idPrefix="f"
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
            <input
              type="checkbox"
              className="mt-1 size-6 shrink-0 accent-[var(--accent)]"
              checked={prefs.ocultarNoDisponible}
              onChange={(e) => guardar({ ocultarNoDisponible: e.target.checked })}
            />
            <span>
              <span className="block font-bold">Ocultar lugares con algo “No disponible” de lo que necesito</span>
              <span className="block text-sm text-muted">Si no, van al final de la lista.</span>
            </span>
          </label>
        )}
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-xl font-bold">
          {mensaje}
        </p>
        <div role="group" aria-label="Tipo de vista" className="flex flex-wrap gap-2">
          <button type="button" className={`btn ${vista === "lista" ? "" : "btn-ghost"}`} aria-pressed={vista === "lista"} onClick={() => cambiar("vista", null)}>
            <Icon name="lista" /> Listado
          </button>
          <button type="button" className={`btn ${vista === "mapa" ? "" : "btn-ghost"}`} aria-pressed={vista === "mapa"} onClick={() => cambiar("vista", "mapa")}>
            <Icon name="mapa" /> Mapa
          </button>
        </div>
      </div>
      {resultado.ocultos > 0 && (
        <p className="mt-1 text-muted">
          Ocultamos {resultado.ocultos} {resultado.ocultos === 1 ? "lugar" : "lugares"} con algo no disponible.
        </p>
      )}

      {vista === "mapa" && (
        <section aria-labelledby="mapa-t" className="mt-6">
          <h2 id="mapa-t" className="sr-only">Mapa</h2>
          <p className="mb-3 max-w-prose text-muted">
            El mapa muestra los mismos lugares que el listado, con la misma información.{" "}
            <button type="button" className="tap inline font-bold underline" onClick={() => cambiar("vista", null)}>
              Ver como listado
            </button>
            .
          </p>
          <Mapa items={resultado.items} hayNecesidades={hayNec} />
        </section>
      )}

      {vista === "lista" && (
        <section aria-labelledby="lista-t" className="mt-6">
          <h2 id="lista-t" className="sr-only">Listado de lugares</h2>
          {resultado.items.length === 0 ? (
            <p className="card p-6">Ningún lugar cumple tus condiciones. Probá sacando alguna.</p>
          ) : (
            <ul className="stagger flex flex-col gap-6">
              {resultado.items.map((r, i) => (
                <li key={r.lugar.id} style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                  <TarjetaLugar r={r} discrepancia={conDiscrepancia.has(r.lugar.id)} i={i} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
