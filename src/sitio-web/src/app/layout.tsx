import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import IntroAnimation from "@/components/landing/IntroAnimation";

export const metadata: Metadata = {
  title: {
    default: "Colegio Nacional Mariscal Francisco Solano López | Caaguazú",
    template: "%s | Colegio Mariscal Solano López"
  },
  description:
    "Institución educativa pública de Caaguazú, Paraguay. Inscripciones, oferta académica y portal para estudiantes, docentes y familias."
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
        <IntroAnimation />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}