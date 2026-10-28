export const metadata = { title: "Accesibilidad de Umbral" };

const decisiones = [
  ["Meta", "Cumplir WCAG 2.2 nivel AA, y llegar a AAA donde se pueda: contraste de 7:1 en el texto y elementos tocables de al menos 44 × 44 px."],
  ["Nada de etiquetas generales", "Nunca decimos “100 % accesible” ni “apto para…”. Mostramos condiciones concretas que se pueden observar, como “Ingreso sin escalones”."],
  ["Tres estados, siempre con texto", "Confirmado, No disponible y Sin información. Cada uno tiene texto, ícono, color y forma de borde distintos, y los colores se distinguen con daltonismo. Si no sabemos algo, no lo damos por hecho."],
  ["Fuente y fecha", "Cada dato dice quién lo aportó (relevamiento del equipo, el comercio o visitantes) y cuándo. Si hay reportes recientes que lo contradicen, lo avisamos."],
  ["Teclado y lectores de pantalla", "Todo se puede usar con teclado, con foco siempre visible. Los resultados y los errores se anuncian. El mapa tiene un listado equivalente."],
  ["Modos de visualización", "Texto hasta 200 %, alto contraste, modo oscuro, reducir movimiento y lectura fácil con pictogramas. Respetamos las preferencias del sistema."],
  ["Privacidad", "No pedimos diagnósticos. Tus necesidades se guardan solo en tu dispositivo, y la medición es anónima."],
];

export default function Accesibilidad() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl leading-tight font-bold sm:text-5xl">Accesibilidad de Umbral</h1>
      <p className="mt-4 text-xl text-muted">La app tiene que ser accesible antes que linda. Estas son las decisiones que tomamos.</p>
      <dl className="mt-10 flex flex-col gap-6">
        {decisiones.map(([t, d]) => (
          <div key={t}><dt className="text-xl font-bold">{t}</dt><dd className="mt-1">{d}</dd></div>
        ))}
      </dl>
      <h2 className="mt-12 text-2xl font-bold">Lo que todavía no está resuelto</h2>
      <ul className="mt-4 flex list-disc flex-col gap-2 pl-6">
        <li>Probamos con herramientas automáticas y con teclado. Falta la prueba con personas usuarias de lectores de pantalla.</li>
        <li>El mapa usa teselas de OpenStreetMap, que no controlamos. Por eso el listado tiene la misma información.</li>
        <li>Las fotos son de ejemplo en esta demostración.</li>
      </ul>
      <h2 className="mt-12 text-2xl font-bold">¿Encontraste una barrera?</h2>
      <p className="mt-3">Contanos desde “Reportar un dato incorrecto” en cualquier ficha, o escribinos para que la arreglemos.</p>
    </div>
  );
}
