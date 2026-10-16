/**
 * ───────────────────────────────────────────────────────────────
 *  TODO EL CONTENIDO EDITABLE VIVE ACÁ.
 *  Buscá los marcadores  «COMPLETAR»  y  «CONFIRMAR».
 * ───────────────────────────────────────────────────────────────
 */
import type { StaticImageData } from "next/image";

import hero from "@/assets/muestras/hero.webp";
import heroVertical from "@/assets/muestras/hero-vertical.webp";
import casa1 from "@/assets/muestras/casa-horizonte-1.webp";
import casa2 from "@/assets/muestras/casa-horizonte-2.webp";
import luz1 from "@/assets/muestras/luz-norte-1.webp";
import luz2 from "@/assets/muestras/luz-norte-2.webp";
import mat1 from "@/assets/muestras/materia-1.webp";
import mat2 from "@/assets/muestras/materia-2.webp";
import torre1 from "@/assets/muestras/torre-aletas-1.webp";
import torre2 from "@/assets/muestras/torre-aletas-2.webp";
import suite1 from "@/assets/muestras/suite-nocturna-1.webp";
import suite2 from "@/assets/muestras/suite-nocturna-2.webp";
import vacio1 from "@/assets/muestras/vacio-central-1.webp";
import vacio2 from "@/assets/muestras/vacio-central-2.webp";

/* ───────────── 1 · Identidad y contacto ───────────── */
export const site = {
  /** true = versión provisional: muestra avisos de «imagen de muestra» y bloquea la indexación en buscadores.
   *  Pasar a false cuando haya renders y datos reales. */
  provisional: true,

  /** Nombre del arquitecto (confirmar tildes: ¿Julián Vázquez?) */
  name: "Julian Vazquez",
  /** Marca (su cuenta de Instagram) */
  brand: "vqz.render",
  /** Wordmark gigante de la portada */
  wordmark: "vqz",
  role: "Arquitecto · Visualización arquitectónica",
  /** COMPLETAR · dominio público final (para metadatos / redes) */
  url: "https://example.com",

  contact: {
    /** COMPLETAR · WhatsApp en formato internacional, solo dígitos. Ej. Argentina móvil: "5491112345678" */
    whatsapp: "",
    /** COMPLETAR · correo */
    email: "",
    /** Usuario de Instagram, sin @ */
    instagram: "vqz.render",
  },

  /** Ubicación visible en el pie (opcional). COMPLETAR o dejar vacío. */
  location: "",
} as const;

export const displayName = site.brand || site.name;

/** Mensaje de WhatsApp. Con tipo y cantidad elegidos, coincide con el texto base acordado. */
export const whatsappTemplate = {
  build: (type?: string, qty?: string) => {
    const t = type ? ` de ${type.toLowerCase()}` : "";
    const q = qty && qty !== "A definir" ? ` Necesitaría aproximadamente ${qty} imágenes.` : "";
    return `Hola, vi tu web y me gustaría cotizar renders para un proyecto${t}.${q}`;
  },
};

/* ───────────── 2 · Portada ───────────── */
export const heroContent = {
  /** Cada línea sube por separado. */
  title: ["Todavía no existe.", "Ya se puede ver."],
  lead: "Renders y visualización arquitectónica para presentar tu proyecto con la fuerza que merece.",
  image: hero,
  imageMobile: heroVertical,
  /** Cápsulas de la portada: 3 en celular, 4 en escritorio. Cada una puede ser un fragmento de un render. */
  capsules: [
    { src: casa1, alt: "Casa de volumen horizontal al atardecer", focus: "42% 50%" },
    { src: luz1, alt: "Living con gran ventanal y luz natural", focus: "50% 40%" },
    { src: vacio1, alt: "Escalera de doble altura bajo una claraboya", focus: "50% 50%" },
    { src: torre1, alt: "Fachada de vidrio con aletas verticales", focus: "40% 50%" },
  ],
  alt: "Volumen horizontal de hormigón y vidrio al atardecer, con el interior iluminado y su reflejo en el agua",
  /** Etiqueta de la imagen de portada */
  caption: { project: "Casa Horizonte", type: "Exterior · atardecer" },
  /** punto focal en mobile (object-position) */
  focus: "50% 50%",
};

export const intro = {
  kicker: "Visualización arquitectónica",
  /** Declaración breve. Sin cifras ni logros. */
  statement:
    "Un proyecto se decide mucho antes de construirse: en cómo se lo muestra. Trabajo cada imagen con mirada de arquitecto — materiales, luz, escala y atmósfera — para que se entienda lo que vas a proponer.",
  points: ["Materiales", "Luz", "Escala", "Atmósfera"],
};

/* ───────────── 3 · Proyectos ─────────────
 *  `sample: true` → se rotula «Imagen de muestra». Al cargar renders reales: sample: false.
 *  `layout` define la posición en la grilla (ver components/Projects.tsx).
 */
export type Shot = { src: StaticImageData; alt: string; note?: string };
export type Project = {
  slug: string;
  title: string;
  space: string;
  kind: string;
  description?: string;
  sample: boolean;
  layout: "wide" | "tall" | "square" | "land" | "cine" | "portrait";
  focus?: string;
  shots: Shot[];
};

export const projects: Project[] = [
  {
    slug: "casa-horizonte",
    title: "Casa Horizonte",
    space: "Exterior · vivienda unifamiliar",
    kind: "Render exterior",
    description: "Un volumen largo y bajo, abierto al paisaje. La luz interior marca el límite entre lo que se muestra y lo que se insinúa.",
    sample: true,
    layout: "wide",
    shots: [
      { src: casa1, alt: "Casa de volumen horizontal al atardecer, interior encendido", note: "Atardecer" },
      { src: casa2, alt: "La misma casa en una hora más fría, con cielo gris azulado", note: "Hora azul" },
    ],
  },
  {
    slug: "luz-norte",
    title: "Departamento Luz Norte",
    space: "Interior · living",
    kind: "Render interior",
    description: "Cómo entra el sol al ambiente y qué materiales recibe: la luz rasante sobre el piso define la escala del espacio.",
    sample: true,
    layout: "tall",
    shots: [
      { src: luz1, alt: "Living con gran ventanal y luz solar sobre el piso de madera", note: "Mediodía" },
      { src: luz2, alt: "El mismo living con luz de tarde más cálida", note: "Tarde" },
    ],
  },
  {
    slug: "materia",
    title: "Estudio de materia",
    space: "Detalle · materialidad",
    kind: "Imagen de detalle",
    description: "Madera y piedra bajo luz rasante: la imagen que ayuda a decidir un acabado antes de comprarlo.",
    sample: true,
    layout: "square",
    shots: [
      { src: mat1, alt: "Listones de madera junto a una pieza de piedra clara", note: "Listones finos" },
      { src: mat2, alt: "Variante con listones más anchos", note: "Listones anchos" },
    ],
  },
  {
    slug: "torre-aletas",
    title: "Torre Aletas",
    space: "Exterior · edificio residencial",
    kind: "Imagen para presentación comercial",
    description: "Una fachada pensada para comunicar ritmo y protección solar a quien todavía no ve el edificio construido.",
    sample: true,
    layout: "land",
    shots: [
      { src: torre1, alt: "Fachada de vidrio con aletas verticales a la mañana", note: "Mañana" },
      { src: torre2, alt: "Fachada con luz cálida de amanecer", note: "Amanecer" },
    ],
  },
  {
    slug: "suite-nocturna",
    title: "Suite nocturna",
    space: "Interior · dormitorio",
    kind: "Render interior",
    description: "Luz cálida y puntual, paneles de madera y una ventana a la noche: atmósfera por encima de la descripción.",
    sample: true,
    layout: "cine",
    shots: [
      { src: suite1, alt: "Dormitorio con panel de madera y lámpara encendida", note: "Luz suave" },
      { src: suite2, alt: "Dormitorio con la lámpara a máxima intensidad", note: "Luz intensa" },
    ],
  },
  {
    slug: "vacio-central",
    title: "Vacío central",
    space: "Interior · doble altura",
    kind: "Render interior",
    description: "Una escalera bajo una claraboya: la luz cenital recorre el espacio y revela su altura.",
    sample: true,
    layout: "portrait",
    shots: [
      { src: vacio1, alt: "Escalera de doble altura bajo una claraboya con luz cenital", note: "Luz cenital" },
      { src: vacio2, alt: "Escalera con haz de luz inclinado", note: "Luz diagonal" },
    ],
  },
];

export const projectsCta = {
  title: "¿Tenés un proyecto en mente? Hablemos.",
  text: "Contame qué necesitás mostrar y vemos juntos qué imágenes lo cuentan mejor.",
  button: "Cotizar mi proyecto",
};

/* ───────────── 4 · Servicios · CONFIRMAR con el arquitecto ───────────── */
export const services = {
  title: "Qué puedo hacer por tu proyecto",
  items: [
    {
      n: "01",
      title: "Renders de interiores",
      text: "Materiales, iluminación y atmósfera de cada ambiente, para decidir y comunicar antes de construir.",
      image: luz1,
      alt: "Muestra de render interior",
    },
    {
      n: "02",
      title: "Renders de exteriores",
      text: "La arquitectura y su relación con el entorno: implantación, volumen, vegetación y luz.",
      image: casa1,
      alt: "Muestra de render exterior",
    },
    {
      n: "03",
      title: "Imágenes para presentación comercial",
      text: "Visuales que ayudan a comunicar un proyecto a clientes, compradores o inversores.",
      image: torre1,
      alt: "Muestra de imagen para presentación comercial",
    },
  ],
  /** Qué gana quien contrata. Sin promesas de plazos ni resultados. */
  value: [
    { title: "Una idea clara", text: "Lo que está en el plano se vuelve algo que cualquiera entiende a primera vista." },
    { title: "Decisiones visibles", text: "Los materiales, la luz y las proporciones elegidas se comunican, no se explican." },
    { title: "Presentación profesional", text: "Imágenes con criterio de arquitecto, listas para acompañar tu proyecto." },
  ],
};

/* ───────────── 5 · Sobre él · COMPLETAR / revisar con él ───────────── */
export const about = {
  kicker: "Sobre mí",
  title: "Primero arquitecto. Después, imagen.",
  /** Texto provisional, sin datos biográficos inventados. Reescribir con su voz. */
  paragraphs: [
    "Me formé como arquitecto, y eso cambia la manera de mirar un render: antes de pensar en la imagen pienso en el espacio, en cómo entra la luz, qué se toca y a qué escala se camina.",
    "Por eso cada visualización busca respetar la intención del proyecto y mostrarla con precisión, para que quien la vea entienda lo mismo que quien la diseñó.",
  ],
  image: mat1,
  alt: "Muestra de materialidad: madera y piedra bajo luz rasante",
  /** COMPLETAR · foto real del arquitecto o de su mesa de trabajo (opcional) */
};

/* ───────────── 6 · Proceso · CONFIRMAR (sin plazos ni cantidad de revisiones) ───────────── */
export const process = {
  title: "Cómo trabajamos",
  steps: [
    { n: "01", title: "Compartís tu proyecto", text: "Me contás qué necesitás mostrar y me pasás la información que tengas." },
    { n: "02", title: "Definimos el alcance", text: "Acordamos las vistas, lo que incluye cada imagen y el presupuesto." },
    { n: "03", title: "Desarrollo y revisión", text: "Voy desarrollando las imágenes y revisamos juntos los avances." },
    { n: "04", title: "Recibís los archivos", text: "Entrego los archivos finales acordados." },
  ],
  note: "Alcance, tiempos y condiciones se acuerdan en cada proyecto.",
};

/* ───────────── 7 · Contacto ───────────── */
export const contactContent = {
  kicker: "Contacto",
  title: "Contame tu proyecto.",
  text: "Con unas líneas alcanza para empezar la conversación. La consulta se abre en WhatsApp con el mensaje ya armado: la revisás y la enviás vos.",
  projectTypes: ["Vivienda", "Edificio", "Interiorismo", "Comercial / local", "Otro"],
  quantities: ["1 a 3", "4 a 6", "7 a 10", "Más de 10", "A definir"],
};

export const nav = [
  { href: "#proyectos", label: "Proyectos" },
  { href: "#servicios", label: "Servicios" },
  { href: "#proceso", label: "Proceso" },
  { href: "#contacto", label: "Contacto" },
];

/* ───────────── helpers ───────────── */
export const whatsappConfigured = site.contact.whatsapp.replace(/\D/g, "").length >= 8;
export const emailConfigured = /.+@.+\..+/.test(site.contact.email);
export const instagramConfigured = site.contact.instagram.trim().length > 0;

export const whatsappUrl = (text: string) =>
  `https://wa.me/${site.contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
