import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Acceso al portal" };

/**
 * /login — página pública. El middleware protege /portal/* por rol.
 * Suspense exigido por useSearchParams en App Router.
 */
export default function LoginPage() {
  return (
    <section className="container-c flex min-h-[70vh] flex-col items-center justify-center py-16">
      <a href="/acceso" className="mb-6 text-sm font-semibold text-slate-500 hover:text-[var(--institutional)]">
        ← Elegir perfil (Docente / Padre / Visitante)
      </a>
      <Suspense
        fallback={
          <p className="text-sm text-slate-500">Cargando acceso…</p>
        }
      >
        <LoginForm />
      </Suspense>
    </section>
  );
}
