import { Ph } from "../ui/Mask";

const perks = [
  { t: "Hecho a mano", d: "Cada pieza se trabaja una por una.", i: "M5 20c4-1 8-5 10-11l4-4 1 1-4 4c-6 2-10 6-11 10Z" },
  { t: "Envíos", d: "A todo el país.", ph: true, i: "M3 7h11v9H3zM14 10h4l3 3v3h-7z" },
  { t: "Cambios", d: "Si no te queda, lo resolvemos.", ph: true, i: "M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5M18 3v4h-4M6 21v-4h4" },
  { t: "Pagá como quieras", d: "Tarjeta, transferencia y más.", ph: true, i: "M3 6h18v12H3zM3 10h18" },
];

/** Franja de confianza: lo que una persona necesita saber antes de comprar, en un vistazo. */
export function Perks() {
  return (
    <section data-tone="dark" className="sheet theme-bone themed px-[var(--gutter)] pb-[8svh] pt-[2svh]" aria-label="Beneficios">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {perks.map((p) => (
          <li key={p.t} className="flex items-start gap-4 rounded-[28px] border-[1.5px] border-ink/20 p-5 transition-colors hover:bg-ink hover:text-paper md:p-6">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d={p.i} /></svg>
            <div><div className="name text-[17px] normal-case">{p.t}</div><div className="mt-1 text-[13px] leading-snug opacity-70">{p.d} {p.ph && <Ph />}</div></div>
          </li>
        ))}
      </ul>
    </section>
  );
}
