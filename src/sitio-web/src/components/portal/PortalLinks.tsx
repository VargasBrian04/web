"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Enlaces del portal según rol y zona.
 * Si Dirección está en /portal/profesor (Ver como docente), solo ve
 * el panel docente y Mi perfil: nada de Administración.
 */
export default function PortalLinks({ role }: { role: string }) {
  const pathname = usePathname() || "";
  const adminViewingTeacher = role === "ADMIN" && pathname.startsWith("/portal/profesor");

  const links =
    adminViewingTeacher
      ? [
          { href: "/portal/profesor", label: "Panel docente" },
          { href: "/portal/perfil", label: "Mi perfil" },
        ]
      : role === "PARENT"
        ? [
            { href: "/portal/padre", label: "Mis hijos" },
            { href: "/portal/perfil", label: "Mi perfil" },
            { href: "/#galeria", label: "Galería" },
          ]
        : role === "STUDENT"
          ? [
              { href: "/portal/alumno", label: "Mis notas" },
              { href: "/portal/alumno/carnet", label: "Mi carné" },
              { href: "/portal/perfil", label: "Mi perfil" },
              { href: "/inscripciones", label: "Inscripciones" },
            ]
          : role === "TEACHER"
            ? [
                { href: "/portal/profesor", label: "Mis cursos" },
                { href: "/portal/profesor/noticias", label: "Gestionar noticias" },
                { href: "/portal/profesor/inscripciones", label: "Inscripciones" },
                { href: "/portal/perfil", label: "Mi perfil" },
                { href: "/noticias", label: "Noticias" },
              ]
            : [
                { href: "/portal/admin", label: "Administración" },
                { href: "/portal/admin/noticias", label: "Blog / Noticias" },
                { href: "/portal/perfil", label: "Mi perfil" },
                { href: "/portal/profesor", label: "Ver como docente" },
                { href: "/portal/alumno", label: "Ver como alumno" },
                { href: "/inscripciones", label: "Inscripciones" },
              ];

  return (
    <>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={pathname === l.href ? "page" : undefined}
          className={`rounded-lg px-4 py-2 text-sm font-semibold hover:bg-white/20 ${
            pathname === l.href ? "bg-white/20" : "bg-white/10"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </>
  );
}
