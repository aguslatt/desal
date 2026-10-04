"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { pieces, img } from "@/content/pieces";
import { copy } from "@/content/copy";
import { Frame } from "../ui/Frame";
import { Ph } from "../ui/Mask";
import { PencilArrow } from "../ui/Pencil";

const [ring, hoops, signet, nugget] = pieces;

/**
 * 05 — MADE BY HAND. Cada palabra ocupa una zona distinta de la pantalla, con macrofotografía a escala monumental.
 * Las palabras se desplazan en sentidos opuestos (scrub) y las macros se abren con máscara.
 */
export function MadeByHand() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    registerGsap();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-slide]").forEach((el) => {
        const v = parseFloat(el.dataset.slide!);
        gsap.fromTo(el, { xPercent: -v }, { xPercent: v, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.7 } });
      });
      gsap.utils.toArray<HTMLElement>("[data-macro]").forEach((el) => {
        gsap.fromTo(el.querySelector("img"), { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.7 } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const h = copy.hand;
  const m = { a: img(nugget, "c"), b: img(signet, "c"), c: img(ring, "c"), d: img(hoops, "c") };

  const steps = (
    <ol className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
      {h.steps.map((s) => (
        <li key={s.n}>
          <div className="hair mb-3" />
          <div className="label flex justify-between"><span className="opacity-50">{s.n}</span><Ph /></div>
          <div className="serif mt-2 text-[8vw] md:text-[3.4vw]" style={{ lineHeight: 1 }}>{s.t}</div>
        </li>
      ))}
    </ol>
  );

  return (
    <section ref={root} id="hecho-a-mano" className="relative overflow-hidden" aria-label="Hecho a mano">
      {/* ───── desktop ───── */}
      <div className="relative hidden h-[245svh] md:block">
        <div className="label absolute left-[var(--gutter)] top-[7svh]">05 — Proceso</div>

        <div data-macro data-cursor="hide" className="absolute left-[40vw] top-[10svh] z-[2] w-[34vw]" data-depth="0.1">
          <Frame seed={12} className="w-full" style={{ aspectRatio: "4/5" }}>
            <img src={m.a.src} alt="Macrofotografía de oro martillado (placeholder)" loading="lazy" className="h-full w-full object-cover" />
          </Frame>
          <PencilArrow className="absolute -left-[5vw] top-[14vw] w-[6vw] rotate-[8deg]" />
          <span className="label absolute -left-[9.4vw] top-[12.4vw] text-bermellon">{h.notes[0]}</span>
        </div>
        <div data-slide="6" className="serif absolute left-[-1vw] top-[6svh] z-[3] text-[32vw]" aria-label="Made"><span className="mask"><span className="mask-in" data-rv="up">MADE</span></span></div>

        <div className="serif serif-i absolute left-[42vw] top-[64svh] z-[3] text-[10vw]" style={{ lineHeight: 1 }}><span className="mask"><span className="mask-in" data-rv="up">by</span></span></div>
        <div className="absolute left-[var(--gutter)] right-[var(--gutter)] top-[92svh]">{steps}</div>

        <div data-macro data-cursor="hide" className="absolute right-[5vw] top-[126svh] z-[2] w-[30vw]" data-depth="0.12">
          <Frame seed={14} className="w-full" style={{ aspectRatio: "1/1" }}>
            <img src={m.b.src} alt="Macrofotografía de plata grabada (placeholder)" loading="lazy" className="h-full w-full object-cover" />
          </Frame>
          <span className="label absolute -bottom-6 right-0 opacity-60">{h.notes[1]}</span>
        </div>
        <div data-macro data-cursor="hide" className="absolute left-[8vw] top-[132svh] z-[2] w-[19vw]" data-depth="-0.08">
          <Frame seed={15} className="w-full" style={{ aspectRatio: "3/4" }}>
            <img src={m.c.src} alt="Macrofotografía de anillo (placeholder)" loading="lazy" className="h-full w-full object-cover" />
          </Frame>
          <span className="label absolute -bottom-6 left-0 opacity-60">{h.notes[2]}</span>
        </div>
        <div data-slide="6" className="serif absolute right-[-2vw] top-[148svh] z-[3] text-[32vw]" aria-label="Hand"><span className="mask"><span className="mask-in" data-rv="up">HAND</span></span></div>

        <p className="label absolute bottom-[4svh] left-[var(--gutter)] max-w-[44ch] opacity-60"><span className="ph">{h.footnote}</span></p>
      </div>

      {/* ───── mobile ───── */}
      <div className="relative px-[var(--gutter)] pb-20 pt-16 md:hidden">
        <div className="label mb-4">05 — Proceso</div>
        <div className="serif text-[40vw]" style={{ lineHeight: 0.8 }}><span className="mask"><span className="mask-in" data-rv="up">MADE</span></span></div>
        <div className="relative -mt-8 ml-auto w-[74vw]" data-macro><Frame seed={12} style={{ aspectRatio: "4/5" }}><img src={m.a.src} alt="" loading="lazy" className="h-full w-full object-cover" /></Frame><span className="label absolute -bottom-5 left-0 text-bermellon">{h.notes[0]}</span></div>
        <div className="serif serif-i mt-10 text-[18vw]" style={{ lineHeight: 1 }}>by</div>
        <div className="mt-6">{steps}</div>
        <div className="mt-12 flex gap-4"><Frame seed={15} className="w-[40vw]" style={{ aspectRatio: "3/4" }}><img src={m.c.src} alt="" loading="lazy" className="h-full w-full object-cover" /></Frame><Frame seed={14} className="mt-16 w-[44vw]" style={{ aspectRatio: "1/1" }}><img src={m.b.src} alt="" loading="lazy" className="h-full w-full object-cover" /></Frame></div>
        <div className="serif -mt-4 text-right text-[40vw]" style={{ lineHeight: 0.8 }}><span className="mask"><span className="mask-in" data-rv="up">HAND</span></span></div>
        <p className="label mt-10 opacity-60"><span className="ph">{h.footnote}</span></p>
      </div>
    </section>
  );
}
