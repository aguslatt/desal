"use client";

import { Accordion } from "radix-ui";
import { Icon } from "@/components/ui/Icon";

const PREGUNTAS = [
  ["¿Por qué a veces dice “Sin información”?", "Porque preferimos decir que no sabemos antes que dar algo por hecho. Un dato sin relevar nunca se muestra como “sí”. Si fuiste a ese café, podés ayudarnos contando cómo te fue."],
  ["¿Quién carga los datos y cómo sé si son actuales?", "Cada dato dice quién lo aportó (el relevamiento del equipo, el café o visitantes) y cuándo. Si varias personas reportan algo distinto de lo publicado en los últimos 60 días, lo avisamos arriba de la ficha."],
  ["¿Tiene costo?", "La información de accesibilidad es siempre gratuita, para las personas y para los cafés. El plan Pro agrega herramientas de gestión, pero ningún dato de accesibilidad queda detrás de un plan pago."],
  ["¿Qué pasa con mis necesidades? ¿Tengo que decir mi diagnóstico?", "No. Elegís condiciones concretas, como “ingreso sin escalones” o “música baja”, y se guardan solo en tu dispositivo. Nadie ve lo que marcaste."],
  ["¿Un café patrocinado aparece primero?", "No. Un café o plan patrocinado solo aparece si cumple todo lo que elegiste, lleva la etiqueta “Patrocinado” y se ordena igual que el resto."],
  ["¿Y si encuentro un dato incorrecto?", "Tocá “Reportar un dato incorrecto” en la ficha. Tu aviso suma a los de otras personas y ayuda a mantener la información al día."],
];

export function Preguntas() {
  return (
    <Accordion.Root type="single" collapsible className="flex flex-col gap-3">
      {PREGUNTAS.map(([q, a]) => (
        <Accordion.Item key={q} value={q} className="card overflow-hidden">
          <Accordion.Header asChild>
            <h3>
              <Accordion.Trigger className="tap group flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left text-lg font-bold">
                <span className="min-w-0">{q}</span>
                <span className="shrink-0 transition-transform group-data-[state=open]:rotate-180"><Icon name="chevron" size={1.3} /></span>
              </Accordion.Trigger>
            </h3>
          </Accordion.Header>
          <Accordion.Content className="border-t border-soft px-5 py-4 text-muted">{a}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
