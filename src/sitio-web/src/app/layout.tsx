import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import WhatsAppFloat from "@/components/landing/WhatsAppFloat";

export const metadata: Metadata = {
  metadataBase: new URL("https://colegio-solano-lopez.vercel.app"),
  title: {
    default: "Colegio Nacional Mariscal Francisco Solano López | Caaguazú",
    template: "%s | Colegio Mariscal Solano López"
  },
  description:
    "Institución educativa pública de Caaguazú, Paraguay. Oferta académica, requisitos de inscripción y portal para estudiantes, docentes y familias.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "es_PY",
    url: "/",
    siteName: "Colegio Nacional Mariscal Francisco Solano López",
    title: "Colegio Nacional Mariscal Francisco Solano López | Caaguazú",
    description:
      "Educación pública y gratuita en Caaguazú. Oferta académica, noticias, calendario escolar y portal para estudiantes, docentes y familias.",
    images: [{ url: "/images/hero-colegio.jpg", alt: "Fachada del Colegio Nacional Mariscal Francisco Solano López" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Colegio Nacional Mariscal Francisco Solano López | Caaguazú",
    description:
      "Educación pública y gratuita en Caaguazú. Oferta académica, noticias, calendario escolar y portal institucional.",
    images: ["/images/hero-colegio.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#5d4037",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Aplica el tema guardado antes del primer pintado (sin parpadeo). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("csl-theme")==="oscuro")document.documentElement.dataset.theme="oscuro"}catch(e){}`,
          }}
        />
      </head>
      <body>
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        <Navbar />
        <main id="contenido">{children}</main>
        <Footer />
        <WhatsAppFloat />
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").catch(function(){})}`,
          }}
        />
      </body>
    </html>
  );
}