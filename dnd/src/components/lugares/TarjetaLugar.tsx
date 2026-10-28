import Link from "next/link";
import { EstadoBadge, ESTADOS } from "@/components/ui/EstadoBadge";
import { Foto } from "@/components/ui/Foto";
import { Icon } from "@/components/ui/Icon";
import { Picto } from "@/components/ui/Picto";
import { condicion, RUBROS } from "@/lib/catalogo";
import { textoCoincidencia, type Resultado } from "@/lib/match";

const GRUPO_ESTADO = ["confirmado", "sin_info", "no_disponible"] as const;

export function EtiquetaPatrocinado() {
  return (
    <span className="inline-flex items-center rounded-full border-2 border-line px-2.5 py-0.5 text-sm font-bold">
      Patrocinado
    </span>
  );
}

export function TarjetaLugar({ r, discrepancia }: { r: Resultado; discrepancia: boolean }) {
  const { lugar, coincidencia: c } = r;
  const ids = Object.keys(c.detalle);
  return (
    <article className="card rise grid gap-0 overflow-hidden sm:grid-cols-[14rem_1fr]">
      <Foto tipo={lugar.fotos[0].tipo} alt={lugar.fotos[0].alt} className="aspect-[4/3] rounded-none sm:aspect-auto sm:h-full" />
      <div className="flex min-w-0 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
          <span>{RUBROS[lugar.rubro]}</span>
          <span aria-hidden="true">·</span>
          <span>{lugar.barrio}</span>
          {lugar.patrocinado && <EtiquetaPatrocinado />}
        </div>
        <h2 className="text-2xl leading-tight font-bold">
          <Link href={`/lugares/${lugar.id}`} className="text-ink">
            {lugar.nombre}
          </Link>
        </h2>

        {ids.length > 0 ? (
          <>
            <p>
              <EstadoBadge estado={GRUPO_ESTADO[c.grupo]} className="!text-base" />
              <span className="ml-2 font-bold">{textoCoincidencia(c)}</span>
            </p>
            <ul className="flex flex-col gap-1 text-sm">
              {ids.map((id) => {
                const e = c.detalle[id];
                return (
                  <li key={id} className="flex items-center gap-2">
                    <span className={`inline-flex shrink-0 ${ESTADOS[e].clase.split(" ")[0]}`}>
                      <Icon name={e} size={1.1} />
                    </span>
                    <Picto palabra={condicion(id).picto} className="!size-10" />
                    <span>
                      <span className="solo-completo">{condicion(id).etiqueta}</span>
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
          <p className="flex items-start gap-2 rounded-lg border-2 border-[var(--warn)] bg-[var(--warn-bg)] p-2 text-sm font-bold text-[var(--warn)]">
            <Icon name="alerta" size={1.2} />
            Hay reportes recientes que contradicen un dato publicado.
          </p>
        )}

        <p className="mt-auto">
          <Link href={`/lugares/${lugar.id}`} className="btn btn-ghost">
            Ver ficha<span className="sr-only"> de {lugar.nombre}</span>
            <Icon name="flecha" />
          </Link>
        </p>
      </div>
    </article>
  );
}
