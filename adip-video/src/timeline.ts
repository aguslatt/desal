// Everything that is timed against the footage lives here (seconds, measured on the camera original).
export const FPS = 30;
export const VIDEO_END = 48.5;
export const TOTAL = 50.5;

/** Shot list: start, end, camera scale from -> to, transform origin (% of frame). */
export const SHOTS: {a: number; b: number; s0: number; s1: number; ox: number; oy: number; split?: {fx: number; ty: number}}[] = [
  {a: 0, b: 4.4333, s0: 1.1, s1: 1.16, ox: 45, oy: 70}, // presentadora
  {a: 4.4333, b: 5.7333, s0: 1.08, s1: 1.1, ox: 50, oy: 0}, // P1
  {a: 5.7333, b: 9.6, s0: 1.0, s1: 1.03, ox: 50, oy: 0, split: {fx: 0.52, ty: 455}},
  {a: 9.6, b: 12.5333, s0: 1.03, s1: 1.0, ox: 50, oy: 0, split: {fx: 0.53, ty: 380}},
  {a: 12.5333, b: 13.1667, s0: 1.05, s1: 1.06, ox: 50, oy: 4, split: {fx: 0.5, ty: 380}},
  {a: 13.1667, b: 16.2, s0: 1.06, s1: 1.12, ox: 50, oy: 4},
  {a: 16.2, b: 17.8667, s0: 1.08, s1: 1.1, ox: 50, oy: 0}, // P2
  {a: 17.8667, b: 23.6, s0: 1.13, s1: 1.07, ox: 50, oy: 4},
  {a: 23.6, b: 25.3667, s0: 1.08, s1: 1.1, ox: 50, oy: 0}, // P3
  {a: 25.3667, b: 30.2333, s0: 1.0, s1: 1.03, ox: 50, oy: 0, split: {fx: 0.5, ty: 395}},
  {a: 30.2333, b: 32.3667, s0: 1.1, s1: 1.12, ox: 50, oy: 0}, // P4
  {a: 32.3667, b: 35.8, s0: 1.06, s1: 1.1, ox: 50, oy: 4},
  {a: 35.8, b: 40.9333, s0: 1.14, s1: 1.09, ox: 50, oy: 6},
  {a: 40.9333, b: 42.1333, s0: 1.08, s1: 1.1, ox: 50, oy: 0}, // P5
  {a: 42.1333, b: 44.9667, s0: 1.06, s1: 1.1, ox: 50, oy: 4},
  {a: 44.9667, b: 48.6, s0: 1.1, s1: 1.05, ox: 50, oy: 2}, // cierre
];
/** Windows where the footage steps back into the arch and the canvas takes the top of the frame. */
export const SPLITS: [number, number][] = [
  [5.7333, 12.5333],
  [25.3667, 30.2333],
];

/** Subtitles: faithful to the audio, max two lines, broken by sense units. */
export const SUBS: [number, number, string][] = [
  [0.0, 2.3, 'Juntamos las preguntas que más\nnos llegan a nuestro WhatsApp.'],
  [2.42, 4.42, 'Hicimos un video para\nresponderlas una por una.'],
  [4.5, 5.7, '¿Dónde estamos ubicados?'],
  [6.02, 7.38, 'Presencialmente,\ncontamos con tres sedes'],
  [7.4, 8.36, 'en la Ciudad de Buenos Aires:'],
  [8.44, 9.6, 'Avenida Córdoba 950,'],
  [9.9, 10.8, 'Paraguay al 930'],
  [10.84, 12.4, 'y Niceto Vega 5140.'],
  [12.64, 14.1, 'De todas formas,\ntodas nuestras prestaciones'],
  [14.14, 16.16, 'cubren toda la Ciudad\nde Buenos Aires y GBA.'],
  [16.24, 17.84, '¿Qué prestaciones brindan\nen Equipo ADIP?'],
  [17.94, 20.2, 'En Equipo ADIP contamos\ncon más de 10 prestaciones,'],
  [20.26, 22.16, 'siempre adaptándolas\na las necesidades específicas'],
  [22.2, 23.58, 'de cada persona\ny cada familia.'],
  [23.64, 25.26, '¿Cómo me puedo contactar\ncon el equipo?'],
  [25.36, 27.74, 'Puedes contactarte con nosotros\na través de nuestro WhatsApp,'],
  [27.76, 30.22, 'nuestro email o cada uno\nde nuestros teléfonos fijos.'],
  [30.26, 32.3, '¿Equipo ADIP es de solo chicos\no también adultos?'],
  [32.38, 34.22, 'Desde Equipo ADIP\nacompañamos a las personas'],
  [34.26, 35.78, 'en cualquier etapa de su vida,'],
  [35.9, 38.02, 'desde bebés hasta\nque sean adultos mayores.'],
  [38.08, 39.48, 'Es decir, no hay\nun rango específico'],
  [39.52, 40.92, 'para poder recibir\nnuestras prestaciones.'],
  [41.0, 42.08, '¿Trabajan con obras sociales?'],
  [42.2, 43.84, 'Sí, trabajamos tanto\ncon obras sociales'],
  [43.86, 44.94, 'como de manera particular.'],
  [45.04, 46.4, 'Si te quedó alguna\npregunta pendiente,'],
  [46.56, 48.0, 'coméntanos y te\nestaremos contactando.'],
];
