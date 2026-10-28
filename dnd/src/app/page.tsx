import Link from "next/link";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Foto } from "@/components/ui/Foto";
import { Icon } from "@/components/ui/Icon";
import { condiciones, dimensiones } from "@/lib/catalogo";
import { lugares } from "@/lib/datos";

/** Arco grande de fondo: el "umbral". Decorativo. */
function Arco({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 480" aria-hidden="true" focusable="false" className={className}>
      <path d="M40 480V190a160 160 0 0 1 320 0v290z" fill="none" stroke="currentColor" strokeWidth="26" />
      <path d="M100 480V196a100 100 0 0 1 200 0v284z" fill="currentColor" opacity=".35" />
    </svg>
  );
}

const pasos = [
  { n: "1", t: "Marcá lo que necesitás", d: "Elegí condiciones concretas, como “ingreso sin escalones” o “atención por escrito”. No hace falta decir nada más.", color: "bg-surface-2 text-accent border-accent" },
  { n: "2", t: "Mirá cuánto coincide", d: "Cada lugar dice “Cumple 5 de 6 · 1 sin información”. Sin puntajes ni estrellas.", color: "bg-mint-bg text-mint border-mint" },
  { n: "3", t: "Andá sabiendo qué te espera", d: "Mirá el recorrido en fotos y, después, contanos cómo te fue para mejorar los datos.", color: "bg-surface-2 text-accent border-accent" },
];

export default function Inicio() {
  return (
    <div className="flex flex-col gap-24">
      <section aria-labelledby="titulo" className="hero px-6 py-12 sm:px-12 sm:py-16 lg:py-20">
        <Arco className="flotar pointer-events-none absolute -right-16 -bottom-10 h-[34rem] text-white opacity-[.12] [--giro:6deg]" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="chip !border-[var(--hero-text)] !text-[var(--hero-text)] border-2">
              <Icon name="confirmado" size={1.1} /> Con fuente y fecha, siempre
            </p>
            <h1 id="titulo" className="mt-5 text-4xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Elegí tu salida sabiendo qué te espera.
            </h1>
            <p className="muted mt-6 max-w-prose text-xl">
              Bares, restaurantes, cafés, cines y centros culturales de la Ciudad. Con datos concretos de accesibilidad, no con etiquetas generales.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/necesidades" className="btn btn-light">
                Marcar lo que necesito
                <Icon name="flecha" />
              </Link>
              <Link href="/lugares" className="btn btn-line-light">
                Ver lugares sin filtros
              </Link>
            </div>
          </div>

          {/* Ejemplo de cómo se ve un resultado. Es una ilustración: no se lee con lector de pantalla. */}
          <div aria-hidden="true" className="flotar relative mx-auto w-full max-w-sm [--giro:-2deg]">
            <div className="card overflow-hidden text-ink">
              <Foto tipo="fachada" alt="" rubro="cafe" semilla="cafe-nube-de-pan" className="aspect-[16/10] !rounded-none" />
              <div className="flex flex-col gap-3 p-5">
                <p className="text-sm font-bold text-muted">Café · Palermo</p>
                <p className="display text-2xl font-bold">Café Nube de Pan</p>
                <p className="inline-flex w-fit items-center gap-2 rounded-2xl border-2 border-ok bg-ok-bg px-3 py-1.5 text-lg font-bold text-ok">
                  <Icon name="confirmado" size={1.3} /> Cumple 3 de 3
                </p>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {["Ingreso sin escalones", "Atención por escrito", "Espacio tranquilo"].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-ok"><Icon name="confirmado" size={1.1} /><span className="text-ink">{t}: <strong>Confirmado</strong></span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="como">
        <p className="chip chip-mint">Así funciona</p>
        <h2 id="como" className="mt-3 max-w-2xl text-4xl leading-tight sm:text-5xl">Tres pasos, sin diagnósticos.</h2>
        <ol className="stagger mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {pasos.map((p, i) => (
            <li key={p.n} className="card min-w-0 p-6" style={{ "--i": i } as React.CSSProperties}>
              <span aria-hidden="true" className={`display inline-flex size-14 items-center justify-center rounded-2xl border-2 text-3xl font-extrabold ${p.color}`}>{p.n}</span>
              <h3 className="mt-5 text-2xl leading-tight">{p.t}</h3>
              <p className="mt-2 text-muted">{p.d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-muted">
          Hoy hay <strong className="text-ink">{lugares.length} lugares de demostración</strong>, <strong className="text-ink">{dimensiones.length} dimensiones</strong> y{" "}
          <strong className="text-ink">{condiciones.length} condiciones</strong> para elegir.
        </p>
      </section>

      <section aria-labelledby="datos">
        <p className="chip chip-violet">Cómo leés cada dato</p>
        <h2 id="datos" className="mt-3 max-w-2xl text-4xl leading-tight sm:text-5xl">Si no sabemos algo, lo decimos.</h2>
        <p className="mt-4 max-w-prose text-xl text-muted">Cada condición tiene uno de tres estados. La falta de información nunca se muestra como “sí”.</p>
        <ul className="stagger mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            { e: "confirmado" as const, t: "Alguien lo relevó o lo reportó, y sabemos quién y cuándo.", f: "Relevamiento del equipo · 12/10/2026" },
            { e: "no_disponible" as const, t: "Lo confirmamos: el lugar no lo tiene.", f: "3 visitantes lo reportaron en el último mes" },
            { e: "sin_info" as const, t: "Todavía no lo sabemos. Podés ayudarnos contando cómo te fue.", f: "Sin fuente todavía" },
          ].map((x, i) => (
            <li key={x.e} className="card min-w-0 p-6" style={{ "--i": i } as React.CSSProperties}>
              <EstadoBadge estado={x.e} className="!text-base" />
              <p className="mt-4 text-lg">{x.t}</p>
              <p className="mt-3 border-t border-soft pt-3 text-sm text-muted">{x.f}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="comercios" className="hero px-6 py-12 sm:px-12">
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 id="comercios" className="text-4xl leading-tight sm:text-5xl">¿Tenés un local?</h2>
            <p className="muted mt-3 max-w-prose text-xl">Mostrá lo que ya hacés bien y sumá clientes que antes no sabían si podían ir. La información de accesibilidad es siempre gratuita.</p>
          </div>
          <Link href="/comercios" className="btn btn-light">
            Para comercios
            <Icon name="flecha" />
          </Link>
        </div>
      </section>
    </div>
  );
}
