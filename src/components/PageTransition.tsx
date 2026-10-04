"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { prefersReduced } from "@/lib/device";
import { getLenis, scrollToTarget } from "@/lib/scroll";
import { setNavigator } from "@/lib/transition";

/**
 * Transición entre páginas: una costra de sal sube y cubre (0.7s), se navega, y sigue de largo.
 * Es un telón de 160svh con borde superior irregular → la línea de sal como gesto de navegación.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const el = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const pending = useRef<string | null>(null);
  const busy = useRef(false);
  const guard = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    registerGsap();
    const node = el.current!;
    gsap.set(node, { y: () => window.innerHeight * 1.05 });

    setNavigator((href, text) => {
      if (busy.current) return;
      const reduced = prefersReduced();
      if (href.split("#")[0] === window.location.pathname) {
        const hash = href.split("#")[1];
        scrollToTarget(hash ? `#${hash}` : 0);
        return;
      }
      busy.current = true;
      pending.current = href;
      if (label.current) label.current.textContent = text ?? "";
      getLenis()?.stop();
      if (reduced) { router.push(href); return; }
      gsap.set(node, { y: () => window.innerHeight * 1.05 });
      gsap.to(node, {
        y: () => -window.innerHeight * 0.12, duration: 0.75, ease: "expo.inOut",
        onComplete: () => router.push(href),
      });
      guard.current = setTimeout(() => { busy.current = false; pending.current = null; gsap.to(node, { y: () => -window.innerHeight * 1.8, duration: 0.6 }); getLenis()?.start(); }, 6000);
    });
    return () => setNavigator(null);
  }, [router]);

  useEffect(() => {
    if (!pending.current || pathname !== pending.current.split("#")[0].split("?")[0]) return;
    if (guard.current) clearTimeout(guard.current);
    const hash = pending.current.split("#")[1];
    const node = el.current!;
    scrollToTarget(0, { immediate: true });
    window.scrollTo(0, 0);
    const done = () => { busy.current = false; pending.current = null; ScrollTrigger.refresh(); getLenis()?.start(); if (hash) setTimeout(() => scrollToTarget(`#${hash}`), 50); };
    if (prefersReduced()) { done(); return; }
    gsap.to(node, { y: () => -window.innerHeight * 1.8, duration: 0.85, ease: "expo.inOut", delay: 0.25, onComplete: () => { gsap.set(node, { y: () => window.innerHeight * 1.05 }); done(); } });
  }, [pathname]);

  return (
    <div
      ref={el}
      aria-hidden
      className="theme-red themed pointer-events-none fixed left-0 top-0 z-[9500] w-full"
      style={{ height: "170svh", transform: "translateY(105vh)", borderRadius: "50% 50% 0 0 / 14vh 14vh 0 0", boxShadow: "0 -30px 80px rgba(0,0,0,.35)" }}
    >
      <div className="absolute left-0 right-0 flex items-start justify-between px-[var(--gutter)]" style={{ top: "56svh" }}>
        <span className="label">DE SAL</span>
        <span ref={label} className="label" />
      </div>
      <img src="/pieces/mark-a.webp" alt="" className="absolute left-1/2 w-[26vw] -translate-x-1/2 md:w-[14vw]" style={{ top: "62svh" }} />
    </div>
  );
}
