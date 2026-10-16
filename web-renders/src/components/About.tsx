import Image from "next/image";
import { about } from "@/content/site";
import Rv from "./Rv";
import Sample from "./Sample";

export default function About() {
  return (
    <section id="sobre-mi" className="sec sec-ink" aria-labelledby="sobre-t">
      <div className="wrap grid12 about-grid">
        <Rv kind="img" className="about-media">
          <div className="media">
            <Image src={about.image} alt={about.alt} fill sizes="(min-width: 900px) 40vw, 100vw" quality={75} placeholder="blur" loading="lazy" />
            <Sample />
          </div>
        </Rv>
        <div className="about-tx">
          <Rv><p className="label acc sec-kicker">{about.kicker}</p></Rv>
          <Rv delay={0.06}><h2 id="sobre-t" className="display">{about.title}</h2></Rv>
          {about.paragraphs.map((t, i) => (
            <Rv key={i} delay={0.12 + i * 0.06}><p>{t}</p></Rv>
          ))}
        </div>
      </div>
    </section>
  );
}
