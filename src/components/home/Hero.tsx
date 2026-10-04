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
import { BrandLockup } from "../ui/Logo";
import { TLink } from "../ui/TLink";

const HeroScene = dynamic(() => import("@/three/HeroScene"), { ssr: false });
const hero = pieces[0];

/**
 * Hero: logo oficial (marca + DESAL + studio), mensaje claro, dos acciones y el anillo real de DESAL en 3D
 * (se gira con el mouse/dedo). La siguiente sección sube y lo cubre.
 */
export function Hero() {
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
        onUpdate: (self) => { st.p = self.progress; gsap.set(copyBox.current, { yPercent: -self.progress * 22 }); },
      });
      ScrollTrigger.create({ trigger: "#joyas", start: "top top", onEnter: () => setActive(false), onLeaveBack: () => setActive(true) });
    });
    const off = whenReady(() => {
      if (reduced) return;
      gsap.fromTo(st, { intro: 0 }, { intro: 1, duration: 1.7, ease: "expo.out" });
      gsap.fromTo(copyBox.current!.children, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.09, ease: "power3.out" });
      gsap.fromTo(chip.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.8 });
    });
    return () => { off(); ctx.revert(); };
  }, []);

  return (
    <section id="inicio" data-tone="light" aria-label="DESAL studio"
      className="theme-red themed sticky top-0 z-0 h-svh min-h-[660px] overflow-hidden"
      style={{ backgroundImage: "radial-gradient(60% 64% at 72% 56%, #c4402a 0%, #9b2219 48%, #521109 100%)" }}>

      {/* joya 3D */}
      <div className="absolute inset-0" data-cursor="drag">
        <div className="absolute inset-0" style={{ opacity: ready ? 0 : 1, transition: "opacity .5s .1s" }}>
          {fb && <img src={fb.src} width={fb.w} height={fb.h} alt={hero.alt} fetchPriority="high" className="absolute bottom-[8svh] right-[14vw] h-auto w-[48vw] md:bottom-[18svh] md:right-[9vw] md:w-[min(34vw,58svh)]" />}
        </div>
        {ok3d && (
          <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: "opacity .5s .1s" }}>
            <HeroScene state={state} active={active} onReady={() => setReady(true)} kind="cuffstar" />
          </div>
        )}
      </div>

      {/* logo + mensaje + acciones */}
      <div ref={copyBox} className="absolute left-[var(--gutter)] right-[var(--gutter)] top-[calc(var(--nav-h)+4svh)] z-[3] flex max-w-[34rem] flex-col items-start md:left-[5vw] md:top-1/2 md:-translate-y-1/2">
        <h1 className="m-0"><BrandLockup className="w-[min(58vw,360px)] md:w-[min(26vw,400px)]" /></h1>
        <p className="serif-text mt-8 text-[24px] leading-[1.1] md:mt-10 md:text-[34px]">{copy.hero.tagline}</p>
        <p className="mt-2 max-w-[28ch] text-[14px] opacity-85 md:text-[16px]">{copy.hero.sub}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <TLink href="/#joyas" label="Joyas" data-magnetic className="btn btn-light">{copy.hero.cta}</TLink>
          <TLink href="/#colecciones" label="Colecciones" data-magnetic className="btn btn-ghost">{copy.hero.cta2}</TLink>
        </div>
      </div>

      {/* chip de producto */}
      <TLink ref={chip} href={`/piece/${hero.slug}`} label={hero.name} data-magnetic
        className="absolute bottom-[calc(7rem+var(--gutter))] right-[var(--gutter)] z-[3] hidden items-center gap-3 rounded-full bg-[#e4dfc1] py-2 pl-2 pr-5 text-[#0c0a08] md:bottom-[calc(var(--gutter)+64px)] md:flex">
        <span className="block h-12 w-12 overflow-hidden rounded-full"><img src={ph.src} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${hero.focus.x * 100}% ${hero.focus.y * 100}%`, transform: `scale(${hero.focus.zoom})`, transformOrigin: `${hero.focus.x * 100}% ${hero.focus.y * 100}%` }} /></span>
        <span className="label leading-tight">{hero.label} {hero.name.toLowerCase()}<br /><span className="opacity-60">{price ?? <>$ <Ph>—</Ph></>}</span></span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#9b2219] text-[#e4dfc1]">→</span>
      </TLink>
    </section>
  );
}
