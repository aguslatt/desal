"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ControlesVisualizacion } from "@/components/a11y/Visualizacion";
import { Icon } from "@/components/ui/Icon";
import { track } from "@/lib/analytics";
import { guardar, usePrefs } from "@/lib/prefs";
import { CondicionesChecklist } from "./CondicionesChecklist";

export function Necesidades() {
  const router = useRouter();
  const prefs = usePrefs();
  const [aviso, setAviso] = useState("");
  const n = prefs.necesidades.length;

  const listo = () => {
    guardar({ onboarding: "listo" });
    track("onboarding_completado", { cantidad: n });
    router.push("/lugares");
  };
  const saltear = () => {
    guardar({ onboarding: prefs.onboarding ?? "salteado" });
    track("onboarding_salteado");
    router.push("/lugares");
  };

  return (
    <div className="rise">
      <h1 className="max-w-3xl text-4xl leading-tight font-bold sm:text-5xl">¿Qué necesitás saber antes de salir?</h1>
      <p className="mt-4 max-w-prose text-xl text-muted">
        Marcá lo que te importa. Son cosas concretas, no hace falta decirnos nada más. Lo que elijas queda solo en este dispositivo.
      </p>
      <p className="mt-2 max-w-prose text-muted">Podés saltear este paso y cambiarlo cuando quieras.</p>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            listo();
          }}
          aria-describedby="necesidades-estado"
        >
          <CondicionesChecklist
            idPrefix="nec"
            seleccion={prefs.necesidades}
            onChange={(next) => {
              guardar({ necesidades: next });
              setAviso(next.length === 0 ? "Sin condiciones marcadas" : `${next.length} ${next.length === 1 ? "condición marcada" : "condiciones marcadas"}`);
            }}
          />

          <div className="sticky bottom-0 z-10 -mx-4 mt-10 border-t border-soft bg-bg/95 px-4 py-4 backdrop-blur">
            <p id="necesidades-estado" role="status" aria-live="polite" className="mb-3 font-bold">
              {aviso || (n === 0 ? "Todavía no marcaste nada" : `${n} ${n === 1 ? "condición marcada" : "condiciones marcadas"}`)}
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn">
                {n === 0 ? "Ver lugares" : "Ver lugares para mí"}
                <Icon name="flecha" />
              </button>
              <button type="button" className="btn btn-ghost" onClick={saltear}>
                Saltear por ahora
              </button>
              {n > 0 && (
                <button type="button" className="btn btn-ghost" onClick={() => { guardar({ necesidades: [] }); setAviso("Sin condiciones marcadas"); }}>
                  Borrar mis condiciones
                </button>
              )}
            </div>
          </div>
        </form>

        <aside aria-labelledby="vis-titulo" className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 id="vis-titulo" className="mb-4 text-xl font-bold">Cómo querés ver la app</h2>
            <ControlesVisualizacion />
          </div>
        </aside>
      </div>
    </div>
  );
}
