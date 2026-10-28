"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { track } from "@/lib/analytics";
import { condiciones } from "@/lib/catalogo";
import { FRANJAS, MAX_COMENTARIO, preguntasReporte, RESPUESTAS } from "@/lib/reporte";
import type { Respuesta } from "@/lib/types";

type Paso = { tipo: "pregunta"; id: string; texto: string } | { tipo: "horario" } | { tipo: "difiere" } | { tipo: "foto" } | { tipo: "resumen" };

const PASOS: Paso[] = [
  ...preguntasReporte.map((p) => ({ tipo: "pregunta" as const, id: p.id, texto: p.texto })),
  { tipo: "horario" },
  { tipo: "difiere" },
  { tipo: "foto" },
  { tipo: "resumen" },
];
const MAX_FOTO = 5 * 1024 * 1024;
const etiquetaRespuesta = (r?: Respuesta) => RESPUESTAS.find((x) => x.v === r)?.t ?? "Sin responder";

type Envio = "editando" | "enviando" | "listo";

async function enviar(cuerpo: unknown): Promise<string | null> {
  try {
    const r = await fetch("/api/reportes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
    if (r.ok) return null;
    const j = (await r.json().catch(() => null)) as { error?: string } | null;
    return j?.error ?? "No pudimos enviar el reporte. Probá de nuevo.";
  } catch {
    return "No pudimos enviar el reporte. Revisá tu conexión y probá de nuevo.";
  }
}

function Confirmacion({ lugarId, nombre }: { lugarId: string; nombre: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="card rise p-8" role="status">
      <h2 ref={ref} tabIndex={-1} className="text-3xl font-bold outline-none">¡Gracias! Recibimos tu reporte</h2>
      <p className="mt-3 max-w-prose text-lg">
        Lo vamos a sumar a la información de {nombre}. Si otras personas cuentan algo parecido, actualizamos el dato.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/lugares/${lugarId}`} className="btn">Volver a la ficha</Link>
        <Link href="/lugares" className="btn btn-ghost">Ver más lugares</Link>
      </div>
    </div>
  );
}

/** Contar cómo te fue: una pregunta por pantalla. El foco pasa a cada pregunta nueva y los errores se explican en texto. */
function Visita({ lugarId, nombre }: { lugarId: string; nombre: string }) {
  const [i, setI] = useState(0);
  const [resp, setResp] = useState<Record<string, Respuesta>>({});
  const [horario, setHorario] = useState("");
  const [difiere, setDifiere] = useState<Respuesta | "">("");
  const [coment, setComent] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [envio, setEnvio] = useState<Envio>("editando");
  const titulo = useRef<HTMLHeadingElement>(null);
  const montado = useRef(false);

  useEffect(() => {
    if (montado.current) titulo.current?.focus();
    montado.current = true;
  }, [i]);

  const paso = PASOS[i];
  const total = PASOS.length;

  const validar = (): string => {
    if (paso.tipo === "pregunta" && !resp[paso.id]) return "Elegí una opción para seguir.";
    if (paso.tipo === "difiere") {
      if (!difiere) return "Elegí una opción para seguir.";
      if (difiere === "si" && !coment.trim()) return "Contanos qué encontraste distinto.";
    }
    return "";
  };
  const siguiente = () => {
    const e = validar();
    setError(e);
    if (!e) setI(i + 1);
  };
  const ir = (n: number) => { setError(""); setI(n); };

  const mandar = async () => {
    setEnvio("enviando");
    setError("");
    const err = await enviar({ lugarId, tipo: "visita", respuestas: resp, horario: horario || undefined, difiere: difiere || undefined, comentario: coment || undefined, conFoto: !!foto });
    if (err) { setError(err); setEnvio("editando"); return; }
    track("reporte_enviado", { tipo: "visita" });
    setEnvio("listo");
  };

  if (envio === "listo") return <Confirmacion lugarId={lugarId} nombre={nombre} />;

  const errId = "reporte-error";
  const desc = error ? errId : undefined;
  return (
    <form
      className="card rise p-5 sm:p-8"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (paso.tipo === "resumen") void mandar();
        else siguiente();
      }}
    >
      <p className="font-bold text-muted">
        {paso.tipo === "resumen" ? "Revisá y enviá" : `Pregunta ${i + 1} de ${total - 1}`}
      </p>
      <progress className="sr-only" max={total} value={i + 1} aria-label="Avance del reporte" />
      <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full bg-accent" style={{ width: `${((i + 1) / total) * 100}%` }} />
      </div>

      {paso.tipo === "pregunta" && (
        <fieldset className="mt-6 min-w-0" aria-describedby={desc}>
          <legend><h2 ref={titulo} tabIndex={-1} className="text-2xl leading-tight font-bold outline-none sm:text-3xl">{paso.texto}</h2></legend>
          <Opciones nombre={paso.id} valor={resp[paso.id] ?? ""} onChange={(v) => { setResp({ ...resp, [paso.id]: v }); setError(""); }} invalido={!!error} desc={desc} />
        </fieldset>
      )}

      {paso.tipo === "horario" && (
        <div className="mt-6">
          <h2 ref={titulo} tabIndex={-1} className="text-2xl leading-tight font-bold outline-none sm:text-3xl"><label htmlFor="r-horario">¿En qué horario fuiste?</label></h2>
          <select id="r-horario" className="field mt-4 max-w-md" value={horario} onChange={(e) => setHorario(e.target.value)}>
            <option value="">Elegí un horario (opcional)</option>
            {FRANJAS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      )}

      {paso.tipo === "difiere" && (
        <fieldset className="mt-6 min-w-0" aria-describedby={desc}>
          <legend><h2 ref={titulo} tabIndex={-1} className="text-2xl leading-tight font-bold outline-none sm:text-3xl">¿Encontraste algo diferente de lo publicado?</h2></legend>
          <Opciones nombre="difiere" valor={difiere} onChange={(v) => { setDifiere(v); setError(""); }} invalido={!!error && !difiere} desc={desc} />
          {difiere === "si" && (
            <div className="mt-5">
              <label htmlFor="r-coment" className="mb-1 block font-bold">Contanos qué encontraste distinto</label>
              <textarea id="r-coment" className="field min-h-32" maxLength={MAX_COMENTARIO} value={coment} onChange={(e) => { setComent(e.target.value); setError(""); }} aria-invalid={!!error && !coment.trim()} aria-describedby={`r-ayuda${desc ? ` ${errId}` : ""}`} />
              <p id="r-ayuda" className="mt-1 text-sm text-muted">Máximo {MAX_COMENTARIO} caracteres. No escribas datos personales.</p>
            </div>
          )}
        </fieldset>
      )}

      {paso.tipo === "foto" && (
        <div className="mt-6">
          <h2 ref={titulo} tabIndex={-1} className="text-2xl leading-tight font-bold outline-none sm:text-3xl"><label htmlFor="r-foto">¿Querés adjuntar una foto como evidencia?</label></h2>
          <p className="mt-2 text-muted">Es opcional. En esta demo la foto no se sube: solo registramos que adjuntaste una.</p>
          <input
            id="r-foto"
            type="file"
            accept="image/*"
            className="field mt-4 max-w-md"
            aria-describedby={desc}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return setFoto(null);
              if (!f.type.startsWith("image/")) { setFoto(null); e.target.value = ""; return setError("El archivo tiene que ser una imagen (JPG, PNG o similar)."); }
              if (f.size > MAX_FOTO) { setFoto(null); e.target.value = ""; return setError("La foto pesa más de 5 MB. Elegí una más liviana."); }
              setError("");
              setFoto(f.name);
            }}
          />
          {foto && <p className="mt-3 font-bold">Foto elegida: {foto}</p>}
        </div>
      )}

      {paso.tipo === "resumen" && (
        <div className="mt-6">
          <h2 ref={titulo} tabIndex={-1} className="text-2xl leading-tight font-bold outline-none sm:text-3xl">Tu reporte sobre {nombre}</h2>
          <ul className="mt-4 divide-y divide-[var(--border-soft)]">
            {PASOS.slice(0, -1).map((p, n) => {
              const [q, a] =
                p.tipo === "pregunta" ? [p.texto, etiquetaRespuesta(resp[p.id])]
                : p.tipo === "horario" ? ["¿En qué horario fuiste?", horario || "Sin responder"]
                : p.tipo === "difiere" ? ["¿Encontraste algo diferente de lo publicado?", `${etiquetaRespuesta(difiere || undefined)}${coment ? `: ${coment}` : ""}`]
                : ["Foto de evidencia", foto ?? "Sin foto"];
              return (
                <li key={n} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0"><p className="text-muted">{q}</p><p className="font-bold">{a}</p></div>
                  <button type="button" className="btn btn-ghost" onClick={() => ir(n)}>Cambiar<span className="sr-only">: {q}</span></button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && <p id={errId} role="alert" className="mt-4 flex items-start gap-2 font-bold text-no"><Icon name="no_disponible" size={1.2} />{error}</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        {i > 0 && <button type="button" className="btn btn-ghost" onClick={() => ir(i - 1)}>Anterior</button>}
        {paso.tipo === "resumen" ? (
          <button type="submit" className="btn" disabled={envio === "enviando"}>{envio === "enviando" ? "Enviando…" : "Enviar reporte"}</button>
        ) : (
          <button type="submit" className="btn">Siguiente<Icon name="flecha" /></button>
        )}
      </div>
    </form>
  );
}

function Opciones({ nombre, valor, onChange, invalido, desc }: { nombre: string; valor: string; onChange: (v: Respuesta) => void; invalido: boolean; desc?: string }) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2" role="presentation">
      {RESPUESTAS.map((o, n) => (
        <label key={o.v} className="relative flex cursor-pointer">
          <input type="radio" name={nombre} value={o.v} className="peer sr-only" checked={valor === o.v} onChange={() => onChange(o.v)} aria-invalid={invalido} aria-describedby={n === 0 ? desc : undefined} />
          <span className="tap flex w-full items-center rounded-xl border-2 border-line bg-surface px-5 py-4 text-xl font-bold peer-checked:border-accent peer-checked:bg-accent peer-checked:text-[var(--accent-text)] peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[var(--focus)]">
            {o.t}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Reportar un dato incorrecto: formulario corto. */
function Dato({ lugarId, nombre }: { lugarId: string; nombre: string }) {
  const [cond, setCond] = useState("");
  const [texto, setTexto] = useState("");
  const [errores, setErrores] = useState<{ cond?: string; texto?: string; envio?: string }>({});
  const [envio, setEnvio] = useState<Envio>("editando");
  if (envio === "listo") return <Confirmacion lugarId={lugarId} nombre={nombre} />;
  return (
    <form
      className="card rise p-5 sm:p-8"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const er = { cond: cond ? undefined : "Elegí qué dato es incorrecto.", texto: texto.trim() ? undefined : "Contanos qué dice la realidad." };
        setErrores(er);
        if (er.cond || er.texto) return;
        setEnvio("enviando");
        const err = await enviar({ lugarId, tipo: "dato", corrige: cond, comentario: texto });
        if (err) { setErrores({ envio: err }); setEnvio("editando"); return; }
        track("reporte_enviado", { tipo: "dato" });
        setEnvio("listo");
      }}
    >
      <h2 className="text-3xl font-bold">¿Qué dato es incorrecto?</h2>
      <div className="mt-5">
        <label htmlFor="d-cond" className="mb-1 block font-bold">Dato</label>
        <select id="d-cond" className="field" value={cond} onChange={(e) => setCond(e.target.value)} aria-invalid={!!errores.cond} aria-describedby={errores.cond ? "d-cond-e" : undefined}>
          <option value="">Elegí un dato</option>
          {condiciones.map((c) => <option key={c.id} value={c.id}>{c.etiqueta}</option>)}
        </select>
        {errores.cond && <p id="d-cond-e" role="alert" className="mt-1 font-bold text-no">{errores.cond}</p>}
      </div>
      <div className="mt-5">
        <label htmlFor="d-texto" className="mb-1 block font-bold">¿Qué dice la realidad?</label>
        <textarea id="d-texto" className="field min-h-32" maxLength={MAX_COMENTARIO} value={texto} onChange={(e) => setTexto(e.target.value)} aria-invalid={!!errores.texto} aria-describedby={`d-ayuda${errores.texto ? " d-texto-e" : ""}`} />
        <p id="d-ayuda" className="mt-1 text-sm text-muted">Máximo {MAX_COMENTARIO} caracteres. No escribas datos personales.</p>
        {errores.texto && <p id="d-texto-e" role="alert" className="mt-1 font-bold text-no">{errores.texto}</p>}
      </div>
      {errores.envio && <p role="alert" className="mt-4 font-bold text-no">{errores.envio}</p>}
      <button type="submit" className="btn mt-6" disabled={envio === "enviando"}>{envio === "enviando" ? "Enviando…" : "Enviar reporte"}</button>
    </form>
  );
}

export function Asistente({ lugarId, nombre, tipo }: { lugarId: string; nombre: string; tipo: "visita" | "dato" }) {
  return tipo === "dato" ? <Dato lugarId={lugarId} nombre={nombre} /> : <Visita lugarId={lugarId} nombre={nombre} />;
}
