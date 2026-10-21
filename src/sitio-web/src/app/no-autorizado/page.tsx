import Link from "next/link";

export const metadata = { title: "Zona de ingreso incorrecta" };

export default function NoAutorizadoPage() {
  return (
    <section className="container-c flex min-h-[60vh] flex-col items-center justify-center py-12 text-center sm:py-16">
      <p className="rounded-full bg-red-50 px-4 py-1 text-xs font-bold uppercase tracking-wide text-red-700">
        Acceso restringido
      </p>
      <h1 className="section-title mt-4">Zona de Ingreso Incorrecta</h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
        La cuenta con la que iniciaste sesión no tiene el rol necesario para
        esta zona del portal. Si sos docente o parte de Dirección/Secretaría,
        ingresá desde <strong>“Soy Docente”</strong>. Si creés que es un error,
        contactá con la Secretaría del colegio.
      </p>
      <div className="mt-6 flex w-full max-w-sm flex-col gap-2 sm:w-auto sm:flex-row sm:justify-center">
        <Link href="/portal" className="btn-primary justify-center">
          Ir a mi portal
        </Link>
        <Link
          href="/acceso"
          className="inline-flex justify-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Elegir otro perfil
        </Link>
      </div>
    </section>
  );
}
