import Link from "next/link";

export default function NoEncontrada() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl font-bold sm:text-5xl">No encontramos esta página</h1>
      <p className="mt-4 text-xl text-muted">Puede que el enlace esté mal escrito o que el lugar ya no esté.</p>
      <p className="mt-8 flex flex-wrap gap-3">
        <Link href="/lugares" className="btn">Ver los lugares</Link>
        <Link href="/" className="btn btn-ghost">Ir al inicio</Link>
      </p>
    </div>
  );
}
