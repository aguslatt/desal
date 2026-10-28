"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { RUBROS } from "@/lib/catalogo";
import { textoCoincidencia, type Resultado } from "@/lib/match";

const GLIFO = ["✓", "?", "✕"]; // cumple todo, con sin información, con "no disponible": forma y símbolo, no solo color
const FORMA = ["50%", "6px", "2px"];

function pin(grupo: 0 | 1 | 2, hayNecesidades: boolean) {
  const g = hayNecesidades ? GLIFO[grupo] : "•";
  const radio = hayNecesidades ? FORMA[grupo] : "50%";
  const clase = !hayNecesidades || grupo === 0 ? "pin-ok" : grupo === 1 ? "pin-unk" : "pin-no";
  return L.divIcon({
    className: "umbral-pin-wrap",
    html: `<span class="umbral-pin ${clase}" style="border-radius:${radio}" aria-hidden="true">${g}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

export default function Mapa({ items, hayNecesidades }: { items: Resultado[]; hayNecesidades: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || mapa.current) return;
    mapa.current = L.map(el.current, { zoomControl: false, keyboard: true, attributionControl: true }).setView([-34.6, -58.43], 12);
    L.control.zoom({ zoomInTitle: "Acercar el mapa", zoomOutTitle: "Alejar el mapa" }).addTo(mapa.current);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">Colaboradores de OpenStreetMap</a>',
    }).addTo(mapa.current);
    capa.current = L.layerGroup().addTo(mapa.current);

    // Teclado: al abrir un resumen, el foco pasa a "Ver ficha"; Escape lo cierra y vuelve al marcador.
    const m = mapa.current;
    let origen: HTMLElement | null = null;
    m.on("popupopen", (e) => {
      const marcador = (e.popup as unknown as { _source?: L.Marker })._source?.getElement() ?? null;
      const cerrar = e.popup.getElement()?.querySelector<HTMLElement>(".leaflet-popup-close-button");
      cerrar?.setAttribute("aria-label", "Cerrar resumen");
      cerrar?.setAttribute("title", "Cerrar resumen");
      if (marcador && document.activeElement === marcador) {
        origen = marcador;
        setTimeout(() => e.popup.getElement()?.querySelector<HTMLElement>('a[href^="/lugares"]')?.focus(), 0);
      }
    });
    const contenedor = el.current;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape" || !m.getPane("popupPane")?.querySelector(".leaflet-popup")) return;
      m.closePopup();
      origen?.focus();
      ev.stopPropagation();
    };
    contenedor.addEventListener("keydown", onKey);
    return () => {
      contenedor.removeEventListener("keydown", onKey);
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

  useEffect(() => {
    const m = mapa.current;
    const g = capa.current;
    if (!m || !g) return;
    g.clearLayers();
    for (const { lugar, coincidencia } of items) {
      const resumen = hayNecesidades ? textoCoincidencia(coincidencia) : RUBROS[lugar.rubro];
      const marker = L.marker([lugar.lat, lugar.lng], {
        icon: pin(coincidencia.grupo, hayNecesidades),
        keyboard: true,
        title: lugar.nombre,
        alt: lugar.nombre,
      }).addTo(g);
      const cont = document.createElement("div");
      const h = document.createElement("strong");
      h.textContent = lugar.nombre;
      const p = document.createElement("p");
      p.style.margin = "4px 0";
      p.textContent = `${RUBROS[lugar.rubro]} · ${lugar.barrio}${lugar.patrocinado ? " · Patrocinado" : ""}`;
      const q = document.createElement("p");
      q.style.margin = "4px 0";
      q.textContent = resumen;
      const a = document.createElement("a");
      a.href = `/lugares/${lugar.id}`;
      a.textContent = "Ver ficha";
      a.style.fontWeight = "700";
      cont.append(h, p, q, a);
      marker.bindPopup(cont);
      marker.on("add", () => {
        const e = marker.getElement();
        e?.setAttribute("aria-label", `${lugar.nombre}. ${resumen}. Enter para ver el resumen.`);
      });
      if (marker.getElement()) marker.getElement()!.setAttribute("aria-label", `${lugar.nombre}. ${resumen}. Enter para ver el resumen.`);
    }
    if (items.length > 0) {
      m.fitBounds(L.latLngBounds(items.map((i) => [i.lugar.lat, i.lugar.lng] as [number, number])), { padding: [40, 40], maxZoom: 15 });
    }
  }, [items, hayNecesidades]);

  return <div ref={el} className="h-[28rem] w-full rounded-xl border-2 border-line sm:h-[36rem]" role="region" aria-label="Mapa de lugares. Cada marcador se puede enfocar con Tab." />;
}
