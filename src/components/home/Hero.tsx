"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { prefersReduced } from "@/lib/device";
import { copy } from "@/content/copy";
import { money, pad, photo, pieces, still, type Piece } from "@/content/pieces";
import { Ph } from "../ui/Mask";
import { BrandLockup } from "../ui/Logo";
import { TLink } from "../ui/TLink";

type Panel = { kind: "brand" } | { kind: "photo"; piece: Piece };
const PANELS: Panel[] = [{ kind: "brand" }, ...pieces.map((piece) => ({ kind: "photo" as const, piece }))];
const N = PANELS.length;
const EASE = "cubic-bezier(.7,0,.2,1)";

/**
 * Hero de paneles que se expanden: la marca y cada pieza real son franjas; la que tocás o señalás se abre
 * (el resto se angosta con su nombre en vertical). Se mueve sola si no la tocás. Sin carruseles ni cortinas.
 */
export function Hero() {
  const [open, setOpen] = useState(0);
  const paused = useRef(false);
  const visible = useRef(true);
  const intent = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    registerGsap();
    reduced.current = prefersReduced();
    const st = ScrollTrigger.create({ trigger: "#joyas", start: "top top", onEnter: () => { visible.current = false; }, onLeaveBack: () => { visible.current = true; } });
    const t = setInterval(() => { if (!paused.current && visible.current && !reduced.current) setOpen((o) => (o + 1) % N); }, 5200);
    const key = (e: KeyboardEvent) => {
      if (!visible.current) return;
      if (e.key === "ArrowRight") setOpen((o) => (o + 1) % N);
      if (e.key === "ArrowLeft") setOpen((o) => (o - 1 + N) % N);
    };
    window.addEventListener("keydown", key);
    return () => { st.kill(); clearInterval(t); window.removeEventListener("keydown", key); };
  }, []);

  const hover = useCallback((i: number) => {
    if (intent.current) clearTimeout(intent.current);
    intent.current = setTimeout(() => setOpen(i), 110); // intención: evita saltos al cruzar el mouse
  }, []);

  return (
    <section id="inicio" data-tone="light" aria-label="DESAL studio"
      className="theme-red themed sticky top-0 z-0 h-svh overflow-hidden"
      onPointerEnter={() => { paused.current = true; }} onPointerLeave={() => { paused.current = false; if (intent.current) clearTimeout(intent.current); }}>
      <h1 className="sr-only">DESAL studio — joyas hechas a mano</h1>
      <div className="absolute inset-0 flex flex-col gap-2 p-2 pb-[88px] md:flex-row md:pb-[64px]">
        {PANELS.map((pn, i) => (
          <article key={i} tabIndex={0} aria-expanded={open === i} aria-label={pn.kind === "brand" ? "Inicio" : `${pn.piece.name}`}
            onPointerEnter={(e) => { if (e.pointerType === "mouse") hover(i); }} onClick={() => setOpen(i)} onFocus={() => setOpen(i)}
            className="group relative min-h-0 min-w-0 cursor-pointer overflow-hidden rounded-[28px] outline-none md:rounded-[40px]"
            style={{ flex: `${open === i ? 7 : 1} 1 0%`, transition: `flex-grow 1s ${EASE}` }} data-cursor={open === i ? undefined : "view"}>
            {pn.kind === "brand" ? <BrandPanel open={open === i} /> : <PhotoPanel piece={pn.piece} n={i} open={open === i} />}
          </article>
        ))}
      </div>
    </section>
  );
}

function BrandPanel({ open }: { open: boolean }) {
  const hero = pieces[0];
  const fb = still(hero);
  const price = money(hero.price);
  return (
    <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(70% 70% at 70% 60%, #c4402a 0%, #9b2219 55%, #521109 100%)" }}>
      {/* contraído: marca + etiqueta vertical */}
      <div className="absolute inset-0 flex items-center justify-center gap-3 transition-opacity duration-500 md:flex-col" style={{ opacity: open ? 0 : 1, transitionDelay: open ? "0s" : ".5s" }}>
        <img src="/brand/mark.png" alt="" width={705} height={411} className="w-[min(5vw,56px)] min-w-[34px]" />
        <span className="label md:[writing-mode:vertical-rl] md:rotate-180">DESAL studio</span>
      </div>
      {/* expandido */}
      <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transitionDelay: open ? ".45s" : "0s" }}>
        {fb && <img src={fb.src} width={fb.w} height={fb.h} alt={hero.alt} className="absolute bottom-[8%] right-[4%] h-auto w-[44%] max-md:bottom-[22%] max-md:right-[8%] max-md:w-[52%]" style={{ animation: "hero-float 7s ease-in-out infinite", filter: "drop-shadow(0 30px 28px rgba(0,0,0,.35))" }} />}
        <div className="absolute left-[clamp(20px,3.4vw,56px)] top-[clamp(76px,12svh,120px)] flex max-w-[26rem] flex-col items-start">
          <BrandLockup className="w-[min(46vw,30svh,300px)] md:w-[min(17vw,30svh,300px)]" />
          <p className="serif-text mt-[3.4svh] text-[clamp(20px,3.2svh,32px)] leading-[1.1]">{copy.hero.tagline}</p>
          <p className="mt-[1svh] max-w-[28ch] text-[clamp(13px,1.8svh,16px)] opacity-85 max-md:hidden">{copy.hero.sub}</p>
          <div className="mt-[2.6svh] flex flex-wrap gap-3">
            <TLink href="/#joyas" label="Joyas" data-magnetic className="btn btn-light">{copy.hero.cta}</TLink>
            <TLink href="/#colecciones" label="Colecciones" data-magnetic className="btn btn-ghost max-md:hidden">{copy.hero.cta2}</TLink>
          </div>
        </div>
        <TLink href={`/piece/${hero.slug}`} label={hero.name} className="absolute bottom-4 right-4 hidden items-center gap-2 rounded-full bg-[#e4dfc1] py-2 pl-5 pr-2 text-[#0c0a08] md:flex">
          <span className="label">{hero.name.toLowerCase()} · {price ?? <>$ <Ph>—</Ph></>}</span><span className="grid h-8 w-8 place-items-center rounded-full bg-[#9b2219] text-[#e4dfc1]">→</span>
        </TLink>
      </div>
      <style>{`@keyframes hero-float{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-14px) rotate(2deg)}}`}</style>
    </div>
  );
}

function PhotoPanel({ piece, n, open }: { piece: Piece; n: number; open: boolean }) {
  const p = photo(piece);
  const price = money(piece.price);
  const pos = `${piece.focus.x * 100}% ${piece.focus.y * 100}%`;
  return (
    <>
      <img src={p.src} width={p.w} height={p.h} alt={piece.alt} loading={n < 2 ? "eager" : "lazy"} decoding="async" draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: pos, transform: open ? "scale(1.02)" : "scale(1.28)", filter: open ? "none" : "brightness(.62) saturate(.9)", transition: `transform 1.4s ${EASE}, filter 1s ${EASE}` }} />
      <span aria-hidden className="absolute inset-0" style={{ backgroundImage: "linear-gradient(to bottom, rgba(10,6,4,.5) 0%, rgba(10,6,4,0) 22%), linear-gradient(to top, rgba(10,6,4,.78) 0%, rgba(10,6,4,0) 52%)" }} />
      {/* contraído: número + nombre vertical */}
      <div className="absolute inset-0 flex items-end justify-start gap-3 p-4 text-[#e4dfc1] transition-opacity duration-500 max-md:items-center md:flex-col md:items-center md:justify-end md:pb-8" style={{ opacity: open ? 0 : 1, transitionDelay: open ? "0s" : ".5s" }}>
        <span className="label opacity-70">{pad(n + 1)}</span>
        <span className="serif text-[clamp(22px,2.6vw,40px)] capitalize md:[writing-mode:vertical-rl] md:rotate-180" style={{ lineHeight: 1 }}>{piece.name.toLowerCase()}</span>
      </div>
      {/* expandido */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 text-[#e4dfc1] transition-all duration-700 md:p-10" style={{ opacity: open ? 1 : 0, transform: open ? "none" : "translateY(24px)", pointerEvents: open ? "auto" : "none", transitionDelay: open ? ".5s" : "0s" }}>
        <p className="label mb-3 opacity-80">{pad(n + 1)} · {piece.label} Nº{piece.no}</p>
        <h2 className="title capitalize" style={{ fontSize: "clamp(46px, 7vw, 118px)" }}>{piece.name.toLowerCase()}</h2>
        <p className="mt-3 text-[15px] opacity-85">{price ?? <>$ <Ph>—</Ph></>}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <TLink href={`/piece/${piece.slug}`} label={piece.name} data-magnetic className="btn btn-light">Ver pieza</TLink>
          <TLink href="/#joyas" label="Joyas" data-magnetic className="btn btn-ghost !text-[#e4dfc1] max-md:hidden">Todas las joyas</TLink>
        </div>
      </div>
    </>
  );
}
