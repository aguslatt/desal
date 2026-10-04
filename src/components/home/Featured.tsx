"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { img, money, pieces } from "@/content/pieces";
import { copy } from "@/content/copy";
import { use3D } from "@/lib/device";
import { useCart } from "../Cart";
import { Ph, Mask } from "../ui/Mask";
import { TLink } from "../ui/TLink";

const ProductScene = dynamic(() => import("@/three/ProductScene"), { ssr: false });
const piece = pieces[2];

/** 03 — Pieza destacada: la joya en 3D, para girarla con el mouse o el dedo. Info y compra al lado. */
export function Featured() {
  const ok3d = use3D();
  const [ready, setReady] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const { add } = useCart();
  const a = img(piece, "a");
  const price = money(piece.price);

  return (
    <section id="destacada" data-tone="light" className="sheet theme-black themed grid min-h-[92svh] md:grid-cols-2" aria-label="Pieza destacada">
      <div className="flex flex-col justify-center gap-6 px-[var(--gutter)] pb-6 pt-[14svh] md:pb-[14svh] md:pr-[4vw]">
        <p className="label">02 — {copy.featured.label}</p>
        <h2 className="serif text-[17vw] md:text-[8vw]" style={{ lineHeight: 0.85 }}><Mask>{piece.label}</Mask><Mask delay={0.08}><span className="serif-i">Nº{piece.no}</span></Mask></h2>
        <dl className="label max-w-md">
          {[["Material", piece.material], ["Peso", piece.weight], ["Medidas", piece.size]].map(([k, v]) => (
            <div key={k as string} className="flex justify-between border-t border-ink/30 py-3"><dt className="opacity-60">{k}</dt><dd>{(v as string) ?? <Ph />}</dd></div>
          ))}
          <div className="flex justify-between border-y border-ink/30 py-3"><dt className="opacity-60">Precio</dt><dd>{price ?? <>$ <Ph>—</Ph></>}</dd></div>
        </dl>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => add(piece.slug, null, stage.current)} data-cursor="link" className="label bg-[#e4dfc1] px-6 py-4 text-[#0c0a08] transition-colors hover:bg-[#c9a24a]">Agregar a la bolsa</button>
          <TLink href={`/piece/${piece.slug}`} label={`${piece.label} Nº${piece.no}`} data-cursor="link" className="label border border-ink/60 px-6 py-4 transition-colors hover:bg-ink hover:text-paper">Ver pieza →</TLink>
        </div>
      </div>

      <div ref={stage} className="relative min-h-[70svh] md:min-h-0" data-cursor="drag" style={{ backgroundImage: "radial-gradient(55% 55% at 50% 52%, #3a322c 0%, #14100d 55%, #050403 100%)" }}>
        <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: ready ? 0 : 1, transition: "opacity .5s" }}>
          <img src={a.src} width={a.w} height={a.h} alt="" loading="lazy" className="w-[70%]" />
        </div>
        {ok3d && <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: "opacity .5s" }}><ProductScene kind={piece.kind} onReady={() => setReady(true)} /></div>}
        <p className="label absolute bottom-5 left-1/2 -translate-x-1/2 opacity-60">↔ {copy.featured.hint}</p>
      </div>
    </section>
  );
}
