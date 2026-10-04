"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { prefersReduced, use3D } from "@/lib/device";
import { whenReady } from "@/lib/ready";
import { copy } from "@/content/copy";
import { money, photo, pieces, still } from "@/content/pieces";
import type { HeroState } from "@/three/HeroScene";
import { Ph } from "../ui/Mask";
import { TLink } from "../ui/TLink";

const HeroScene = dynamic(() => import("@/three/HeroScene"), { ssr: false });
const hero = pieces[0];

/**
 * 01 — Hero. DE SAL (siempre junto) + el anillo real de DE SAL en 3D: se gira arrastrando, responde al mouse
 * y al scroll. Luz radial sobre el rojo. La siguiente sección sube y lo cubre (hoja con sombra).
 */
export function Hero() {
  const word = useRef<HTMLHeadingElement>(null);
  const copyBox = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLAnchorElement>(null);
  const state = useRef<HeroState>({ p: 0, intro: 0 });
  const [active, setActive] = useState(true);
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
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: document.body, start: "top top", end: () => `+=${window.innerHeight}`, scrub: reduced ? false : 0.4,
        onUpdate: (self) => {
          st.p = self.progress;
          gsap.set(word.current, { yPercent: -self.progress * 14 });
          gsap.set(copyBox.current, { yPercent: -self.progress * 30 });
        },
      });
      ScrollTrigger.create({ trigger: "#joyas", start: "top top", onEnter: () => setActive(false), onLeaveBack: () => setActive(true) });
    });
    const off = whenReady(() => {
      if (reduced) return;
      gsap.fromTo(st, { intro: 0 }, { intro: 1, duration: 1.7, ease: "expo.out" });
      gsap.fromTo(word.current!.querySelectorAll(".mask-in"), { yPercent: 105 }, { yPercent: 0, duration: 1.1, ease: "power4.out" });
      gsap.fromTo(copyBox.current!.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, delay: 0.35 });
      gsap.fromTo(chip.current, { y: 40, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.9, delay: 0.9, ease: "back.out(1.6)" });
    });
    return () => { off(); ctx.revert(); };
  }, []);

  return (
    <section id="inicio" data-tone="light" aria-label="DE SAL studio"
      className="theme-red themed sticky top-0 z-0 h-svh min-h-[640px] overflow-hidden"
      style={{ backgroundImage: "radial-gradient(60% 62% at 68% 60%, #c4402a 0%, #9b2219 46%, #4a0f0a 100%)" }}>

      <h1 ref={word} className="serif absolute left-[2.4vw] top-[12svh] select-none text-[24.5vw] md:top-[11svh] md:text-[25vw]" aria-label="DE SAL studio">
        <span className="mask"><span className="mask-in">DE SAL</span></span>
      </h1>
      <span className="serif-i serif pointer-events-none absolute right-[4vw] top-[calc(12svh+19.5vw)] text-[5.4vw] md:top-[calc(11svh+19.6vw)] md:text-[4.2vw]" style={{ lineHeight: 1 }} aria-hidden>studio</span>

      {/* joya 3D (se arrastra) */}
      <div className="absolute inset-0" data-cursor="drag">
        <div className="absolute inset-0" style={{ opacity: ready ? 0 : 1, transition: "opacity .5s .1s" }}>
          {fb && <img src={fb.src} width={fb.w} height={fb.h} alt={hero.alt} fetchPriority="high" className="absolute bottom-[34svh] right-[14vw] h-auto w-[56vw] md:bottom-[12svh] md:right-[9vw] md:w-[min(32vw,56svh)]" />}
        </div>
        {ok3d && (
          <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: "opacity .5s .1s" }}>
            <HeroScene state={state} active={active} onReady={() => setReady(true)} kind="cuffstar" />
          </div>
        )}
      </div>

      {/* mensaje + acciones */}
      <div ref={copyBox} className="absolute inset-x-[var(--gutter)] bottom-[calc(7rem+var(--gutter))] z-[3] max-w-[34rem] md:bottom-[calc(var(--gutter)+64px)] md:left-[2.4vw]">
        <p className="serif-text text-[26px] leading-[1.05] md:text-[34px]">{copy.hero.tagline}</p>
        <p className="mt-2 text-[14px] opacity-80 md:text-[15px]">{copy.hero.sub}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <TLink href="/#joyas" label="Joyas" data-cursor="link" data-magnetic className="btn btn-light">{copy.hero.cta} →</TLink>
          <TLink href="/#colecciones" label="Colecciones" data-cursor="link" data-magnetic className="btn btn-ghost">{copy.hero.cta2}</TLink>
        </div>
      </div>

      {/* chip de producto: el anillo es una pieza real que se puede ver y comprar */}
      <TLink ref={chip} href={`/piece/${hero.slug}`} label={`${hero.label} Nº${hero.no}`} data-cursor="link" data-magnetic
        className="absolute bottom-[calc(7rem+var(--gutter))] right-[var(--gutter)] z-[3] hidden items-center gap-3 rounded-full bg-[#e4dfc1] py-2 pl-2 pr-5 text-[#0c0a08] md:bottom-[calc(var(--gutter)+64px)] md:flex">
        <span className="block h-12 w-12 overflow-hidden rounded-full"><img src={ph.src} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${hero.focus.x * 100}% ${hero.focus.y * 100}%`, transform: `scale(${hero.focus.zoom})`, transformOrigin: `${hero.focus.x * 100}% ${hero.focus.y * 100}%` }} /></span>
        <span className="label leading-tight">{hero.label} Nº{hero.no}<br /><span className="opacity-60">{price ?? <>$ <Ph>—</Ph></>}</span></span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#9b2219] text-[#e4dfc1]">→</span>
      </TLink>
    </section>
  );
}
