import Image from "next/image";
import { heroContent, site } from "@/content/site";
import HeroStage from "./HeroStage";

export default function Hero() {
  const h = heroContent;
  return (
    <section id="inicio" className="hero panel" aria-labelledby="hero-title">
      <HeroStage>
        <div className="hero-wm hero-wm-back" aria-hidden="true">{site.wordmark}</div>
        <div className="hero-lines" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => <i key={i} />)}
        </div>
        <div className="hero-caps">
          {h.capsules.map((c, i) => (
            <a key={i} href="#proyectos" className="hcap" data-n={`0${i + 1}`} tabIndex={i === 0 ? 0 : -1} aria-label={i === 0 ? "Ver proyectos" : undefined} aria-hidden={i === 0 ? undefined : true}>
              <Image
                src={c.src}
                alt={i === 0 ? c.alt : ""}
                fill
                sizes="(min-width: 900px) 17vw, 34vw"
                quality={75}
                placeholder="blur"
                fetchPriority={i < 3 ? "high" : "auto"}
                loading={i < 3 ? "eager" : "lazy"}
                style={{ objectPosition: c.focus }}
              />
            </a>
          ))}
        </div>
      </HeroStage>

      <div className="hero-bottom">
        <h1 id="hero-title" className="display hero-title">
          {h.title.map((l) => (
            <span className="ln" key={l}><span>{l}</span></span>
          ))}
        </h1>
        <div className="hero-card glass">
          <p className="hero-lead">{h.lead}</p>
          <div className="hero-cta">
            <a href="#proyectos" className="btn btn-dark">Ver proyectos <span className="arr" aria-hidden="true">→</span></a>
            <a href="#contacto" className="btn btn-line">Cotizar mi proyecto</a>
          </div>
        </div>
      </div>
    </section>
  );
}
