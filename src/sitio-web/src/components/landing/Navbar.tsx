"use client";

import Link from "next/link";
import { useState } from "react";

const groups = [
  {
    label: "Institución",
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
    links: [
      { href: "/#oferta", label: "Oferta académica" },
      { href: "/#niveles", label: "Niveles" },
      { href: "/#estadisticas", label: "Estadísticas" },
      { href: "/#calificaciones", label: "Calificaciones" },
      { href: "/noticias", label: "Noticias" },
    ],
  },
  {
    label: "Admisiones",
    links: [
      { href: "/#requisitos", label: "Requisitos" },
      { href: "/#matriculas", label: "Matrículas" },
      { href: "/inscripciones", label: "Inscripciones" },
      { href: "/#contacto", label: "Contacto" },
    ],
  },
];

const flatLinks = groups.flatMap((g) => g.links);

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--institutional)]/95 backdrop-blur">
      <div className="container-c flex h-16 items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/images/logo-colegio.png"
            alt="Escudo del colegio"
            className="h-10 w-10 rounded-full bg-white object-contain p-0.5"
          />
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">
              Mariscal Francisco Solano López
            </p>
            <p className="text-xs text-stone-300">Caaguazú - Paraguay</p>
          </div>
        </Link>

        {/* Escritorio: grupos con desplegable */}
        <nav className="hidden items-center gap-1 lg:flex">
          {groups.map((g) => (
            <div key={g.label} className="group relative">
              <button className="rounded-lg px-3 py-2 text-sm text-stone-100 transition-colors hover:bg-white/10 hover:text-white">
                {g.label} ▾
              </button>
              <div className="invisible absolute left-0 top-full w-52 translate-y-1 rounded-xl border border-stone-200 bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                {g.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    className="block rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-[var(--paper)] hover:text-[var(--institutional)]"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <a
            href="/#galeria"
            className="rounded-lg px-3 py-2 text-sm text-stone-100 transition-colors hover:bg-white/10 hover:text-white"
          >
            Galería
          </a>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href="https://aprendizaje.mec.edu.py/aprendizaje/familia/documentos"
            target="_blank"
            rel="noopener noreferrer"
            title="Consultar calificaciones oficiales en el MEC"
            className="rounded-lg border border-[var(--gold)] px-3 py-2 text-sm font-bold text-[var(--gold)] transition-colors hover:bg-[var(--gold)] hover:text-white"
          >
            Calificaciones ↗
          </a>
          <Link
            href="/acceso"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Acceder
          </Link>
          <Link
            href="/inscripciones"
            className="rounded-lg bg-[var(--gold)] px-3 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Inscripciones
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
        <nav className="max-h-[70vh] overflow-y-auto border-t border-white/10 bg-[var(--institutional)] px-4 py-4 lg:hidden">
          {groups.map((g) => (
            <div key={g.label} className="mb-3">
              <p className="px-2 text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
                {g.label}
              </p>
              {g.links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-1.5 text-sm text-stone-100 hover:bg-white/10"
                >
                  {l.label}
                </a>
              ))}
            </div>
          ))}
          <a
            href="/#galeria"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-2 py-1.5 text-sm text-stone-100 hover:bg-white/10"
          >
            Galería
          </a>
          <div className="mt-3 flex gap-2">
            <Link
              href="/acceso"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-white/30 px-3 py-2 text-center text-sm font-semibold text-white"
            >
              Acceder
            </Link>
            <Link
              href="/inscripciones"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg bg-[var(--gold)] px-3 py-2 text-center text-sm font-bold text-white"
            >
              Inscripciones
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export { flatLinks };
