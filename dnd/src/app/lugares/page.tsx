import { Suspense } from "react";
import { Buscador } from "@/components/lugares/Buscador";

export const metadata = { title: "Lugares" };

export default function Pagina() {
  return (
    <Suspense fallback={<h1 className="text-4xl font-bold">Lugares</h1>}>
      <Buscador />
    </Suspense>
  );
}
