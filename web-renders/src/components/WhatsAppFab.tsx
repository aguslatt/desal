"use client";
import { useEffect, useState } from "react";
import { whatsappConfigured, whatsappTemplate, whatsappUrl } from "@/content/site";

/** Acceso persistente y discreto. Se oculta mientras la sección de contacto está a la vista. */
export default function WhatsAppFab() {
  const [hide, setHide] = useState(true);
  useEffect(() => {
    const c = document.getElementById("contacto");
    let atContact = false;
    let pastHero = false;
    const upd = () => setHide(atContact || !pastHero);
    const io = new IntersectionObserver(([e]) => { atContact = e.isIntersecting; upd(); }, { threshold: 0.25 });
    if (c) io.observe(c);
    const on = () => { pastHero = window.scrollY > window.innerHeight * 0.35; upd(); };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", on); };
  }, []);

  const href = whatsappConfigured ? whatsappUrl(whatsappTemplate.build()) : "#contacto";
  const ext = whatsappConfigured;
  return (
    <a
      className="wa"
      href={href}
      data-hide={hide}
      tabIndex={hide ? -1 : 0}
      aria-hidden={hide}
      aria-label={ext ? "Consultar por WhatsApp" : "Ir a contacto"}
      {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-4.1A8 8 0 1 1 8.2 19L4 20z" /><path d="M9 9.5c.4 2.2 2.3 4.1 4.6 4.8l1.2-1.3-1.9-.9-.8.6c-.9-.4-1.6-1.1-2-2l.6-.8-.9-1.9L9 9.5z" /></svg>
      <span className="t">Consultar por WhatsApp</span>
    </a>
  );
}
