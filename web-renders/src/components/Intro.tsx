import { intro } from "@/content/site";
import Rv from "./Rv";

export default function Intro() {
  return (
    <section className="sec sec-bone on-light" aria-label="Presentación">
      <div className="wrap grid12 intro-grid">
        <Rv className="intro-k"><p className="label acc sec-kicker">{intro.kicker}</p></Rv>
        <Rv className="intro-t display" delay={0.08}><p style={{ margin: 0 }}>{intro.statement}</p></Rv>
        <Rv as="ul" className="intro-pts" delay={0.16}>
          {intro.points.map((p, i) => (
            <li key={p}><span className="label num">0{i + 1}</span><span className="display" style={{ fontSize: "1.35rem" }}>{p}</span></li>
          ))}
        </Rv>
      </div>
    </section>
  );
}
