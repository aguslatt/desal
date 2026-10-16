import { displayName, nav, site } from "@/content/site";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <div>
          <p className="display" style={{ margin: 0, fontSize: "1.5rem" }}>{displayName}</p>
          <small>
            {site.role}{site.location ? ` · ${site.location}` : ""}
            {site.provisional && <><br />Versión provisional: imágenes y textos de muestra, pendientes de reemplazo.</>}
          </small>
        </div>
        <nav aria-label="Pie">
          {nav.map((n) => <a key={n.href} href={n.href} className="link-u">{n.label}</a>)}
          <a href="#sobre-mi" className="link-u">Sobre mí</a>
        </nav>
        <small>© {new Date().getFullYear()} {displayName}</small>
      </div>
    </footer>
  );
}
