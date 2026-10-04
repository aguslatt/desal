"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { collections, markImg, pad, pieces, piecesOf } from "@/content/pieces";
import { copy } from "@/content/copy";
import { ProxText } from "../ui/Extras";
import { PhotoCover } from "../ui/PhotoCover";
import { TLink } from "../ui/TLink";

/** 04 — Colecciones: dos tiles grandes. Anillos (con foto real) y Collares (próximamente, con la marca girando). */
export function Collections() {
  const mark = useRef<HTMLImageElement>(null);
  const m = markImg();
  useEffect(() => {
    registerGsap();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = gsap.to(mark.current, { rotation: 360, duration: 22, ease: "none", repeat: -1 });
    return () => { t.kill(); };
  }, []);
  const rings = piecesOf("anillos");

  return (
    <section id="colecciones" data-tone="dark" className="sheet theme-marfil themed px-[var(--gutter)] pb-[16svh] pt-[10svh] md:pb-[20svh] md:pt-[14svh]" aria-label="Colecciones">
      <div className="mb-8 md:mb-14">
        <p className="label mb-3">03 — {copy.collections.sub}</p>
        <h2 className="serif text-[12.5vw] md:text-[9vw]"><ProxText>{copy.collections.title}</ProxText></h2>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.45fr_1fr] md:gap-5">
        {/* Anillos */}
        <TLink href={`/piece/${rings[0].slug}`} label="ANILLOS" data-cursor="view" className="group round-lg relative block min-h-[64svh] overflow-hidden text-[#e4dfc1] md:min-h-[78svh]">
          <PhotoCover piece={pieces[0]} zoom={1.15} hover={1.12} className="absolute inset-0" rounded="" priority />
          <span aria-hidden className="absolute inset-0" style={{ backgroundImage: "linear-gradient(to top, rgba(5,4,3,.78) 0%, rgba(5,4,3,.1) 55%, rgba(5,4,3,0) 100%)" }} />
          <span className="pill pill-ink absolute left-5 top-5">01</span>
          <span className="pill pill-ink absolute right-5 top-5">({pad(rings.length)} piezas)</span>
          <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
            <div>
              <h3 className="serif text-[15vw] md:text-[7vw]" style={{ lineHeight: 0.85 }}>{collections[0].name}</h3>
              <p className="label mt-2 opacity-80">{collections[0].blurb}</p>
            </div>
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#e4dfc1] text-[#0c0a08] transition-transform duration-500 group-hover:rotate-[-45deg] group-hover:scale-110" aria-hidden>→</span>
          </div>
        </TLink>

        {/* Collares: próximamente */}
        <div className="theme-red themed round-lg relative flex min-h-[48svh] flex-col justify-between overflow-hidden p-6 md:min-h-[78svh] md:p-8" style={{ backgroundImage: "radial-gradient(70% 60% at 50% 40%, #c4402a 0%, #9b2219 55%, #4a0f0a 100%)" }}>
          <div className="flex justify-between"><span className="pill pill-ink">02</span><span className="pill pill-line">Próximamente</span></div>
          <img ref={mark} src={m.src} width={m.w} height={m.h} alt="" loading="lazy" className="pointer-events-none absolute left-1/2 top-[38%] w-[56%] -translate-x-1/2 -translate-y-1/2" style={{ filter: "drop-shadow(0 26px 22px rgba(0,0,0,.45))" }} />
          <div className="relative">
            <h3 className="serif text-[15vw] md:text-[4.6vw]" style={{ lineHeight: 0.85 }}>{collections[1].name}</h3>
            <p className="label mt-2 opacity-80">{collections[1].blurb} · <span className="ph">fotos por definir</span></p>
          </div>
        </div>
      </div>
    </section>
  );
}
