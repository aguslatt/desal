import Link from "next/link";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Icon } from "@/components/ui/Icon";

export default function Inicio() {
  return (
    <div className="rise">
      <section className="max-w-3xl">
        <h1 className="text-4xl leading-tight font-bold sm:text-6xl sm:leading-[1.05]">
          Elegí tu salida sabiendo qué te espera.
        </h1>
        <p className="mt-6 max-w-prose text-xl text-muted">
          Bares, restaurantes, cafés, cines y centros culturales de la Ciudad. Con datos concretos, con fuente y con fecha.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/necesidades" className="btn">
            Marcar lo que necesito
            <Icon name="flecha" />
          </Link>
          <Link href="/lugares" className="btn btn-ghost">
            Ver lugares sin filtros
          </Link>
        </div>
      </section>

      <section aria-labelledby="como" className="mt-20">
        <h2 id="como" className="text-2xl font-bold">Cómo leés cada dato</h2>
        <p className="mt-2 max-w-prose text-muted">
          Cada condición tiene uno de tres estados. Si no sabemos algo, lo decimos: nunca lo damos por hecho.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          <li className="card min-w-0 p-5">
            <EstadoBadge estado="confirmado" />
            <p className="mt-3">Alguien lo relevó o lo reportó, y sabemos quién y cuándo.</p>
          </li>
          <li className="card min-w-0 p-5">
            <EstadoBadge estado="no_disponible" />
            <p className="mt-3">Lo confirmamos: el lugar no lo tiene.</p>
          </li>
          <li className="card min-w-0 p-5">
            <EstadoBadge estado="sin_info" />
            <p className="mt-3">Todavía no lo sabemos. Podés ayudarnos contando cómo te fue.</p>
          </li>
        </ul>
      </section>
    </div>
  );
}
