"use client";

import { useRef } from "react";
import { money, pad, pieces, type Piece } from "@/content/pieces";
import { copy } from "@/content/copy";
import { useCart } from "../Cart";
import { Heart } from "../ui/Extras";
import { Ph } from "../ui/Mask";
import { PhotoCover } from "../ui/PhotoCover";
import { TLink } from "../ui/TLink";

function Card({ piece, i }: { piece: Piece; i: number }) {
  const { add } = useCart();
  const tile = useRef<HTMLDivElement>(null);
  const price = money(piece.price);
  const label = `${piece.label} Nº${piece.no}`;
  return (
    <article className="group w-[72vw] shrink-0 md:w-auto">
      <div ref={tile} className="relative">
        <TLink href={`/piece/${piece.slug}`} label={label} data-cursor="view" aria-label={label} className="block">
          <PhotoCover piece={piece} className="aspect-[4/5]" rounded="round-lg" />
        </TLink>
        <span className="pill pill-ink pointer-events-none absolute left-4 top-4">{pad(i + 1)}</span>
        <Heart id={piece.slug} className="absolute right-4 top-4" />
        <button onClick={() => add(piece.slug, null, tile.current)} aria-label={`Agregar ${label} a la bolsa`} data-cursor="link" data-magnetic
          className="btn btn-sm btn-dark absolute bottom-4 left-4 right-4 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100">
          + Agregar a la bolsa
        </button>
      </div>
      <TLink href={`/piece/${piece.slug}`} label={label} data-cursor="view" className="mt-4 block px-1">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="name text-[19px] md:text-[21px]">{piece.name.toLowerCase()}</h3>
          <span className="label whitespace-nowrap">{price ?? <>$ <Ph>—</Ph></>}</span>
        </div>
        <p className="mt-1 text-[13px] opacity-60">{piece.label.charAt(0) + piece.label.slice(1).toLowerCase()} Nº{piece.no}</p>
      </TLink>
    </article>
  );
}

/** 02 — Lo nuevo: las piezas reales. Foto grande, nombre y precio siempre visibles, agregar en un toque. */
export function NewIn() {
  return (
    <section id="joyas" data-tone="dark" className="sheet theme-bone themed pb-[12svh] pt-[10svh] md:pb-[14svh] md:pt-[12svh]" aria-label="Lo nuevo">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 px-[var(--gutter)] md:mb-14">
        <div>
          <p className="mb-3 text-[14px] opacity-70">{copy.newIn.sub}</p>
          <h2 className="title">{copy.newIn.title}</h2>
        </div>
        <TLink href="/#colecciones" label="Colecciones" className="btn btn-ghost" data-cursor="link" data-magnetic>{copy.newIn.all} →</TLink>
      </div>
      <div className="hscroll flex items-start gap-3 px-[var(--gutter)] pb-4 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:pb-0">
        {pieces.map((p, i) => <Card key={p.slug} piece={p} i={i} />)}
      </div>
      <p className="label mt-10 px-[var(--gutter)] opacity-60"><span className="ph">{copy.newIn.note}</span></p>
    </section>
  );
}
