/** Barras horizontales con su tabla de texto equivalente. */
export function Barras({ titulo, filas, columna }: { titulo: string; filas: { etiqueta: string; valor: number }[]; columna: string }) {
  const max = Math.max(...filas.map((f) => f.valor), 1);
  return (
    <figure className="card p-5">
      <h3 className="text-xl font-bold">{titulo}</h3>
      <div aria-hidden="true" className="mt-4 flex flex-col gap-2">
        {filas.map((f) => (
          <div key={f.etiqueta} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-sm sm:w-48">{f.etiqueta}</span>
            <div className="h-7 flex-1 overflow-hidden rounded-md border-2 border-line bg-surface">
              <div className="flex h-full items-center justify-end bg-accent pr-2 text-sm font-bold text-[var(--accent-text)]" style={{ width: `${Math.max((f.valor / max) * 100, 12)}%` }}>{f.valor}</div>
            </div>
          </div>
        ))}
      </div>
      <table className="mt-4 w-full border-collapse text-left">
        <caption className="sr-only">{titulo}</caption>
        <thead><tr className="border-b-2 border-line"><th scope="col" className="py-1 pr-3">{columna}</th><th scope="col" className="py-1 text-right">Cantidad</th></tr></thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.etiqueta} className="border-b border-[var(--border-soft)]"><th scope="row" className="py-1 pr-3 font-normal">{f.etiqueta}</th><td className="py-1 text-right font-bold">{f.valor}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
