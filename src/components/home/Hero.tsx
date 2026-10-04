"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { prefersReduced, use3D } from "@/lib/device";
import { whenReady } from "@/lib/ready";
import { copy } from "@/content/copy";
import { img, pieces } from "@/content/pieces";
import type { HeroState } from "@/three/HeroScene";
import { TLink } from "../ui/TLink";

const HeroScene = dynamic(() => import("@/three/HeroScene"), { ssr: false });

/**
 * 01 — Hero. Una sola idea: DE SAL (siempre junto) + una joya real girando al ritmo del mouse.
 * Luz radial sobre el rojo de marca. Al scrollear, la siguiente sección sube y lo cubre (hoja con sombra).
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const word = useRef<HTMLHeadingElement>(null);
  const copyBox = useRef<HTMLDivElement>(null);
  const state = useRef<HeroState>({ p: 0, intro: 0 });
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);
  const ok3d = use3D();
  const ring = img(pieces[0], "a");

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
      // la hoja siguiente tapa el hero → se pausa el WebGL
      ScrollTrigger.create({ trigger: "#joyas", start: "top top", onEnter: () => setActive(false), onLeaveBack: () => setActive(true) });
    });

    const off = whenReady(() => {
      if (reduced) return;
      gsap.fromTo(st, { intro: 0 }, { intro: 1, duration: 1.6, ease: "expo.out" });
      gsap.fromTo(word.current!.querySelectorAll(".mask-in"), { yPercent: 105 }, { yPercent: 0, duration: 1.1, ease: "power4.out" });
      gsap.fromTo(copyBox.current!.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, delay: 0.35 });
    });
    return () => { off(); ctx.revert(); };
  }, []);

  return (
    <section ref={root} id="inicio" data-tone="light" aria-label="DE SAL studio"
      className="theme-red themed sticky top-0 z-0 h-svh min-h-[640px] overflow-hidden"
      style={{ backgroundImage: "radial-gradient(60% 62% at 70% 62%, #c4402a 0%, #9b2219 46%, #4a0f0a 100%)" }}>

      <h1 ref={word} className="serif absolute left-[2.4vw] top-[12svh] select-none text-[24.5vw] md:top-[11svh] md:text-[25vw]" aria-label="DE SAL studio">
        <span className="mask"><span className="mask-in">DE SAL</span></span>
      </h1>
      <span className="serif-i serif pointer-events-none absolute right-[4vw] top-[calc(12svh+19.5vw)] text-[5.4vw] md:top-[calc(11svh+19.6vw)] md:text-[4.2vw]" style={{ lineHeight: 1 }} aria-hidden>studio</span>

      {/* joya */}
      <div className="absolute inset-0" data-cursor="hide">
        <div className="absolute inset-0" style={{ opacity: ready ? 0 : 1, transition: "opacity .5s .1s" }}>
          <img src={ring.src} width={ring.w} height={ring.h} alt="Anillo de oro con esmeralda (placeholder)" fetchPriority="high"
            className="absolute bottom-[34svh] right-[14vw] h-auto w-[56vw] md:bottom-[10svh] md:right-[8vw] md:w-[min(34vw,60svh)]" />
        </div>
        {ok3d && (
          <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: "opacity .5s .1s" }}>
            <HeroScene state={state} active={active} onReady={() => setReady(true)} />
          </div>
        )}
      </div>

      {/* mensaje + acciones: lo primero que se lee */}
      <div ref={copyBox} className="absolute inset-x-[var(--gutter)] bottom-[calc(3.5rem+var(--gutter)+32px)] z-[3] max-w-[34rem] md:bottom-[calc(var(--gutter)+64px)] md:left-[2.4vw]">
        <p className="serif-text text-[26px] leading-[1.05] md:text-[34px]">{copy.hero.tagline}</p>
        <p className="mt-2 text-[14px] opacity-80 md:text-[15px]">{copy.hero.sub}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <TLink href="/#joyas" label="Joyas" data-cursor="link" className="label group relative overflow-hidden bg-[#e4dfc1] px-6 py-4 text-[#9b2219]">
            <span className="relative">{copy.hero.cta} →</span>
          </TLink>
          <TLink href="/#colecciones" label="Colecciones" data-cursor="link" className="label border border-[#e4dfc1]/70 px-6 py-4 transition-colors hover:bg-[#e4dfc1] hover:text-[#9b2219]">{copy.hero.cta2}</TLink>
        </div>
      </div>

      <p className="label absolute bottom-[calc(3.5rem+var(--gutter))] right-[var(--gutter)] z-[3] hidden items-center gap-3 opacity-80 md:bottom-[calc(var(--gutter)+64px)] md:flex">
        Scroll <span className="relative block h-9 w-px overflow-hidden bg-[#e4dfc1]/30"><span className="absolute inset-x-0 top-0 h-3 bg-[#e4dfc1]" style={{ animation: "drip 1.8s var(--ease-in-out-expo) infinite" }} /></span>
      </p>
      <style>{`@keyframes drip{0%{transform:translateY(-100%)}100%{transform:translateY(300%)}}`}</style>
    </section>
  );
}
