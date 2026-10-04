"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";

/**
 * Cursor = cristal de sal (rombo 7px) que se vuelve etiqueta de espécimen según el contexto.
 *   data-cursor="view"           → "VER →"
 *   data-cursor="drag"           → "ARRASTRAR ↔"
 *   data-cursor="tag"            → data-cursor-label (nombre/numeración de la pieza)
 *   data-cursor="link"           → el cristal crece
 *   data-cursor="hide"           → se oculta
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const crystal = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    registerGsap();
    document.documentElement.classList.add("has-cursor");
    const r = root.current!, c = crystal.current!, t = tag.current!, tx = text.current!;
    gsap.set(r, { xPercent: 0, opacity: 0 });
    const qx = gsap.quickTo(r, "x", { duration: 0.28, ease: "power3.out" });
    const qy = gsap.quickTo(r, "y", { duration: 0.28, ease: "power3.out" });
    let shown = false;
    let mode = "";

    const set = (m: string, label = "") => {
      if (m === mode && tx.textContent === label) return;
      mode = m;
      const showTag = m === "view" || m === "drag" || m === "tag";
      tx.textContent = m === "view" ? "VER →" : m === "drag" ? "ARRASTRAR ↔" : label;
      gsap.to(c, { scale: showTag || m === "hide" ? 0 : m === "link" ? 3.2 : 1, duration: 0.35, ease: "power3.out" });
      gsap.to(t, { scale: showTag ? 1 : 0.6, opacity: showTag ? 1 : 0, duration: 0.3, ease: "power3.out" });
    };

    const move = (e: PointerEvent) => {
      if (!shown) { shown = true; gsap.set(r, { x: e.clientX, y: e.clientY }); gsap.to(r, { opacity: 1, duration: 0.3 }); }
      qx(e.clientX); qy(e.clientY);
      const target = (e.target as Element | null)?.closest<HTMLElement>("[data-cursor], a, button");
      if (!target) return set("");
      const kind = target.dataset.cursor ?? "link";
      set(kind, target.dataset.cursorLabel ?? "");
    };
    const down = () => gsap.to(r, { scale: 0.85, duration: 0.15 });
    const up = () => gsap.to(r, { scale: 1, duration: 0.4, ease: "back.out(3)" });
    const leave = () => { shown = false; gsap.to(r, { opacity: 0, duration: 0.2 }); };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={root} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[9800] opacity-0" style={{ willChange: "transform" }}>
      <div ref={crystal} className="absolute -left-[5px] -top-[5px] h-[10px] w-[10px] rounded-full bg-[#050403]" style={{ boxShadow: "0 0 0 1.5px #e4dfc1" }} />
      <div ref={tag} className="label absolute left-[14px] top-[14px] origin-top-left whitespace-nowrap rounded-full bg-[#050403] px-4 py-[9px] text-[#e4dfc1] opacity-0"
        style={{ transform: "scale(.6)", boxShadow: "0 0 0 1.5px #e4dfc1" }}>
        <span ref={text} />
      </div>
    </div>
  );
}
