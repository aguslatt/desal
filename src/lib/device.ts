"use client";

import { useEffect, useState } from "react";

function useMedia(q: string, initial = false) {
  const [v, setV] = useState(initial);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setV(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [q]);
  return v;
}

export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");
export const useFinePointer = () => useMedia("(hover: hover) and (pointer: fine)");
export const useIsDesktop = () => useMedia("(min-width: 768px)");

export const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** ¿Conviene montar WebGL? Falla a un fallback 2D de alta calidad si no. */
export function canRender3D(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReduced()) return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return false;
  if ((nav.hardwareConcurrency ?? 8) <= 2) return false;
  if ((nav.deviceMemory ?? 8) <= 2) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function use3D() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => setOk(canRender3D()), []);
  return ok; // null = aún no decidido (se muestra el fallback → sin salto de layout)
}
