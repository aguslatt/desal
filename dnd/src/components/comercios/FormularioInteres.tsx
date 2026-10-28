"use client";

import { Dialog } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { track } from "@/lib/analytics";
import { RUBROS_COMERCIO, type Interes } from "@/lib/entrada";

type Errores = Partial<Record<"nombre" | "rubro" | "contacto" | "envio", string>>;

const TEXTOS: Record<Interes, { boton: string; titulo: string; ayuda: string }> = {
  pro: { boton: "Quiero el plan Pro", titulo: "Quiero el plan Pro", ayuda: "Dejanos estos datos y te escribimos." },
  relevamiento: { boton: "Quiero que relevemos mi café", titulo: "Quiero un relevamiento", ayuda: "Dejanos estos datos y te escribimos para coordinar." },
};

/**
 * "Fake door": registra el interés (anónimo para las personas usuarias; acá el dato es del comercio).
 * Es un diálogo modal: el foco queda adentro, Escape cierra y el foco vuelve al botón.
 */
export function FormularioInteres({ interes, className = "btn" }: { interes: Interes; className?: string }) {
  const t = TEXTOS[interes];
  const [abierto, setAbierto] = useState(false);
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [v, setV] = useState({ nombre: "", rubro: "", contacto: "" });
  const gracias = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (listo) gracias.current?.focus();
  }, [listo]);

  const cambiar = (o: boolean) => {
    setAbierto(o);
    if (o) {
      track("pro_clic", { interes });
      setListo(false);
      setErrores({});
    }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Errores = {};
    if (v.nombre.trim().length < 2) er.nombre = "Escribí el nombre del café.";
    if (!v.rubro) er.rubro = "Elegí el tipo de café.";
    if (!v.contacto.trim()) er.contacto = "Escribí un correo o un teléfono para contactarte.";
    setErrores(er);
    if (Object.keys(er).length) return;
    setEnviando(true);
    try {
      const r = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...v, interes }) });
      if (r.ok) {
        track("lead_comercio_enviado", { interes });
        setListo(true);
      } else {
        const j = (await r.json().catch(() => null)) as { campo?: keyof Errores; error?: string } | null;
        setErrores(j?.campo ? { [j.campo]: j.error } : { envio: j?.error ?? "No pudimos enviar tus datos. Probá de nuevo." });
      }
    } catch {
      setErrores({ envio: "No pudimos enviar tus datos. Revisá tu conexión y probá de nuevo." });
    } finally {
      setEnviando(false);
    }
  };

  const err = (k: keyof Errores) => (errores[k] ? `${k}-err` : undefined);
  return (
    <Dialog.Root open={abierto} onOpenChange={cambiar}>
      <Dialog.Trigger className={className}>{t.boton}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="card fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6 sm:p-8">
          {listo ? (
            <div role="status">
              <Dialog.Title ref={gracias} tabIndex={-1} className="text-2xl font-bold outline-none">Estamos sumando los primeros comercios, te contactamos</Dialog.Title>
              <Dialog.Description className="mt-3 text-muted">Registramos tu interés. No hace falta que hagas nada más.</Dialog.Description>
              <Dialog.Close className="btn mt-6">Cerrar</Dialog.Close>
            </div>
          ) : (
            <form onSubmit={enviar} noValidate>
              <Dialog.Title className="text-2xl font-bold">{t.titulo}</Dialog.Title>
              <Dialog.Description className="mt-2 text-muted">{t.ayuda} Usamos tus datos solo para escribirte sobre esto.</Dialog.Description>

              <div className="mt-5">
                <label htmlFor="fi-nombre" className="mb-1 block font-bold">Nombre del café</label>
                <input id="fi-nombre" className="field" autoComplete="organization" value={v.nombre} maxLength={80} onChange={(e) => setV({ ...v, nombre: e.target.value })} aria-invalid={!!errores.nombre} aria-describedby={err("nombre")} />
                {errores.nombre && <p id="nombre-err" className="mt-1 flex gap-1.5 font-bold text-no"><Icon name="no_disponible" size={1.2} />{errores.nombre}</p>}
              </div>
              <div className="mt-5">
                <label htmlFor="fi-rubro" className="mb-1 block font-bold">Tipo de café</label>
                <select id="fi-rubro" className="field" value={v.rubro} onChange={(e) => setV({ ...v, rubro: e.target.value })} aria-invalid={!!errores.rubro} aria-describedby={err("rubro")}>
                  <option value="">Elegí el tipo de café</option>
                  {RUBROS_COMERCIO.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {errores.rubro && <p id="rubro-err" className="mt-1 flex gap-1.5 font-bold text-no"><Icon name="no_disponible" size={1.2} />{errores.rubro}</p>}
              </div>
              <div className="mt-5">
                <label htmlFor="fi-contacto" className="mb-1 block font-bold">Correo o teléfono</label>
                <input id="fi-contacto" className="field" autoComplete="email" value={v.contacto} maxLength={120} onChange={(e) => setV({ ...v, contacto: e.target.value })} aria-invalid={!!errores.contacto} aria-describedby={err("contacto")} />
                {errores.contacto && <p id="contacto-err" className="mt-1 flex gap-1.5 font-bold text-no"><Icon name="no_disponible" size={1.2} />{errores.contacto}</p>}
              </div>
              {errores.envio && <p role="alert" className="mt-4 font-bold text-no">{errores.envio}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="submit" className="btn" disabled={enviando}>{enviando ? "Enviando…" : "Enviar"}</button>
                <Dialog.Close className="btn btn-ghost">Cancelar</Dialog.Close>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
