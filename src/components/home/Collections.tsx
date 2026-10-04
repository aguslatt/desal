"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { collections, img, pad, piecesOf } from "@/content/pieces";
import { Roll, TLink } from "../ui/TLink";

/**
 * 06 — COLECCIONES. No son categorías: son cuatro nombres monumentales.
 * Hover (desktop): la pieza gigante asociada persigue el cursor con inercia y se revela con máscara.
 * Mobile: acordeón táctil.
 */
export function Collections() {
  const [active, setActive] = useState<number | null>(null);
  const [open, setOpen] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const imgs = useRef<(HTMLDivElement | null)[]>([]);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    registerGsap();
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = stage.current!;
    gsap.set(el, { xPercent: -50, yPercent: -50, x: -999, y: -999 });
    const qx = gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" });
    const qy = gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" });
    const qr = gsap.quickTo(el, "rotation", { duration: 0.7, ease: "power3.out" });
    let lastX = 0;
    const move = (e: PointerEvent) => {
      qx(e.clientX); qy(e.clientY);
      qr(gsap.utils.clamp(-9, 9, (e.clientX - lastX) * 0.35));
      lastX = e.clientX;
    };
    list.current!.addEventListener("pointermove", move);
    const l = list.current!;
    return () => l.removeEventListener("pointermove", move);
  }, []);

  useEffect(() => {
    imgs.current.forEach((n, i) => {
      if (!n) return;
      gsap.to(n, { clipPath: active === i ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)", duration: active === i ? 0.7 : 0.5, ease: "expo.out", overwrite: true });
      gsap.to(n.firstElementChild, { scale: active === i ? 1 : 1.2, duration: 0.9, ease: "expo.out", overwrite: true });
    });
    gsap.to(stage.current, { opacity: active == null ? 0 : 1, duration: 0.3 });
  }, [active]);

  return (
    <section id="colecciones" className="relative bg-hueso px-[var(--gutter)] pb-[10svh] pt-[16svh]" aria-label="Colecciones">
      <div className="label mb-[5svh] flex justify-between"><span>06 — Colecciones</span><span>(04)</span></div>

      {/* pieza que persigue al cursor (desktop) */}
      <div ref={stage} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[50] hidden aspect-square w-[34vw] opacity-0 md:block">
        {collections.map((c, i) => {
          const p = piecesOf(c.id)[0];
          const a = img(p, "a");
          return (
            <div key={c.id} ref={(n) => { imgs.current[i] = n; }} className="absolute inset-0 flex items-center justify-center" style={{ clipPath: "inset(0% 0% 100% 0%)" }}>
              <img src={a.src} width={a.w} height={a.h} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
            </div>
          );
        })}
      </div>

      {/* desktop: lista tipográfica */}
      <ul ref={list} className="hidden md:block" onPointerLeave={() => setActive(null)}>
        {collections.map((c, i) => {
          const ps = piecesOf(c.id);
          return (
            <li key={c.id} className="border-t border-tinta/40" onPointerEnter={() => setActive(i)}>
              <TLink href={`/piece/${ps[0].slug}`} label={c.name} data-cursor="hide"
                className="group flex items-baseline justify-between py-[2.2svh] transition-opacity duration-500" style={{ opacity: active == null || active === i ? 1 : 0.14 }}>
                <span className="label w-[10vw]">{pad(i + 1)}</span>
                <span className="serif flex-1 text-[15vw] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-[2vw]" style={{ lineHeight: 0.86 }}>{c.name}</span>
                <span className="label w-[14vw] text-right"><span className="block">({pad(ps.length)})</span><span className="block opacity-60"><Roll>{c.blurb}</Roll></span></span>
              </TLink>
            </li>
          );
        })}
        <li className="border-t border-tinta/40" />
      </ul>

      {/* mobile: acordeón */}
      <ul className="md:hidden">
        {collections.map((c, i) => {
          const ps = piecesOf(c.id);
          const a = img(ps[0], "a");
          const isOpen = open === i;
          return (
            <li key={c.id} className="border-t border-tinta/40">
              <button className="flex w-full items-baseline justify-between py-3 text-left" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
                <span className="label w-8">{pad(i + 1)}</span>
                <span className="serif flex-1 text-[17vw]" style={{ lineHeight: 0.9 }}>{c.name}</span>
                <span className="label">({pad(ps.length)})</span>
              </button>
              <div className="grid transition-[grid-template-rows] duration-700 ease-[var(--ease-out-expo)]" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                <div className="overflow-hidden">
                  <div className="flex items-center justify-between gap-4 pb-6">
                    <img src={a.src} width={a.w} height={a.h} alt="" loading="lazy" className="max-h-[34svh] w-[56vw] object-contain" />
                    <div className="label flex flex-col items-end gap-2 text-right">
                      <span className="opacity-60">{c.blurb}</span>
                      {ps.map((p) => <TLink key={p.slug} href={`/piece/${p.slug}`} label={`${p.label} Nº${p.no}`} className="u-line">{p.label} Nº{p.no} →</TLink>)}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        <li className="border-t border-tinta/40" />
      </ul>
    </section>
  );
}
