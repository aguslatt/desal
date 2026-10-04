import type Lenis from "lenis";

let lenis: Lenis | null = null;
export const setLenis = (l: Lenis | null) => { lenis = l; };
export const getLenis = () => lenis;

export function scrollToTarget(target: string | number | HTMLElement, opts: { immediate?: boolean; offset?: number } = {}) {
  if (lenis) lenis.scrollTo(target as never, { duration: opts.immediate ? 0 : 1.1, immediate: opts.immediate, offset: opts.offset ?? 0, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
  else if (typeof target === "number") window.scrollTo({ top: target, behavior: opts.immediate ? "auto" : "smooth" });
  else {
    const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    el?.scrollIntoView({ behavior: opts.immediate ? "auto" : "smooth" });
  }
}
