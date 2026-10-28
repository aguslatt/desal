import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-28 border-t-4 border-accent bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-2">
        <div>
          <p className="display text-xl font-extrabold text-accent">Umbral</p>
          <p className="max-w-prose text-muted">
            La información de accesibilidad es siempre gratuita. Tus necesidades se guardan solo en tu dispositivo.
          </p>
        </div>
        <div>
          <ul className="flex flex-wrap gap-x-4">
            <li><Link className="tap inline-flex items-center" href="/comercios">Para comercios</Link></li>
            <li><Link className="tap inline-flex items-center" href="/relevamientos">Relevamientos profesionales</Link></li>
            <li><Link className="tap inline-flex items-center" href="/accesibilidad">Accesibilidad de Umbral</Link></li>
            <li><Link className="tap inline-flex items-center" href="/creditos">Créditos de las fotos</Link></li>
          </ul>
          <p className="mt-2 text-muted">Pictogramas de lectura fácil: © Gobierno de Aragón, autor Sergio Palao.</p>
          <ul className="flex flex-wrap gap-x-4">
            <li><a className="tap inline-flex items-center" href="https://arasaac.org">ARASAAC</a></li>
            <li><a className="tap inline-flex items-center" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es">Licencia CC BY-NC-SA 4.0</a></li>
          </ul>
          <p className="mt-2 text-muted">Los lugares de esta demostración son ficticios. Cualquier parecido con uno real es casualidad.</p>
        </div>
      </div>
    </footer>
  );
}
