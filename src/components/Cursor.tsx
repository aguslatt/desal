"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";

/**
 * Cursor de ORO FUNDIDO: una gota líder y una cola de gotas que se funden entre sí (filtro "goo").
 * Sobre piezas se hincha y muestra la acción. Es el mismo material de la marca.
 *   data-cursor="view"  → "VER"  · "drag" → "ARRASTRAR" · "tag" → data-cursor-label · "link" → gota más grande · "hide" → se achica
 */
const SIZES = [22, 19, 16, 13, 10, 8, 6];
const LAG = [0.1, 0.2, 0.3, 0.42, 0.56, 0.72, 0.9];

export function Cursor() {
  const drops = useRef<(HTMLSpanElement | null)[]>([]);
  const label = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    registerGsap();
    document.documentElement.classList.add("has-cursor");
    const els = drops.current.filter(Boolean) as HTMLSpanElement[];
    const lab = label.current!, tx = text.current!;
    gsap.set(els, { x: -100, y: -100, xPercent: -50, yPercent: -50, opacity: 0 });
    gsap.set(lab, { xPercent: -50, yPercent: -50, x: -100, y: -100, scale: 0.4, opacity: 0 });
    const q = els.map((el, i) => ({ x: gsap.quickTo(el, "x", { duration: LAG[i], ease: "power3.out" }), y: gsap.quickTo(el, "y", { duration: LAG[i], ease: "power3.out" }) }));
    const lx = gsap.quickTo(lab, "x", { duration: 0.1, ease: "power3.out" });
    const ly = gsap.quickTo(lab, "y", { duration: 0.1, ease: "power3.out" });
    let shown = false, mode = "", curLabel = "";

    const set = (m: string, l = "") => {
      if (m === mode && l === curLabel) return;
      mode = m; curLabel = l;
      const big = m === "view" || m === "drag";
      const pill = m === "tag";
      tx.textContent = m === "view" ? "VER" : m === "drag" ? "ARRASTRAR" : l;
      gsap.to(els[0], { scale: big ? (m === "drag" ? 4.6 : 3.2) : m === "link" ? 2 : m === "hide" || pill ? (pill ? 0.6 : 0.2) : 1, duration: 0.5, ease: "elastic.out(1,0.6)" });
      gsap.to(lab, { scale: big || pill ? 1 : 0.4, opacity: big || pill ? 1 : 0, duration: 0.35, ease: "power3.out" });
      lab.className = `label pointer-events-none fixed left-0 top-0 z-[9801] whitespace-nowrap text-[#0c0a08] ${pill ? "rounded-full bg-[#d4a843] px-4 py-2.5" : ""}`;
    };

    const move = (e: PointerEvent) => {
      if (!shown) { shown = true; els.forEach((el) => gsap.set(el, { x: e.clientX, y: e.clientY })); gsap.to(els, { opacity: 1, duration: 0.3 }); }
      q.forEach((k) => { k.x(e.clientX); k.y(e.clientY); });
      lx(e.clientX + (mode === "tag" ? 70 : 0)); ly(e.clientY + (mode === "tag" ? 34 : 0));
      const t = (e.target as Element | null)?.closest<HTMLElement>("[data-cursor], a, button");
      if (!t) return set("");
      set(t.dataset.cursor ?? "link", t.dataset.cursorLabel ?? "");
    };
    const down = () => gsap.to(els[0], { scale: "*=0.8", duration: 0.15 });
    const up = () => gsap.to(els[0], { scale: mode === "drag" ? 4.6 : mode === "view" ? 3.2 : mode === "link" ? 2 : 1, duration: 0.5, ease: "elastic.out(1,0.5)" });
    const leave = () => { shown = false; gsap.to(els, { opacity: 0, duration: 0.2 }); };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none">
      <svg width="0" height="0" className="absolute"><defs>
        <filter id="goo" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" result="g" />
          <feColorMatrix in="g" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
      </defs></svg>
      <svg width="0" height="0" className="absolute"><defs>
        <filter id="water" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence id="water-turb" type="fractalNoise" baseFrequency="0.008 0.014" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap id="water-disp" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs></svg>
      <div className="fixed inset-0 z-[9800]" style={{ filter: "url(#goo)" }}>
        {SIZES.map((s, i) => (
          <span key={i} ref={(el) => { drops.current[i] = el; }} className="absolute left-0 top-0 block rounded-full opacity-0" style={{ width: s, height: s, willChange: "transform", background: "radial-gradient(circle at 34% 28%, #fbe7a3 0%, #d9ae48 45%, #a87c22 100%)" }} />
        ))}
      </div>
      <div ref={label} className="label fixed left-0 top-0 z-[9801] whitespace-nowrap text-[#0c0a08] opacity-0"><span ref={text} /></div>
    </div>
  );
}
