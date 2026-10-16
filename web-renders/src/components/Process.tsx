import { process } from "@/content/site";
import Rv from "./Rv";

export default function Process() {
  return (
    <section id="proceso" className="sec sec-bone2 on-light" aria-labelledby="proceso-t">
      <div className="wrap">
        <div className="sec-head">
          <Rv>
            <p className="label acc sec-kicker">Proceso</p>
            <h2 id="proceso-t" className="display sec-title">{process.title}</h2>
          </Rv>
        </div>
        <ol className="steps">
          {process.steps.map((s, i) => (
            <Rv as="li" key={s.n} className="step" delay={i * 0.09}>
              <span className="n num" aria-hidden="true">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Rv>
          ))}
        </ol>
        <Rv><p className="proc-note">{process.note}</p></Rv>
      </div>
    </section>
  );
}
