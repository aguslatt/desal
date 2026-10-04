"use client";

import { collections, img, pad, piecesOf } from "@/content/pieces";
import { copy } from "@/content/copy";
import { Mask } from "../ui/Mask";
import { TLink } from "../ui/TLink";

const THEMES = ["theme-red", "theme-black", "theme-gold", "theme-hondo", "theme-red"];

/** 04 — Colecciones: cinco tiles de color con la pieza y el nombre. Un toque lleva a la primera pieza de cada una. */
export function Collections() {
  return (
    <section id="colecciones" data-tone="dark" className="sheet theme-marfil themed px-[var(--gutter)] pb-[16svh] pt-[10svh] md:pb-[20svh] md:pt-[14svh]" aria-label="Colecciones">
      <div className="mb-8 md:mb-14">
        <p className="label mb-3">03 — {copy.collections.sub}</p>
        <h2 className="serif text-[12.5vw] md:text-[9vw]"><Mask>{copy.collections.title}</Mask></h2>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
        {collections.map((c, i) => {
          const ps = piecesOf(c.id);
          const a = img(ps[0], "a");
          return (
            <TLink key={c.id} href={`/piece/${ps[0].slug}`} label={c.name} data-cursor="view"
              className={`${THEMES[i]} themed group relative block aspect-[3/4] overflow-hidden p-4 max-md:last:col-span-2 max-md:last:aspect-[2/1]`}>
              <span className="label absolute right-4 top-4 z-[2] opacity-80">({pad(ps.length)})</span>
              <span className="label absolute left-4 top-4 z-[2] opacity-80">{pad(i + 1)}</span>
              <img src={a.src} width={a.w} height={a.h} alt="" loading="lazy"
                className={`absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-[56%] group-hover:rotate-[5deg] group-hover:scale-[1.07] ${ps[0].kind === "pendant" ? "w-[40%]" : "w-[72%]"}`}
                style={{ filter: "drop-shadow(0 22px 18px rgba(0,0,0,.34))" }} draggable={false} />
              <div className="absolute inset-x-4 bottom-4 z-[2] flex items-end justify-between">
                <div>
                  <h3 className="serif text-[clamp(20px,2.3vw,36px)]" style={{ lineHeight: 0.95 }}>{c.name}</h3>
                  <p className="label mt-1.5 opacity-70">{c.blurb}</p>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center border border-current transition-colors group-hover:bg-ink group-hover:text-paper" aria-hidden>→</span>
              </div>
            </TLink>
          );
        })}
      </div>
    </section>
  );
}
