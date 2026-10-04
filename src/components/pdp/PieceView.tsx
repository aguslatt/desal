"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { use3D } from "@/lib/device";
import { whenReady } from "@/lib/ready";
import { indexOf, money, pad, photo, pieces, still, type Piece } from "@/content/pieces";
import { copy } from "@/content/copy";
import { useCart } from "../Cart";
import { Heart } from "../ui/Extras";
import { Ph } from "../ui/Mask";
import { fitVw } from "../ui/Meta";
import { PhotoCover } from "../ui/PhotoCover";
import { TLink } from "../ui/TLink";

const ProductScene = dynamic(() => import("@/three/ProductScene"), { ssr: false });
const SIZES = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const THEMES = ["theme-red", "theme-black", "theme-red", "theme-black"];

function Spec({ k, v, className = "" }: { k: string; v: React.ReactNode; className?: string }) {
  return (
    <div className={`pill pill-line absolute z-[4] hidden !h-auto gap-3 py-2 md:inline-flex ${className}`}>
      <span className="opacity-60">{k}</span><span>{v}</span>
    </div>
  );
}

/**
 * Ficha de producto: la pieza (3D si está modelada, foto real si no) ocupa casi toda la pantalla,
 * con el nombre monumental detrás y los datos en cápsulas alrededor. Abajo: en la mano, detalles y más piezas.
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
  const others = pieces.filter((p) => p.slug !== piece.slug);
  const ph = photo(piece);
  const fb = still(piece);
  const price = money(piece.price);
  const fs = fitVw(piece.name, 80, 18);

  useEffect(() => {
    registerGsap();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const off = whenReady(() => {
      gsap.fromTo(hero.current!.querySelectorAll("[data-in]"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.07, ease: "power3.out", delay: 0.3 });
    });
    return () => { off(); };
  }, []);

  const buy = () => { add(piece.slug, size, stage.current); setAdded(true); setTimeout(() => setAdded(false), 1800); };

  return (
    <article data-tone="dark">
      {/* ───── primer viewport ───── */}
      <div ref={hero} data-tone="light" className={`${THEMES[i % 4]} themed relative h-svh min-h-[660px] overflow-hidden`}
        style={{ backgroundImage: "radial-gradient(60% 60% at 50% 55%, color-mix(in srgb, var(--paper) 82%, white) 0%, var(--paper) 55%, color-mix(in srgb, var(--paper) 55%, black) 100%)" }}>
        <div className="absolute left-[var(--gutter)] top-[78px] z-[5] flex items-center gap-2 md:top-[88px]" data-in>
          <TLink href="/#joyas" label="Joyas" data-cursor="link" className="btn btn-ghost btn-sm">← Joyas</TLink>
          <span className="pill pill-line">{pad(i + 1)} / {pad(pieces.length)}</span>
        </div>
        <div className="serif serif-i pointer-events-none absolute right-[var(--gutter)] top-[84px] z-[3] text-[5vw] md:top-[88px] md:text-[2vw]" style={{ lineHeight: 1 }} data-in>{piece.label} Nº{piece.no}</div>

        <h1 className="serif pointer-events-none absolute inset-x-0 top-[15svh] z-[1] select-none text-center" style={{ fontSize: `${fs}vw`, lineHeight: 0.8 }}>{piece.name}</h1>

        <div ref={stage} className="absolute inset-0 z-[2]" data-cursor={piece.model ? "drag" : undefined}>
          {piece.model ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: ready ? 0 : 1, transition: "opacity .5s" }}>
                {fb && <img src={fb.src} width={fb.w} height={fb.h} alt={piece.alt} fetchPriority="high" className="max-h-[62svh] w-auto max-w-[88vw] md:max-h-[72svh]" />}
              </div>
              {ok3d && <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: "opacity .5s" }}><ProductScene kind={piece.model} onReady={() => setReady(true)} /></div>}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center pt-[8svh]">
              <PhotoCover piece={piece} zoom={1} hover={1.06} className="h-[62svh] w-[min(80vw,34svh*1.0+20vw)] md:h-[66svh] md:w-[30vw]" rounded="round-lg" priority />
            </div>
          )}
        </div>

        <div data-in>
          <Spec k="Material" v={piece.material ?? <Ph />} className="left-[var(--gutter)] top-[44svh]" />
          <Spec k="Peso" v={piece.weight ?? <Ph>— g</Ph>} className="right-[var(--gutter)] top-[36svh]" />
          <Spec k="Medidas" v={piece.size ?? <Ph>— mm</Ph>} className="left-[var(--gutter)] top-[56svh]" />
          <Spec k="Stock" v={piece.stock ?? <Ph />} className="right-[var(--gutter)] top-[48svh]" />
        </div>

        {/* compra */}
        <div className="absolute inset-x-[var(--gutter)] bottom-[calc(5.5rem+36px)] z-[5] flex flex-col gap-3 md:bottom-[calc(var(--gutter)+60px)] md:flex-row md:items-end md:justify-between" data-in>
          <Ruler size={size} setSize={setSize} />
          <div className="flex items-center gap-3 md:gap-4">
            <div className="label leading-tight"><span className="opacity-60">Precio</span><br /><span className="serif text-[26px]" style={{ lineHeight: 1 }}>{price ?? <>$ <Ph>—</Ph></>}</span></div>
            <Heart id={piece.slug} />
            <button onClick={buy} data-cursor="link" data-magnetic className="btn btn-light flex-1 md:flex-none md:min-w-[260px]">{added ? "Agregado ✓" : "Agregar a la bolsa"}</button>
          </div>
        </div>
      </div>

      {/* ───── en la mano ───── */}
      <section className="sheet theme-bone themed px-[var(--gutter)] pb-[14svh] pt-[10svh]" data-tone="dark">
        <div className="grid gap-8 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-6">
            <p className="label mb-4">En la mano</p>
            <div className="round-lg overflow-hidden"><img src={ph.src} width={ph.w} height={ph.h} alt={piece.alt} loading="lazy" className="max-h-[92svh] w-full object-cover" style={{ aspectRatio: ph.ratio > 1 ? "16/10" : "4/5", objectPosition: `${piece.focus.x * 100}% ${piece.focus.y * 100}%` }} /></div>
          </div>
          <div className="flex flex-col justify-between gap-10 md:col-span-6 md:pl-8">
            <h2 className="title">Hecho a mano, una por una.</h2>
            <dl className="label flex flex-col gap-2">
              {[["Material", piece.material], ["Peso", piece.weight], ["Medidas", piece.size], ["Acabado", null], ["Cuidado", null]].map(([k, v]) => (
                <div key={k as string} className="flex justify-between rounded-full border-[1.5px] border-black/25 px-6 py-3.5"><dt className="opacity-60">{k}</dt><dd>{(v as string) ?? <Ph />}</dd></div>
              ))}
            </dl>
            <p className="label opacity-60">{copy.hand.steps.map((s) => s.t).join(" → ")} <span className="ph">*</span></p>
          </div>
        </div>
      </section>

      {/* ───── detalles (recortes reales) ───── */}
      <section className="sheet theme-red themed px-[var(--gutter)] pb-[14svh] pt-[10svh]" data-tone="light">
        <p className="label mb-6">Detalles</p>
        <div className="grid gap-4 md:grid-cols-3">
          {[{ z: 3.2, dx: 0, dy: 0 }, { z: 4.4, dx: 0.04, dy: -0.03 }, { z: 2.2, dx: -0.05, dy: 0.04 }].map((c, k) => (
            <PhotoCover key={k} piece={{ ...piece, focus: { x: piece.focus.x + c.dx, y: piece.focus.y + c.dy, zoom: c.z } }} className="aspect-[4/5]" rounded="round-lg" hover={1.12} />
          ))}
        </div>
      </section>

      {/* ───── seguir mirando ───── */}
      <section className="sheet theme-marfil themed px-[var(--gutter)] pb-[16svh] pt-[10svh]" data-tone="dark">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="title">Seguí mirando</h2>
          <TLink href="/#joyas" label="Joyas" className="btn btn-ghost btn-sm" data-cursor="link" data-magnetic>Ver todas →</TLink>
        </div>
        <div className="hscroll flex gap-3 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible">
          {others.map((p) => (
            <TLink key={p.slug} href={`/piece/${p.slug}`} label={`${p.label} Nº${p.no}`} data-cursor="view" className="group block w-[72vw] shrink-0 md:w-auto">
              <PhotoCover piece={p} className="aspect-[4/5]" rounded="round-lg" />
              <div className="mt-3 flex items-baseline justify-between px-1"><h3 className="name text-[19px]">{p.name.toLowerCase()}</h3><span className="label">$ <Ph>—</Ph></span></div>
            </TLink>
          ))}
        </div>
      </section>
    </article>
  );
}

/** Selector de talle en cápsulas. Talles = placeholder hasta definir. */
function Ruler({ size, setSize }: { size: number | null; setSize: (n: number) => void }) {
  return (
    <div>
      <div className="label mb-2 flex justify-between"><span>Talle <span className="ph">placeholder</span></span><span>{size ?? "—"}</span></div>
      <div className="hscroll flex max-w-[86vw] gap-1.5 md:max-w-none" role="radiogroup" aria-label="Talle">
        {SIZES.map((n) => (
          <button key={n} role="radio" aria-checked={size === n} onClick={() => setSize(n)} data-cursor="link"
            className="label grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] border-current/50 transition-all hover:border-current aria-checked:scale-110 aria-checked:border-transparent aria-checked:bg-[#e4dfc1] aria-checked:text-[#0c0a08]">{n}</button>
        ))}
      </div>
    </div>
  );
}
