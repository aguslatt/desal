"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl font-bold sm:text-5xl">Algo salió mal</h1>
      <p className="mt-4 text-xl text-muted">No es culpa tuya. Probá de nuevo; si sigue pasando, volvé en un rato.</p>
      <p className="mt-8"><button type="button" className="btn" onClick={reset}>Probar de nuevo</button></p>
    </div>
  );
}
