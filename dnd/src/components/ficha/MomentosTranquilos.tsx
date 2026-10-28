import { Icon } from "@/components/ui/Icon";
import type { MomentoTranquilo, Nivel } from "@/lib/types";

const NIVEL: Record<Nivel, string> = { 1: "Bajo", 2: "Medio", 3: "Alto" };

function Barra({ nivel, serie }: { nivel: Nivel; serie: "ruido" | "gente" }) {
  // Ruido: relleno liso. Concurrencia: rayado. Se distinguen sin color.
  const rayado = serie === "gente" ? "bg-[repeating-linear-gradient(135deg,var(--surface)_0_4px,transparent_4px_8px)]" : "";
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm">{serie === "ruido" ? "Ruido" : "Concurrencia"}</span>
      <div className="h-8 flex-1 overflow-hidden rounded-md border-2 border-line bg-surface">
        <div className={`flex h-full items-center justify-end bg-accent pr-2 text-sm font-bold text-[var(--accent-text)] ${rayado}`} style={{ width: `${(nivel / 3) * 100}%` }}>
          <span className={serie === "gente" ? "rounded bg-accent px-1" : ""}>{NIVEL[nivel]}</span>
        </div>
      </div>
    </div>
  );
}

/** Gráfico por franja horaria + tabla de texto con exactamente la misma información. */
export function MomentosTranquilos({ momentos }: { momentos: MomentoTranquilo[] }) {
  if (momentos.length === 0) return null;
  const mejor = momentos.reduce((a, b) => (a.ruido + a.concurrencia <= b.ruido + b.concurrencia ? a : b));
  return (
    <section aria-labelledby="momentos">
      <h2 id="momentos" className="flex items-center gap-2 text-2xl font-bold"><Icon name="reloj" size={1.3} /> Momentos tranquilos</h2>
      <p className="mt-2 max-w-prose text-muted">
        Nivel de ruido y de gente según el horario. Es una estimación a partir de relevamientos y reportes de visitantes.
      </p>
      <p className="mt-3 text-lg font-bold">
        El momento más tranquilo: {mejor.franja.toLowerCase()} (ruido {NIVEL[mejor.ruido].toLowerCase()}, concurrencia {NIVEL[mejor.concurrencia].toLowerCase()}).
      </p>

      <figure className="card mt-5 p-5">
        <div aria-hidden="true" className="flex flex-col gap-6">
          {momentos.map((m) => (
            <div key={m.franja} className="flex flex-col gap-1.5">
              <p className="font-bold">{m.franja}</p>
              <Barra nivel={m.ruido} serie="ruido" />
              <Barra nivel={m.concurrencia} serie="gente" />
            </div>
          ))}
        </div>
        <figcaption className="mt-4 text-sm text-muted">
          Gráfico de barras: más largo significa más ruido o más gente. La tabla de abajo tiene la misma información en texto.
        </figcaption>
      </figure>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[20rem] border-collapse text-left">
          <caption className="mb-2 text-left font-bold">Ruido y concurrencia por franja horaria</caption>
          <thead>
            <tr className="border-b-2 border-line">
              <th scope="col" className="py-2 pr-4">Franja</th>
              <th scope="col" className="py-2 pr-4">Ruido</th>
              <th scope="col" className="py-2">Concurrencia</th>
            </tr>
          </thead>
          <tbody>
            {momentos.map((m) => (
              <tr key={m.franja} className="border-b border-[var(--border-soft)]">
                <th scope="row" className="py-2 pr-4 font-normal">{m.franja}</th>
                <td className="py-2 pr-4 font-bold">{NIVEL[m.ruido]}</td>
                <td className="py-2 font-bold">{NIVEL[m.concurrencia]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
