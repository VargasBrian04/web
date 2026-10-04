import Link from "next/link";

export const metadata = { title: "Sin permiso" };

export default function NoAutorizadoPage() {
  return (
    <section className="container-c flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="rounded-full bg-red-50 px-4 py-1 text-xs font-bold uppercase tracking-wide text-red-700">
        Acceso restringido
      </p>
      <h1 className="section-title mt-4">No tenés permiso para esta sección</h1>
      <p className="mt-3 max-w-md text-slate-600">
        Tu rol no habilita esta área del portal. Si creés que es un error,
        contactá con la Secretaría del colegio.
      </p>
      <Link href="/portal" className="btn-primary mt-6">
        Ir a mi portal
      </Link>
    </section>
  );
}
