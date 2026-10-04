"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { prefersReduced } from "@/lib/device";
import { setLenis } from "@/lib/scroll";

/** Lenis con inercia suave (lerp .1) sincronizado con ScrollTrigger. Sin scroll hijacking: solo suaviza el scroll nativo. */
export function SmoothScroll() {
  useEffect(() => {
    registerGsap();
    if (prefersReduced()) return;
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95, smoothWheel: true });
    setLenis(lenis);
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.off("scroll", onScroll);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
  return null;
}
