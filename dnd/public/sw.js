/* Service worker de Umbral: la app se puede instalar y abre sin conexión (página de aviso).
   - Archivos estáticos (_next/static, pictogramas, íconos): primero el caché.
   - Páginas: primero la red; si no hay conexión, la última copia o /offline.html.
   - API, métricas y todo lo que no sea GET: siempre la red, sin caché. */
const VERSION = "umbral-v1";
const PRECACHE = ["/offline.html", "/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/metricas")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/picto/") || /\.(png|svg|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((r) => {
        const copia = r.clone();
        caches.open(VERSION).then((c) => c.put(req, copia));
        return r;
      })),
    );
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copia = r.clone();
          caches.open(VERSION).then((c) => c.put(req, copia));
          return r;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/offline.html"))),
    );
  }
});
