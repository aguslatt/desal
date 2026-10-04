"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { markImg } from "@/content/pieces";
import { copy } from "@/content/copy";
import { Roll, TLink } from "../ui/TLink";
import { scrollToTarget } from "@/lib/scroll";

/**
 * 08 — FOOTER = escena final. DE SAL enorme medio enterrada en una pila de sal real
 * (canvas 2D: los granos caen, se acumulan y se agitan con el mouse). Una joya cae despacio y se hunde.
 */
export function Footer() {
  const section = useRef<HTMLElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const jewel = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const a = markImg();

  useEffect(() => {
    registerGsap();
    const canvas = cv.current!, el = section.current!;
    const ctx2 = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let W = 0, H = 0, dpr = 1;
    const CW = 3; // ancho de columna (px css)
    let heights: Float32Array = new Float32Array(0);
    type G = { x: number; y: number; vx: number; vy: number; s: number };
    let grains: G[] = [];
    let running = false, raf = 0, last = 0;
    let pointer = { x: -1, y: -1, vx: 0 };
    const maxPile = () => H * (coarse ? 0.2 : 0.24);

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = el.clientWidth; H = el.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cols = Math.ceil(W / CW) + 1;
      const old = heights;
      heights = new Float32Array(cols);
      // pila base irregular (viento)
      for (let i = 0; i < cols; i++) heights[i] = (old[i] ?? 0) || H * 0.1 + Math.sin(i * 0.05) * H * 0.018 + Math.sin(i * 0.17) * H * 0.008;
      draw();
    };

    const spawn = (x: number, y: number, vx = 0, vy = 20) =>
      grains.push({ x, y, vx, vy, s: 1.2 + Math.random() * 1.8 });

    const land = (g: G) => {
      let c = Math.max(0, Math.min(heights.length - 1, Math.floor(g.x / CW)));
      // desliza al vecino más bajo (ángulo de reposo)
      for (let k = 0; k < 6; k++) {
        const l = heights[c - 1] ?? Infinity, r = heights[c + 1] ?? Infinity;
        if (heights[c] - l > 2.5 && l <= r) c--; else if (heights[c] - r > 2.5) c++; else break;
      }
      heights[c] += g.s * 0.55;
    };

    function draw() {
      ctx2.clearRect(0, 0, W, H);
      // pila
      ctx2.fillStyle = "#e4dfc1";
      ctx2.beginPath();
      ctx2.moveTo(0, H);
      for (let i = 0; i < heights.length; i++) ctx2.lineTo(i * CW, H - heights[i]);
      ctx2.lineTo(W, H);
      ctx2.closePath();
      ctx2.fill();
      // cristales sueltos
      ctx2.fillStyle = "#f7f3ea";
      for (const g of grains) ctx2.fillRect(g.x, g.y, g.s, g.s);
    }

    const step = (t: number) => {
      const dt = Math.min(0.04, (t - last) / 1000 || 0.016); last = t;
      // lluvia lenta de sal
      if (Math.random() < 0.5) spawn(Math.random() * W, -4, (Math.random() - 0.5) * 6, 30 + Math.random() * 40);
      // el mouse agita: desparrama granos cerca del cursor
      if (pointer.x >= 0) {
        const col = Math.floor(pointer.x / CW);
        const top = H - (heights[col] ?? 0);
        if (Math.abs(pointer.y - top) < 90) {
          const speed = Math.min(1, Math.abs(pointer.vx) / 30);
          for (let k = 0; k < 2 + speed * 5; k++) {
            const j = Math.max(0, Math.min(heights.length - 1, col + Math.round((Math.random() - 0.5) * 8)));
            if (heights[j] > 3) { heights[j] -= 0.9; spawn(j * CW, H - heights[j] - 2, (Math.random() - 0.5) * 140 + pointer.vx * 3, -60 - Math.random() * 120); }
          }
        }
      }
      for (let i = grains.length - 1; i >= 0; i--) {
        const g = grains[i];
        g.vy += 260 * dt; g.x += g.vx * dt; g.y += g.vy * dt;
        const c = Math.floor(g.x / CW);
        if (g.x < 0 || g.x > W) { grains.splice(i, 1); continue; }
        if (g.y >= H - (heights[c] ?? 0)) { land(g); grains.splice(i, 1); }
      }
      // tope de altura: la sal "se asienta" parejo
      let hi = 0;
      for (let i = 0; i < heights.length; i++) hi = Math.max(hi, heights[i]);
      if (hi > maxPile()) for (let i = 0; i < heights.length; i++) heights[i] *= 0.9985;
      pointer.vx *= 0.9;
      draw();
      if (running) raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top, vx: e.movementX };
    };

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const trig = ScrollTrigger.create({
      trigger: el, start: "top bottom", end: "bottom top",
      onToggle: (s) => {
        if (reduced) return;
        running = s.isActive;
        cancelAnimationFrame(raf);
        if (running) { last = performance.now(); raf = requestAnimationFrame(step); }
      },
    });
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", () => { pointer.x = -1; });

    // joya que cae despacio y se hunde en la sal
    let fall: gsap.core.Timeline | undefined;
    if (!reduced) {
      const j = jewel.current!;
      fall = gsap.timeline({ repeat: -1, repeatDelay: 1.2, paused: true });
      fall.set(j, { y: "-30svh", x: 0, rotate: -30, opacity: 1, clipPath: "inset(0% 0% 0% 0%)" })
        .to(j, { y: "62svh", duration: 7.5, ease: "power1.in" }, 0)
        .to(j, { rotate: 160, duration: 7.5, ease: "none" }, 0)
        .to(j, { x: "4vw", duration: 3.75, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0)
        .to(j, { clipPath: "inset(0% 0% 40% 0%)", duration: 0.6, ease: "power2.out" }, 7.0)
        .to(j, { y: "70svh", duration: 0.6, ease: "power2.out" }, 7.5);
      ScrollTrigger.create({ trigger: el, start: "top 70%", end: "bottom top", onToggle: (s) => (s.isActive ? fall!.play() : fall!.pause()) });
    }

    // DE SAL emerge al entrar
    if (!reduced) gsap.fromTo(word.current, { yPercent: 28 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top 20%", scrub: 0.6 } });

    return () => {
      running = false; cancelAnimationFrame(raf); ro.disconnect(); trig.kill();
      el.removeEventListener("pointermove", onMove);
      fall?.kill();
    };
  }, []);

  const links = [
    { t: "Instagram", href: copy.instagramUrl, ext: true },
    { t: "Contacto", href: "#", ph: true },
    { t: "Shop", href: "/#joyas" },
    { t: "Shipping", href: "#", ph: true },
  ];

  return (
    <footer ref={section} id="footer" data-tone="light" className="theme-black themed relative h-[112svh] min-h-[640px] overflow-hidden" aria-label="Final">
      <div className="absolute inset-x-[var(--gutter)] top-[9svh] z-[3] flex items-start justify-between">
        <div>
          <p className="label mb-4 opacity-70">08 — Final</p>
          <p className="serif serif-i text-[7vw] md:text-[3vw]" style={{ lineHeight: 1 }}>joyas para llevar,<br />hechas a mano.</p>
        </div>
        <ul className="flex flex-col items-end gap-1">
          {links.map((l) => (
            <li key={l.t}>
              {l.ext ? (
                <a href={l.href} target="_blank" rel="noreferrer" className="serif whitespace-nowrap text-[8vw] md:text-[4.4vw]" style={{ lineHeight: 1.02 }}><Roll>{l.t + " ↗"}</Roll></a>
              ) : l.ph ? (
                <a href={l.href} onClick={(e) => e.preventDefault()} className="serif whitespace-nowrap text-[8vw] md:text-[4.4vw]" style={{ lineHeight: 1.02 }} title="Placeholder: por definir"><Roll>{l.t}</Roll></a>
              ) : (
                <TLink href={l.href} label="Shop" className="serif whitespace-nowrap text-[8vw] md:text-[4.4vw]"><Roll>{l.t}</Roll></TLink>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* joya que cae */}
      <div ref={jewel} aria-hidden className="pointer-events-none absolute left-[52%] top-0 z-[2] w-[22vw] md:left-[56%] md:w-[10vw]" style={{ willChange: "transform" }}>
        <img src={a.src} width={a.w} height={a.h} alt="" loading="lazy" className="w-full" />
      </div>

      {/* DE SAL: enorme, medio enterrada */}
      <div ref={word} className="serif pointer-events-none absolute inset-x-0 bottom-[2vw] z-[1] select-none text-center text-[44vw] text-rojo md:bottom-[-3vw] md:whitespace-nowrap md:text-[27vw]" style={{ lineHeight: 0.8 }} aria-hidden>
        <span className="block md:inline">DE</span><span className="hidden md:inline"> </span><span className="block md:inline">SAL</span>
        <span className="serif-i serif absolute bottom-[36%] right-[6%] text-[7vw] text-[#e4dfc1] md:bottom-[44%] md:right-[8%] md:text-[3.4vw]" style={{ lineHeight: 1 }}>studio</span>
      </div>

      {/* pila de sal */}
      <canvas ref={cv} aria-hidden className="pointer-events-none absolute inset-0 z-[4] h-full w-full" />

      <div className="label absolute inset-x-[var(--gutter)] bottom-[calc(var(--gutter)*0.6)] z-[5] flex items-end justify-between text-[#0c0a08]">
        <span>© DE SAL · v1 · piezas y datos <span className="ph">placeholder</span></span>
        <button onClick={() => scrollToTarget(0)} className="u-line" data-cursor="link">Volver arriba ↑</button>
      </div>
    </footer>
  );
}
