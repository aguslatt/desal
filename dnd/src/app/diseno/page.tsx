import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Sistema de diseño" };

const colores = [
  ["Fondo", "bg-bg border border-soft"],
  ["Superficie", "bg-surface border border-soft"],
  ["Texto", "bg-ink"],
  ["Acento", "bg-accent"],
  ["Confirmado", "bg-ok"],
  ["No disponible", "bg-no"],
  ["Sin información", "bg-unk"],
] as const;

export default function Diseno() {
  return (
    <div className="flex flex-col gap-14">
      <header>
        <h1 className="text-4xl font-bold">Sistema de diseño</h1>
        <p className="mt-3 max-w-prose text-muted">Referencia interna de colores, estados y componentes base.</p>
      </header>

      <section aria-labelledby="d-color">
        <h2 id="d-color" className="text-2xl font-bold">Color</h2>
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {colores.map(([n, c]) => (
            <li key={n}>
              <div className={`h-16 rounded-xl ${c}`} role="img" aria-label={`Muestra de ${n}`} />
              <p className="mt-1 text-sm font-bold">{n}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="d-estados">
        <h2 id="d-estados" className="text-2xl font-bold">Estados del dato</h2>
        <p className="mt-2 max-w-prose text-muted">Texto, ícono, color y forma del borde a la vez.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <EstadoBadge estado="confirmado" />
          <EstadoBadge estado="no_disponible" />
          <EstadoBadge estado="sin_info" />
        </div>
      </section>

      <section aria-labelledby="d-botones">
        <h2 id="d-botones" className="text-2xl font-bold">Botones y campos</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className="btn">Principal<Icon name="flecha" /></button>
          <button type="button" className="btn btn-ghost">Secundario</button>
          <button type="button" className="btn" disabled>Deshabilitado</button>
        </div>
        <div className="mt-6 max-w-sm">
          <label htmlFor="demo-campo" className="mb-1 block font-bold">Campo de texto</label>
          <input id="demo-campo" className="field" />
        </div>
      </section>
    </div>
  );
}
