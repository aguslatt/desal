"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { paperCut } from "@/lib/cut";
import { markReady } from "@/lib/ready";
import { getLenis } from "@/lib/scroll";
import { prefersReduced } from "@/lib/device";

/** Carga inicial: contador monumental + sal que cae; sale como la costra (mismo gesto que la transición de página). */
export function Loader({ preload = [] as string[] }) {
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    registerGsap();
    let seen = false;
    try { seen = sessionStorage.getItem("desal-seen") === "1"; } catch {}
    const reduced = prefersReduced();
    if (seen || reduced) {
      setGone(true);
      markReady();
      return;
    }
    getLenis()?.stop();
    document.documentElement.style.overflow = "hidden";

    const counter = { v: 0 };
    const assets = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      ...preload.map((src) => new Promise<void>((res) => { const i = new Image(); i.onload = i.onerror = () => res(); i.src = src; })),
    ]);
    let loaded = false;
    assets.then(() => { loaded = true; });

    const grains = root.current!.querySelectorAll<HTMLElement>("[data-grain]");
    grains.forEach((g, i) => {
      gsap.fromTo(g, { y: -30 - Math.random() * 60, opacity: 0 }, { y: "105svh", opacity: 1, duration: 1.4 + Math.random() * 1.2, delay: i * 0.03, ease: "power1.in", repeat: -1, repeatDelay: Math.random() });
    });

    const tl = gsap.timeline();
    tl.to(counter, {
      v: 100, duration: 1.5, ease: "power2.inOut",
      onUpdate: () => {
        // no pasa de 92 hasta que los assets estén listos
        if (!loaded && counter.v > 92) counter.v = 92;
        if (num.current) num.current.textContent = String(Math.round(counter.v)).padStart(3, "0");
      },
    });
    const finish = () => {
      const poll = () => {
        if (!loaded) return void setTimeout(poll, 60);
        gsap.to(counter, { v: 100, duration: 0.2, onUpdate: () => { if (num.current) num.current.textContent = String(Math.round(counter.v)).padStart(3, "0"); } });
        gsap.to(root.current, {
          yPercent: -112, duration: 0.95, ease: "expo.inOut", delay: 0.25,
          onStart: () => setTimeout(() => markReady(), 380),
          onComplete: () => {
            document.documentElement.style.overflow = "";
            getLenis()?.start();
            try { sessionStorage.setItem("desal-seen", "1"); } catch {}
            setGone(true);
          },
        });
      };
      poll();
    };
    tl.add(finish);
    return () => { tl.kill(); document.documentElement.style.overflow = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className="tex-sand fixed inset-0 z-[9700] overflow-hidden" style={{ clipPath: paperCut(9, { n: 48, amp: 3.2, edges: ["b"] }) }} role="status" aria-label="Cargando">
      {Array.from({ length: 26 }).map((_, i) => (
        <span key={i} data-grain className="absolute block bg-tinta" style={{ left: `${(i * 37) % 100}%`, top: 0, width: 2 + (i % 3), height: 2 + (i % 3), opacity: 0 }} />
      ))}
      <div className="absolute left-[var(--gutter)] right-[var(--gutter)] top-[var(--gutter)] flex justify-between">
        <span className="label">DE SAL</span>
        <span className="label">Objetos que emergen de la sal</span>
      </div>
      <div className="absolute bottom-[calc(var(--gutter)*0.5)] left-[var(--gutter)] flex items-end gap-4">
        <span ref={num} className="serif num" style={{ fontSize: "min(34vw, 46svh)" }}>000</span>
      </div>
      <span className="label absolute bottom-[var(--gutter)] right-[var(--gutter)]">Cargando</span>
    </div>
  );
}
