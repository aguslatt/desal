"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { img, pieces } from "@/content/pieces";
import { copy } from "@/content/copy";
import { Mask, Ph } from "../ui/Mask";

/** 05 — Hecho a mano: explicado en una pantalla. Mensaje + 4 pasos a la izquierda, macrofotografía a la derecha. */
export function MadeByHand() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    registerGsap();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-macro]").forEach((el) => {
        gsap.fromTo(el.querySelector("img"), { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const h = copy.hand;
  const big = img(pieces[3], "c"), small = img(pieces[2], "c");

  return (
    <section ref={root} id="hecho-a-mano" data-tone="light" className="sheet theme-red themed overflow-hidden px-[var(--gutter)] pb-[16svh] pt-[10svh] md:pb-[20svh] md:pt-[14svh]" aria-label="Hecho a mano">
      <div className="grid gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <p className="label mb-3">04 — Hecho a mano</p>
          <h2 className="serif text-[16vw] md:text-[7.2vw]" style={{ lineHeight: 0.86 }}><Mask>{h.title}</Mask></h2>
          <p className="serif-text mt-6 max-w-md text-[19px] leading-snug md:text-[22px]">{h.text}</p>
          <ol className="mt-10">
            {h.steps.map((s) => (
              <li key={s.n} className="grid grid-cols-[3rem_1fr_auto] items-baseline gap-3 border-t border-ink/40 py-4">
                <span className="label opacity-70">{s.n}</span>
                <span><span className="serif block text-[26px] md:text-[32px]" style={{ lineHeight: 1 }}>{s.t}</span><span className="label mt-1 block opacity-70">{s.d}</span></span>
                <Ph />
              </li>
            ))}
            <li className="border-t border-ink/40" />
          </ol>
          <p className="label mt-4 opacity-70"><span className="ph">{h.footnote}</span></p>
        </div>

        <div className="relative md:col-span-7">
          <div data-macro data-cursor="hide" className="relative aspect-[5/6] overflow-hidden"><img src={big.src} alt="Macrofotografía (placeholder)" loading="lazy" className="h-full w-full object-cover" /></div>
          <div data-macro data-cursor="hide" className="absolute -bottom-8 -left-2 aspect-square w-[44%] overflow-hidden border-[6px] border-paper md:-left-10"><img src={small.src} alt="Detalle (placeholder)" loading="lazy" className="h-full w-full object-cover" /></div>
          <span className="label absolute right-3 top-3 bg-paper px-2.5 py-1.5 text-ink">macro · <span className="ph">placeholder</span></span>
        </div>
      </div>
    </section>
  );
}
