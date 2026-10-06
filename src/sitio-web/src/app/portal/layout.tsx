import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import ThemeToggle from "@/components/landing/ThemeToggle";

/**
 * Layout del portal: exige sesión (el middleware ya filtra por rol),
 * muestra navegación según rol y salida segura con NextAuth.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/portal");

  const role = session.user.role;
  const roleLabel =
    role === "PARENT"
      ? "Padre / Encargado"
      : role === "STUDENT"
        ? "Alumno"
        : role === "TEACHER"
          ? "Docente"
          : role === "ADMIN"
            ? "Dirección / Secretaría"
            : role;

  const links =
    role === "PARENT"
      ? [
          { href: "/portal/padre", label: "Mis hijos" },
          { href: "/portal/avisos", label: "Avisos" },
          { href: "/portal/perfil", label: "Mi perfil" },
          { href: "/#galeria", label: "Galería" },
        ]
      : role === "STUDENT"
        ? [
            { href: "/portal/alumno", label: "Mis notas" },
            { href: "/portal/alumno/carnet", label: "Mi carné" },
            { href: "/portal/avisos", label: "Avisos" },
            { href: "/portal/perfil", label: "Mi perfil" },
            { href: "/inscripciones", label: "Inscripciones" },
          ]
        : role === "TEACHER"
          ? [
              { href: "/portal/profesor", label: "Mis cursos" },
              { href: "/portal/avisos", label: "Avisos" },
              { href: "/portal/perfil", label: "Mi perfil" },
              { href: "/noticias", label: "Noticias" },
            ]
          : [
              { href: "/portal/admin", label: "Administración" },
              { href: "/portal/admin/noticias", label: "Blog / Noticias" },
              { href: "/portal/avisos", label: "Avisos" },
              { href: "/portal/perfil", label: "Mi perfil" },
              { href: "/portal/profesor", label: "Ver como docente" },
              { href: "/portal/alumno", label: "Ver como alumno" },
              { href: "/inscripciones", label: "Inscripciones" },
            ];

  return (
    <div className="container-c py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--institutional)] px-6 py-4 text-white">
        <div>
          <p className="text-sm text-stone-300">
            Portal académico · {roleLabel}
          </p>
          <p className="text-lg font-bold">{session.user.name}</p>
          <p className="text-xs text-stone-300">
            @{session.user.username}
            {session.user.email ? ` · ${session.user.email}` : " · sin correo vinculado"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-bold hover:opacity-90">
              Salir
            </button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
