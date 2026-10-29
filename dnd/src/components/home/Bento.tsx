import Link from "next/link";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Foto } from "@/components/ui/Foto";
import { Icon } from "@/components/ui/Icon";

/* eslint-disable @next/next/no-img-element */
const celda = "card card-hover relative flex min-w-0 flex-col gap-3 overflow-hidden p-6 text-ink no-underline";

const barras = [
  { f: "Mañana", r: 1, c: 1 },
  { f: "Mediodía", r: 1, c: 2 },
  { f: "Tarde", r: 2, c: 2 },
  { f: "Noche", r: 2, c: 3 },
];

/** Mosaico de lo que ofrece la app. Cada celda lleva al lugar donde se usa; las ilustraciones son decorativas. */
export function Bento() {
  return (
    <ul className="stagger grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-rows-[auto_auto] [&>li]:min-w-0">
      <li className="md:col-span-2" style={{ "--i": 0 } as React.CSSProperties}>
        <div className={`${celda} h-full`}>
          <p className="chip chip-violet w-fit">Tres estados</p>
          <h3 className="text-2xl leading-tight">Nunca un “sí” inventado.</h3>
          <p className="text-muted">Cada condición es Confirmada, No disponible o Sin información. Texto, ícono, color y forma: se distinguen aunque no veas los colores.</p>
          <div aria-hidden="true" className="mt-auto flex flex-wrap gap-2 pt-2">
            <EstadoBadge estado="confirmado" />
            <EstadoBadge estado="no_disponible" />
            <EstadoBadge estado="sin_info" />
          </div>
        </div>
      </li>

      <li className="md:col-span-2" style={{ "--i": 1 } as React.CSSProperties}>
        <div className={`${celda} h-full`}>
          <p className="chip chip-mint w-fit">Fuente y fecha</p>
          <h3 className="text-2xl leading-tight">Cada dato dice quién lo aportó y cuándo.</h3>
          <p className="text-muted">Relevamiento del equipo, el café o visitantes. Si hay reportes recientes que lo contradicen, te avisamos.</p>
          <div aria-hidden="true" className="mt-auto flex flex-col gap-2 pt-2 text-sm font-bold">
            <span className="rounded-xl border-2 border-ok bg-ok-bg px-3 py-1.5 text-ok">Relevamiento del equipo · 12/10/2026</span>
            <span className="rounded-xl border-2 border-ok bg-ok-bg px-3 py-1.5 text-ok">4 visitantes lo confirmaron en el último mes</span>
          </div>
        </div>
      </li>

      <li className="md:col-span-2 md:row-span-2" style={{ "--i": 2 } as React.CSSProperties}>
        <Link href="/lugares/cafe-nube-de-pan/recorrido" className={`${celda} group h-full`}>
          <p className="chip chip-violet w-fit">Recorrido visual</p>
          <h3 className="text-2xl leading-tight">De la vereda a la mesa, antes de salir.</h3>
          <p className="text-muted">Cinco pasos con imagen y descripción: ingreso, interior, mesa y baño. Para anticipar la visita.</p>
          <div aria-hidden="true" className="mt-auto grid grid-cols-3 gap-2 pt-2">
            {(["vereda", "ingreso", "bano"] as const).map((t) => (
              <Foto key={t} tipo={t} alt="" semilla="bento" className="aspect-square [&_figcaption]:hidden" />
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 font-bold text-accent">Ver un recorrido <Icon name="flecha" /></span>
        </Link>
      </li>

      <li className="md:col-span-2" style={{ "--i": 3 } as React.CSSProperties}>
        <Link href="/lugares/cafe-biblioteca-hojarasca" className={`${celda} group h-full`}>
          <p className="chip chip-mint w-fit">Momentos tranquilos</p>
          <h3 className="text-2xl leading-tight">Cuándo hay menos ruido y menos gente.</h3>
          <div aria-hidden="true" className="mt-auto grid grid-cols-4 items-end gap-3 pt-2">
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
          <span className="inline-flex items-center gap-1.5 font-bold text-accent">Ver el gráfico y la tabla <Icon name="flecha" /></span>
        </Link>
      </li>

      <li style={{ "--i": 4 } as React.CSSProperties}>
        <Link href="/lugares?vista=mapa" className={`${celda} group h-full`}>
          <p className="chip chip-violet w-fit">Mapa</p>
          <h3 className="text-xl leading-tight">Mapa y listado, la misma información.</h3>
          <svg aria-hidden="true" focusable="false" viewBox="0 0 200 110" className="mt-auto w-full">
            <rect width="200" height="110" rx="14" fill="var(--surface-2)" />
            <path d="M0 70c40-30 70 20 110-10s60-20 90-6M30 0c10 40 30 40 38 110M130 0c-10 30 6 60 28 110" fill="none" stroke="var(--border-soft)" strokeWidth="6" strokeLinecap="round" />
            {[[48, 42, "var(--ok)"], [112, 58, "var(--unk)"], [150, 30, "var(--ok)"], [84, 84, "var(--no)"]].map(([x, y, c], i) => (
              <g key={i}><circle cx={x as number} cy={y as number} r="11" fill={c as string} stroke="var(--surface)" strokeWidth="3" /><circle cx={x as number} cy={y as number} r="3" fill="var(--surface)" /></g>
            ))}
          </svg>
        </Link>
      </li>

      <li style={{ "--i": 5 } as React.CSSProperties}>
        <Link href="/necesidades" className={`${celda} group h-full`}>
          <p className="chip chip-mint w-fit">Lectura fácil</p>
          <h3 className="text-xl leading-tight">Frases cortas y pictogramas.</h3>
          <div aria-hidden="true" className="mt-auto flex gap-2">
            {["escalera", "escribir", "silencio"].map((p) => (
              <img key={p} src={`/picto/${p}.png`} alt="" width={64} height={64} loading="lazy" className="size-16 rounded-xl border border-soft bg-white p-1" />
            ))}
          </div>
        </Link>
      </li>

      <li className="md:col-span-4" style={{ "--i": 6 } as React.CSSProperties}>
        <div className="hero flex min-w-0 flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-10">
          <div className="min-w-0">
            <p className="display text-2xl font-bold">La información de accesibilidad es siempre gratuita.</p>
            <p className="muted mt-1">Para las personas y para los cafés. Sin planes pagos para ver un dato.</p>
          </div>
          <Link href="/accesibilidad" className="btn btn-light">Cómo cuidamos la accesibilidad<Icon name="flecha" /></Link>
        </div>
      </li>
    </ul>
  );
}
