"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { prefersReduced, use3D } from "@/lib/device";
import { saltLine } from "@/lib/cut";
import { whenReady } from "@/lib/ready";
import { copy } from "@/content/copy";
import { pieces, img } from "@/content/pieces";
import type { HeroState } from "@/three/HeroScene";

const HeroScene = dynamic(() => import("@/three/HeroScene"), { ssr: false });

/**
 * 01 — INTRO. Pantalla casi vacía: DE / SAL monumental y la pieza semienterrada entre dos costras.
 * Con el scroll la joya emerge, DE y SAL se separan y dejan pasar la siguiente escena.
 * Planos: bg · tipografía · costra trasera · JOYA · costra delantera · micro-texto.
 */
export function Intro() {
  const run = useRef<HTMLDivElement>(null);
  const stick = useRef<HTMLDivElement>(null);
  const de = useRef<HTMLSpanElement>(null);
  const sal = useRef<HTMLSpanElement>(null);
  const crustB = useRef<HTMLDivElement>(null);
  const crustF = useRef<HTMLDivElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const micro = useRef<HTMLDivElement>(null);
  const gap = useRef<HTMLDivElement>(null);
  const state = useRef<HeroState>({ p: 0, intro: 0 });
  const [active, setActive] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const ok3d = use3D();
  const ring = img(pieces[0], "a");

  useEffect(() => {
    registerGsap();
    const reduced = prefersReduced();
    const st = state.current;
    st.intro = reduced ? 1 : 0;

    const ctx = gsap.context(() => {
      // progreso por scroll (scrub suave)
      ScrollTrigger.create({
        trigger: run.current, start: "top top", end: "bottom bottom", scrub: reduced ? false : 0.5,
        onUpdate: (self) => {
          const p = self.progress;
          st.p = p;
          const e = p * p * (3 - 2 * p);
          const vw = window.innerWidth;
          const wide = vw >= 768;
          gsap.set(de.current, { x: -e * vw * (wide ? 0.36 : 0.5), yPercent: -e * 8 });
          gsap.set(sal.current, { x: e * vw * (wide ? 0.36 : 0.5), yPercent: e * 6 });
          gsap.set(crustB.current, { yPercent: e * 14 });
          gsap.set(crustF.current, { yPercent: e * 30 });
          gsap.set(micro.current, { yPercent: -e * 40, opacity: 1 - Math.min(1, p * 3) });
          gsap.set(gap.current, { clipPath: `inset(${(1 - Math.min(1, Math.max(0, (p - 0.55) * 3))) * 100}% 0 0 0)` });
          if (fb.current) {
            gsap.set(fb.current, { yPercent: -e * 22 + (1 - st.intro) * 40, rotate: e * 18, scale: 1 + e * 0.1 });
          }
        },
      });

      // visibilidad: pausa WebGL fuera de viewport
      ScrollTrigger.create({ trigger: stick.current, start: "top bottom", end: "bottom top", onToggle: (s) => setActive(s.isActive) });
    });

    // entrada (cuando el loader terminó)
    const off = whenReady(() => {
      if (reduced) return;
      const tl = gsap.timeline();
      tl.fromTo(st, { intro: 0 }, { intro: 1, duration: 1.5, ease: "expo.out" }, 0);
      tl.fromTo([de.current, sal.current].map((el) => el!.querySelectorAll(".mask-in")), { yPercent: 105 }, { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12 }, 0.05);
      tl.fromTo(micro.current!.children, { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.07 }, 0.5);
    });

    return () => { off(); ctx.revert(); };
  }, []);

  const letters = (s: string) => (
    <span className="mask inline-block"><span className="mask-in inline-block">{s}</span></span>
  );

  return (
    <section id="intro" aria-label="DE SAL">
      <div ref={run} className="relative" style={{ height: "270svh" }}>
        <div ref={stick} className="sticky top-0 h-svh overflow-hidden bg-crema">
          {/* plano 0: textura */}
          

          {/* plano 2: tipografía monumental */}
          <h1 className="serif absolute inset-0 select-none" aria-label="DE SAL">
            <span ref={de} data-mdepth="6" className="absolute left-[3vw] top-[9svh] block text-[40vw] md:left-[3vw] md:top-[15svh] md:text-[25vw]">{letters("DE")}</span>
            <span ref={sal} data-mdepth="10" className="absolute right-[2vw] top-[27svh] block text-[50vw] md:right-[2vw] md:top-[15svh] md:text-[25vw]">{letters("SAL")}</span>
          </h1>

          {/* costra trasera: arena húmeda */}
          <div ref={crustB} className="tex-sand absolute inset-x-[-2%] bottom-[-2%] h-[44svh] md:h-[46svh]" style={{ clipPath: saltLine(11, 46, 9) }} aria-hidden />

          {/* plano 3: joya (WebGL, con fallback 2D de alta calidad) */}
          <div className="absolute inset-0" data-cursor="hide">
            <div ref={fb} className="absolute inset-0 flex items-center justify-center" style={{ opacity: sceneReady ? 0 : 1, transition: "opacity .5s .1s" }}>
              <img src={ring.src} width={ring.w} height={ring.h} alt="Anillo escultórico dorado con piedra verde (placeholder)" fetchPriority="high"
                className="h-auto w-[78vw] md:w-[min(41vw,72svh)]" style={{ marginTop: "-2svh" }} />
            </div>
            {ok3d && (
              <div className="absolute inset-0" style={{ opacity: sceneReady ? 1 : 0, transition: "opacity .5s .1s" }}>
                <HeroScene state={state} active={active} onReady={() => setSceneReady(true)} />
              </div>
            )}
          </div>

          {/* costra delantera: sal */}
          <div ref={crustF} className="tex-salt absolute inset-x-[-2%] bottom-[-2%] h-[27svh] md:h-[28svh]" style={{ clipPath: saltLine(23, 38, 14) }} aria-hidden>
            <div className="absolute inset-0 bg-hueso/0" />
          </div>

          {/* plano 4: micro-texto */}
          <div ref={micro} className="absolute inset-x-[var(--gutter)] bottom-[calc(var(--gutter)+4px)] flex items-end justify-between">
            <p className="label leading-[1.5]">
              {copy.hero.map((l) => <span key={l} className="block">{l}</span>)}
            </p>
            <p className="label hidden text-right opacity-60 md:block">Nº00 — <span className="ph">{copy.heroNote}</span></p>
            <p className="label flex items-center gap-3">Scroll <span className="relative block h-9 w-px overflow-hidden bg-tinta/25"><span className="absolute inset-x-0 top-0 h-3 bg-tinta" style={{ animation: "drip 1.8s var(--ease-in-out-expo) infinite" }} /></span></p>
          </div>

          <span className="label vtext absolute right-[calc(var(--gutter)*0.55)] top-1/2 hidden -translate-y-1/2 opacity-60 md:block">{copy.instagram}</span>

          {/* gap: aparece entre DE y SAL cuando se separan */}
          <div ref={gap} className="absolute inset-x-0 bottom-[3.2svh] flex flex-col items-center gap-1 text-center" style={{ clipPath: "inset(100% 0 0 0)" }}>
            <span className="label">01 — 06</span>
            <span className="serif-i serif text-[9vw] md:text-[4.2vw]" style={{ lineHeight: 1.15 }}>nuevos objetos ↓</span>
          </div>
        </div>
      </div>
      <style>{`@keyframes drip{0%{transform:translateY(-100%)}100%{transform:translateY(300%)}}`}</style>
    </section>
  );
}
