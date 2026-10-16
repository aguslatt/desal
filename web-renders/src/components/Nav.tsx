"use client";
import { useEffect, useRef, useState } from "react";
import { displayName, nav, site } from "@/content/site";

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const burger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // sección activa
  useEffect(() => {
    const els = nav.map((n) => document.querySelector<HTMLElement>(n.href)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive("#" + e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // menú: bloquear scroll, Esc, devolver foco
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        burger.current?.focus();
      }
    };
    window.addEventListener("keydown", k);
    return () => {
      window.removeEventListener("keydown", k);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="nav" data-solid={solid || open}>
        <div className="wrap nav-in">
          <a href="#inicio" className="brand" aria-label={`${displayName} — inicio`} onClick={() => setOpen(false)}>
            <i aria-hidden="true">{site.wordmark}</i>
            <div>
              <b>{displayName}</b>
              <span>{site.role.split(" · ")[1] ?? site.role}</span>
            </div>
          </a>
          <nav aria-label="Principal" className="nav-links">
            {nav.map((n) => (
              <a key={n.href} href={n.href} aria-current={active === n.href ? "true" : undefined}>
                {n.label}
              </a>
            ))}
            <a href="#contacto" className="btn btn-cu nav-cta">Cotizar</a>
          </nav>
          <div className="nav-mob">
            <a href="#contacto" className="btn btn-cu nav-cta" onClick={() => setOpen(false)}>Cotizar</a>
            <button ref={burger} className="burger" aria-expanded={open} aria-controls="menu-movil" onClick={() => setOpen((v) => !v)}>
              <span className="label">{open ? "Cerrar" : "Menú"}</span>
              <i aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      <div id="menu-movil" className="menu" data-open={open} aria-hidden={!open} inert={!open}>
        <nav aria-label="Menú móvil">
          <ol>
            {nav.map((n, i) => (
              <li key={n.href}>
                <a href={n.href} onClick={() => setOpen(false)}>
                  <span className="num">0{i + 1}</span>
                  {n.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <a href="#contacto" className="btn btn-cu" onClick={() => setOpen(false)}>Cotizar mi proyecto</a>
      </div>
    </>
  );
}
