import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[var(--institutional)] py-8 text-stone-200 sm:py-10">
      <div className="container-c flex flex-col items-center justify-between gap-5 text-center md:flex-row md:gap-6 md:text-left">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo-nuevo.png"
            alt="Escudo del colegio"
            className="h-10 w-10 shrink-0 rounded-full bg-white object-contain p-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-white sm:text-base">
              Colegio Nacional Mariscal Francisco Solano López
            </p>
            <p className="text-xs sm:text-sm">
              Educación Media Pública · Caaguazú, Paraguay
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
          <Link href="/buscar" className="hover:text-white">
            Buscar
          </Link>
          <Link href="/galeria" className="hover:text-white">
            Galería
          </Link>
          <Link href="/preguntas" className="hover:text-white">
            Ayuda
          </Link>
          <Link href="/login" className="hover:text-white">
            Acceder
          </Link>
          <Link href="/inscripciones" className="hover:text-white">
            Inscripciones
          </Link>
          <a href="/#historia" className="hover:text-white">
            Institucional
          </a>
        </nav>
        <p className="text-xs text-stone-400">
          © {new Date().getFullYear()} · Sistema institucional y portal
          académico
        </p>
      </div>
    </footer>
  );
}