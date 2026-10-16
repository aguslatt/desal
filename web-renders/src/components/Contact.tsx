import { contactContent, emailConfigured, instagramConfigured, site, whatsappConfigured, whatsappTemplate, whatsappUrl } from "@/content/site";
import ContactForm from "./ContactForm";
import Rv from "./Rv";

export default function Contact() {
  const c = site.contact;
  const anyMissing = !whatsappConfigured || !emailConfigured || !instagramConfigured;
  return (
    <section id="contacto" className="panel panel-dark contact" aria-labelledby="contacto-t">
      <div className="wrap grid12 contact-grid">
        <div className="c-left">
          <Rv><p className="label acc kicker">{contactContent.kicker}</p></Rv>
          <Rv delay={0.06}><h2 id="contacto-t" className="display">Contame <em>tu proyecto.</em></h2></Rv>
          <Rv delay={0.12}><p>{contactContent.text}</p></Rv>
          <Rv delay={0.18}>
            <ul className="c-links">
              <li>
                {whatsappConfigured ? (
                  <a className="glass-d" href={whatsappUrl(whatsappTemplate.build())} target="_blank" rel="noopener noreferrer"><span className="label">WhatsApp</span><span>Escribir ahora ↗</span></a>
                ) : (<span className="pending glass-d"><span className="label">WhatsApp</span><span>Pendiente de cargar</span></span>)}
              </li>
              <li>
                {emailConfigured ? (
                  <a className="glass-d" href={`mailto:${c.email}`}><span className="label">Correo</span><span>{c.email}</span></a>
                ) : (<span className="pending glass-d"><span className="label">Correo</span><span>Pendiente de cargar</span></span>)}
              </li>
              <li>
                {instagramConfigured ? (
                  <a className="glass-d" href={`https://instagram.com/${c.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer"><span className="label">Instagram</span><span>@{c.instagram.replace(/^@/, "")}</span></a>
                ) : (<span className="pending glass-d"><span className="label">Instagram</span><span>Pendiente de cargar</span></span>)}
              </li>
            </ul>
            {site.provisional && anyMissing && (
              <p className="mute-d" style={{ fontSize: ".8rem", marginTop: 14 }}>Datos de contacto provisorios · se completan en <code>src/content/site.ts</code>.</p>
            )}
          </Rv>
        </div>
        <Rv className="c-right" delay={0.1}><ContactForm /></Rv>
      </div>
    </section>
  );
}
