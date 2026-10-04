"use client";

import { useEffect, useState } from "react";
import { scrollToTarget } from "@/lib/scroll";

const SECTIONS = [
  { id: "inicio", label: "Inicio" },
  { id: "joyas", label: "Joyas" },
  { id: "collares", label: "Collares" },
  { id: "destacada", label: "En 3D" },
  { id: "hecho-a-mano", label: "Hecho a mano" },
  { id: "colecciones", label: "Colecciones" },
  { id: "comunidad", label: "Comunidad" },
];

/** Índice lateral: dónde estás y a dónde ir (solo desktop). Toma el color de la sección que tiene debajo. */
export function SectionDots() {
  const [cur, setCur] = useState("inicio");
  useEffect(() => {
    let raf = 0;
    const run = () => {
      raf = 0;
      let best = "inicio";
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.5) best = s.id;
      }
      setCur(best);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(run); };
    run();
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <nav aria-label="Secciones" className="fixed right-4 top-1/2 z-[8000] hidden -translate-y-1/2 flex-col items-end gap-2.5 md:flex" style={{ color: "var(--tone-fg, #e4dfc1)" }}>
      {SECTIONS.map((s) => (
        <button key={s.id} onClick={() => scrollToTarget(`#${s.id}`)} aria-label={s.label} aria-current={cur === s.id} data-cursor="link" className="group flex items-center gap-3">
          <span className="label translate-x-2 rounded-full px-3 py-1.5 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" style={{ background: "var(--tone-fg, #e4dfc1)", color: "var(--tone-bg, #0c0a08)" }}>{s.label}</span>
          <span className="block h-2 w-2 rounded-full bg-current opacity-50 transition-all group-hover:scale-150 group-hover:opacity-100 group-aria-[current=true]:h-6 group-aria-[current=true]:w-2 group-aria-[current=true]:opacity-100" />
        </button>
      ))}
    </nav>
  );
}
