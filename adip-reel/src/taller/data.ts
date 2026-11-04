// "Taller para personas mayores" — Equipo ADIP. All times are seconds on the source timeline
// (word timings from a forced transcription of the interview audio).
export const FPS = 30;
export const VOICE_END = 53.0; // end of "¡Los esperamos!"
export const OUTRO_AT = 52.7; // ribbons start covering
export const TOTAL = 61.0;

// Subtitle chunks. [word|t] marks a keyword and the instant it is spoken.
export type Chunk = {s: number; e: number; text: string};
export const CHUNKS: Chunk[] = [
  {s: 1.5, e: 2.82, text: 'te cuesta [concentrarte|1.88],'},
  {s: 2.86, e: 4.08, text: 'sentís que la [tecnología|3.28] avanza'},
  {s: 4.12, e: 5.86, text: 'y te cuesta seguirle el [ritmo|5.44],'},
  {s: 5.9, e: 7.34, text: 'querés [moverte|6.16] más o incluso'},
  {s: 7.36, e: 8.36, text: 'tener un espacio donde puedas'},
  {s: 8.38, e: 9.62, text: '[conectar|8.38] con otras personas.'},
  {s: 9.78, e: 11.34, text: 'Desde Equipo ADIP creamos un [taller|11.10]'},
  {s: 11.36, e: 12.98, text: 'pensado para el [bienestar integral|12.12]'},
  {s: 13.0, e: 14.0, text: 'de las [personas mayores|13.38]'},
  {s: 14.02, e: 16.45, text: 'y de esa forma poder [acompañarlos|14.96] en el día a día.'},
  {s: 16.5, e: 18.24, text: 'Junto a [profesionales|16.68] de diferentes áreas'},
  {s: 18.26, e: 21.2, text: 'vamos a trabajar la [memoria|19.60], la [atención|20.46],'},
  {s: 21.22, e: 23.64, text: 'el [movimiento|21.44] y además la [alimentación saludable|22.58].'},
  {s: 23.68, e: 24.86, text: 'También vamos a explorar'},
  {s: 24.88, e: 26.74, text: 'el uso de [herramientas tecnológicas|25.38]'},
  {s: 26.76, e: 29.5, text: 'y uso de dispositivos, ya sea el [celular|28.5], la [tablet|29.14]'},
  {s: 29.52, e: 31.62, text: 'y además generar un [espacio|30.74] donde'},
  {s: 31.64, e: 33.34, text: 'las personas puedan [interactuar|32.28],'},
  {s: 33.38, e: 34.98, text: 'generar un espacio de [conversación|34.28],'},
  {s: 35.0, e: 37.74, text: '[temáticas|35.02] que tienen en común los participantes,'},
  {s: 37.76, e: 39.4, text: '[miedos|37.78] y sus [inquietudes|38.68].'},
  {s: 39.5, e: 41.3, text: 'Me encanta. Contame un poco la [dinámica|40.84]'},
  {s: 41.32, e: 42.9, text: 'de qué manera se va a desenvolver este taller.'},
  {s: 42.94, e: 44.06, text: 'Son encuentros [semanales|43.5]'},
  {s: 44.1, e: 45.62, text: 'para [aprender|44.34], [cuidarte|45.24]'},
  {s: 45.66, e: 47.28, text: 'y [conectar|45.98] con otras personas.'},
  {s: 47.32, e: 48.7, text: 'Si te gustaría [participar|47.78],'},
  {s: 48.74, e: 49.92, text: 'dejanos tu [comentario|49.30],'},
  {s: 49.94, e: 51.8, text: 'la palabra [INFO|50.34] y te contactaremos.'},
  {s: 52.08, e: 53.0, text: '¡Los esperamos!'},
];
