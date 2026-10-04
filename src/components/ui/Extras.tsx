"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";

/** Barra de progreso de lectura (arriba, redondeada). */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    registerGsap();
    const st = ScrollTrigger.create({ start: 0, end: "max", onUpdate: (s) => { if (bar.current) bar.current.style.transform = `scaleX(${s.progress})`; } });
    return () => st.kill();
  }, []);
  return <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[8700] h-[3px]"><div ref={bar} className="h-full origin-left rounded-r-full bg-[#c9a24a]" style={{ transform: "scaleX(0)" }} /></div>;
}

/** Corazón de favoritos (persistente). */
export function Heart({ id, className = "" }: { id: string; className?: string }) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    try { const f = JSON.parse(localStorage.getItem("desal-fav") ?? "[]") as string[]; btn.current?.setAttribute("aria-pressed", String(f.includes(id))); } catch {}
  }, [id]);
  const toggle = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      const f = new Set(JSON.parse(localStorage.getItem("desal-fav") ?? "[]") as string[]);
      const on = !f.has(id); on ? f.add(id) : f.delete(id);
      localStorage.setItem("desal-fav", JSON.stringify([...f]));
      btn.current?.setAttribute("aria-pressed", String(on));
      registerGsap();
      gsap.fromTo(btn.current, { scale: 0.7 }, { scale: 1, duration: 0.6, ease: "elastic.out(1,0.4)" });
    } catch {}
  };
  return (
    <button ref={btn} onClick={toggle} aria-label="Guardar en favoritos" data-cursor="link" aria-pressed="false"
      className={`group/h grid h-10 w-10 place-items-center rounded-full bg-[#e4dfc1] text-[#0c0a08] transition-colors aria-pressed:bg-[#9b2219] aria-pressed:text-[#e4dfc1] ${className}`}>
      <svg viewBox="0 0 24 24" width="18" height="18" className="fill-transparent stroke-current group-aria-[pressed=true]/h:fill-current" strokeWidth="1.8"><path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.9a4.3 4.3 0 0 1 7.5 2.6c0 5.4-7.5 10-7.5 10Z" /></svg>
    </button>
  );
}
