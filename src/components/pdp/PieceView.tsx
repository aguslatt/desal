"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { use3D } from "@/lib/device";
import { whenReady } from "@/lib/ready";
import { img, indexOf, money, pad, pieces, type Piece } from "@/content/pieces";
import { copy } from "@/content/copy";
import { useCart } from "../Cart";
import { PhotoSlot } from "../ui/Frame";
import { Mask, Ph } from "../ui/Mask";
import { fitVw } from "../ui/Meta";
import { TLink } from "../ui/TLink";

const ProductScene = dynamic(() => import("@/three/ProductScene"), { ssr: false });

const SIZES = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

/** Dato de la ficha: etiqueta + valor (placeholder si no hay dato real) + línea de llamada hacia la pieza. */
function Spec({ k, v, className = "", line = "right" }: { k: string; v: React.ReactNode; className?: string; line?: "left" | "right" }) {
  return (
    <div className={`label absolute z-[4] flex items-center gap-3 ${line === "left" ? "flex-row-reverse text-right" : ""} ${className}`}>
      <div><div className="opacity-50">{k}</div><div className="mt-0.5">{v}</div></div>
      <span className="hidden h-px w-[7vw] bg-ink/50 md:block" />
    </div>
  );
}

/**
 * PDP como ficha de especimen: la pieza ocupa casi toda la pantalla, el nombre es monumental
 * y los datos se reparten alrededor de la pieza como en una etiqueta de museo.
 */
export function PieceView({ piece }: { piece: Piece }) {
  const ok3d = use3D();
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const { add } = useCart();
  const i = indexOf(piece.slug);
  const next = pieces[(i + 1) % pieces.length];
  const a = img(piece, "a"), b = img(piece, "b"), c = img(piece, "c");
  const isRing = piece.sizes != null;
  const price = money(piece.price);
  const fs = fitVw(piece.label, 88, 27);

  useEffect(() => {
    registerGsap();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const off = whenReady(() => {
      gsap.fromTo(hero.current!.querySelectorAll("[data-in]"), { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.06, ease: "power3.out", delay: 0.35 });
    });
    return () => { off(); };
  }, []);

  const buy = () => {
    add(piece.slug, size, stage.current);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const cta = (
    <button onClick={buy} data-cursor="link"
      className="label group relative flex h-14 w-full items-center justify-between overflow-hidden bg-ink px-6 text-paper md:w-[22vw] md:min-w-[280px]">
      <span className="absolute inset-0 origin-bottom scale-y-0 bg-oro transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-y-100" />
      <span className="relative">{added ? "Agregado ✓" : "Agregar a la bolsa"}</span>
      <span className="relative">{price ?? <>$ [—]</>}</span>
    </button>
  );

  return (
    <article data-tone="dark">
      {/* ───── primer viewport ───── */}
      <div ref={hero} data-tone="light" className={`${piece.metal === "oro" ? "theme-red" : "theme-black"} themed relative h-svh min-h-[620px] overflow-hidden`}>
        <div className="absolute left-[var(--gutter)] top-[78px] z-[5] label md:top-[84px]" data-in>
          <TLink href="/#joyas" label="Joyas" className="u-line">← Joyas</TLink>
          <span className="ml-4 opacity-50">{pad(i + 1)} / {pad(pieces.length)}</span>
        </div>

        {/* nombre monumental, detrás de la pieza */}
        <h1 className="serif pointer-events-none absolute inset-x-0 top-[17svh] z-[1] select-none text-center" style={{ fontSize: `${fs}vw`, lineHeight: 0.8 }}>
          <Mask>{piece.label}</Mask>
        </h1>
        <div className="serif serif-i pointer-events-none absolute right-[var(--gutter)] top-[74px] z-[3] text-[9vw] md:top-[78px] md:text-[3.2vw]" style={{ lineHeight: 1 }} data-in>Nº{piece.no}</div>

        {/* pieza */}
        <div ref={stage} className="absolute inset-0 z-[2]" data-cursor="drag">
          <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: ready ? 0 : 1, transition: "opacity .5s" }}>
            <img src={a.src} width={a.w} height={a.h} alt={`${piece.label} Nº${piece.no} (placeholder)`} fetchPriority="high" className="max-h-[62svh] w-auto max-w-[88vw] md:max-h-[74svh]" />
          </div>
          {ok3d && <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: "opacity .5s" }}><ProductScene kind={piece.kind} onReady={() => setReady(true)} /></div>}
        </div>

        {/* ficha: datos alrededor de la pieza (desktop) */}
        <div className="hidden md:block" data-in>
          <Spec k="Material" v={piece.material ?? <Ph />} className="left-[var(--gutter)] top-[44svh]" />
          <Spec k="Peso" v={piece.weight ?? <Ph>— g</Ph>} className="right-[var(--gutter)] top-[34svh]" line="left" />
          <Spec k="Medidas" v={piece.size ?? <Ph>— mm</Ph>} className="left-[var(--gutter)] top-[68svh]" />
          <Spec k="Stock" v={<span className="flex items-center gap-2"><i className="block h-1.5 w-1.5 bg-accent" />{piece.stock ?? <Ph />}</span>} className="right-[var(--gutter)] top-[56svh]" line="left" />
        </div>

        {/* compra */}
        <div className="absolute inset-x-[var(--gutter)] bottom-[calc(3.5rem+12px)] z-[5] flex flex-col gap-3 md:bottom-[var(--gutter)] md:flex-row md:items-end md:justify-between" data-in>
          <div className="hidden md:block">
            {isRing && <Ruler size={size} setSize={setSize} />}
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            {isRing && <div className="md:hidden"><Ruler size={size} setSize={setSize} /></div>}
            <div className="label flex items-baseline justify-between md:justify-end md:gap-6">
              <span className="opacity-50">Precio</span><span className="serif text-[26px]" style={{ lineHeight: 1 }}>{price ?? <>$ <Ph>—</Ph></>}</span>
            </div>
            {cta}
          </div>
        </div>

      </div>

      {/* ───── macro enorme ───── */}
      <section className="relative">
        <div data-tone="light" className="theme-black themed relative h-[100svh] overflow-hidden" data-cursor="hide">
          <img src={c.src} alt="Macrofotografía (placeholder)" loading="lazy" className="h-full w-full object-cover" data-depth="0.08" />
          <div className="label absolute bottom-[var(--gutter)] left-[var(--gutter)] bg-[#e4dfc1] px-3 py-2 text-[#0c0a08]">Detalle · Nº{piece.no} · <span className="ph">macro placeholder</span></div>
        </div>
      </section>

      {/* ───── cómo queda puesto + material ───── */}
      <section className="relative grid gap-10 px-[var(--gutter)] py-[14svh] md:grid-cols-12 md:gap-6">
        <div className="md:col-span-5 md:col-start-1"><PhotoSlot title="puesta" seed={21} className="w-full" style={{ aspectRatio: "4/5" }} /><p className="label mt-3 opacity-60">Cómo queda puesto</p></div>
        <div className="flex flex-col justify-between md:col-span-6 md:col-start-7">
          <h2 className="serif text-[15vw] md:text-[7.4vw]" style={{ lineHeight: 0.9 }}><Mask>Hecho</Mask><Mask className="serif-i" delay={0.08}>a mano,</Mask><Mask delay={0.16}>una vez.</Mask></h2>
          <dl className="label mt-10">
            {[["Material", piece.material], ["Peso", piece.weight], ["Medidas", piece.size], ["Acabado", null], ["Cuidado", null]].map(([k, v]) => (
              <div key={k as string} className="flex justify-between border-t border-ink/30 py-3"><dt className="opacity-50">{k}</dt><dd>{(v as string) ?? <Ph />}</dd></div>
            ))}
            <div className="border-t border-ink/30" />
          </dl>
        </div>
      </section>

      {/* ───── otro ángulo, gran formato ───── */}
      <section data-tone="light" className="theme-red themed relative overflow-hidden py-[10svh]">
        <div className="mx-auto w-[78vw] md:w-[52vw]" data-grow="0.92,1.04"><img src={b.src} width={b.w} height={b.h} alt="" loading="lazy" className="w-full" /></div>
        <div className="label mt-8 flex justify-between px-[var(--gutter)]"><span>Otro ángulo</span><span>{copy.hand.steps.map((s) => s.t).join(" → ")} <span className="ph">*</span></span></div>
      </section>

      {/* ───── siguiente ───── */}
      <section className="relative px-[var(--gutter)] py-[12svh]">
        <p className="label mb-4">Siguiente — {pad(((i + 1) % pieces.length) + 1)} / {pad(pieces.length)}</p>
        <TLink href={`/piece/${next.slug}`} label={`${next.label} Nº${next.no}`} data-cursor="tag" data-cursor-label="Siguiente →" className="group relative block">
          <div className="serif transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-[2vw]" style={{ fontSize: `${fitVw(next.label, 88, 24)}vw`, lineHeight: 0.85 }}>{next.label} <span className="serif-i">Nº{next.no}</span></div>
          <img src={img(next, "a").src} alt="" loading="lazy" className="pointer-events-none absolute right-[4vw] top-1/2 hidden w-[22vw] -translate-y-1/2 rotate-6 opacity-0 transition-all duration-700 ease-[var(--ease-out-expo)] group-hover:rotate-0 group-hover:opacity-100 md:block" />
        </TLink>
      </section>
    </article>
  );
}

/** Selector de talle: regla con marcas (el elegido crece). Talles = placeholder hasta definir. */
function Ruler({ size, setSize }: { size: number | null; setSize: (n: number) => void }) {
  return (
    <div>
      <div className="label mb-2 flex justify-between"><span>Talle <span className="ph">placeholder</span></span><span>{size ?? "—"}</span></div>
      <div className="flex items-end gap-[3px]" role="radiogroup" aria-label="Talle">
        {SIZES.map((n) => (
          <button key={n} role="radio" aria-checked={size === n} aria-label={`Talle ${n}`} onClick={() => setSize(n)} className="group flex h-9 w-[7.4vw] flex-col items-center justify-end md:w-8" data-cursor="link">
            <span className={`label label-sm mb-1 transition-opacity ${size === n ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}>{n}</span>
            <span className={`block w-px bg-ink transition-all duration-300 ease-[var(--ease-out-expo)] ${size === n ? "h-5 w-[2px] bg-accent" : "h-2.5 group-hover:h-4"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
