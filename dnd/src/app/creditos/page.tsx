import { fotosCreditos } from "@/lib/fotos";
import { RUBROS } from "@/lib/catalogo";

export const metadata = { title: "Créditos de las fotos" };

export default function Creditos() {
  const porRubro = Object.entries(RUBROS).map(([k, nombre]) => ({ nombre, fotos: fotosCreditos.filter((f) => f.rubro === k) }));
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl leading-tight font-bold sm:text-5xl">Créditos de las fotos</h1>
      <p className="mt-4 max-w-prose text-xl text-muted">
        Las fotos de los lugares son <strong className="text-ink">ilustrativas</strong>: muestran espacios parecidos, no los locales de la demostración, que son ficticios. Vienen de Wikimedia Commons con licencias libres. Las redimensionamos y las convertimos a WebP; conservan la licencia original.
      </p>
      {porRubro.map((g) => (
        <section key={g.nombre} className="mt-10" aria-labelledby={`c-${g.nombre}`}>
          <h2 id={`c-${g.nombre}`} className="text-2xl font-bold">{g.nombre}</h2>
          <ul className="mt-4 flex flex-col divide-y divide-[var(--border-soft)]">
            {g.fotos.map((f) => (
              <li key={f.id} className="py-3">
                <p className="font-bold">{f.alt}</p>
                <p className="text-sm text-muted">
                  Autor: {f.autor || "sin datos"} · Licencia: {f.licencia} · <a href={f.pagina}>Ver original en Wikimedia Commons<span className="sr-only">: {f.titulo}</span></a>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="mt-10 text-muted">Las ilustraciones del recorrido visual y los íconos de Umbral son propios. Los pictogramas son de ARASAAC (ver el pie de página).</p>
    </div>
  );
}
