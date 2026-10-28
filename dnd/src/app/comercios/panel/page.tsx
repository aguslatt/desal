import Link from "next/link";
import { Barras } from "@/components/comercios/Barras";
import { condicion } from "@/lib/catalogo";
import panel from "@/data/panel-demo.json";

export const metadata = { title: "Panel Pro de ejemplo" };

export default function Panel() {
  const visitas = panel.visitas.reduce((a, b) => a + b.valor, 0);
  const contactos = panel.contactos.reduce((a, b) => a + b.valor, 0);
  return (
    <div className="flex flex-col gap-10">
      <header className="max-w-3xl">
        <p className="inline-block rounded-full border-2 border-[var(--warn)] bg-[var(--warn-bg)] px-3 py-0.5 font-bold text-[var(--warn)]">Datos de ejemplo</p>
        <h1 className="mt-3 text-4xl leading-tight font-bold sm:text-5xl">Panel Pro</h1>
        <p className="mt-3 text-xl text-muted">{panel.local} · {panel.periodo}. Así se vería el panel del plan Pro. Los números son inventados.</p>
        <p className="mt-3"><Link href="/comercios" className="font-bold">Volver a “Para comercios”</Link></p>
      </header>

      <section aria-labelledby="resumen">
        <h2 id="resumen" className="text-2xl font-bold">Resumen</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          <li className="card p-5"><p className="text-4xl font-bold">{visitas}</p><p className="text-muted">Visitas a la ficha</p></li>
          <li className="card p-5"><p className="text-4xl font-bold">{contactos}</p><p className="text-muted">Contactos recibidos</p></li>
        </ul>
      </section>

      <section aria-labelledby="det" className="grid gap-5 lg:grid-cols-2">
        <h2 id="det" className="sr-only">Detalle</h2>
        <Barras titulo="Visitas a la ficha por semana" columna="Semana" filas={panel.visitas} />
        <Barras titulo="Contactos recibidos" columna="Tipo de contacto" filas={panel.contactos} />
        <div className="lg:col-span-2">
          <Barras titulo="Condiciones más buscadas en tu zona" columna="Condición" filas={panel.buscadas.map((b) => ({ etiqueta: condicion(b.id).etiqueta, valor: b.valor }))} />
        </div>
      </section>
      <p className="max-w-prose text-muted">Las estadísticas son agregadas: nunca mostramos datos de personas.</p>
    </div>
  );
}
