"use client";

import { collections, pad, pieces, piecesOf } from "@/content/pieces";
import { copy } from "@/content/copy";
import { PhotoCover } from "../ui/PhotoCover";
import { TLink } from "../ui/TLink";

/** 04 — Colecciones: dos tiles grandes. Anillos (con foto real) y Collares (próximamente, con la marca girando). */
export function Collections() {
  const rings = piecesOf("anillos");

  return (
    <section id="colecciones" data-tone="dark" className="sheet theme-marfil themed px-[var(--gutter)] pb-[12svh] pt-[10svh] md:pb-[14svh] md:pt-[12svh]" aria-label="Colecciones">
      <div className="mb-8 md:mb-14">
        <p className="mb-3 text-[14px] opacity-70">{copy.collections.sub}</p>
        <h2 className="title">{copy.collections.title}</h2>
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
              <h3 className="title capitalize">{collections[0].name.toLowerCase()}</h3>
              <p className="label mt-2 opacity-80">{collections[0].blurb}</p>
            </div>
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#e4dfc1] text-[#0c0a08] transition-transform duration-500 group-hover:rotate-[-45deg] group-hover:scale-110" aria-hidden>→</span>
          </div>
        </TLink>

        {/* Collares con letras */}
        <TLink href="/#collares" label="Collares" data-cursor="view" className="theme-red themed group round-lg relative flex min-h-[48svh] flex-col justify-between overflow-hidden p-6 md:min-h-[78svh] md:p-8" style={{ backgroundImage: "radial-gradient(70% 60% at 50% 40%, #c4402a 0%, #9b2219 55%, #4a0f0a 100%)" }}>
          <div className="flex justify-between"><span className="pill pill-ink">02</span><span className="pill pill-line">Con letras</span></div>
          <div aria-hidden className="absolute inset-x-0 top-[22%] flex justify-center gap-2 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-3">
            {"DESAL".split("").map((c, i) => (
              <span key={i} className="serif text-[#e8c26a] drop-shadow-[0_14px_10px_rgba(0,0,0,.4)] transition-transform duration-500 group-hover:rotate-[var(--r)]" style={{ fontSize: "min(15vw,7.5vw)", ["--r" as string]: `${(i % 2 ? 1 : -1) * (4 + i)}deg`, transform: `translateY(${[0, 10, 22, 10, 0][i]}px)` }}>{c}</span>
            ))}
          </div>
          <div className="relative">
            <h3 className="title capitalize">Collares</h3>
            <p className="label mt-2 opacity-80">con tus letras · armalo en 3D →</p>
          </div>
        </TLink>
      </div>
    </section>
  );
}
