import { intro } from "@/content/site";
import Rv from "./Rv";

export default function Intro() {
  const [a, ...rest] = intro.statement.split(". ");
  return (
    <section className="panel panel-light intro" aria-label="Presentación">
      <div className="wrap grid12">
        <Rv className="intro-k"><p className="label acc kicker">{intro.kicker}</p></Rv>
        <Rv className="intro-t display" delay={0.08}>
          <p style={{ margin: 0 }}>{a}. <span>{rest.join(". ")}</span></p>
        </Rv>
        <Rv as="ul" className="intro-pts" delay={0.16}>
          {intro.points.map((p, i) => (
            <li key={p} data-k={i}><span>{p}</span></li>
          ))}
        </Rv>
      </div>
    </section>
  );
}
