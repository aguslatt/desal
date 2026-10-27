// Tiempos en segundos del video original (transcripción Whisper, revisada); O() los pasa al tiempo del montaje.
export const TRIM = 0.45; // se recorta el silencio inicial; no hay otros cortes
export const O = (t: number) => t - TRIM;

export type Chunk = {s: number; e: number; parts: [string, boolean?][]};

const ch = (s: number, e: number, parts: ([string] | [string, boolean])[]): Chunk => ({s: O(s), e: O(e), parts: parts as Chunk['parts']});

// Subtítulos corregidos, máximo dos líneas, texto = lo que se dice.
export const CHUNKS: Chunk[] = [
  ch(0.6, 2.06, [['Hola, soy Ale Schujman']]),
  ch(2.06, 3.3, [['y quiero invitar a toda la comunidad']]),
  ch(3.3, 4.3, [['y a las familias de ADIP']]),
  ch(4.3, 6.7, [['el día '], ['24 de noviembre,', true]]),
  ch(6.78, 8.1, [['19 horas, online.', true]]),
  ch(8.55, 9.3, [['Vamos a dar un taller']]),
  ch(9.3, 10.46, [['junto a Mariela Holcman.']]),
  ch(10.5, 12.0, [['Ser padres, '], ['no pares:', true]]),
  ch(12.2, 13.95, [['el arte de '], ['poner límites.', true]]),
  ch(14.08, 15.6, [['Los tiempos cambiaron,']]),
  ch(15.76, 16.8, [['la esencia es la misma.']]),
  ch(16.8, 18.8, [['Nuestros chicos nos precisan el límite:']]),
  ch(18.8, 21.1, [['es '], ['amor', true], [', es '], ['cuidado', true], [', es '], ['protección.', true]]),
  ch(21.4, 23.3, [['Es la clave de un '], ['vínculo saludable', true]]),
  ch(23.3, 25.5, [['y de eso vamos a hablar en el taller del 24.']]),
  ch(25.76, 26.5, [['Ahí nos vemos.']]),
];

// Momentos de motion (tiempo de montaje).
export const T = {
  title: 0.1,
  titleOut: 3.05,
  d24: O(4.64), // "24"
  dDe: O(5.44), // "de noviembre"
  d19: O(6.8), // "19 h"
  dOnline: O(7.54), // "online"
  wipe2: 7.28, // la banda "online" se expande
  switch2: 7.85, // composición cubierta: cambia el layout
  reveal2: 7.88,
  tag: O(9.06),
  serPadres: O(10.52),
  noPares: O(11.34),
  arte: O(12.4),
  de: O(12.64),
  limites: O(13.2),
  sOut: 13.5,
  amor: O(18.96) - 0.45,
  cuidado: O(19.66) - 0.45,
  proteccion: O(20.52) - 0.45,
  cOut: 20.8,
  vinculo: O(22.36) - 0.5,
  saludable: O(22.78) - 0.45,
  wipeEnd: 25.55,
  revealEnd: 26.25,
};
