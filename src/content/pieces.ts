import sizes from "./pieceSizes.json";
import type { PieceKind } from "@/three/PieceModel";

/**
 * ⚠ PLACEHOLDER. Estas piezas son modelos procedurales, NO son piezas reales de DE SAL.
 * Los nombres son solo categoría + número. Precio, material, peso, medidas y stock
 * son `null` y se muestran como [por definir]. Reemplazar por datos y fotografía reales (ver README).
 */
export type CollectionId = "anillos" | "collares" | "aros" | "pulseras" | "broches";

export type Piece = {
  slug: string;
  no: string; // número en su categoría, "01"
  label: string; // "ANILLO"
  kind: PieceKind;
  collection: CollectionId;
  metal: "oro" | "plata"; // solo describe el render placeholder
  /** datos reales por completar */
  price: number | null;
  material: string | null;
  weight: string | null;
  size: string | null;
  stock: number | null;
  /** talles disponibles (solo anillos); null = por definir */
  sizes: number[] | null;
  /** posición de la piedra en el render a (0–1), para anotaciones */
  note?: { x: number; y: number };
};

export const pieces: Piece[] = [
  { slug: "anillo-01", no: "01", label: "ANILLO", kind: "ring", collection: "anillos", metal: "oro", price: null, material: null, weight: null, size: null, stock: null, sizes: [], note: { x: 0.27, y: 0.17 } },
  { slug: "aros-01", no: "01", label: "AROS", kind: "hoops", collection: "aros", metal: "oro", price: null, material: null, weight: null, size: null, stock: null, sizes: null },
  { slug: "anillo-02", no: "02", label: "ANILLO", kind: "signet", collection: "anillos", metal: "plata", price: null, material: null, weight: null, size: null, stock: null, sizes: [] },
  { slug: "broche-01", no: "01", label: "BROCHE", kind: "nugget", collection: "broches", metal: "oro", price: null, material: null, weight: null, size: null, stock: null, sizes: null },
  { slug: "pulsera-01", no: "01", label: "PULSERA", kind: "cuff", collection: "pulseras", metal: "plata", price: null, material: null, weight: null, size: null, stock: null, sizes: null },
  { slug: "collar-01", no: "01", label: "COLLAR", kind: "pendant", collection: "collares", metal: "oro", price: null, material: null, weight: null, size: null, stock: null, sizes: null },
];

export const bySlug = (s: string) => pieces.find((p) => p.slug === s);
export const indexOf = (s: string) => pieces.findIndex((p) => p.slug === s);
export const pad = (n: number) => String(n).padStart(2, "0");

type View = "a" | "b" | "c";
export function img(p: Piece, v: View = "a") {
  const key = `${p.kind}-${v}` as keyof typeof sizes;
  const [w, h] = (sizes[key] as number[] | undefined) ?? [1000, 1000];
  return { src: `/pieces/${p.kind}-${v}.webp`, w, h, ratio: w / h };
}

export const collections: { id: CollectionId; name: string; blurb: string }[] = [
  { id: "anillos", name: "ANILLOS", blurb: "para los dedos" },
  { id: "collares", name: "COLLARES", blurb: "para colgar" },
  { id: "aros", name: "AROS", blurb: "para las orejas" },
  { id: "pulseras", name: "PULSERAS", blurb: "para las muñecas" },
  { id: "broches", name: "BROCHES", blurb: "para la ropa" },
];
export const piecesOf = (c: CollectionId) => pieces.filter((p) => p.collection === c);

/** Formatea un dato real o devuelve null para que la UI muestre el placeholder. */
export const money = (n: number | null) => (n == null ? null : `$ ${n.toLocaleString("es-AR")}`);

/** Marca DE SAL renderizada (oro fundido). */
export const markImg = () => {
  const [w, h] = (sizes["mark-a" as keyof typeof sizes] as number[] | undefined) ?? [900, 760];
  return { src: "/pieces/mark-a.webp", w, h };
};
