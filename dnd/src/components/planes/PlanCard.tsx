import Link from "next/link";
import { EtiquetaPatrocinado } from "@/components/lugares/TarjetaLugar";
import { EstadoBadge, ESTADOS } from "@/components/ui/EstadoBadge";
import { Foto } from "@/components/ui/Foto";
import { Icon } from "@/components/ui/Icon";
import { Picto } from "@/components/ui/Picto";
import { condicion } from "@/lib/catalogo";
import { diaCorto, franja } from "@/lib/fecha";
import { textoCoincidencia } from "@/lib/match";
import type { ResultadoPlan } from "@/lib/planes";

const GRUPO_ESTADO = ["confirmado", "sin_info", "no_disponible"] as const;
const BANDA = ["bg-ok-bg text-ok border-ok", "bg-unk-bg text-unk border-unk border-dashed", "bg-no-bg text-no border-no"];
const mayus = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function PlanCard({ r }: { r: ResultadoPlan }) {
  const { plan, lugar, coincidencia: c } = r;
  const ids = Object.keys(c.detalle);
  const foto = lugar.fotos[1] ?? lugar.fotos[0];
  return (
    <article className="card card-hover grid gap-0 overflow-hidden sm:grid-cols-[17rem_1fr]">
      <div className="relative">
        <Foto tipo={foto.tipo} alt={foto.alt} src={foto.src} srcSet={foto.srcSet} sizes="(min-width: 640px) 272px, 100vw" rubro={lugar.rubro} semilla={lugar.id} className="aspect-[4/3] !rounded-none sm:aspect-auto sm:h-full" />
        <span className="chip chip-mint absolute top-3 left-3 !bg-surface">{plan.tipo}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-3 p-5 sm:p-6">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-muted">
          <span className="inline-flex items-center gap-1.5 text-accent"><Icon name="reloj" size={1.1} />{diaCorto(plan.fecha)} · {franja(plan.desde, plan.hasta)}</span>
          <span>{plan.precio}</span>
          <span>{plan.reserva ? "Con reserva previa" : "Sin reserva"}</span>
          {lugar.patrocinado && <EtiquetaPatrocinado />}
        </p>
        <h2 className="text-2xl leading-tight font-bold sm:text-3xl">
          <Link href={`/planes/${plan.id}`} className="text-ink no-underline hover:underline">{plan.titulo}</Link>
        </h2>
        <p className="text-muted">En <strong className="text-ink">{lugar.nombre}</strong> · {lugar.barrio}</p>

        {ids.length > 0 && (
          <>
            <p className={`inline-flex w-fit items-center gap-2 rounded-2xl border-2 px-3 py-1.5 text-lg font-bold ${BANDA[c.grupo]}`}>
              <Icon name={GRUPO_ESTADO[c.grupo]} size={1.3} />
              {textoCoincidencia(c)}
            </p>
            <ul className="flex flex-wrap gap-2 text-sm">
              {ids.map((id) => {
                const e = c.detalle[id];
                return (
                  <li key={id} className={`flex items-center gap-2 rounded-xl border-2 px-2.5 py-1 ${ESTADOS[e].clase}`}>
                    <Icon name={e} size={1.1} />
                    <Picto palabra={condicion(id).picto} className="!size-8" />
                    <span>
                      <span className="solo-completo">{mayus(condicion(id).corta)}</span>
                      <span className="solo-facil">{condicion(id).facil}</span>: <strong>{ESTADOS[e].texto}</strong>
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {ids.length === 0 && <p className="line-clamp-2 text-muted">{plan.descripcion}</p>}

        <p className="mt-auto pt-1">
          <Link href={`/planes/${plan.id}`} className="btn">
            Ver plan<span className="sr-only">: {plan.titulo}</span>
            <Icon name="flecha" />
          </Link>
        </p>
      </div>
    </article>
  );
}

export { EstadoBadge };
