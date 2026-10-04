import photoSizes from "./photoSizes.json";
import stillSizes from "./pieceSizes.json";
import type { PieceKind } from "@/three/PieceModel";

/**
 * Piezas reales de DE SAL (fotos del taller). Los NOMBRES son provisorios (categoría + número).
 * Precio, material, peso, medidas, stock y talles son `null` → se muestran como [por definir].
 * `model`: diseño modelado en 3D a partir de la foto (aproximación, no es un escaneo).
 */
export type CollectionId = "anillos" | "collares";
type PhotoKey = keyof typeof photoSizes;

export type Piece = {
  slug: string;
  no: string;
  label: string;
  collection: CollectionId;
  photo: PhotoKey;
  /** punto de interés de la foto (0–1) y zoom para recortes */
  focus: { x: number; y: number; zoom: number };
  alt: string;
  model: PieceKind | null;
  price: number | null;
  material: string | null;
  weight: string | null;
  size: string | null;
  stock: number | null;
  /** talles (anillos): [] = por definir */
  sizes: number[] | null;
};

const base = { price: null, material: null, weight: null, size: null, stock: null, sizes: [] as number[], collection: "anillos" as const, label: "ANILLO" };

export const pieces: Piece[] = [
  { ...base, slug: "anillo-01", no: "01", photo: "estrella", focus: { x: 0.64, y: 0.54, zoom: 2.2 }, model: "cuffstar", alt: "Anillo ancho dorado con estrella en relieve y piedra celeste" },
  { ...base, slug: "anillo-02", no: "02", photo: "rib", focus: { x: 0.58, y: 0.42, zoom: 2.4 }, model: "rib", alt: "Dos anillos dorados tipo costillas con piedras celestes" },
  { ...base, slug: "anillo-03", no: "03", photo: "amatista", focus: { x: 0.6, y: 0.44, zoom: 2.6 }, model: "molten", alt: "Anillo dorado fundido con amatista y piedra blanca" },
  { ...base, slug: "anillo-04", no: "04", photo: "agujeros", focus: { x: 0.5, y: 0.5, zoom: 1.7 }, model: null, alt: "Anillo dorado calado con piedras, sobre el pasto" },
];

export const bySlug = (s: string) => pieces.find((p) => p.slug === s);
export const indexOf = (s: string) => pieces.findIndex((p) => p.slug === s);
export const pad = (n: number) => String(n).padStart(2, "0");

export function photo(p: Piece) {
  const [w, h] = photoSizes[p.photo];
  return { src: `/photos/${p.photo}.webp`, w, h, ratio: w / h };
}
/** render 3D estático (fallback sin WebGL / miniaturas) */
export function still(p: Piece) {
  if (!p.model) return null;
  const [w, h] = (stillSizes[`${p.model}-a` as keyof typeof stillSizes] as number[] | undefined) ?? [900, 800];
  return { src: `/pieces/${p.model}-a.webp`, w, h };
}
/** compat: miniatura para carrito */
export const thumb = (p: Piece) => photo(p);

export const collections: { id: CollectionId; name: string; blurb: string; soon?: boolean }[] = [
  { id: "anillos", name: "ANILLOS", blurb: "para los dedos" },
  { id: "collares", name: "COLLARES", blurb: "para colgar", soon: true },
];
export const piecesOf = (c: CollectionId) => pieces.filter((p) => p.collection === c);

export const money = (n: number | null) => (n == null ? null : `$ ${n.toLocaleString("es-AR")}`);

/** Marca DE SAL renderizada (oro fundido). */
export const markImg = () => {
  const [w, h] = (stillSizes["mark-a" as keyof typeof stillSizes] as number[] | undefined) ?? [900, 760];
  return { src: "/pieces/mark-a.webp", w, h };
};
