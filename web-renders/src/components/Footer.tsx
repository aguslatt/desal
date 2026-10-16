import { displayName, nav, site } from "@/content/site";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="foot-in">
        <div>
          <p className="display" style={{ margin: 0, fontSize: "1.6rem", fontWeight: 300 }}>{displayName}</p>
          <small>
            {site.role}{site.location ? ` · ${site.location}` : ""}
            {site.provisional && <><br />Versión provisional: nombres de proyectos, textos y datos de contacto pendientes de confirmar.</>}
          </small>
        </div>
        <nav aria-label="Pie">
          {nav.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
          <a href="#sobre-mi">Sobre mí</a>
        </nav>
        <small>© {new Date().getFullYear()} {displayName}</small>
      </div>
    </footer>
  );
}
