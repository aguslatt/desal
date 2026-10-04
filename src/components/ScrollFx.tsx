"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { prefersReduced } from "@/lib/device";

/**
 * Motor declarativo de scroll:
 *  data-rv="up|clip|fade"   → revelado por máscara / recorte / fade (solo micro-texto)
 *  data-rv-delay="0.1"      → retraso
 *  data-depth="0.3"         → parallax vertical sutil (±24px·depth·… scrub)
 *  data-grow="0.9,1.05"     → escala con el scroll (la pieza "se acerca")
 *  data-mdepth="10"         → profundidad por mouse (máx px), vía CSS `translate` (no choca con transforms de GSAP)
 */
export function ScrollFx() {
  const pathname = usePathname();

  useEffect(() => {
    registerGsap();
    const reduced = prefersReduced();
    let ctx: gsap.Context | undefined;
    let raf = 0;
    const kill: (() => void)[] = [];

    const t = setTimeout(() => {
      ctx = gsap.context(() => {
        document.querySelectorAll<HTMLElement>("[data-rv]").forEach((el) => {
          const kind = el.dataset.rv;
          if (reduced) { el.classList.add("rv-done"); return; }
          const delay = parseFloat(el.dataset.rvDelay ?? "0");
          const done = () => { el.classList.add("rv-done"); gsap.set(el, { clearProps: "transform,clipPath,opacity" }); };
          const from = kind === "up" ? { yPercent: 112, y: 0 } : kind === "clip" ? { clipPath: "inset(0% 0% 100% 0%)" } : { opacity: 0 };
          const to = kind === "up" ? { yPercent: 0, y: 0, duration: 0.95, ease: "power4.out" }
            : kind === "clip" ? { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "expo.inOut" }
            : { opacity: 1, duration: 0.6, ease: "power1.out" };
          gsap.fromTo(el, from, { ...to, delay, onComplete: done, paused: false,
            scrollTrigger: { trigger: kind === "up" ? (el.parentElement ?? el) : el, start: el.dataset.rvStart ?? "top 90%", once: true } });
        });

        if (!reduced) {
          document.querySelectorAll<HTMLElement>("[data-grow]").forEach((el) => {
            const [a, b] = (el.dataset.grow ?? "0.9,1").split(",").map(parseFloat);
            gsap.fromTo(el, { scale: a }, { scale: b, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 } });
          });
          document.querySelectorAll<HTMLElement>("[data-depth]").forEach((el) => {
            const d = parseFloat(el.dataset.depth ?? "0.2");
            gsap.fromTo(el, { y: -d * 90 }, { y: d * 90, ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 } });
          });
        }
      });
      ScrollTrigger.refresh();

      // profundidad por mouse
      if (!reduced && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const els = Array.from(document.querySelectorAll<HTMLElement>("[data-mdepth]"));
        const st = els.map((el) => ({ el, d: parseFloat(el.dataset.mdepth ?? "8"), x: 0, y: 0 }));
        let mx = 0, my = 0;
        const move = (e: PointerEvent) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; };
        window.addEventListener("pointermove", move, { passive: true });
        const loop = () => {
          for (const s of st) {
            s.x += (mx * s.d * 2 - s.x) * 0.07;
            s.y += (my * s.d * 2 - s.y) * 0.07;
            s.el.style.translate = `${s.x.toFixed(2)}px ${s.y.toFixed(2)}px`;
          }
          raf = requestAnimationFrame(loop);
        };
        if (st.length) loop();
        kill.push(() => { window.removeEventListener("pointermove", move); cancelAnimationFrame(raf); });
      }
    }, 60);

    return () => {
      clearTimeout(t);
      kill.forEach((f) => f());
      ctx?.revert();
    };
  }, [pathname]);

  return null;
}
