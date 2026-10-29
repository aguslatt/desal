"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { condicion } from "@/lib/catalogo";
import { lugares } from "@/lib/datos";
import { buscar, mensajeResultado, textoCoincidencia } from "@/lib/match";
import { guardar } from "@/lib/prefs";
import { track } from "@/lib/analytics";

const OPCIONES = ["ingreso_sin_escalones", "atencion_escrito", "espacio_tranquilo", "bano_accesible", "musica_baja", "carta_facil"];
const BANDA = ["bg-ok-bg text-ok border-ok", "bg-unk-bg text-unk border-unk border-dashed", "bg-no-bg text-no border-no"];
const ICONO = ["confirmado", "sin_info", "no_disponible"] as const;
const mayus = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * Demo viva con los datos reales: tocás lo que necesitás y los cafés se reordenan.
 * Es la idea central de Umbral, funcionando en la portada.
 */
export function DemoVivo() {
  const router = useRouter();
  const [sel, setSel] = useState<string[]>(["ingreso_sin_escalones", "atencion_escrito"]);
  const res = useMemo(() => buscar(lugares, { necesidades: sel }), [sel]);
  const top = res.items.slice(0, 3);

  const alternar = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const verTodos = () => {
    guardar({ necesidades: sel, onboarding: "listo" });
    track("filtro_usado", { filtro: "demo_portada", valor: String(sel.length) });
    router.push("/lugares");
  };

  return (
    <div className="card relative min-w-0 overflow-hidden p-5 text-ink sm:p-6" role="group" aria-labelledby="demo-titulo">
      <p className="chip chip-mint">Probalo ahora</p>
      <h2 id="demo-titulo" className="display mt-2 text-2xl leading-tight font-bold">¿Qué necesitás saber antes de ir?</h2>

      <ul className="mt-4 flex flex-wrap gap-2">
        {OPCIONES.map((id) => {
          const on = sel.includes(id);
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => alternar(id)}
                className={`tap inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1 text-sm font-bold transition-colors ${on ? "border-accent bg-accent text-[var(--accent-text)]" : "border-line bg-surface hover:border-accent"}`}
              >
                {on && <Icon name="confirmado" size={1.05} />}
                {mayus(condicion(id).corta)}
              </button>
            </li>
          );
        })}
      </ul>

      <p role="status" aria-live="polite" className="mt-4 font-bold">{mensajeResultado(res, sel.length > 0)}</p>

      {top.length > 0 && (
        <ol className="mt-3 flex flex-col gap-2.5">
          {top.map((r) => {
            const c = r.coincidencia;
            const f = r.lugar.fotos[0];
            return (
              <li key={r.lugar.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-soft bg-surface p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.src} srcSet={f.srcSet} sizes="64px" alt="" width={64} height={64} loading="lazy" className="size-16 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <Link href={`/lugares/${r.lugar.id}`} className="display block truncate font-bold text-ink no-underline hover:underline">{r.lugar.nombre}</Link>
                  <p className={`mt-1 inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-lg border-2 px-2 py-0.5 text-xs font-bold ${BANDA[c.grupo]}`}>
                    <Icon name={ICONO[c.grupo]} size={1} />
                    {c.total > 0 ? textoCoincidencia(c) : r.lugar.barrio}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <button type="button" onClick={verTodos} className="btn mt-4 w-full">
        {res.cumplenTodo > 0 ? `Ver los ${res.cumplenTodo} ${res.cumplenTodo === 1 ? "café que cumple" : "cafés que cumplen"}` : "Ver los cafés"}
        <Icon name="flecha" />
      </button>
    </div>
  );
}
