import Image from "next/image";
import { services } from "@/content/site";
import Rv from "./Rv";
import Sample from "./Sample";

export default function Services() {
  return (
    <section id="servicios" className="panel panel-light services" aria-labelledby="servicios-t">
      <div className="wrap">
        <Rv><h2 id="servicios-t" className="display svc-title">Servicios</h2></Rv>
        <div className="svc-cards">
          {services.items.map((s, i) => (
            <Rv as="article" key={s.n} className="svc" delay={i * 0.1}>
              <div className="media">
                <Image src={s.image} alt={s.alt} fill sizes="(min-width: 900px) 30vw, 100vw" quality={75} placeholder="blur" loading="lazy" />
                <Sample show={s.sample} />
              </div>
              <div className="svc-tx">
                <span className="n num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </Rv>
          ))}
        </div>
        <div className="value" aria-label="Qué ganás al trabajar así">
          {services.value.map((v, i) => (
            <Rv key={v.title} delay={i * 0.08}>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </Rv>
          ))}
        </div>
      </div>
    </section>
  );
}
