import { site } from "@/content/site";

/** Rótulo honesto de imagen provisoria. Desaparece solo al pasar `site.provisional` a false o `sample` a false. */
export default function Sample({ show = true }: { show?: boolean }) {
  if (!show || !site.provisional) return null;
  return <span className="chip-sample">Imagen de muestra</span>;
}
