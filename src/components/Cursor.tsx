"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";

/**
 * Cursor sobrio: el del sistema se mantiene; solo sobre elementos con data-cursor aparece una píldora con la acción.
 *   data-cursor="view" → "Ver" · "drag" → "Arrastrar" · "tag" → data-cursor-label
 */
export function Cursor() {
  const el = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    registerGsap();
    const c = el.current!, tx = text.current!;
    gsap.set(c, { xPercent: -50, yPercent: -50, x: -200, y: -200, scale: 0.5, opacity: 0 });
    const qx = gsap.quickTo(c, "x", { duration: 0.22, ease: "power3.out" });
    const qy = gsap.quickTo(c, "y", { duration: 0.22, ease: "power3.out" });
    let mode = "";
    const set = (m: string, l: string) => {
      const label = m === "view" ? "Ver" : m === "drag" ? "Arrastrar" : m === "tag" ? l : "";
      if (label === mode) return;
      mode = label;
      if (label) tx.textContent = label;
      document.documentElement.classList.toggle("cursor-hidden", !!label);
      gsap.to(c, { scale: label ? 1 : 0.5, opacity: label ? 1 : 0, duration: 0.35, ease: "power3.out" });
    };
    const move = (e: PointerEvent) => {
      qx(e.clientX); qy(e.clientY);
      const t = (e.target as Element | null)?.closest<HTMLElement>("[data-cursor]");
      if (!t) return set("", "");
      set(t.dataset.cursor ?? "", t.dataset.cursorLabel ?? "");
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => { window.removeEventListener("pointermove", move); document.documentElement.classList.remove("cursor-hidden"); };
  }, []);

  return (
    <div ref={el} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[9800] grid h-[84px] min-w-[84px] place-items-center rounded-full bg-[#e4dfc1] px-4 text-[#0c0a08] opacity-0 shadow-[0_8px_30px_rgba(0,0,0,.25)]">
      <span ref={text} className="label whitespace-nowrap" />
    </div>
  );
}
