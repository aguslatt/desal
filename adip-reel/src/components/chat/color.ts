/** Mezcla lineal de dos colores #RRGGBB (t = 0 → a, t = 1 → b). */
export const mixHex = (a: string, b: string, t: number): string => {
  const k = Math.min(1, Math.max(0, t));
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const v = (i: number) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * k);
  return `rgb(${v(0)}, ${v(1)}, ${v(2)})`;
};

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * Math.min(1, Math.max(0, t));
