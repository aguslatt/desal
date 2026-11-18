// Equipo ADIP · manual de identidad v2 (octubre 2026). No hay otros colores ni otra tipografía.
export type RGB = [number, number, number];
export const C = {
  violet: [138, 0, 183] as RGB,
  pink: [237, 41, 149] as RGB,
  orange: [254, 128, 28] as RGB,
  yellow: [255, 203, 1] as RGB,
  green: [148, 201, 32] as RGB,
  gray: [239, 239, 239] as RGB,
  ink: [0, 0, 0] as RGB,
  white: [255, 255, 255] as RGB,
};
export const css = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
export const PALETTE: RGB[] = [C.violet, C.pink, C.orange, C.yellow, C.green];
/** text colour that sits on each palette fill (manual: blanco sobre violeta/fucsia, negro sobre el resto) */
export const onColor = (c: RGB) => (c === C.violet || c === C.pink ? '#FFFFFF' : '#000000');
export const GRADIENT: [number, string][] = [
  [0, '#8A00B7'],
  [0.3, '#ED2995'],
  [0.55, '#FE801C'],
  [0.78, '#FFCB01'],
  [1, '#94C920'],
];
export const FONT = "'Montserrat', sans-serif";
/** "El trazo" del manual (viewBox 0 0 400 120) */
export const TRAZO = 'M10 96 C 70 98, 120 92, 156 74 C 196 54, 204 16, 178 12 C 150 8, 146 54, 182 76 C 220 98, 300 98, 390 92';
