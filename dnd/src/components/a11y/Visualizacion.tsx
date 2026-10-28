"use client";

import { useEffect, useId, useRef, useState } from "react";
import { guardar, usePrefs, type Prefs } from "@/lib/prefs";
import { Icon } from "@/components/ui/Icon";

function Grupo<T extends string>({
  nombre,
  valor,
  opciones,
  onChange,
}: {
  nombre: string;
  valor: T;
  opciones: { v: T; t: string }[];
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 font-bold">{nombre}</legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map((o) => (
          <label key={o.v} className="tap relative inline-flex cursor-pointer">
            <input
              type="radio"
              name={`${id}-${nombre}`}
              className="peer sr-only"
              checked={valor === o.v}
              onChange={() => onChange(o.v)}
            />
            <span className="tap inline-flex items-center rounded-full border-2 border-line px-4 py-2 font-bold peer-checked:border-accent peer-checked:bg-accent peer-checked:text-[var(--accent-text)] peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
              {o.t}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Interruptor({ texto, ayuda, checked, onChange }: { texto: string; ayuda?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="tap flex cursor-pointer items-start gap-3 py-1">
      <input type="checkbox" className="mt-1 size-6 shrink-0 accent-[var(--accent)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block font-bold">{texto}</span>
        {ayuda && <span className="block text-sm text-muted">{ayuda}</span>}
      </span>
    </label>
  );
}

/** Modos de visualización: siempre a mano en el encabezado. Escape cierra y devuelve el foco al botón. */
export function Visualizacion() {
  const p = usePrefs();
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const set = (c: Partial<Prefs>) => guardar(c);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [abierto]);

  return (
    <div className="relative max-w-full">
      <button
        ref={boton}
        type="button"
        className="btn btn-ghost"
        aria-expanded={abierto}
        aria-controls={panelId}
        onClick={() => setAbierto((v) => !v)}
      >
        <Icon name="ajustes" />
        Visualización
      </button>
      <div
        id={panelId}
        role="group"
        aria-label="Modos de visualización"
        hidden={!abierto}
        className="card fixed inset-x-3 top-[4.5rem] z-50 max-h-[calc(100dvh-5.5rem)] overflow-y-auto p-5 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[26rem]"
      >
        <div className="flex flex-col gap-5">
          <Grupo
            nombre="Tamaño del texto"
            valor={p.texto}
            onChange={(v) => set({ texto: v })}
            opciones={[
              { v: "100", t: "Normal" },
              { v: "125", t: "Grande" },
              { v: "150", t: "Más grande" },
              { v: "200", t: "Enorme" },
            ]}
          />
          <Grupo
            nombre="Tema"
            valor={p.tema}
            onChange={(v) => set({ tema: v })}
            opciones={[
              { v: "auto", t: "Como mi equipo" },
              { v: "light", t: "Claro" },
              { v: "dark", t: "Oscuro" },
            ]}
          />
          <div>
            <Interruptor texto="Alto contraste" ayuda="Blanco y negro puro, bordes marcados." checked={p.contraste === "high"} onChange={(v) => set({ contraste: v ? "high" : "normal" })} />
            <Interruptor texto="Reducir movimiento" ayuda="Sin animaciones ni transiciones." checked={p.movimiento === "reduce"} onChange={(v) => set({ movimiento: v ? "reduce" : "auto" })} />
            <Interruptor texto="Lectura fácil" ayuda="Frases cortas y pictogramas." checked={p.facil} onChange={(v) => set({ facil: v })} />
          </div>
          <button type="button" className="btn btn-ghost self-start" onClick={() => { setAbierto(false); boton.current?.focus(); }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
