import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import ThemeToggle from "@/components/landing/ThemeToggle";
import PushButton from "@/components/portal/PushButton";
import PortalLinks from "@/components/portal/PortalLinks";
import CumplesHoy from "@/components/portal/CumplesHoy";

/**
 * Layout del portal: exige sesión (el middleware ya filtra por rol),
 * muestra navegación según rol y zona (Dirección en /portal/profesor
 * solo ve panel docente + perfil) y salida segura con NextAuth.
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

  return (
    <div className="container-c py-10">
      <div className="portal-head mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--institutional)] px-4 py-4 text-white sm:px-6">
        <div className="portal-user min-w-0">
          <p className="text-sm text-stone-300">
            Portal académico · {roleLabel}
          </p>
          <p className="truncate text-lg font-bold">{session.user.name}</p>
          <p className="hidden text-xs text-stone-300 break-all sm:block">
            @{session.user.username}
            {session.user.email ? ` · ${session.user.email}` : " · sin correo vinculado"}
          </p>
        </div>
        <div className="portal-links flex flex-wrap items-center gap-2">
          <PortalLinks role={role} />
          <ThemeToggle />
          <PushButton />
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
      <div className="mt-6">
        <CumplesHoy />
      </div>
    </div>
  );
}
