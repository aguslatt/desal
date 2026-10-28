import Link from "next/link";
import { EstadoBadge, ESTADOS } from "@/components/ui/EstadoBadge";
import { Foto } from "@/components/ui/Foto";
import { Icon } from "@/components/ui/Icon";
import { Picto } from "@/components/ui/Picto";
import { condicion, RUBROS } from "@/lib/catalogo";
import { textoCoincidencia, type Resultado } from "@/lib/match";

const GRUPO_ESTADO = ["confirmado", "sin_info", "no_disponible"] as const;

export function EtiquetaPatrocinado() {
  return <span className="chip chip-mint">Patrocinado</span>;
}

const mayus = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const BANDA = ["bg-ok-bg text-ok border-ok", "bg-unk-bg text-unk border-unk border-dashed", "bg-no-bg text-no border-no"];

export function TarjetaLugar({ r, discrepancia }: { r: Resultado; discrepancia: boolean; i?: number }) {
  const { lugar, coincidencia: c } = r;
  const ids = Object.keys(c.detalle);
  return (
    <article className="card card-hover grid gap-0 overflow-hidden sm:grid-cols-[17rem_1fr]">
      <div className="relative">
        <Foto tipo={lugar.fotos[0].tipo} alt={lugar.fotos[0].alt} rubro={lugar.rubro} semilla={lugar.id} className="aspect-[4/3] !rounded-none sm:aspect-auto sm:h-full" />
        <span className="chip chip-violet absolute top-3 left-3 !bg-surface">{RUBROS[lugar.rubro]}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
          <span>{lugar.barrio}</span>
          {lugar.patrocinado && <EtiquetaPatrocinado />}
        </div>
        <h2 className="text-2xl leading-tight font-bold sm:text-3xl">
          <Link href={`/lugares/${lugar.id}`} className="text-ink no-underline hover:underline">
            {lugar.nombre}
          </Link>
        </h2>

        {ids.length > 0 ? (
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
        ) : (
          <p className="text-muted">{lugar.descripcion}</p>
        )}

        {discrepancia && (
          <p className="flex items-start gap-2 rounded-xl border-2 border-[var(--warn)] bg-[var(--warn-bg)] p-2.5 text-sm font-bold text-[var(--warn)]">
            <Icon name="alerta" size={1.2} />
            Hay reportes recientes que contradicen un dato publicado.
          </p>
        )}

        <p className="mt-auto pt-1">
          <Link href={`/lugares/${lugar.id}`} className="btn">
            Ver ficha<span className="sr-only"> de {lugar.nombre}</span>
            <Icon name="flecha" />
          </Link>
        </p>
      </div>
    </article>
  );
}
