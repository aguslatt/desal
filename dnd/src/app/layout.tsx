import type { Metadata, Viewport } from "next";
import "@fontsource-variable/lexend/wght.css";
import "@fontsource/atkinson-hyperlegible/latin-400.css";
import "@fontsource/atkinson-hyperlegible/latin-700.css";
import "@fontsource/atkinson-hyperlegible/latin-ext-400.css";
import "@fontsource/atkinson-hyperlegible/latin-ext-700.css";
import "./globals.css";
import { SCRIPT_INICIAL } from "@/lib/prefs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ES_DEMO } from "@/lib/datos";
import { RegistrarSW } from "@/components/RegistrarSW";

export const metadata: Metadata = {
  title: { default: "Umbral · Elegí tu salida sabiendo qué te espera", template: "%s · Umbral" },
  appleWebApp: { capable: true, title: "Umbral" },
  icons: { apple: "/apple-touch-icon.png" },
  description:
    "Bares, restaurantes, cafés, cines y centros culturales de CABA con información de accesibilidad concreta, verificada y fechada.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1116" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" suppressHydrationWarning data-text="100" data-theme="light" data-easy="off">
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_INICIAL }} />
      </head>
      <body>
        <a href="#contenido" className="skip-link">
          Ir al contenido
        </a>
        {ES_DEMO && (
          <aside aria-label="Aviso" className="border-b border-line bg-[var(--warn-bg)] px-4 py-2 text-center text-sm font-bold text-[var(--warn)]">
            Datos de demostración
          </aside>
        )}
        <Header />
        <main id="contenido" tabIndex={-1} className="mx-auto max-w-6xl px-4 pt-10 outline-none">
          {children}
        </main>
        <Footer />
        <RegistrarSW />
      </body>
    </html>
  );
}
