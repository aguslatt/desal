import { process } from "@/content/site";
import Rv from "./Rv";

export default function Process() {
  return (
    <section id="proceso" className="panel panel-light" style={{ background: "var(--bone-2)" }} aria-labelledby="proceso-t">
      <div className="wrap">
        <div className="sec-head">
          <Rv>
            <p className="label acc kicker">Proceso</p>
            <h2 id="proceso-t" className="display sec-title">{process.title}</h2>
          </Rv>
        </div>
        <ol className="steps">
          {process.steps.map((s, i) => (
            <Rv as="li" key={s.n} className="step" delay={i * 0.09}>
              <span className="n" aria-hidden="true">{s.n}</span>
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
