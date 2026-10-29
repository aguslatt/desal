import Link from "next/link";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Foto } from "@/components/ui/Foto";
import { Icon } from "@/components/ui/Icon";
import { Bento } from "@/components/home/Bento";
import { DemoVivo } from "@/components/home/DemoVivo";
import { Escenarios } from "@/components/home/Escenarios";
import { Preguntas } from "@/components/home/Preguntas";
import { condiciones, dimensiones, ESTILOS } from "@/lib/catalogo";
import { buscarPlanes } from "@/lib/planes";
import { PlanCard } from "@/components/planes/PlanCard";
import { lugares, planes } from "@/lib/datos";
import { fotoDe } from "@/lib/fotos";

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
  { n: "3", t: "Andá sabiendo qué te espera", d: "Elegí un café o un plan, mirá el recorrido y, después, contanos cómo te fue para mejorar los datos.", color: "bg-surface-2 text-accent border-accent" },
];

export default function Inicio() {
  const planesDestacados = buscarPlanes(planes, lugares, { necesidades: [] }).items.slice(0, 3);
  return (
    <div className="flex flex-col gap-28">
      <section aria-labelledby="titulo" className="hero px-6 py-12 sm:px-12 sm:py-16 lg:py-20">
        <Arco className="flotar pointer-events-none absolute -right-16 -bottom-10 h-[34rem] text-white opacity-[.12] [--giro:6deg]" />
        <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div>
            <p className="chip !border-[var(--hero-text)] !text-[var(--hero-text)] border-2">
              <Icon name="confirmado" size={1.1} /> Con fuente y fecha, siempre
            </p>
            <h1 id="titulo" className="mt-5 text-4xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Elegí tu café sabiendo qué te espera.
            </h1>
            <p className="muted mt-6 max-w-prose text-xl">
              Cafés de la Ciudad y planes para el finde, con datos concretos de accesibilidad: escalones, ruido, comunicación por escrito. Nada de etiquetas generales.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/necesidades" className="btn btn-light">
                Marcar lo que necesito
                <Icon name="flecha" />
              </Link>
              <Link href="/planes" className="btn btn-line-light">
                Ver planes del finde
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full min-w-0 max-w-md pb-6 lg:pb-0">
            {/* eslint-disable @next/next/no-img-element */}
            <img aria-hidden="true" src={fotoDe("cafe", "interior", 2).src} alt="" width={960} height={640} className="absolute -top-8 -right-6 hidden w-40 rotate-6 rounded-2xl border-4 border-white object-cover shadow-xl lg:block" style={{ aspectRatio: "4/5" }} />
            <img aria-hidden="true" src={fotoDe("cafe", "mesa", 2).src} alt="" width={960} height={640} className="absolute -bottom-4 -left-10 hidden w-36 -rotate-6 rounded-2xl border-4 border-white object-cover shadow-xl lg:block" style={{ aspectRatio: "1/1" }} />
            {/* eslint-enable @next/next/no-img-element */}
            <div className="relative"><DemoVivo /></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="funciones" className="revela">
        <p className="chip chip-violet">Lo que vas a encontrar</p>
        <h2 id="funciones" className="mt-3 max-w-3xl text-4xl leading-tight sm:text-5xl">Todo lo que necesitás saber antes de ir.</h2>
        <div className="mt-10"><Bento /></div>
      </section>

      <section aria-labelledby="escenarios" className="revela">
        <p className="chip chip-mint">Armá tu salida</p>
        <h2 id="escenarios" className="mt-3 max-w-3xl text-4xl leading-tight sm:text-5xl">¿Qué necesitás hoy?</h2>
        <p className="mt-4 max-w-prose text-xl text-muted">Elegí una situación y te mostramos los cafés con esas condiciones. Después podés ajustarlas.</p>
        <div className="mt-10"><Escenarios /></div>
      </section>

      <section aria-labelledby="finde" className="revela">
        <p className="chip chip-mint">Este finde</p>
        <h2 id="finde" className="mt-3 max-w-3xl text-4xl leading-tight sm:text-5xl">Planes de todo tipo, adaptados.</h2>
        <p className="mt-4 max-w-prose text-xl text-muted">Música, talleres, charlas, catas, juegos y más. Cada plan dice si tiene intérprete de LSA, volumen bajo, subtítulos o reserva.</p>
        <ul className="stagger mt-8 flex flex-col gap-6">
          {planesDestacados.map((r, i) => (
            <li key={r.plan.id} style={{ "--i": i } as React.CSSProperties}><PlanCard r={r} /></li>
          ))}
        </ul>
        <p className="mt-8"><Link href="/planes" className="btn">Ver todos los planes<Icon name="flecha" /></Link></p>
      </section>

      <section aria-labelledby="estilos" className="revela">
        <p className="chip chip-violet">Explorá</p>
        <h2 id="estilos" className="mt-3 max-w-2xl text-4xl leading-tight sm:text-5xl">¿Qué café tenés ganas de probar?</h2>
        <ul className="stagger mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ESTILOS.map((e, i) => {
            const delEstilo = lugares.filter((l) => l.estilo === e);
            if (delEstilo.length === 0) return null;
            const f = delEstilo[0].fotos[0];
            return (
              <li key={e} style={{ "--i": i } as React.CSSProperties}>
                <Link href={`/lugares?estilo=${encodeURIComponent(e)}`} className="group relative block overflow-hidden rounded-3xl no-underline">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.src} srcSet={f.srcSet} sizes="(min-width: 1024px) 25vw, 50vw" alt="" width={960} height={640} loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-2xl bg-surface px-4 py-2.5 font-bold text-ink">
                    <span className="display">{e}<span className="block text-sm font-normal text-muted">{delEstilo.length} {delEstilo.length === 1 ? "café" : "cafés"}</span></span>
                    <Icon name="flecha" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="preguntas" className="revela">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="chip chip-violet">Preguntas frecuentes</p>
            <h2 id="preguntas" className="mt-3 text-4xl leading-tight sm:text-5xl">Lo que más nos preguntan.</h2>
            <p className="mt-4 text-muted">
              Hoy hay <strong className="text-ink">{lugares.length} cafés y {planes.length} planes de demostración</strong>, <strong className="text-ink">{dimensiones.length} dimensiones</strong> y{" "}
              <strong className="text-ink">{condiciones.length} condiciones</strong> para elegir.
            </p>
          </div>
          <Preguntas />
        </div>
      </section>

      <section aria-labelledby="comercios" className="hero revela px-6 py-12 sm:px-12">
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 id="comercios" className="text-4xl leading-tight sm:text-5xl">¿Tenés un café?</h2>
            <p className="muted mt-3 max-w-prose text-xl">Mostrá lo que ya hacés bien, publicá tus planes y sumá clientes que antes no sabían si podían ir. La información de accesibilidad es siempre gratuita.</p>
          </div>
          <Link href="/comercios" className="btn btn-light">
            Para cafés
            <Icon name="flecha" />
          </Link>
        </div>
      </section>
    </div>
  );
}
