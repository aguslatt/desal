import { mulberry32 } from "./noise";

/**
 * "Corte de papel": polígono irregular (clip-path) determinístico por seed.
 * Evita rectángulos perfectos: es una de las firmas gráficas de DE SAL.
 */
export function paperCut(seed: number, opts: { n?: number; amp?: number; edges?: ("t" | "r" | "b" | "l")[] } = {}) {
  const { n = 9, amp = 1.4, edges = ["t", "r", "b", "l"] } = opts;
  const r = mulberry32(seed * 977 + 13);
  const j = (on: boolean) => (on ? r() * amp : 0);
  const pts: string[] = [];
  const top = edges.includes("t"), right = edges.includes("r"), bottom = edges.includes("b"), left = edges.includes("l");
  for (let i = 0; i <= n; i++) pts.push(`${((i / n) * 100).toFixed(2)}% ${j(top).toFixed(2)}%`);
  for (let i = 1; i <= n; i++) pts.push(`${(100 - j(right)).toFixed(2)}% ${((i / n) * 100).toFixed(2)}%`);
  for (let i = n - 1; i >= 0; i--) pts.push(`${((i / n) * 100).toFixed(2)}% ${(100 - j(bottom)).toFixed(2)}%`);
  for (let i = n - 1; i >= 1; i--) pts.push(`${j(left).toFixed(2)}% ${((i / n) * 100).toFixed(2)}%`);
  return `polygon(${pts.join(",")})`;
}

/** Línea de sal: borde superior irregular y alto-frecuencia (costra). Rellena hacia abajo. */
export function saltLine(seed: number, n = 40, amp = 5) {
  const r = mulberry32(seed * 313 + 7);
  const pts = ["0% 100%"];
  let y = amp / 2;
  for (let i = 0; i <= n; i++) {
    y += (r() - 0.5) * amp * 0.9;
    y = Math.max(0, Math.min(amp, y));
    pts.push(`${((i / n) * 100).toFixed(2)}% ${y.toFixed(2)}%`);
  }
  pts.push("100% 100%");
  return `polygon(${pts.join(",")})`;
}
