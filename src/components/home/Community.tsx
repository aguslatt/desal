"use client";

import { img, pieces } from "@/content/pieces";
import { copy } from "@/content/copy";
import { Mask } from "../ui/Mask";

type Shot = { src: string; bg: string; fit: "cover" | "contain"; scale?: number };
const [ring, hoops, signet, nugget, cuff, pendant] = pieces;
const S = (p: (typeof pieces)[number], v: "a" | "b" | "c", bg: string, fit: Shot["fit"] = "contain", scale = 0.85): Shot => ({ src: img(p, v).src, bg, fit, scale });

/** PLACEHOLDER: composiciones con renders. Reemplazar por fotos reales de la comunidad. */
const shots: Shot[] = [
  S(ring, "b", "#9b2219"), S(hoops, "a", "#050403", "contain", 0.8), S(nugget, "c", "#c9a24a", "cover", 1),
  S(cuff, "b", "#e4dfc1"), S(pendant, "a", "#6a150f", "contain", 0.95), S(signet, "b", "#050403"),
];

/** 06 — Comunidad: tira de negativos (referencia) con cómo llevan DE SAL. Un solo botón: ir a Instagram. */
export function Community() {
  return (
    <section id="comunidad" data-tone="dark" className="sheet theme-bone themed overflow-hidden pb-[16svh] pt-[10svh] md:pb-[20svh] md:pt-[14svh]" aria-label="Seen on you">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 px-[var(--gutter)] md:mb-12">
        <div>
          <p className="label mb-3">05 — {copy.community.sub}</p>
          <h2 className="serif text-[18vw] md:text-[9vw]" style={{ lineHeight: 0.84 }} aria-label="Seen on you">
            <Mask>{copy.community.title[0]} <span className="serif-i">{copy.community.title[1].toLowerCase()}</span></Mask>
          </h2>
        </div>
        <a href={copy.instagramUrl} target="_blank" rel="noreferrer" data-cursor="link" className="label bg-[#050403] px-6 py-4 text-[#e4dfc1] transition-colors hover:bg-[#9b2219]">{copy.community.cta} ↗ {copy.instagram}</a>
      </div>

      <div className="hscroll relative mx-0 flex gap-3 bg-[#050403] px-[var(--gutter)] py-9 text-[#e4dfc1]" data-cursor="drag">
        <i aria-hidden className="absolute inset-x-0 top-3 h-2" style={{ backgroundImage: "repeating-linear-gradient(90deg,#e4dfc1 0 10px,transparent 10px 26px)", opacity: 0.5 }} />
        <i aria-hidden className="absolute inset-x-0 bottom-3 h-2" style={{ backgroundImage: "repeating-linear-gradient(90deg,#e4dfc1 0 10px,transparent 10px 26px)", opacity: 0.5 }} />
        {shots.map((s, i) => (
          <figure key={i} className="w-[68vw] shrink-0 md:w-[24vw]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[6px]" style={{ background: s.bg }}>
              <img src={s.src} alt="Foto de prueba (placeholder)" loading="lazy" className={`h-full w-full ${s.fit === "cover" ? "object-cover" : "object-contain"}`} style={{ transform: `scale(${s.scale})` }} draggable={false} />
            </div>
            <figcaption className="label label-sm mt-2 flex justify-between opacity-70"><span>▸ {String(i + 11)}A</span><span>{String(i + 11)}</span></figcaption>
          </figure>
        ))}
      </div>
      <p className="label mt-4 px-[var(--gutter)] opacity-60"><span className="ph">{copy.community.note}</span></p>
    </section>
  );
}
