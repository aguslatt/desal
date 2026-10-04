"use client";

import { useEffect, useRef } from "react";
import { gsap, Draggable, registerGsap } from "@/lib/gsap";
import { pieces, img } from "@/content/pieces";
import { copy } from "@/content/copy";
import { Frame, PhotoSlot } from "../ui/Frame";
import { Mask } from "../ui/Mask";
import { PencilArrow } from "../ui/Pencil";

const [ring, hoops, signet, nugget] = pieces;

/**
 * 04 — DE SAL WORLD. No es un "about": es un collage en 4 planos que se puede mover.
 * Desktop: piezas arrastrables con inercia + profundidad por mouse. Mobile: composición apilada.
 */
export function World() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let z = 20;
    const ds = Draggable.create(root.current!.querySelectorAll(".dragme"), {
      type: "x,y", inertia: true, edgeResistance: 0.8, zIndexBoost: false,
      onPress() { this.target.style.zIndex = String(++z); gsap.to(this.target, { scale: 1.03, rotate: `+=${(Math.random() - 0.5) * 2}`, duration: 0.3 }); },
      onRelease() { gsap.to(this.target, { scale: 1, duration: 0.5, ease: "elastic.out(1,.6)" }); },
    });
    return () => ds.forEach((d) => d.kill());
  }, []);

  const w = copy.world;
  const imgs = {
    gold: img(nugget, "c").src,
    silver: img(signet, "c").src,
    ringB: img(ring, "b"),
    hoops: img(hoops, "a"),
  };

  return (
    <section id="mundo" data-tone="light" className="theme-black themed relative" aria-label="El mundo de DE SAL">

      {/* ───── desktop ───── */}
      <div ref={root} className="relative hidden h-[190svh] overflow-hidden md:block">
        <div className="label absolute left-[var(--gutter)] top-[8svh]">04 — Mundo</div>

        {/* plano 2: frase */}
        <h2 className="serif absolute left-[6vw] top-[16svh] z-[2] text-[9.4vw]" style={{ lineHeight: 0.9 }}>
          <Mask>{w.phrase[0]}</Mask>
          <Mask delay={0.07}>{w.phrase[1]}</Mask>
          <Mask className="serif-i" delay={0.14}>{w.phrase[2]}</Mask>
        </h2>

        <div data-mdepth="5" className="absolute left-[53vw] top-[6svh]">
          <Frame seed={2} className="dragme w-[24vw] rotate-[2deg]" style={{ aspectRatio: "4/5", zIndex: 3 }}>
            <img src={imgs.gold} alt="Macro oro (placeholder)" loading="lazy" className="h-full w-full object-cover" draggable={false} data-cursor="drag" />
          </Frame>
        </div>

        <div data-mdepth="9" className="absolute left-[70vw] top-[56svh]">
          <Frame seed={5} className="dragme w-[21vw] -rotate-[3deg]" style={{ aspectRatio: "3/4", zIndex: 4 }}>
            <img src={imgs.silver} alt="Macro plata (placeholder)" loading="lazy" className="h-full w-full object-cover" draggable={false} data-cursor="drag" />
          </Frame>
        </div>

        <div data-mdepth="7" className="absolute left-[29vw] top-[88svh]">
          <div className="dragme w-[19vw] rotate-[3deg]" style={{ aspectRatio: "4/5", zIndex: 5 }} data-cursor="drag"><PhotoSlot title="manos" seed={6} className="h-full w-full" /></div>
        </div>

        <div data-mdepth="6" className="absolute left-[4vw] top-[100svh]">
          <div className="dragme relative h-[22vw] w-[16vw] -rotate-[2deg] bg-rojo" style={{ clipPath: "polygon(0 1%,100% 0,99% 100%,2% 98%)", zIndex: 3, backgroundImage: "url(/tex/salt.webp)", backgroundBlendMode: "multiply", backgroundSize: "420px" }} data-cursor="drag">
            <span className="label absolute bottom-3 left-3 text-[#e4dfc1]">textura · sal</span>
          </div>
          <PencilArrow className="absolute -right-[7vw] top-[3vw] w-[6vw]" />
        </div>

        {/* plano 3: pieza flotando, muy cerca (mueve más con el mouse) */}
        <div data-mdepth="26" className="absolute left-[41vw] top-[46svh] z-[6] w-[17vw]">
          <img src={imgs.ringB.src} width={imgs.ringB.w} height={imgs.ringB.h} alt="" loading="lazy" className="w-full" style={{ animation: "float 6s ease-in-out infinite" }} />
        </div>

        {/* palabras-material */}
        <div data-mdepth="12" className="absolute left-[62vw] top-[46svh] z-[2]">
          <div className="serif serif-i text-[10vw]" style={{ lineHeight: 1 }}><Mask>{w.words[0].w}</Mask></div>
          <p className="label -mt-1 ml-1 opacity-70">sal (f.) — {w.words[0].d}</p>
        </div>
        <div data-mdepth="10" className="absolute left-[14vw] top-[68svh] z-[2]">
          <div className="serif text-[12vw]" style={{ lineHeight: 1 }}><Mask>{w.words[1].w}</Mask></div>
          <p className="label -mt-2 ml-1 opacity-70">metal (m.) — {w.words[1].d}</p>
        </div>
        <div data-mdepth="8" className="absolute right-[5vw] top-[132svh] z-[2] text-right">
          <div className="serif serif-i text-[9vw]" style={{ lineHeight: 1 }}><Mask>{w.words[2].w}</Mask></div>
          <p className="label -mt-1 opacity-70">joya (f.) — {w.words[2].d}</p>
        </div>
        <p className="label absolute bottom-[4svh] right-[var(--gutter)] opacity-50"><span className="ph">frases: propuesta de copy</span> · arrastrá las piezas</p>
      </div>

      {/* ───── mobile ───── */}
      <div className="relative overflow-hidden px-[var(--gutter)] pb-24 pt-20 md:hidden">
        <div className="label mb-6">04 — Mundo</div>
        <h2 className="serif text-[15vw]" style={{ lineHeight: 0.92 }}>
          <Mask>{w.phrase[0]}</Mask><Mask delay={0.07}>{w.phrase[1]}</Mask><Mask className="serif-i" delay={0.14}>{w.phrase[2]}</Mask>
        </h2>
        <Frame seed={2} className="ml-auto mt-10 w-[62vw] rotate-[2deg]" style={{ aspectRatio: "4/5" }}>
          <img src={imgs.gold} alt="" loading="lazy" className="h-full w-full object-cover" />
        </Frame>
        <div className="-mt-6"><div className="serif serif-i text-[28vw]" style={{ lineHeight: 1 }}>{w.words[0].w}</div><p className="label opacity-70">sal (f.) — {w.words[0].d}</p></div>
        <div className="relative mt-8 flex items-start justify-between">
          <Frame seed={5} className="w-[48vw] -rotate-[3deg]" style={{ aspectRatio: "3/4" }}>
            <img src={imgs.silver} alt="" loading="lazy" className="h-full w-full object-cover" />
          </Frame>
          <img src={imgs.ringB.src} width={imgs.ringB.w} height={imgs.ringB.h} alt="" loading="lazy" className="-ml-10 mt-14 w-[44vw]" style={{ animation: "float 6s ease-in-out infinite" }} />
        </div>
        <div className="mt-8"><div className="serif text-[26vw]" style={{ lineHeight: 1 }}>{w.words[1].w}</div><p className="label opacity-70">metal (m.) — {w.words[1].d}</p></div>
        <PhotoSlot title="manos" seed={6} className="mt-8 w-[58vw] rotate-[3deg]" style={{ aspectRatio: "4/5" }} />
        <div className="mt-8 text-right"><div className="serif serif-i text-[22vw]" style={{ lineHeight: 1 }}>{w.words[2].w}</div><p className="label opacity-70">joya (f.) — {w.words[2].d}</p></div>
      </div>
      <style>{`@keyframes float{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-14px) rotate(2deg)}}`}</style>
    </section>
  );
}
