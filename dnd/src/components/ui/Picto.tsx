/* eslint-disable @next/next/no-img-element */
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Pictograma ARASAAC (CC BY-NC-SA, ver pie de página y public/picto/LICENCIA.txt).
 * Solo se ve con "Lectura fácil" activada. Es decorativo: el texto siempre está al lado.
 */
export function Picto({ palabra, className = "" }: { palabra?: string; className?: string }) {
  if (!palabra) return null;
  return <img src={`/picto/${slug(palabra)}.png`} alt="" width={56} height={56} loading="lazy" className={`solo-facil size-14 shrink-0 ${className}`} />;
}
