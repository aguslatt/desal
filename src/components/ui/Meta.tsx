import { money, type Piece } from "@/content/pieces";
import { Ph } from "./Mask";

/** Tamaño de fuente (vw) para que una palabra entre en `span` vw sin romperse. */
export const fitVw = (word: string, span: number, max: number) => Math.min(max, span / (word.length * 0.74));

export function Price({ piece }: { piece: Piece }) {
  const m = money(piece.price);
  return m ? <>{m}</> : <>$ <Ph>—</Ph></>;
}

/** Ficha mínima de una pieza: numeración, material, "hecho a mano", precio. Datos reales = por definir. */
export function Meta({ piece, className = "", align = "left" }: { piece: Piece; className?: string; align?: "left" | "right" }) {
  return (
    <dl className={`label flex flex-col ${align === "right" ? "items-end text-right" : ""} ${className}`}>
      <div className="mb-3 flex gap-3"><dt className="opacity-50">Nº{piece.no}</dt><dd>{piece.label}</dd></div>
      <div className="hair w-full" />
      <div className="flex w-full justify-between gap-6 py-2"><dt className="opacity-50">Material</dt><dd>{piece.material ?? <Ph />}</dd></div>
      <div className="hair w-full" />
      <div className="flex w-full justify-between gap-6 py-2"><dt className="opacity-50">Hecho</dt><dd>a mano</dd></div>
      <div className="hair w-full" />
      <div className="flex w-full justify-between gap-6 py-2"><dt className="opacity-50">Precio</dt><dd><Price piece={piece} /></dd></div>
    </dl>
  );
}
