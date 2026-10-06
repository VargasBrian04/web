"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const groups = [
  {
    label: "Institución",
    icon: "🏛️",
    links: [
      { href: "/#historia", label: "Historia" },
      { href: "/#mision", label: "Misión" },
      { href: "/#vision", label: "Visión" },
      { href: "/#docentes", label: "Docentes" },
      { href: "/#normas", label: "Convivencia" },
    ],
  },
  {
    label: "Académica",
    icon: "📚",
    links: [
      { href: "/#oferta", label: "Oferta académica" },
      { href: "/#niveles", label: "Niveles" },
      { href: "/#estadisticas", label: "Estadísticas" },
      { href: "/noticias", label: "Noticias" },
      { href: "/horarios", label: "Horarios" },
      { href: "/calendario", label: "Calendario" },
      { href: "/encuestas", label: "Encuestas" },
    ],
  },
  {
    label: "Admisiones",
    icon: "📝",
    links: [
      { href: "/#requisitos", label: "Requisitos" },
      { href: "/registro", label: "Registro" },
      { href: "/inscripciones", label: "Inscripciones" },
      { href: "/#contacto", label: "Contacto" },
    ],
  },
];

const flatLinks = groups.flatMap((g) => g.links);

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href.startsWith("/#")
      ? pathname === "/" || pathname === "/inicio"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--institutional)]/95 shadow-md backdrop-blur">
      <div className="container-c flex h-16 items-center justify-between gap-2">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <img
            src="/images/logo-nuevo.png"
            alt="Escudo del colegio"
            className="h-10 w-10 shrink-0 rounded-full bg-white object-contain p-0.5 shadow"
          />
          <div className="leading-tight">
            <p className="truncate text-sm font-bold text-white">
              Mariscal Francisco Solano López
            </p>
            <p className="hidden text-xs text-stone-300 sm:block">Caaguazú - Paraguay</p>
          </div>
        </Link>

        {/* Escritorio: grupos con desplegable */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {groups.map((g) => {
            const active = g.links.some((l) => isActive(l.href));
            return (
              <div key={g.label} className="group relative">
                <button
                  aria-current={active ? "true" : undefined}
                  className={`rounded-lg px-3 py-2 text-sm transition-all hover:-translate-y-px hover:bg-white/10 hover:text-white hover:shadow ${
                    active ? "bg-white/15 font-bold text-white shadow" : "text-stone-100"
                  }`}
                >
                  {g.icon} {g.label} ▾
                </button>
                <div className="invisible absolute left-0 top-full w-56 translate-y-1 rounded-xl border border-stone-200 bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  {g.links.map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      aria-current={isActive(l.href) ? "page" : undefined}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--paper)] hover:text-[var(--institutional)] ${
                        isActive(l.href) ? "bg-[var(--paper)] font-bold text-[var(--institutional)]" : "text-stone-700"
                      }`}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
          <a
            href="/#galeria"
            className="rounded-lg px-3 py-2 text-sm text-stone-100 transition-all hover:-translate-y-px hover:bg-white/10 hover:text-white"
          >
            🖼️ Galería
          </a>
        </nav>

        <div className="hidden items-center gap-1.5 xl:flex">
          <ThemeToggle />
          <Link
            href="/buscar"
            title="Buscar en el sitio"
            className="rounded-lg px-2.5 py-2 text-base transition-colors hover:bg-white/10"
          >
            🔍
          </Link>
          <a
            href="https://aprendizaje.mec.edu.py/aprendizaje/familia/documentos"
            target="_blank"
            rel="noopener noreferrer"
            title="Consultar calificaciones oficiales en el MEC"
            className="whitespace-nowrap rounded-lg border border-[var(--gold)] px-2.5 py-2 text-sm font-bold text-[var(--gold)] transition-all hover:-translate-y-px hover:bg-[var(--gold)] hover:text-white hover:shadow"
          >
            ✓ Calificaciones ↗
          </a>
          <Link
            href="/acceso"
            className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Acceder
          </Link>
          <Link
            href="/registro"
            className="whitespace-nowrap rounded-lg bg-[var(--gold)] px-3 py-2 text-sm font-bold text-white shadow transition-all hover:-translate-y-px hover:opacity-90 hover:shadow-md"
          >
            Registro
          </Link>
        </div>

        <div className="hidden items-center gap-1 md:flex xl:hidden">
          <ThemeToggle />
          <Link
            href="/acceso"
            className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Acceder
          </Link>
          <Link
            href="/registro"
            className="whitespace-nowrap rounded-lg bg-[var(--gold)] px-3 py-2 text-sm font-bold text-white shadow"
          >
            Registro
          </Link>
        </div>

        {/* Móvil: hamburguesa */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
          className="rounded-lg p-2 text-white hover:bg-white/10 lg:hidden"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <nav className="max-h-[70vh] overflow-y-auto border-t border-white/10 bg-[var(--institutional)] px-4 py-4 lg:hidden" aria-label="Móvil">
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
              Menú
            </p>
            <ThemeToggle />
          </div>
          {groups.map((g) => (
            <div key={g.label} className="mb-3">
              <p className="px-2 text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
                {g.icon} {g.label}
              </p>
              {g.links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`block rounded-lg px-2 py-2 text-sm transition-colors hover:bg-white/10 ${
                    isActive(l.href) ? "bg-white/15 font-bold text-white" : "text-stone-100"
                  }`}
                >
                  {l.label}
                </a>
              ))}
            </div>
          ))}
          <a
            href="/#galeria"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-2 py-2 text-sm text-stone-100 hover:bg-white/10"
          >
            🖼️ Galería
          </a>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/acceso"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-white/30 px-3 py-2.5 text-center text-sm font-semibold text-white"
            >
              🔑 Acceder
            </Link>
            <Link
              href="/registro"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-[var(--gold)] px-3 py-2.5 text-center text-sm font-bold text-white"
            >
              ✨ Registro
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export { flatLinks };
