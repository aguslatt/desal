"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { img, type Piece } from "@/content/pieces";
import { TLink } from "./ui/TLink";

/**
 * Pieza como objeto (no como card). Hover físico:
 *  · inclinación con inercia hacia el cursor  · la pieza se desplaza
 *  · segunda fotografía entra con máscara     · destello recortado a la silueta
 *  · coordenadas vivas                        · el nombre sigue al cursor (vía Cursor)
 */
export function PieceFigure({ piece, className = "", innerClassName = "", style, float = false, view = "a", link = true, children }: {
  piece: Piece; className?: string; innerClassName?: string; style?: React.CSSProperties; float?: boolean; view?: "a" | "b" | "c"; link?: boolean; children?: React.ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const alt = useRef<HTMLImageElement>(null);
  const glint = useRef<HTMLDivElement>(null);
  const coords = useRef<HTMLSpanElement>(null);
  const a = img(piece, view);
  const b = img(piece, view === "a" ? "b" : "a");

  useEffect(() => {
    registerGsap();
    const el = root.current!, t = tilt.current!;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let floatTween: gsap.core.Tween | undefined;
    if (float && !reduced) {
      floatTween = gsap.to(el.firstElementChild, { y: 14, rotate: 2.2, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }
    if (!fine || reduced) return () => floatTween?.kill();

    gsap.set(t, { transformPerspective: 900 });
    const rx = gsap.quickTo(t, "rotationX", { duration: 0.6, ease: "power3.out" });
    const ry = gsap.quickTo(t, "rotationY", { duration: 0.6, ease: "power3.out" });
    const qx = gsap.quickTo(t, "x", { duration: 0.7, ease: "power3.out" });
    const qy = gsap.quickTo(t, "y", { duration: 0.7, ease: "power3.out" });

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
      ry((nx - 0.5) * 12); rx(-(ny - 0.5) * 9); qx((nx - 0.5) * 18); qy((ny - 0.5) * 12);
      if (glint.current) glint.current.style.setProperty("--gx", `${(1 - nx) * 100}%`);
      if (coords.current) coords.current.textContent = `x.${String(Math.round(nx * 99)).padStart(2, "0")} y.${String(Math.round(ny * 99)).padStart(2, "0")}`;
    };
    const enter = () => {
      gsap.to(alt.current, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.out" });
      gsap.to(glint.current, { opacity: 1, duration: 0.3 });
      gsap.to(coords.current, { opacity: 1, duration: 0.3 });
      floatTween?.pause();
    };
    const leave = () => {
      gsap.to(alt.current, { clipPath: "inset(0% 100% 0% 0%)", duration: 0.6, ease: "expo.inOut" });
      gsap.to(glint.current, { opacity: 0, duration: 0.4 });
      gsap.to(coords.current, { opacity: 0, duration: 0.3 });
      gsap.to(t, { rotationX: 0, rotationY: 0, x: 0, y: 0, duration: 1.1, ease: "elastic.out(1,0.5)" });
      floatTween?.resume();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    return () => {
      floatTween?.kill();
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, [float]);

  const body = (
    <div className="relative" style={{ aspectRatio: a.ratio }}>
      <div ref={tilt} className="absolute inset-0" style={{ willChange: "transform", filter: "drop-shadow(0 26px 22px rgba(0,0,0,.34)) drop-shadow(0 4px 6px rgba(0,0,0,.25))" }}>
        <img src={a.src} width={a.w} height={a.h} alt={`${piece.label} Nº${piece.no} (placeholder)`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full" draggable={false} />
        <img ref={alt} src={b.src} width={b.w} height={b.h} alt="" aria-hidden loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain" style={{ clipPath: "inset(0% 100% 0% 0%)" }} draggable={false} />
        <div ref={glint} aria-hidden className="pointer-events-none absolute inset-0 opacity-0" style={{
          ["--gx" as string]: "50%",
          WebkitMaskImage: `url(${a.src})`, maskImage: `url(${a.src})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%",
          background: "linear-gradient(112deg, transparent calc(var(--gx) - 7%), rgba(255,255,255,.95) calc(var(--gx) - 1.5%), rgba(255,255,255,.0) calc(var(--gx) + 3%), transparent calc(var(--gx) + 3%))",
          mixBlendMode: "overlay",
        }} />
      </div>
      <span ref={coords} aria-hidden className="label label-sm pointer-events-none absolute -bottom-5 right-0 opacity-0">x.00 y.00</span>
      {children}
    </div>
  );

  return (
    <figure ref={root} className={className} style={style}>
      <div className={innerClassName}>
        {link ? (
          <TLink href={`/piece/${piece.slug}`} label={`${piece.label} Nº${piece.no}`} data-cursor="tag" data-cursor-label={`${piece.label} Nº${piece.no} →`} className="block" aria-label={`${piece.label} Nº${piece.no}`}>
            {body}
          </TLink>
        ) : body}
      </div>
    </figure>
  );
}
