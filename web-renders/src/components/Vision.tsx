"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { site } from "@/content/site";
import Rv from "./Rv";

const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false });

function canWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Panel con objeto 3D en tiempo real y texto que pasa por detrás (como en las referencias). */
export default function Vision() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (canWebGL()) setOk(true);
  }, []);

  return (
    <section className="panel vision" aria-labelledby="vision-t">
      <p className="mono vision-l">Visualización arquitectónica</p>
      <p className="mono vision-r">{site.brand || site.name}</p>
      <Rv className="vision-txt">
        <h2 id="vision-t" className="display">Del plano<br />a la imagen.</h2>
      </Rv>
      <div className="vision-stage">
        {ok ? <Scene3D /> : <div className="scene3d-fallback" />}
      </div>
      <p className="vision-note">Materiales, luz y escala, resueltos antes de construir.</p>
    </section>
  );
}
