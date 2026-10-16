import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { displayName, heroContent, site } from "@/content/site";

const title = `${displayName} — Renders y visualización arquitectónica`;
const description =
  "Renders y visualización arquitectónica para presentar tu proyecto con la fuerza que merece. Interiores, exteriores e imágenes para presentación comercial.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description,
  // Mientras sea provisional, no se indexa (hay contenido de muestra).
  robots: site.provisional ? { index: false, follow: false } : { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "es_AR",
    title,
    description,
    images: [{ url: heroContent.image.src, width: heroContent.image.width, height: heroContent.image.height }],
  },
  twitter: { card: "summary_large_image", title, description, images: [heroContent.image.src] },
};

export const viewport: Viewport = { themeColor: "#14110f", width: "device-width", initialScale: 1 };

// El revelado al scroll solo se activa si hay JS (sin JS todo es visible).
const jsFlag = `document.documentElement.classList.add('js')`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: jsFlag }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
