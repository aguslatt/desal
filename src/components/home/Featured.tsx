"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { money, photo, pieces, still } from "@/content/pieces";
import { copy } from "@/content/copy";
import { use3D } from "@/lib/device";
import { useCart } from "../Cart";
import { Ph } from "../ui/Mask";
import { TLink } from "../ui/TLink";

const ProductScene = dynamic(() => import("@/three/ProductScene"), { ssr: false });
const models = pieces.filter((p) => p.model);

/** 03 — Explorá en 3D: tres diseños reales de DESAL, para girar con el mouse o el dedo y cambiar con un toque. */
export function Featured() {
  const ok3d = use3D();
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const { add } = useCart();
  const piece = models[i];
  const price = money(piece.price);
  const fb = still(piece);

  return (
    <section id="destacada" data-tone="light" className="sheet theme-black themed px-[var(--gutter)] pb-[12svh] pt-[10svh] md:pb-[14svh] md:pt-[12svh]" aria-label="Explorá en 3D">
      <div className="mb-8 md:mb-12">
        <p className="mb-3 text-[14px] opacity-70">{copy.featured.label}</p>
        <h2 className="title">{copy.featured.title}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.5fr_1fr] md:gap-5">
        {/* visor 3D */}
        <div ref={stage} data-cursor="drag" className="round-lg relative min-h-[64svh] overflow-hidden md:min-h-[72svh]"
          style={{ backgroundImage: "radial-gradient(58% 58% at 50% 54%, #4a3d33 0%, #1c1613 58%, #0a0807 100%)" }}>
          <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: ready ? 0 : 1, transition: "opacity .5s" }}>
            {fb && <img src={fb.src} width={fb.w} height={fb.h} alt={piece.alt} loading="lazy" className="w-[62%]" />}
          </div>
          {ok3d && <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: "opacity .5s" }}><ProductScene kind={piece.model!} onReady={() => setReady(true)} /></div>}
          <span className="pill pill-ink absolute left-5 top-5">↔ {copy.featured.hint}</span>
          <div className="absolute bottom-5 left-5 flex gap-2">
            {models.map((m, k) => {
              const ph = photo(m);
              return (
                <button key={m.slug} onClick={() => setI(k)} aria-label={`Ver ${m.label} Nº${m.no}`} aria-pressed={i === k} data-cursor="link"
                  className="h-14 w-14 overflow-hidden rounded-full ring-2 ring-transparent transition-all aria-pressed:scale-110 aria-pressed:ring-[#e4dfc1] md:h-16 md:w-16">
                  <img src={ph.src} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${m.focus.x * 100}% ${m.focus.y * 100}%`, transform: `scale(${m.focus.zoom})`, transformOrigin: `${m.focus.x * 100}% ${m.focus.y * 100}%` }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* info */}
        <div className="round-lg flex flex-col justify-between gap-8 bg-[#e4dfc1] p-7 text-[#0c0a08] md:p-9">
          <div>
            <p className="label opacity-60">{String(i + 1).padStart(2, "0")} / {String(models.length).padStart(2, "0")}</p>
            <h3 className="title mt-3 capitalize">{piece.name.toLowerCase()}</h3>
            <p className="label mt-3 opacity-70">{piece.label} Nº{piece.no}</p>
          </div>
          <dl className="label">
            {[["Material", piece.material], ["Peso", piece.weight], ["Medidas", piece.size]].map(([k, v]) => (
              <div key={k as string} className="flex items-center justify-between border-t border-black/20 py-3"><dt className="opacity-60">{k}</dt><dd>{(v as string) ?? <Ph />}</dd></div>
            ))}
            <div className="flex items-center justify-between border-y border-black/20 py-3"><dt className="opacity-60">Precio</dt><dd>{price ?? <>$ <Ph>—</Ph></>}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => add(piece.slug, null, stage.current)} data-cursor="link" data-magnetic className="btn btn-dark">Agregar a la bolsa</button>
            <TLink href={`/piece/${piece.slug}`} label={`${piece.label} Nº${piece.no}`} data-cursor="link" data-magnetic className="btn border-[1.5px] border-black/70 text-[#0c0a08] [--btn-fill:#0c0a08] hover:text-[#e4dfc1]">Ver pieza →</TLink>
          </div>
        </div>
      </div>
    </section>
  );
}
