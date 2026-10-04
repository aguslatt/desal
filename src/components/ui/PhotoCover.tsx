"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { photo, type Piece } from "@/content/pieces";

/**
 * Foto real recortada sobre su punto de interés. Al pasar el mouse, la foto se acerca y "sigue" al cursor.
 * `zoom` base; `hover` multiplicador extra.
 */
export function PhotoCover({ piece, zoom, hover = 1.1, className = "", rounded = "round", priority = false }: {
  piece: Piece; zoom?: number; hover?: number; className?: string; rounded?: string; priority?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const im = useRef<HTMLImageElement>(null);
  const p = photo(piece);
  const z = zoom ?? piece.focus.zoom;
  const ox = piece.focus.x * 100, oy = piece.focus.y * 100;

  useEffect(() => {
    registerGsap();
    const el = root.current!, img = im.current!;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.set(img, { scale: z });
    const qx = gsap.quickTo(img, "x", { duration: 0.8, ease: "power3.out" });
    const qy = gsap.quickTo(img, "y", { duration: 0.8, ease: "power3.out" });
    const disp = document.getElementById("water-disp"), turb = document.getElementById("water-turb");
    let tf: gsap.core.Tween | undefined;
    const water = (on: boolean) => {
      if (!disp || !turb) return;
      tf?.kill();
      if (on) {
        img.style.filter = "url(#water)";
        const o = { t: 0, s: 0 };
        tf = gsap.to(o, { s: 34, duration: 0.7, ease: "power3.out", onUpdate: () => { disp.setAttribute("scale", String(o.s)); } });
        gsap.ticker.add(tick);
      } else {
        const cur = parseFloat(disp.getAttribute("scale") ?? "0");
        const o = { s: cur };
        tf = gsap.to(o, { s: 0, duration: 0.8, ease: "power3.out", onUpdate: () => { disp.setAttribute("scale", String(o.s)); }, onComplete: () => { img.style.filter = ""; gsap.ticker.remove(tick); } });
      }
    };
    const tick = (t: number) => { turb?.setAttribute("baseFrequency", `${(0.008 + Math.sin(t * 0.9) * 0.002).toFixed(5)} ${(0.014 + Math.cos(t * 0.7) * 0.003).toFixed(5)}`); };
    const enter = () => { gsap.to(img, { scale: z * hover, duration: 0.9, ease: "expo.out" }); water(true); };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      qx(-((e.clientX - r.left) / r.width - 0.5) * 36); qy(-((e.clientY - r.top) / r.height - 0.5) * 36);
    };
    const leave = () => { gsap.to(img, { scale: z, duration: 1, ease: "expo.out" }); qx(0); qy(0); water(false); };
    el.addEventListener("pointerenter", enter); el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
    return () => { gsap.ticker.remove(tick); el.removeEventListener("pointerenter", enter); el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, [z, hover]);

  return (
    <div ref={root} className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} overflow-hidden ${rounded} ${className}`}>
      <img ref={im} src={p.src} width={p.w} height={p.h} alt={piece.alt} loading={priority ? "eager" : "lazy"} decoding="async" draggable={false}
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
        style={{ objectPosition: `${ox}% ${oy}%`, transformOrigin: `${ox}% ${oy}%`, transform: `scale(${z})` }} />
    </div>
  );
}
