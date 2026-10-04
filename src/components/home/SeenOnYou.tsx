"use client";

import { useEffect, useRef } from "react";
import { gsap, Draggable, registerGsap } from "@/lib/gsap";
import { pieces, img } from "@/content/pieces";
import { copy } from "@/content/copy";
import { SectionEdge } from "../ui/Frame";
import { Mask } from "../ui/Mask";
import { PencilCircle, PencilX } from "../ui/Pencil";

const [ring, hoops, signet, nugget, cuff, pendant] = pieces;

type Shot = { src: string; bg: string; fit?: "cover" | "contain"; pos?: string; scale?: number };
const S = (p: (typeof pieces)[number], v: "a" | "b" | "c", bg: string, o: Partial<Shot> = {}): Shot => ({ src: img(p, v).src, bg, ...o });

/** 8 pruebas de contacto + 7 copias físicas. PLACEHOLDER: composiciones con renders sobre fondos de papel/mineral. */
const strip: Shot[] = [
  S(ring, "b", "#cdbfa4", { fit: "contain", scale: 0.9 }), S(hoops, "a", "#6f716c", { fit: "contain", scale: 0.8 }),
  S(nugget, "c", "#d9a23a", { fit: "cover" }), S(cuff, "b", "#e6decd", { fit: "contain", scale: 0.95 }),
  S(pendant, "a", "#b9bbba", { fit: "contain", scale: 0.95 }), S(signet, "b", "#efeae0", { fit: "contain", scale: 0.9 }),
];
const prints: (Shot & { w: number; x: number; y: number; r: number; ar: string })[] = [
  { ...S(ring, "b", "#cdbfa4", { fit: "contain", scale: 0.95 }), w: 22, x: 6, y: 4, r: -6, ar: "4/5" },
  { ...S(signet, "c", "#b9bbba", { fit: "cover" }), w: 17, x: 29, y: 18, r: 5, ar: "1/1" },
  { ...S(hoops, "a", "#6f716c", { fit: "contain", scale: 0.8 }), w: 24, x: 46, y: 2, r: -3, ar: "5/4" },
  { ...S(pendant, "a", "#efeae0", { fit: "contain", scale: 1 }), w: 15, x: 73, y: 14, r: 7, ar: "3/4" },
  { ...S(nugget, "a", "#e6decd", { fit: "contain", scale: 0.95 }), w: 21, x: 16, y: 52, r: 4, ar: "5/4" },
  { ...S(cuff, "a", "#cdbfa4", { fit: "contain", scale: 0.95 }), w: 20, x: 44, y: 46, r: -7, ar: "1/1" },
  { ...S(ring, "c", "#d9a23a", { fit: "cover" }), w: 16, x: 70, y: 56, r: 3, ar: "4/5" },
];

function Print({ s, className = "", style }: { s: Shot; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`bg-[#f8f5ee] p-[0.55vw] pb-[2.4vw] max-md:p-1.5 max-md:pb-6 ${className}`} style={style}>
      <div className="relative h-full w-full overflow-hidden" style={{ background: s.bg }}>
        <img src={s.src} alt="Foto de prueba (placeholder)" loading="lazy" className={`h-full w-full ${s.fit === "cover" ? "object-cover" : "object-contain"}`} style={{ transform: `scale(${s.scale ?? 1})` }} draggable={false} />
      </div>
      <span className="label label-sm absolute bottom-[0.6vw] left-[0.7vw] opacity-50 max-md:bottom-1.5 max-md:left-2">@desal_studio</span>
    </div>
  );
}

const Tape = ({ className = "" }: { className?: string }) => (
  <span aria-hidden className={`absolute z-[2] block h-[1.8vw] w-[5.6vw] bg-arena/70 max-md:h-5 max-md:w-14 ${className}`} style={{ clipPath: "polygon(0 8%,4% 0,8% 10%,100% 0,97% 50%,100% 100%,6% 92%,0 100%,3% 50%)" }} />
);

/**
 * 07 — SEEN ON YOU. Nada de grilla de Instagram: una hoja de contacto con marcas de lápiz graso
 * y fotos impresas tiradas sobre la mesa (arrastrables en desktop).
 */
export function SeenOnYou() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let z = 20;
    const ds = Draggable.create(root.current!.querySelectorAll(".dragme"), {
      type: "x,y", inertia: true, edgeResistance: 0.7,
      onPress() { this.target.style.zIndex = String(++z); gsap.to(this.target, { scale: 1.04, duration: 0.25 }); },
      onRelease() { gsap.to(this.target, { scale: 1, duration: 0.5, ease: "elastic.out(1,.6)" }); },
    });
    return () => ds.forEach((d) => d.kill());
  }, []);

  return (
    <section id="seen" className="relative overflow-hidden bg-crema pb-[10svh] pt-[14svh]" aria-label="Seen on you">
      <SectionEdge color="var(--color-crema)" seed={44} />
      <div className="px-[var(--gutter)]">
        <div className="label mb-[3svh] flex justify-between"><span>07 — Comunidad</span>
          <a href={copy.instagramUrl} target="_blank" rel="noreferrer" className="u-line" data-cursor="view">{copy.instagram} ↗</a></div>
        <h2 className="serif text-[21vw] md:text-[15vw]" style={{ lineHeight: 0.84 }} aria-label="Seen on you">
          <Mask>{copy.seen.title[0]}</Mask><Mask className="serif-i md:ml-[22vw]" delay={0.08}>{copy.seen.title[1]}</Mask>
        </h2>
      </div>

      {/* hoja de contacto */}
      <div className="relative mt-[6svh] -rotate-[1.2deg] px-[var(--gutter)]">
        <div className="hscroll flex gap-[0.8vw] border-y border-tinta/70 bg-hueso px-3 py-3 md:overflow-visible max-md:gap-2">
          {strip.map((s, i) => (
            <div key={i} className="relative w-[34vw] shrink-0 md:w-0 md:flex-1">
              <div className="relative aspect-[3/2] w-full overflow-hidden border border-tinta/60" style={{ background: s.bg }}>
                <img src={s.src} alt="" loading="lazy" className={`h-full w-full ${s.fit === "cover" ? "object-cover" : "object-contain"}`} style={{ transform: `scale(${s.scale ?? 1})` }} draggable={false} />
              </div>
              <div className="label label-sm mt-1.5 flex justify-between opacity-70"><span>▸ {pad2(i + 11)}A</span><span>{pad2(i + 11)}</span></div>
              {i === 2 && <PencilCircle className="absolute -left-[8%] -top-[18%] w-[118%]" style={{ height: "150%" }} />}
              {i === 4 && <PencilX className="absolute left-[18%] top-[6%] w-[64%]" />}
            </div>
          ))}
        </div>
        <p className="label label-sm mt-3 opacity-60"><span className="ph">{copy.seen.note}</span></p>
      </div>

      {/* copias físicas */}
      <div ref={root} className="relative mt-[8svh] hidden h-[112svh] md:block">
        {prints.map((p, i) => (
          <div key={i} className="dragme absolute" data-cursor="drag" style={{ left: `${p.x}vw`, top: `${p.y}svh`, width: `${p.w}vw`, transform: `rotate(${p.r}deg)`, zIndex: i + 2 }}>
            <Print s={p} style={{ aspectRatio: p.ar }} className="relative w-full" />
            <Tape className={i % 2 ? "-top-[0.9vw] right-[2vw] rotate-[6deg]" : "-top-[0.9vw] left-[2vw] -rotate-[8deg]"} />
          </div>
        ))}
      </div>
      <div className="hscroll mt-10 flex gap-4 px-[var(--gutter)] pb-4 md:hidden">
        {prints.map((p, i) => (
          <div key={i} className="relative w-[58vw] shrink-0" style={{ transform: `rotate(${p.r}deg)` }}>
            <Print s={p} style={{ aspectRatio: p.ar }} className="relative w-full" />
            <Tape className="-top-3 left-6 -rotate-6" />
          </div>
        ))}
      </div>
    </section>
  );
}
const pad2 = (n: number) => String(n).padStart(2, "0");
