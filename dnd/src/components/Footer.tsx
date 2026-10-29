import Link from "next/link";
import { Marca } from "./Header";

const columnas = [
  { t: "Explorar", l: [["/lugares", "Cafés"], ["/lugares?vista=mapa", "Mapa de cafés"], ["/planes", "Planes del finde"], ["/necesidades", "Mis necesidades"]] },
  { t: "Para cafés", l: [["/comercios", "Plan gratuito y Pro"], ["/comercios/panel", "Panel de ejemplo"], ["/relevamientos", "Relevamientos profesionales"]] },
  { t: "Información", l: [["/accesibilidad", "Accesibilidad de Umbral"], ["/creditos", "Créditos de las fotos"]] },
] as const;

export function Footer() {
  return (
    <footer className="mt-28 border-t-4 border-accent bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <p className="display flex items-center gap-2.5 text-2xl font-extrabold text-accent"><Marca />Umbral</p>
          <p className="mt-3 max-w-sm text-muted">Cafés y planes con accesibilidad concreta, verificada y fechada. Siempre gratis. Tus necesidades se guardan solo en tu dispositivo.</p>
        </div>
        <nav aria-label="Pie de página" className="grid gap-8 sm:grid-cols-3">
          {columnas.map((c) => (
            <div key={c.t}>
              <p className="display font-bold">{c.t}</p>
              <ul className="mt-2">
                {c.l.map(([href, t]) => (
                  <li key={href}><Link className="tap inline-flex items-center" href={href}>{t}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-soft">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-muted">
          <p>Pictogramas de lectura fácil: © Gobierno de Aragón, autor Sergio Palao.</p>
          <ul className="flex flex-wrap gap-x-4">
            <li><a className="tap inline-flex items-center" href="https://arasaac.org">ARASAAC</a></li>
            <li><a className="tap inline-flex items-center" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es">Licencia CC BY-NC-SA 4.0</a></li>
          </ul>
          <p>Los cafés y los planes de esta demostración son ficticios. Cualquier parecido con uno real es casualidad.</p>
        </div>
      </div>
    </footer>
  );
}
