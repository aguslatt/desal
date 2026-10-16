"use client";
import { useId, useMemo, useState } from "react";
import {
  contactContent,
  emailConfigured,
  site,
  whatsappConfigured,
  whatsappTemplate,
  whatsappUrl,
} from "@/content/site";

/**
 * No hay backend: el formulario NO "envía" nada por sí mismo. Arma el mensaje y abre
 * WhatsApp (o el correo) con el texto listo; la persona lo revisa y lo manda desde su app.
 */
export default function ContactForm() {
  const id = useId();
  const [type, setType] = useState("");
  const [qty, setQty] = useState("");
  const [need, setNeed] = useState("");
  const [name, setName] = useState("");
  const [via, setVia] = useState("");
  const [date, setDate] = useState("");
  const [trap, setTrap] = useState("");
  const [notice, setNotice] = useState("");

  const message = useMemo(() => {
    let m = whatsappTemplate.build(type || undefined, qty || undefined);
    if (need.trim()) m += `\n\nQué necesito mostrar: ${need.trim()}`;
    if (date.trim()) m += `\nFecha estimada: ${date.trim()}`;
    if (name.trim()) m += `\n\n${name.trim()}`;
    if (via.trim()) m += `${name.trim() ? " · " : "\n\n"}Contacto: ${via.trim()}`;
    return m;
  }, [type, qty, need, date, name, via]);

  const waHref = whatsappConfigured ? whatsappUrl(message) : undefined;
  const mailHref = emailConfigured
    ? `mailto:${site.contact.email}?subject=${encodeURIComponent("Consulta por renders")}&body=${encodeURIComponent(message)}`
    : undefined;

  const missing = () =>
    setNotice(
      "Todavía no hay un número de WhatsApp cargado en esta versión provisional, así que no se abre ningún chat. Se configura en src/content/site.ts.",
    );

  return (
    <form className="form glass-d" onSubmit={(e) => e.preventDefault()} aria-label="Consulta por un proyecto" noValidate>
      <fieldset className="field">
        <legend>Tipo de proyecto</legend>
        <div className="chips">
          {contactContent.projectTypes.map((t) => (
            <label className="chip" key={t}>
              <input type="radio" name={`${id}-type`} value={t} checked={type === t} onChange={() => setType(t)} />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Cantidad aproximada de imágenes</legend>
        <div className="chips">
          {contactContent.quantities.map((t) => (
            <label className="chip" key={t}>
              <input type="radio" name={`${id}-qty`} value={t} checked={qty === t} onChange={() => setQty(t)} />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor={`${id}-need`}>Qué necesitás mostrar <span className="opt">(opcional)</span></label>
        <textarea id={`${id}-need`} className="input" rows={3} value={need} onChange={(e) => setNeed(e.target.value)} placeholder="Ej.: living y cocina integrados, vista exterior de día…" />
      </div>

      <div className="two">
        <div className="field">
          <label htmlFor={`${id}-name`}>Nombre <span className="opt">(opcional)</span></label>
          <input id={`${id}-name`} className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-via`}>Medio de contacto <span className="opt">(opcional)</span></label>
          <input id={`${id}-via`} className="input" autoComplete="email" placeholder="Correo o teléfono" value={via} onChange={(e) => setVia(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${id}-date`}>Fecha estimada <span className="opt">(opcional)</span></label>
        <input id={`${id}-date`} className="input" placeholder="Ej.: fin de mes, sin apuro" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {/* señuelo anti-bots: no se usa para enviar nada */}
      <div className="hp" aria-hidden="true"><input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} name="web" /></div>

      <div className="preview" aria-label="Vista previa del mensaje">
        <span className="label">Tu mensaje</span>
        {message}
      </div>

      <div className="form-actions">
        {waHref ? (
          <a className="btn btn-cu" href={waHref} target="_blank" rel="noopener noreferrer">Abrir en WhatsApp <span className="arr" aria-hidden="true">→</span></a>
        ) : (
          <button type="button" className="btn btn-cu" aria-disabled="true" onClick={missing}>Abrir en WhatsApp <span className="arr" aria-hidden="true">→</span></button>
        )}
        {mailHref && <a className="btn btn-line-d" href={mailHref}>Enviar por correo</a>}
      </div>
      <p role="status" className="notice" hidden={!notice} style={{ display: notice ? undefined : "none" }}>{notice}</p>
      <p className="mute-d" style={{ margin: 0, fontSize: ".82rem" }}>
        No se envía nada automáticamente: se abre tu app con el mensaje listo para revisar.
      </p>
    </form>
  );
}
