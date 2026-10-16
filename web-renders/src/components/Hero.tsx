import { getImageProps } from "next/image";
import { heroContent } from "@/content/site";
import Sample from "./Sample";

export default function Hero() {
  const h = heroContent;
  // Dirección de arte: en pantallas angostas se sirve una composición vertical dedicada
  // (solo se descarga la que corresponde).
  const common = { alt: h.alt, fill: true, quality: 75, placeholder: "blur" as const, fetchPriority: "high" as const };
  const { props: desktop } = getImageProps({ ...common, src: h.image, sizes: "100vw" });
  const { props: mobile } = getImageProps({ ...common, src: h.imageMobile, sizes: "100vw" });
  const { alt, ...imgProps } = desktop;
  return (
    <section id="inicio" className="hero" aria-labelledby="hero-title">
      <div className="hero-media">
        <picture>
          <source media="(max-width: 767px)" srcSet={mobile.srcSet} sizes="100vw" />
          <img {...imgProps} alt={alt} style={{ ...imgProps.style, objectPosition: h.focus }} />
        </picture>
      </div>
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-frame" aria-hidden="true" />
      <div className="wrap hero-body">
        <h1 id="hero-title" className="display hero-title">
          {h.title.map((l) => (
            <span className="ln" key={l}><span>{l}</span></span>
          ))}
        </h1>
        <div className="hero-row">
          <p className="hero-lead">{h.lead}</p>
          <div className="hero-cta">
            <a href="#proyectos" className="btn btn-solid">Ver proyectos <span className="arr" aria-hidden="true">→</span></a>
            <a href="#contacto" className="btn btn-ghost">Cotizar mi proyecto</a>
          </div>
          <div className="hero-meta">
            <Sample />
            <p className="label" style={{ margin: "10px 0 0" }}>{h.caption.project}</p>
            <p className="label mute-d" style={{ margin: "4px 0 0", color: "rgba(237,230,218,.7)" }}>{h.caption.type}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
