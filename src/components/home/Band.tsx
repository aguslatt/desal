"use client";

import { markImg } from "@/content/pieces";
import { Marquee } from "../ui/Extras";

/** Cinta de marca entre secciones: reacciona a la velocidad del scroll. */
export function Band() {
  const m = markImg();
  const word = (t: string, i: number) => <span key={i} className="serif text-[11vw] md:text-[6.5vw]" style={{ lineHeight: 1 }}>{t}</span>;
  const mark = (i: number) => <img key={`m${i}`} src={m.src} alt="" width={m.w} height={m.h} className="h-[10vw] w-auto md:h-[5.6vw]" style={{ animation: "spin-slow 14s linear infinite" }} />;
  return (
    <div data-tone="light" className="sheet theme-red themed overflow-hidden py-7 md:py-10" aria-hidden>
      <Marquee items={[word("DE SAL studio", 0), mark(0), word("HECHO A MANO", 1), mark(1)]} speed={70} />
      <style>{`@keyframes spin-slow{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
