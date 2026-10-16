import Image from "next/image";
import { services } from "@/content/site";
import Rv from "./Rv";
import Sample from "./Sample";

export default function Services() {
  return (
    <section id="servicios" className="sec sec-bone on-light" aria-labelledby="servicios-t">
      <div className="wrap">
        <div className="sec-head">
          <Rv>
            <p className="label acc sec-kicker">Servicios</p>
            <h2 id="servicios-t" className="display sec-title" style={{ maxWidth: "14ch" }}>{services.title}</h2>
          </Rv>
        </div>

        <div>
          {services.items.map((s, i) => (
            <article key={s.n} className="srow">
              <Rv className="n"><span className="num">{s.n}</span></Rv>
              <Rv className="tx" delay={0.05}>
                <h3 className="display">{s.title}</h3>
                <p>{s.text}</p>
              </Rv>
              <Rv kind="img" className="media" delay={0.1}>
                <Image src={s.image} alt={s.alt} fill sizes="(min-width: 900px) 40vw, 100vw" quality={75} placeholder="blur" loading="lazy" />
                <Sample />
              </Rv>
            </article>
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
