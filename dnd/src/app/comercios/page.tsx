import Link from "next/link";
import { FormularioInteres } from "@/components/comercios/FormularioInteres";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Para comercios" };

const gratis = [
  "Ficha del local con toda su información de accesibilidad",
  "Condiciones con fuente y fecha, también las que cargues vos",
  "Aparecer en el listado y en el mapa cuando cumplís lo que alguien busca",
  "Recibir reportes de las personas que te visitaron",
];
const pro = [
  "Gestión de consultas y reservas por texto",
  "Publicación de actividades y promociones",
  "Estadísticas agregadas: visitas a tu ficha y contactos recibidos",
  "Las condiciones más buscadas por las personas de tu zona",
];

function Lista({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {items.map((i) => (
        <li key={i} className="flex gap-2"><span className="mt-1 text-ok"><Icon name="confirmado" size={1.2} /></span><span>{i}</span></li>
      ))}
    </ul>
  );
}

export default function Comercios() {
  return (
    <div className="flex flex-col gap-14">
      <header className="max-w-3xl">
        <h1 className="text-4xl leading-tight font-bold sm:text-5xl">Para comercios</h1>
        <p className="mt-4 text-xl text-muted">
          Que más personas sepan que pueden ir a tu local. Mostrá lo que ya hacés bien y marcá lo que todavía falta.
        </p>
      </header>

      <section aria-labelledby="planes">
        <h2 id="planes" className="text-2xl font-bold">Dos planes</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          <article className="card p-6">
            <h3 className="text-2xl font-bold">Gratuito</h3>
            <p className="mt-1 text-muted">Para todos los comercios, siempre.</p>
            <Lista items={gratis} />
            <p className="mt-5 font-bold">La información de accesibilidad es siempre gratuita. Ningún dato queda detrás de un plan pago.</p>
          </article>
          <article className="card border-2 !border-accent p-6">
            <h3 className="text-2xl font-bold">Pro</h3>
            <p className="mt-1 text-muted">Para comercios que quieren gestionar su relación con la comunidad.</p>
            <Lista items={pro} />
            <div className="mt-6 flex flex-wrap gap-3">
              <FormularioInteres interes="pro" />
              <Link href="/comercios/panel" className="btn btn-ghost">Ver el panel de ejemplo</Link>
            </div>
          </article>
        </div>
      </section>

      <section aria-labelledby="orden" className="max-w-3xl">
        <h2 id="orden" className="text-2xl font-bold">Reglas que no cambian</h2>
        <ul className="mt-4 flex list-disc flex-col gap-2 pl-6">
          <li>Un lugar patrocinado solo aparece si cumple todas las condiciones que la persona eligió, y lleva la etiqueta “Patrocinado”.</li>
          <li>Pagar no cambia lo que decimos sobre tu local. Cada dato dice quién lo aportó y cuándo.</li>
          <li>Si varias personas reportan algo distinto de lo publicado, lo mostramos.</li>
        </ul>
        <p className="mt-6">
          ¿Querés saber qué le falta a tu local? Mirá los <Link href="/relevamientos">relevamientos profesionales</Link>.
        </p>
      </section>
    </div>
  );
}
