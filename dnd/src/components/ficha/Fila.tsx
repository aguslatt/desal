import { Picto } from "@/components/ui/Picto";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Icon } from "@/components/ui/Icon";
import { condicion } from "@/lib/catalogo";
import { textoFuente, textoValor } from "@/lib/fuente";
import { estadoDe } from "@/lib/match";
import type { Lugar } from "@/lib/types";

/** Una condición: estado (texto + ícono + color), valor, fuente y fecha. */
export function Fila({ lugar, condicionId, discrepa }: { lugar: Lugar; condicionId: string; discrepa?: boolean }) {
  const c = condicion(condicionId);
  const dato = lugar.datos[condicionId];
  const estado = estadoDe(lugar, condicionId);
  const valor = dato ? textoValor(dato, c.valor?.unidad) : "";
  const fuente = dato ? textoFuente(dato) : "";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex min-w-0 max-w-full items-center gap-3 font-bold">
          <Picto palabra={c.picto} />
          <span className="min-w-0">
          <span className="solo-completo">{c.etiqueta}</span>
          <span className="solo-facil">{c.facil}</span>
          </span>
        </p>
        <EstadoBadge estado={estado} />
      </div>
      {valor && estado !== "sin_info" && <p>{valor}</p>}
      {estado === "no_disponible" && dato?.estado === "confirmado" && (
        <p>El dato publicado no alcanza el mínimo ({c.minimo} {c.valor?.unidad}).</p>
      )}
      <p className="text-sm text-muted">
        {fuente || "Todavía no sabemos. Podés ayudarnos contando cómo te fue."}
      </p>
      {discrepa && (
        <p className="flex items-start gap-2 rounded-lg border-2 border-[var(--warn)] bg-[var(--warn-bg)] p-2 text-sm font-bold text-[var(--warn)]">
          <Icon name="alerta" size={1.2} />
          Reportes recientes contradicen este dato.
        </p>
      )}
    </div>
  );
}
