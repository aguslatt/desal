"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { prefersReduced } from "@/lib/device";

/** Texto cuyas letras "adelgazan" cerca del cursor (eje de peso de la variable). Interacción de títulos. */
export function ProxText({ children, className = "", min = 380, radius = 190 }: { children: string; className?: string; min?: number; radius?: number }) {
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || prefersReduced()) return;
    const el = root.current!;
    const chars = Array.from(el.querySelectorAll<HTMLElement>("[data-c]"));
    let raf = 0, mx = -9999, my = -9999, near = false;
    const cur = chars.map(() => 900);
    const loop = () => {
      const rects = chars.map((c) => c.getBoundingClientRect());
      let moving = false;
      chars.forEach((c, i) => {
        const r = rects[i];
        const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
        const target = near ? 900 - Math.max(0, 1 - d / radius) * (900 - min) : 900;
        cur[i] += (target - cur[i]) * 0.14;
        if (Math.abs(target - cur[i]) > 0.5) moving = true;
        c.style.fontWeight = String(Math.round(cur[i]));
      });
      raf = moving || near ? requestAnimationFrame(loop) : 0;
    };
    const move = (e: PointerEvent) => {
      mx = e.clientX; my = e.clientY;
      const r = el.getBoundingClientRect();
      near = my > r.top - radius && my < r.bottom + radius && mx > r.left - radius && mx < r.right + radius;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => { window.removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, [min, radius]);
  return (
    <span ref={root} className={className} aria-label={children}>
      {children.split(" ").map((w, wi, arr) => (
        <span key={wi} aria-hidden>
          <span className="inline-block whitespace-nowrap">
            {Array.from(w).map((ch, i) => <span key={i} data-c style={{ display: "inline-block", fontWeight: 900 }}>{ch}</span>)}
          </span>
          {wi < arr.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

/** Cinta infinita; la velocidad y la inclinación reaccionan al scroll. */
export function Marquee({ items, className = "", speed = 60 }: { items: React.ReactNode[]; className?: string; speed?: number }) {
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    registerGsap();
    if (prefersReduced()) return;
    const el = track.current!;
    const w = () => el.scrollWidth / 2;
    let x = 0, boost = 0;
    const tick = (_t: number, dt: number) => {
      x -= (speed + boost) * (dt / 1000);
      if (-x > w()) x += w();
      el.style.transform = `translate3d(${x}px,0,0) skewX(${Math.max(-10, Math.min(10, boost * -0.05))}deg)`;
      boost *= 0.92;
    };
    gsap.ticker.add(tick);
    const st = ScrollTrigger.create({ onUpdate: (s) => { boost = Math.max(-400, Math.min(400, s.getVelocity() * 0.15)); } });
    return () => { gsap.ticker.remove(tick); st.kill(); };
  }, [speed]);
  const row = (k: string) => <div key={k} className="flex shrink-0 items-center gap-10 pr-10">{items.map((it, i) => <span key={i} className="flex shrink-0 items-center gap-10">{it}</span>)}</div>;
  return <div className={`overflow-hidden ${className}`} aria-hidden><div ref={track} className="flex w-max will-change-transform">{row("a")}{row("b")}</div></div>;
}

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
