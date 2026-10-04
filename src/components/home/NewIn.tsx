"use client";

import { useRef } from "react";
import { money, pad, pieces, type Piece } from "@/content/pieces";
import { copy } from "@/content/copy";
import { useCart } from "../Cart";
import { PieceFigure } from "../PieceFigure";
import { Ph, Mask } from "../ui/Mask";
import { TLink } from "../ui/TLink";

/** Fondo de cada tile según el metal, para que la pieza siempre destaque. */
const TILE = ["theme-red", "theme-marfil", "theme-black", "theme-hondo", "theme-red", "theme-black"];

function Card({ piece, i }: { piece: Piece; i: number }) {
  const { add } = useCart();
  const tile = useRef<HTMLDivElement>(null);
  const price = money(piece.price);
  const label = `${piece.label} Nº${piece.no}`;
  return (
    <article className="group">
      <div ref={tile} className={`${TILE[i]} themed relative aspect-[4/5] overflow-hidden`}>
        <TLink href={`/piece/${piece.slug}`} label={label} data-cursor="view" className="absolute inset-0 block" aria-label={label}>
          <span className="label absolute left-4 top-4 z-[2] opacity-80">{pad(i + 1)}</span>
          <span className="label absolute right-4 top-4 z-[2] opacity-80">{piece.metal}</span>
          <PieceFigure piece={piece} link={false} className="absolute inset-0 flex items-center justify-center" innerClassName={piece.kind === "pendant" ? "w-[50%]" : "w-[74%]"} />
        </TLink>
        {/* agregar rápido */}
        <button onClick={() => add(piece.slug, null, tile.current)} aria-label={`Agregar ${label} a la bolsa`} data-cursor="link"
          className="label absolute bottom-3 right-3 z-[3] flex h-10 items-center gap-2 bg-[#050403] px-4 text-[#e4dfc1] transition-colors hover:bg-[#e4dfc1] hover:text-[#050403] md:translate-y-2 md:opacity-0 md:transition-all md:group-hover:translate-y-0 md:group-hover:opacity-100">
          + Agregar
        </button>
      </div>
      <TLink href={`/piece/${piece.slug}`} label={label} data-cursor="view" className="mt-4 block">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="serif text-[20px] md:text-[26px]" style={{ lineHeight: 1 }}>{piece.label} <span className="serif-i">Nº{piece.no}</span></h3>
          <span className="label whitespace-nowrap">{price ?? <>$ <Ph>—</Ph></>}</span>
        </div>
        <p className="label mt-2 opacity-60">{piece.metal} · {piece.collection}</p>
      </TLink>
    </article>
  );
}

/** 02 — Lo nuevo: seis piezas, cada una sobre su color. Nombre, tipo y precio siempre visibles. */
export function NewIn() {
  return (
    <section id="joyas" data-tone="dark" className="sheet theme-bone themed px-[var(--gutter)] pb-[16svh] pt-[10svh] md:pb-[20svh] md:pt-[14svh]" aria-label="Lo nuevo">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-14">
        <div>
          <p className="label mb-3">01 — {copy.newIn.sub}</p>
          <h2 className="serif text-[18vw] md:text-[9vw]" aria-label={copy.newIn.title}><Mask>{copy.newIn.title}</Mask></h2>
        </div>
        <TLink href="/#colecciones" label="Colecciones" className="label u-line pb-1" data-cursor="link">{copy.newIn.all} →</TLink>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 md:gap-y-14">
        {pieces.map((p, i) => <Card key={p.slug} piece={p} i={i} />)}
      </div>
      <p className="label mt-10 opacity-60"><span className="ph">{copy.newIn.note}</span></p>
    </section>
  );
}
