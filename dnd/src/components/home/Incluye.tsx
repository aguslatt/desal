import Link from "next/link";
import { Foto } from "@/components/ui/Foto";
import { Icon } from "@/components/ui/Icon";

const barras = [
  { f: "Mañana", r: 1, c: 1 },
  { f: "Mediodía", r: 1, c: 2 },
  { f: "Tarde", r: 2, c: 2 },
  { f: "Noche", r: 2, c: 3 },
];

const PASOS = [
  { t: "vereda" as const, n: "Vereda" },
  { t: "ingreso" as const, n: "Ingreso" },
  { t: "interior" as const, n: "Interior" },
  { t: "mesa" as const, n: "Mesa" },
  { t: "bano" as const, n: "Baño" },
];

const tarjeta = "card card-hover group flex h-full min-w-0 flex-col gap-4 p-6 text-ink no-underline";

/**
 * Qué suma Umbral además de las fichas: programas del finde, recorrido visual y momentos tranquilos.
 * Las ilustraciones son decorativas (aria-hidden): todo lo importante está en el texto.
 */
export function Incluye() {
  return (
    <div>
      <p className="max-w-3xl text-xl text-muted">
        Además de las fichas de cada café, Umbral suma <strong className="text-ink">programas del finde</strong>, un{" "}
        <strong className="text-ink">recorrido visual de cinco pasos</strong> para anticipar la visita, de la vereda a la mesa y el baño, y un{" "}
        <strong className="text-ink">gráfico de momentos tranquilos</strong> con el nivel de ruido y de gente por franja horaria.
      </p>

      <ul className="stagger mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3 [&>li]:min-w-0">
        <li style={{ "--i": 0 } as React.CSSProperties}>
          <Link href="/programas" className={tarjeta}>
            <span className="chip chip-mint w-fit">1 · Programas del finde</span>
            <h3 className="text-2xl leading-tight">Qué hacer este finde, con las condiciones a la vista.</h3>
            <p className="text-muted">Música, talleres, charlas, catas, juegos y más en cafés de la Ciudad. Cada programa dice si tiene intérprete de LSA, volumen bajo, subtítulos o reserva.</p>
            <div aria-hidden="true" className="mt-auto rounded-2xl border border-soft bg-surface-2 p-3 text-sm">
              <p className="flex items-center gap-1.5 font-bold text-accent"><Icon name="reloj" size={1.05} /> Sábado 31/10 · 11 a 13 h</p>
              <p className="display mt-1 font-bold">Taller de latte art con intérprete de LSA</p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border-2 border-ok bg-ok-bg px-2 py-0.5 text-xs font-bold text-ok"><Icon name="confirmado" size={1} /> Cumple 2 de 2</p>
            </div>
            <span className="inline-flex items-center gap-1.5 font-bold text-accent">Ver los programas <Icon name="flecha" /></span>
          </Link>
        </li>

        <li style={{ "--i": 1 } as React.CSSProperties}>
          <Link href="/lugares/cafe-nube-de-pan/recorrido" className={tarjeta}>
            <span className="chip chip-violet w-fit">2 · Recorrido visual</span>
            <h3 className="text-2xl leading-tight">Cinco pasos para anticipar la visita.</h3>
            <p className="text-muted">De la vereda a la mesa y el baño, con una imagen y una descripción en cada paso. Así sabés qué te espera antes de salir.</p>
            <ol aria-hidden="true" className="mt-auto grid grid-cols-5 gap-1.5">
              {PASOS.map((p, i) => (
                <li key={p.t} className="flex flex-col items-center gap-1 text-[0.7rem] font-bold text-muted">
                  <Foto tipo={p.t} alt="" semilla="incluye" className="aspect-square w-full [&_figcaption]:hidden" />
                  <span>{i + 1}</span>
                  <span className="-mt-1">{p.n}</span>
                </li>
              ))}
            </ol>
            <span className="inline-flex items-center gap-1.5 font-bold text-accent">Ver un recorrido <Icon name="flecha" /></span>
          </Link>
        </li>

        <li style={{ "--i": 2 } as React.CSSProperties}>
          <Link href="/lugares/cafe-biblioteca-hojarasca#momentos" className={tarjeta}>
            <span className="chip chip-mint w-fit">3 · Momentos tranquilos</span>
            <h3 className="text-2xl leading-tight">Cuándo hay menos ruido y menos gente.</h3>
            <p className="text-muted">Un gráfico con el nivel de ruido y de gente en cada franja horaria, y una tabla con la misma información.</p>
            <div aria-hidden="true" className="mt-auto">
              <div className="grid grid-cols-4 items-end gap-3">
                {barras.map((b) => (
                  <div key={b.f} className="flex flex-col items-center gap-1.5 text-xs font-bold text-muted">
                    <div className="flex h-20 w-full items-end gap-1">
                      <span className="w-1/2 rounded-t-md bg-accent" style={{ height: `${(b.r / 3) * 100}%` }} />
                      <span className="w-1/2 rounded-t-md bg-[repeating-linear-gradient(135deg,var(--accent)_0_3px,var(--surface)_3px_6px)]" style={{ height: `${(b.c / 3) * 100}%` }} />
                    </div>
                    {b.f}
                  </div>
                ))}
              </div>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-muted">
                <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-4 rounded-sm bg-accent" />Ruido</span>
                <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-4 rounded-sm bg-[repeating-linear-gradient(135deg,var(--accent)_0_3px,var(--surface)_3px_6px)]" />Gente</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 font-bold text-accent">Ver el gráfico y la tabla <Icon name="flecha" /></span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
