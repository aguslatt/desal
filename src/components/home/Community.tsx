"use client";

import { useEffect, useRef } from "react";
import { gsap, Draggable, registerGsap } from "@/lib/gsap";
import { photo, pieces } from "@/content/pieces";
import { copy } from "@/content/copy";

/** 06 — Comunidad: las fotos de las piezas puestas, en un carril que se arrastra con inercia. */
export function Community() {
  const wrap = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const w = wrap.current!, r = rail.current!;
    const d = Draggable.create(r, { type: "x", inertia: true, edgeResistance: 0.85,
      bounds: { minX: Math.min(0, w.clientWidth - r.scrollWidth - 40), maxX: 0 }, allowNativeTouchScrolling: true })[0];
    const upd = () => d.applyBounds({ minX: Math.min(0, w.clientWidth - r.scrollWidth - 40), maxX: 0 });
    window.addEventListener("resize", upd);
    return () => { window.removeEventListener("resize", upd); d.kill(); };
  }, []);

  return (
    <section id="comunidad" data-tone="dark" className="sheet theme-bone themed overflow-hidden pb-[12svh] pt-[10svh] md:pb-[14svh] md:pt-[12svh]" aria-label="Seen on you">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 px-[var(--gutter)] md:mb-12">
        <div>
          <p className="mb-3 text-[14px] opacity-70">{copy.community.sub}</p>
          <h2 className="title" aria-label="Seen on you">Seen on you</h2>
        </div>
        <a href={copy.instagramUrl} target="_blank" rel="noreferrer" data-cursor="link" data-magnetic className="btn btn-dark">{copy.community.cta} ↗</a>
      </div>

      <div ref={wrap} className="hscroll px-[var(--gutter)] md:overflow-hidden" data-cursor="drag">
        <div ref={rail} className="flex w-max gap-4 pr-[var(--gutter)] md:cursor-grab">
          {pieces.map((p, i) => {
            const ph = photo(p);
            return (
              <figure key={p.slug} className="group w-[68vw] shrink-0 md:w-[24vw]">
                <div className="round-lg relative aspect-[9/14] overflow-hidden">
                  <img src={ph.src} width={ph.w} height={ph.h} alt={p.alt} loading="lazy" draggable={false}
                    className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]" />
                  <span className="pill pill-ink absolute left-4 top-4">@desal_studio</span>
                </div>
                <figcaption className="label mt-3 flex justify-between px-2"><span>{String(i + 1).padStart(2, "0")}</span><span className="opacity-60">{p.label} Nº{p.no}</span></figcaption>
              </figure>
            );
          })}
        </div>
      </div>
      <p className="label mt-6 px-[var(--gutter)] opacity-60">↔ Arrastrá · fotos reales del taller</p>
    </section>
  );
}
