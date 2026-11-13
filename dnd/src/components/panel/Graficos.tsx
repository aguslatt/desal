import { DIAS_SEMANA, FRANJAS } from "@/lib/analitica";
import { formatearFecha } from "@/lib/fecha";

const corta = (iso: string) => formatearFecha(iso).slice(0, 5);

interface Serie { nombre: string; valores: number[]; discontinua?: boolean }

/** Gráfico de líneas en SVG. Es decorativo (aria-hidden): la misma información está en la tabla de al lado. */
export function GraficoLineas({ fechas, series }: { fechas: string[]; series: Serie[] }) {
  const W = 720, H = 240, M = { t: 16, r: 16, b: 32, l: 40 };
  const max = Math.max(4, ...series.flatMap((s) => s.valores));
  const tope = Math.ceil(max / 4) * 4;
  const x = (i: number) => M.l + (fechas.length <= 1 ? 0 : (i / (fechas.length - 1)) * (W - M.l - M.r));
  const y = (v: number) => M.t + (1 - v / tope) * (H - M.t - M.b);
  const marcas = [0, Math.floor((fechas.length - 1) / 2), fechas.length - 1];
  return (
    <svg aria-hidden="true" focusable="false" viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      {[0, 1, 2, 3, 4].map((i) => {
        const v = (tope / 4) * i;
        return (
          <g key={i}>
            <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke="var(--border-soft)" strokeWidth="1.5" />
            <text x={M.l - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill="var(--text-muted)">{v}</text>
          </g>
        );
      })}
      {marcas.map((i) => <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === fechas.length - 1 ? "end" : "middle"} fontSize="12" fill="var(--text-muted)">{corta(fechas[i])}</text>)}
      {series.map((s, k) => (
        <g key={s.nombre}>
          <polyline fill="none" stroke={k === 0 ? "var(--accent)" : "var(--mint)"} strokeWidth="3" strokeDasharray={s.discontinua ? "7 5" : undefined} strokeLinejoin="round" strokeLinecap="round" points={s.valores.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
          {s.valores.length <= 31 && s.valores.map((v, i) => (k === 0
            ? <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="var(--accent)" />
            : <rect key={i} x={x(i) - 3.5} y={y(v) - 3.5} width="7" height="7" fill="var(--mint)" />))}
        </g>
      ))}
    </svg>
  );
}

export function Leyenda({ series }: { series: Serie[] }) {
  return (
    <ul aria-hidden="true" className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold">
      {series.map((s, k) => (
        <li key={s.nombre} className="flex items-center gap-2">
          <svg width="34" height="10" viewBox="0 0 34 10" focusable="false"><line x1="2" x2="32" y1="5" y2="5" stroke={k === 0 ? "var(--accent)" : "var(--mint)"} strokeWidth="3" strokeDasharray={s.discontinua ? "7 5" : undefined} strokeLinecap="round" /></svg>
          {s.nombre}
        </li>
      ))}
    </ul>
  );
}

/** Mapa de calor como tabla: cada celda lleva el número, no solo el color. */
export function MapaCalor({ calor, max }: { calor: number[][]; max: number }) {
  const nivel = (n: number) => (n === 0 || max === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)));
  const estilos = [
    "bg-surface-2 text-ink",
    "bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-ink",
    "bg-[color-mix(in_srgb,var(--accent)_25%,var(--surface))] text-ink",
    "bg-[color-mix(in_srgb,var(--accent)_35%,var(--surface))] text-ink",
    "bg-accent text-[var(--accent-text)]",
  ];
  const usadas = FRANJAS.map((_, i) => calor.some((f) => f[i] > 0) || i > 0); // oculta "Madrugada" si está vacía
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[30rem] border-separate border-spacing-1.5 text-center">
        <caption className="sr-only">Visitas a tu ficha por día de la semana y franja horaria</caption>
        <thead>
          <tr><td /> {FRANJAS.map((f, i) => usadas[i] && <th key={f} scope="col" className="px-1 pb-1 text-sm font-bold">{f}</th>)}</tr>
        </thead>
        <tbody>
          {DIAS_SEMANA.map((d, i) => (
            <tr key={d}>
              <th scope="row" className="pr-2 text-left text-sm font-bold">{d}</th>
              {calor[i].map((n, j) => usadas[j] && <td key={j} className={`rounded-lg py-2 font-bold ${estilos[nivel(n)]}`} title={`${d}, ${FRANJAS[j]}: ${n}`}>{n}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
