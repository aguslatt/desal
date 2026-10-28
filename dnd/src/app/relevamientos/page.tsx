import { FormularioInteres } from "@/components/comercios/FormularioInteres";

export const metadata = { title: "Relevamientos profesionales" };

const pasos = [
  ["Visita al local", "Un equipo que incluye personas con discapacidad recorre el espacio, de la vereda al baño, y mide lo que importa: escalones, anchos, alturas, ruido, luz."],
  ["Informe con fotos", "Recibís un informe con cada condición, su estado (Confirmado o No disponible), fotos y la fecha del relevamiento."],
  ["Publicación en Umbral", "Los datos se publican en tu ficha con la fuente “Relevamiento del equipo”. Sin editarlos para que queden mejor."],
  ["Recomendaciones", "Una lista de mejoras posibles, ordenadas por impacto y costo, para que decidas qué hacer."],
];

export default function Relevamientos() {
  return (
    <div className="flex flex-col gap-14">
      <header className="max-w-3xl">
        <h1 className="text-4xl leading-tight font-bold sm:text-5xl">Relevamientos profesionales</h1>
        <p className="mt-4 text-xl text-muted">
          Un relevamiento hecho con personas con discapacidad, para que lo que se publica de tu local sea concreto, verificado y fechado.
        </p>
        <p className="mt-6 max-w-prose rounded-[var(--radius)] border-2 border-accent p-5 text-xl font-bold">
          Se cobra el trabajo, no un resultado favorable.
        </p>
        <p className="mt-3 max-w-prose text-muted">
          Si el relevamiento encuentra barreras, las publicamos tal cual. Por eso la información de Umbral es confiable para quien la usa.
        </p>
      </header>

      <section aria-labelledby="como">
        <h2 id="como" className="text-2xl font-bold">Cómo funciona</h2>
        <ol className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {pasos.map(([t, d], i) => (
            <li key={t} className="card min-w-0 p-5">
              <p className="font-bold text-muted">Paso {i + 1}</p>
              <h3 className="text-xl font-bold">{t}</h3>
              <p className="mt-2">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="precio" className="max-w-3xl">
        <h2 id="precio" className="text-2xl font-bold">Cuánto cuesta</h2>
        <p className="mt-3 max-w-prose">El presupuesto depende del tamaño del local y de sus espacios. Dejanos tus datos y te escribimos con una propuesta.</p>
        <p className="mt-6"><FormularioInteres interes="relevamiento" /></p>
      </section>
    </div>
  );
}
