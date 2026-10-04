import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "DESAL studio — joyas que emergen de la sal",
  description: "Joyería hecha a mano. Joyas para llevar.",
  openGraph: { title: "DESAL", description: "Joyas que emergen de la sal." },
};

export const viewport: Viewport = { themeColor: "#EFEAE0", width: "device-width", initialScale: 1 };

// el CSS de revelado se activa solo si hay JS (sin JS, todo es visible)
const jsFlag = `document.documentElement.classList.add('js')`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: jsFlag }} />
        <style>{`
          .js [data-rv="up"]:not(.rv-done){transform:translateY(112%)}
          .js [data-rv="clip"]:not(.rv-done){clip-path:inset(0 0 100% 0)}
          .js [data-rv="fade"]:not(.rv-done){opacity:0}
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
