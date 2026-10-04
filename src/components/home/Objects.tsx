"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { paperCut } from "@/lib/cut";
import { pieces, img, pad } from "@/content/pieces";
import { copy } from "@/content/copy";
import { PieceFigure } from "../PieceFigure";
import { Mask } from "../ui/Mask";
import { Meta, fitVw, Price } from "../ui/Meta";
import { PencilArrow, PencilCircle } from "../ui/Pencil";
import { TLink } from "../ui/TLink";

const [P1, P2, P3, P4, P5, P6] = pieces;

/** Nombre monumental de pieza (serif). */
function Name({ p, className = "", style, italic = false }: { p: (typeof pieces)[number]; className?: string; style?: React.CSSProperties; italic?: boolean }) {
  return (
    <div className={`serif ${italic ? "serif-i" : ""} pointer-events-none select-none whitespace-nowrap ${className}`} style={style} aria-hidden>
      <Mask>{p.label}</Mask>
    </div>
  );
}

/**
 * 02 — NEW OBJECTS 01—06. Seis composiciones distintas: el scroll construye el catálogo.
 * Desktop: cada pieza ocupa el espacio de una manera propia. Mobile: carrusel horizontal por swipe.
 */
export function Objects() {
  const section = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const prevIdx = useRef(0);
  const swing = useRef<HTMLDivElement>(null);
  const railNum = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerGsap();
    const ctx = gsap.context(() => {
      const blocks = gsap.utils.toArray<HTMLElement>("[data-block]");
      blocks.forEach((b, i) => {
        ScrollTrigger.create({ trigger: b, start: "top 55%", end: "bottom 55%", onToggle: (s) => { if (s.isActive) setIdx(i); } });
      });
      ScrollTrigger.create({
        trigger: section.current, start: "top 40%", end: "bottom 60%",
        onToggle: (s) => gsap.to(rail.current, { opacity: s.isActive ? 1 : 0, duration: 0.4 }),
      });
      // collar: cuelga y se mece
      if (swing.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(swing.current, { transformOrigin: "50% 0%", rotate: -1.6 });
        gsap.to(swing.current, { rotate: 1.6, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
      }
    }, section);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!railNum.current || prevIdx.current === idx) return;
    gsap.fromTo(railNum.current, { yPercent: idx > prevIdx.current ? 100 : -100 }, { yPercent: 0, duration: 0.5, ease: "power3.out" });
    prevIdx.current = idx;
  }, [idx]);

  return (
    <section ref={section} id="objetos" className="relative" aria-label="New objects">
      {/* riel de numeración (desktop) */}
      <div ref={rail} className="label pointer-events-none fixed left-[var(--gutter)] top-1/2 z-[60] hidden -translate-y-1/2 text-white opacity-0 mix-blend-difference md:block">
        <span className="digit"><span ref={railNum}>{pad(idx + 1)}</span></span><span className="opacity-40"> / 06</span>
      </div>

      {/* título */}
      <header className="relative overflow-hidden px-[var(--gutter)] pb-[6svh] pt-[16svh] md:pb-[2svh] md:pt-[20svh]">
        <div className="label mb-[4svh] flex items-baseline justify-between">
          <span>01 — 06</span>
          <span className="ph hidden md:inline">{copy.newObjects.note}</span>
        </div>
        <h2 className="serif text-[24vw] md:text-[19.5vw]" aria-label="New objects">
          <Mask className="serif-i">NEW</Mask>
          <Mask className="md:ml-[8vw]" delay={0.08}>OBJECTS</Mask>
        </h2>
      </header>

      {/* ───────────── DESKTOP ───────────── */}
      <div className="hidden md:block">
        {/* 01 — enorme a la izquierda, cruza el nombre */}
        <div data-block className="relative h-[130svh]">
          <Name p={P1} className="absolute left-[16vw] top-[4svh] text-[23vw]" />
          <div className="absolute left-[-8vw] top-[10svh] w-[66vw] -rotate-[5deg]" data-depth="0.12">
            <PieceFigure piece={P1}>
              <PencilCircle className="absolute w-[10.5vw]" style={{ left: "26%", top: "10.5%", transform: "rotate(-12deg)" }} />
              <PencilArrow className="absolute w-[6vw] -scale-x-100" style={{ left: "17%", top: "-6%", transform: "rotate(14deg)" }} />
              <span className="label absolute text-bermellon" style={{ left: "8%", top: "-12%" }}>esta piedra</span>
            </PieceFigure>
          </div>
          <Meta piece={P1} className="absolute right-[var(--gutter)] top-[44svh] w-[19vw]" />
        </div>

        {/* 02 — pequeño, flotando, mucho aire */}
        <div data-block className="relative h-[105svh]">
          <div className="absolute right-[27vw] top-0 h-[20svh] w-px bg-tinta/50" />
          <PieceFigure piece={P2} float className="absolute right-[18vw] top-[19svh] w-[26vw]" />
          <div className="absolute left-[9vw] top-[34svh]">
            <Name p={P2} italic className="text-[11vw]" />
            <Meta piece={P2} className="mt-8 w-[17vw]" />
          </div>
          <span className="label absolute right-[10vw] top-[76svh] opacity-60">+ x.62 y.18</span>
          <span className="label absolute left-[44vw] top-[12svh] opacity-60">+</span>
        </div>

        {/* 03 — casi toda la pantalla; el nombre pasa por detrás */}
        <div data-block className="relative h-[165svh]">
          <Name p={P3} className="absolute left-1/2 top-[18svh] -translate-x-1/2 text-[33vw]" />
          <div className="absolute left-1/2 top-[8svh] w-[84vw] -translate-x-1/2" data-grow="0.9,1.04">
            <PieceFigure piece={P3} />
          </div>
          <div className="label absolute bottom-[12svh] left-[var(--gutter)] flex flex-col gap-1">
            <span className="opacity-50">Nº{P3.no}</span><span>{P3.label} · {P3.metal}</span>
          </div>
          <div className="label absolute bottom-[12svh] right-[var(--gutter)] text-right"><Price piece={P3} /></div>
        </div>

        {/* 04 — imagen recortada sobre textura (panel de papel cortado) */}
        <div data-block className="relative h-[130svh]">
          <div className="tex-sand absolute left-[7vw] top-[10svh] h-[96svh] w-[58vw]" style={{ clipPath: paperCut(4, { n: 11, amp: 1.7 }) }} aria-hidden />
          <div className="serif vtext absolute left-[8.4vw] top-[16svh] rotate-180" style={{ fontSize: `${fitVw(P4.label, 44, 11)}vw` }} aria-hidden><Mask>{P4.label}</Mask></div>
          <PieceFigure piece={P4} className="absolute left-[38vw] top-[25svh] w-[50vw] rotate-[4deg]" />
          <Meta piece={P4} className="absolute bottom-[14svh] right-[var(--gutter)] w-[17vw]" />
          <span className="label absolute left-[24vw] top-[104svh] opacity-60">Nº{P4.no} · recorte sobre textura</span>
        </div>

        {/* 05 — a la derecha, nombre vertical + detalle macro */}
        <div data-block className="relative h-[135svh]">
          <div className="serif vtext absolute left-[3vw] top-[10svh] rotate-180" style={{ fontSize: `${fitVw(P5.label, 44, 11.5)}vw` }} aria-hidden><Mask>{P5.label}</Mask></div>
          <div className="absolute right-[-10vw] top-[6svh] w-[62vw] rotate-[-6deg]" data-depth="0.1">
            <PieceFigure piece={P5} />
          </div>
          <div className="absolute left-[24vw] top-[76svh] h-[14vw] w-[30vw] overflow-hidden" style={{ clipPath: paperCut(8, { n: 8, amp: 2.4 }) }} data-cursor="hide">
            <img src={img(P3, "c").src} alt="Detalle macro (placeholder)" loading="lazy" className="h-full w-full object-cover" />
          </div>
          <span className="label absolute left-[24vw] top-[76svh] -translate-y-6 opacity-60">detalle 01</span>
          <Meta piece={P5} className="absolute left-[56vw] top-[92svh] w-[17vw]" />
        </div>

        {/* 06 — cuelga desde arriba y se mece */}
        <div data-block className="relative h-[150svh] overflow-hidden">
          <div ref={swing} className="absolute left-[24vw] top-[-6svh] w-[33vw]">
            <PieceFigure piece={P6} />
          </div>
          <div className="absolute right-[7vw] top-[26svh] text-right">
            <Name p={P6} className="text-[16vw]" />
            <Meta piece={P6} align="right" className="ml-auto mt-10 w-[17vw]" />
          </div>
        </div>
      </div>

      {/* ───────────── MOBILE: carrusel por swipe ───────────── */}
      <MobileObjects />
    </section>
  );
}

function MobileObjects() {
  const scroller = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [i, setI] = useState(0);

  const onScroll = () => {
    const el = scroller.current!;
    const p = el.scrollLeft / (el.scrollWidth - el.clientWidth);
    if (bar.current) bar.current.style.transform = `scaleX(${0.1666 + p * 0.8334})`;
    setI(Math.round(p * (pieces.length - 1)));
  };

  return (
    <div className="md:hidden">
      <div ref={scroller} onScroll={onScroll} className="hscroll flex" style={{ height: "74svh" }}>
        {pieces.map((p, k) => {
          const a = img(p, "a");
          const v = k % 3;
          const fs = fitVw(p.label, 94, 30);
          return (
            <TLink key={p.slug} href={`/piece/${p.slug}`} label={`${p.label} Nº${p.no}`} className="relative block h-full w-screen shrink-0 overflow-hidden" aria-label={`${p.label} Nº${p.no}`}>
              {v === 0 && (<>
                <div className="serif absolute left-[3vw] top-[2svh]" style={{ fontSize: `${fs}vw` }} aria-hidden>{p.label}</div>
                <img src={a.src} width={a.w} height={a.h} alt="" loading="lazy" className="absolute left-[2vw] top-[16svh] w-[96vw]" />
                <div className="absolute bottom-3 left-[var(--gutter)] right-[var(--gutter)] flex justify-between"><Meta piece={p} className="hidden" /><span className="label">Nº{p.no}</span><span className="label"><Price piece={p} /></span></div>
              </>)}
              {v === 1 && (<>
                <div className="serif vtext absolute left-[2vw] top-[3svh] rotate-180" style={{ fontSize: `${Math.min(20, 66 / (p.label.length * 0.6))}vw` }} aria-hidden>{p.label}</div>
                <img src={a.src} width={a.w} height={a.h} alt="" loading="lazy" className="absolute right-[-12vw] top-[12svh] w-[90vw] -rotate-6" />
                <div className="absolute bottom-3 right-[var(--gutter)] flex gap-6"><span className="label">Nº{p.no}</span><span className="label"><Price piece={p} /></span></div>
              </>)}
              {v === 2 && (<>
                <img src={a.src} width={a.w} height={a.h} alt="" loading="lazy" className="absolute left-[-14vw] top-[6svh] w-[118vw] rotate-3" />
                <div className="serif absolute bottom-[4svh] left-[3vw]" style={{ fontSize: `${fs}vw` }} aria-hidden>{p.label}</div>
                <div className="absolute right-[var(--gutter)] top-3 flex gap-6"><span className="label">Nº{p.no}</span><span className="label"><Price piece={p} /></span></div>
              </>)}
            </TLink>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 px-[var(--gutter)]">
        <span className="label num">{pad(i + 1)} / 06</span>
        <span className="relative block h-px flex-1 bg-tinta/25"><span ref={bar} className="absolute inset-0 origin-left bg-tinta" style={{ transform: "scaleX(.1666)" }} /></span>
        <span className="label">Deslizá →</span>
      </div>
    </div>
  );
}
