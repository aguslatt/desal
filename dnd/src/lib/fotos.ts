import data from "@/data/fotos.json";
import type { Rubro } from "./types";

/** Fotos ilustrativas con licencia libre (Wikimedia Commons). Los créditos se listan en /creditos. */
export interface FotoCredito {
  id: string;
  rubro: Rubro;
  slot: "fachada" | "interior" | "mesa";
  alt: string;
  titulo: string;
  autor: string;
  licencia: string;
  pagina: string;
}

export const fotosCreditos = Object.values(data) as FotoCredito[];

export function imagen(id: string) {
  return {
    src: `/fotos/${id}-960.webp`,
    srcSet: `/fotos/${id}-480.webp 480w, /fotos/${id}-960.webp 960w, /fotos/${id}-1440.webp 1440w`,
  };
}

/** Una foto ilustrativa de un rubro y una ranura (fachada, interior o mesa). */
export function fotoDe(rubro: Rubro, slot: FotoCredito["slot"], n = 0): FotoCredito & { src: string; srcSet: string } {
  const lista = fotosCreditos.filter((f) => f.rubro === rubro && f.slot === slot);
  const f = lista[n % lista.length];
  return { ...f, ...imagen(f.id) };
}
