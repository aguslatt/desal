"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { pieces } from "@/content/pieces";
import { copy } from "@/content/copy";
import { Ph } from "../ui/Mask";
import { ProxText } from "../ui/Extras";
import { PhotoCover } from "../ui/PhotoCover";

/** 05 — Hecho a mano: mensaje + 4 pasos (a la izquierda) y macros reales de las piezas (a la derecha). */
export function MadeByHand() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    registerGsap();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-float]").forEach((el, i) => {
        gsap.to(el, { y: i % 2 ? 18 : -18, rotate: i % 2 ? 3 : -3, duration: 4 + i, ease: "sine.inOut", yoyo: true, repeat: -1 });
      });
      gsap.utils.toArray<HTMLElement>("[data-step]").forEach((el) => {
        gsap.fromTo(el, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      });
    }, root);
    return () => ctx.revert();
  }, []);
  const h = copy.hand;

  return (
    <section ref={root} id="hecho-a-mano" data-tone="light" className="sheet theme-red themed overflow-hidden px-[var(--gutter)] pb-[16svh] pt-[10svh] md:pb-[20svh] md:pt-[14svh]" aria-label="Hecho a mano">
      <div className="grid gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <p className="label mb-3">04 — Hecho a mano</p>
          <h2 className="serif text-[16vw] md:text-[7.2vw]" style={{ lineHeight: 0.86 }}><ProxText>{h.title}</ProxText></h2>
          <p className="serif-text mt-6 max-w-md text-[19px] leading-snug md:text-[22px]">{h.text}</p>
          <ol className="mt-9 flex flex-col gap-2.5">
            {h.steps.map((s) => (
              <li key={s.n} data-step className="flex items-center gap-4 rounded-full border-[1.5px] border-ink/40 py-2.5 pl-2.5 pr-6 transition-colors hover:bg-ink hover:text-paper">
                <span className="label grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper">{s.n}</span>
                <span className="flex-1"><span className="serif block text-[22px] md:text-[26px]" style={{ lineHeight: 1 }}>{s.t}</span><span className="label mt-1 block opacity-70">{s.d}</span></span>
                <Ph />
              </li>
            ))}
          </ol>
          <p className="label mt-4 opacity-70"><span className="ph">{h.footnote}</span></p>
        </div>

        <div className="relative min-h-[110vw] md:col-span-7 md:min-h-0">
          <PhotoCover piece={pieces[1]} zoom={1.9} hover={1.06} className="absolute inset-0 md:relative md:aspect-[5/6]" rounded="round-lg" />
          <div data-float className="absolute -bottom-6 -left-1 h-[42vw] w-[42vw] overflow-hidden rounded-full border-[6px] border-[#9b2219] md:-bottom-10 md:-left-12 md:h-[17vw] md:w-[17vw]">
            <PhotoCover piece={pieces[2]} zoom={2.8} hover={1.08} className="h-full w-full" rounded="" />
          </div>
          <div data-float className="absolute -top-5 right-3 h-[26vw] w-[26vw] overflow-hidden rounded-full border-[6px] border-[#9b2219] md:-right-6 md:-top-8 md:h-[10vw] md:w-[10vw]">
            <PhotoCover piece={pieces[0]} zoom={2.8} hover={1.08} className="h-full w-full" rounded="" />
          </div>
          <span className="pill pill-ink absolute bottom-4 right-4">foto real · macro</span>
        </div>
      </div>
    </section>
  );
}
