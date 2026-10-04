import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[var(--institutional)] py-10 text-stone-200">
      <div className="container-c flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo-colegio.png"
            alt="Escudo del colegio"
            className="h-10 w-10 rounded-full bg-white object-contain p-0.5"
          />
          <div>
            <p className="font-semibold text-white">
              Colegio Nacional Mariscal Francisco Solano López
            </p>
            <p className="text-sm">
              Educación Media Pública · Caaguazú, Paraguay
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm">
          <Link href="/login" className="hover:text-white">
            Portal de usuarios
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