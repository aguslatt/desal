"use client";
import { useEffect, useRef, type ReactNode } from "react";

/** Escenario 3D de la portada: se inclina suavemente con el mouse y las capas tienen profundidad. */
export default function HeroStage({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current?.closest<HTMLElement>(".hero");
    const l = layer.current;
    if (!el || !l) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        l.dataset.live = "1";
        l.style.setProperty("--ry", `${x * 9}deg`);
        l.style.setProperty("--rx", `${-y * 6}deg`);
      });
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      delete l.dataset.live;
      l.style.setProperty("--ry", "0deg");
      l.style.setProperty("--rx", "0deg");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="hero-stage" ref={stage}>
      <div className="hero-3d" ref={layer}>{children}</div>
    </div>
  );
}
