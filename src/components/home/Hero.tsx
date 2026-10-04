"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { prefersReduced, use3D } from "@/lib/device";
import { whenReady } from "@/lib/ready";
import { copy } from "@/content/copy";
import { money, pad, photo, pieces, still, type Piece } from "@/content/pieces";
import type { HeroState } from "@/three/HeroScene";
import { Ph } from "../ui/Mask";
import { BrandLockup } from "../ui/Logo";
import { TLink } from "../ui/TLink";

const HeroScene = dynamic(() => import("@/three/HeroScene"), { ssr: false });

type Slide = { kind: "3d" } | { kind: "photo"; piece: Piece };
const SLIDES: Slide[] = [{ kind: "3d" }, ...pieces.map((piece) => ({ kind: "photo" as const, piece }))];
const N = SLIDES.length;
const DURATION = 6.5; // segundos por diapositiva

/**
 * Hero con varias imágenes que cambian: diapositiva 0 = logo + anillo 3D; luego una por pieza real (foto grande).
 * Transición de cortina, barra de progreso, autoplay (pausa con el mouse), flechas, teclado y swipe.
 */
export function Hero() {
  const slideEls = useRef<(HTMLDivElement | null)[]>([]);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const cur = useRef(0);
  const busy = useRef(false);
  const prog = useRef(0);
  const paused = useRef(false);
  const visible = useRef(true);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [idx, setIdx] = useState(0);
  const [onScreen, setOnScreen] = useState(true);

  const paintBars = useCallback((active: number) => {
    bars.current.forEach((b, i) => { if (b) b.style.transform = `scaleX(${i < active ? 1 : 0})`; });
  }, []);

  const go = useCallback((to: number, dir?: 1 | -1) => {
    to = (to + N) % N;
    if (busy.current || to === cur.current) return;
    registerGsap();
    const d = dir ?? (to > cur.current ? 1 : -1);
    const from = cur.current;
    const inEl = slideEls.current[to]!, outEl = slideEls.current[from]!;
    busy.current = true;
    gsap.set(inEl, { zIndex: 3, visibility: "visible", clipPath: d > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)" });
    gsap.set(outEl, { zIndex: 2 });
    const tl = gsap.timeline({ onComplete: () => { gsap.set(outEl, { visibility: "hidden", xPercent: 0, zIndex: 1 }); busy.current = false; } });
    tl.to(inEl, { clipPath: "inset(0 0 0 0)", duration: 1.0, ease: "expo.inOut" }, 0)
      .fromTo(inEl.querySelectorAll("[data-kb]"), { scale: 1.2 }, { scale: 1.03, duration: 1.8, ease: "power3.out" }, 0)
      .to(outEl, { xPercent: -d * 14, duration: 1.0, ease: "expo.inOut" }, 0)
      .fromTo(inEl.querySelectorAll("[data-txt]"), { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }, 0.5);
    cur.current = to; prog.current = 0; setIdx(to); paintBars(to);
  }, [paintBars]);

  useEffect(() => {
    registerGsap();
    const reduced = prefersReduced();
    const tick = (_t: number, dt: number) => {
      if (reduced || paused.current || !visible.current || busy.current) return;
      prog.current += dt / 1000 / DURATION;
      const b = bars.current[cur.current];
      if (b) b.style.transform = `scaleX(${Math.min(1, prog.current)})`;
      if (prog.current >= 1) go(cur.current + 1, 1);
    };
    gsap.ticker.add(tick);
    const st = ScrollTrigger.create({ trigger: "#joyas", start: "top top", onEnter: () => { visible.current = false; setOnScreen(false); }, onLeaveBack: () => { visible.current = true; setOnScreen(true); } });
    const key = (e: KeyboardEvent) => {
      if (!visible.current) return;
      if (e.key === "ArrowRight") go(cur.current + 1, 1);
      if (e.key === "ArrowLeft") go(cur.current - 1, -1);
    };
    window.addEventListener("keydown", key);
    return () => { gsap.ticker.remove(tick); st.kill(); window.removeEventListener("keydown", key); };
  }, [go]);

  const onDown = (e: React.PointerEvent) => { touch.current = { x: e.clientX, y: e.clientY }; };
  const onUp = (e: React.PointerEvent) => {
    const s = touch.current; touch.current = null;
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    const min = cur.current === 0 ? 110 : 56; // en la diapositiva 3D el arrastre gira el anillo: umbral mayor
    if (Math.abs(dx) > min && Math.abs(dx) > Math.abs(dy) * 1.4) go(cur.current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  };

  return (
    <section id="inicio" data-tone="light" aria-roledescription="carrusel" aria-label="DESAL studio"
      className="theme-red themed sticky top-0 z-0 h-svh overflow-hidden"
      style={{ backgroundImage: "radial-gradient(60% 64% at 72% 56%, #c4402a 0%, #9b2219 48%, #521109 100%)", touchAction: "pan-y" }}
      onPointerEnter={() => { paused.current = true; }} onPointerLeave={() => { paused.current = false; }}
      onPointerDown={onDown} onPointerUp={onUp}>

      {SLIDES.map((s, i) => (
        <div key={i} ref={(el) => { slideEls.current[i] = el; }} className="absolute inset-0" aria-hidden={idx !== i}
          style={{ visibility: i === 0 ? "visible" : "hidden", zIndex: i === 0 ? 3 : 1, backgroundImage: i === 0 ? "radial-gradient(60% 64% at 72% 56%, #c4402a 0%, #9b2219 48%, #521109 100%)" : undefined }}>
          {s.kind === "3d" ? <Slide3D active={idx === 0 && onScreen} /> : <SlidePhoto piece={s.piece} n={i + 1} />}
        </div>
      ))}

      {/* controles */}
      <div className="absolute inset-x-[var(--gutter)] bottom-[84px] z-[6] flex items-center justify-between gap-4 md:bottom-[84px]">
        <div className="flex items-center gap-2" role="tablist" aria-label="Diapositivas">
          {SLIDES.map((_, i) => (
            <button key={i} role="tab" aria-selected={idx === i} aria-label={`Ir a la diapositiva ${i + 1}`} onClick={() => go(i)} data-cursor="link"
              className="group relative h-6 w-8 md:w-12">
              <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-[#e4dfc1]/30 transition-all group-hover:h-[5px]">
                <span ref={(el) => { bars.current[i] = el; }} className="absolute inset-0 origin-left rounded-full bg-[#e4dfc1]" style={{ transform: "scaleX(0)" }} />
              </span>
            </button>
          ))}
          <span className="label ml-2 whitespace-nowrap tabular-nums opacity-80">{pad(idx + 1)} / {pad(N)}</span>
        </div>
        <div className="flex gap-2">
          {[-1, 1].map((d) => (
            <button key={d} onClick={() => go(cur.current + d, d as 1 | -1)} aria-label={d < 0 ? "Anterior" : "Siguiente"} data-cursor="link" data-magnetic
              className="grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-[#e4dfc1]/70 text-[#e4dfc1] transition-colors hover:bg-[#e4dfc1] hover:text-[#9b2219]">{d < 0 ? "←" : "→"}</button>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Diapositiva 0: logo oficial, mensaje, acciones y el anillo en 3D. */
function Slide3D({ active }: { active: boolean }) {
  const hero = pieces[0];
  const copyBox = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLAnchorElement>(null);
  const state = useRef<HeroState>({ p: 0, intro: 0 });
  const [ready, setReady] = useState(false);
  const ok3d = use3D();
  const fb = still(hero);
  const ph = photo(hero);
  const price = money(hero.price);

  useEffect(() => {
    registerGsap();
    const reduced = prefersReduced();
    const st = state.current;
    st.intro = reduced ? 1 : 0;
    const t = ScrollTrigger.create({ trigger: document.body, start: "top top", end: () => `+=${window.innerHeight}`, scrub: reduced ? false : 0.4,
      onUpdate: (self) => { st.p = self.progress; gsap.set(copyBox.current, { yPercent: -self.progress * 22 }); } });
    const off = whenReady(() => {
      if (reduced) return;
      gsap.fromTo(st, { intro: 0 }, { intro: 1, duration: 1.7, ease: "expo.out" });
      gsap.fromTo(copyBox.current!.children, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.09, ease: "power3.out" });
      gsap.fromTo(chip.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.8 });
    });
    return () => { off(); t.kill(); };
  }, []);

  return (
    <>
      <div className="absolute inset-0" data-cursor="drag">
        <div className="absolute inset-0" style={{ opacity: ready ? 0 : 1, transition: "opacity .5s .1s" }}>
          {fb && <img src={fb.src} width={fb.w} height={fb.h} alt={hero.alt} fetchPriority="high" className="absolute bottom-[34svh] right-[24vw] h-auto w-[44vw] md:bottom-[18svh] md:right-[9vw] md:w-[min(28vw,50svh)]" />}
        </div>
        {ok3d && (
          <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: "opacity .5s .1s" }}>
            <HeroScene state={state} active={active} onReady={() => setReady(true)} kind="cuffstar" />
          </div>
        )}
      </div>
      <div ref={copyBox} className="absolute left-[var(--gutter)] right-[var(--gutter)] top-[calc(var(--nav-h)+2svh)] z-[3] flex max-w-[34rem] flex-col items-start md:left-[5vw] md:top-[calc(var(--nav-h)+4svh)]">
        <h1 className="m-0"><BrandLockup className="w-[min(52vw,34svh)] md:w-[min(26vw,40svh,400px)]" /></h1>
        <p className="serif-text mt-[4svh] text-[clamp(20px,3.4svh,34px)] leading-[1.1]">{copy.hero.tagline}</p>
        <p className="mt-[1svh] max-w-[28ch] text-[clamp(13px,1.9svh,16px)] opacity-85">{copy.hero.sub}</p>
        <div className="mt-[3svh] flex flex-wrap items-center gap-3">
          <TLink href="/#joyas" label="Joyas" data-magnetic className="btn btn-light">{copy.hero.cta}</TLink>
          <TLink href="/#colecciones" label="Colecciones" data-magnetic className="btn btn-ghost">{copy.hero.cta2}</TLink>
        </div>
      </div>
      <TLink ref={chip} href={`/piece/${hero.slug}`} label={hero.name} data-magnetic
        className="absolute bottom-[150px] right-[var(--gutter)] z-[3] hidden items-center gap-3 rounded-full bg-[#e4dfc1] py-2 pl-2 pr-5 text-[#0c0a08] md:flex">
        <span className="block h-12 w-12 overflow-hidden rounded-full"><img src={ph.src} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${hero.focus.x * 100}% ${hero.focus.y * 100}%`, transform: `scale(${hero.focus.zoom})`, transformOrigin: `${hero.focus.x * 100}% ${hero.focus.y * 100}%` }} /></span>
        <span className="label leading-tight">{hero.label} {hero.name.toLowerCase()}<br /><span className="opacity-60">{price ?? <>$ <Ph>—</Ph></>}</span></span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#9b2219] text-[#e4dfc1]">→</span>
      </TLink>
    </>
  );
}

/** Diapositivas de foto: en desktop, foto grande en tarjeta sobre su propio fondo desenfocado; en mobile, foto a pantalla completa. */
function SlidePhoto({ piece, n }: { piece: Piece; n: number }) {
  const p = photo(piece);
  const price = money(piece.price);
  const pos = `${piece.focus.x * 100}% ${piece.focus.y * 100}%`;
  return (
    <>
      {/* mobile: foto completa */}
      <div className="absolute inset-0 overflow-hidden md:hidden"><img data-kb src={p.src} width={p.w} height={p.h} alt={piece.alt} className="h-full w-full object-cover" style={{ objectPosition: pos }} /></div>
      <span aria-hidden className="absolute inset-0 md:hidden" style={{ backgroundImage: "linear-gradient(to top, rgba(10,6,4,.82) 0%, rgba(10,6,4,.25) 45%, rgba(10,6,4,0) 70%)" }} />
      {/* desktop: panel de foto a la derecha, a toda altura */}
      <div className="absolute right-0 top-0 hidden h-full w-[54vw] overflow-hidden rounded-l-[56px] md:block">
        <img data-kb src={p.src} width={p.w} height={p.h} alt={piece.alt} className="h-full w-full object-cover" style={{ objectPosition: pos }} />
        <span aria-hidden className="absolute inset-0" style={{ backgroundImage: "linear-gradient(to bottom, rgba(10,6,4,.55) 0%, rgba(10,6,4,0) 24%), linear-gradient(to top, rgba(10,6,4,.35) 0%, rgba(10,6,4,0) 40%)" }} />
      </div>

      <div className="absolute bottom-[150px] left-[var(--gutter)] right-[var(--gutter)] z-[3] flex flex-col items-start text-[#e4dfc1] md:bottom-[150px] md:left-[5vw] md:max-w-[34vw]">
        <p data-txt className="label mb-3 opacity-80">{pad(n)} · {piece.label} Nº{piece.no}</p>
        <h2 data-txt className="title capitalize" style={{ fontSize: "clamp(46px, 7.2vw, 120px)" }}>{piece.name.toLowerCase()}</h2>
        <p data-txt className="mt-3 text-[15px] opacity-85">{price ?? <>$ <Ph>—</Ph></>}</p>
        <div data-txt className="mt-5 flex flex-wrap gap-3">
          <TLink href={`/piece/${piece.slug}`} label={piece.name} data-magnetic className="btn btn-light">Ver pieza</TLink>
          <TLink href="/#joyas" label="Joyas" data-magnetic className="btn btn-ghost !text-[#e4dfc1]">Todas las joyas</TLink>
        </div>
      </div>
    </>
  );
}
