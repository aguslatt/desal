import { TLink } from "../ui/TLink";

const ITEMS = [
  { t: "Lo nuevo", h: "/#joyas" },
  { t: "Collares con letras", h: "/#collares" },
  { t: "En 3D", h: "/#destacada" },
  { t: "Hecho a mano", h: "/#hecho-a-mano" },
  { t: "Colecciones", h: "/#colecciones" },
  { t: "Comunidad", h: "/#comunidad" },
];

/** Accesos rápidos en círculos de doble contorno (referencia MIE): a dónde ir, en un vistazo. */
export function Circles() {
  return (
    <nav aria-label="Accesos rápidos" className="mb-10 flex gap-3 overflow-x-auto px-[var(--gutter)] pb-2 md:mb-14 md:justify-between md:overflow-visible [scrollbar-width:none]">
      {ITEMS.map((it) => (
        <TLink key={it.t} href={it.h} label={it.t} data-cursor="link" data-magnetic
          className="group relative grid aspect-square w-[clamp(92px,11vw,150px)] shrink-0 place-items-center rounded-full border border-ink/35 p-3 text-center transition-all duration-500 hover:bg-ink hover:text-paper">
          <span aria-hidden className="absolute inset-[-7px] rounded-full border border-ink/20 transition-all duration-500 group-hover:inset-[-12px] group-hover:border-ink/40" />
          <span className="label leading-tight">{it.t}</span>
        </TLink>
      ))}
    </nav>
  );
}
