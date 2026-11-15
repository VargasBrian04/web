import AlertsAdmin from "@/components/portal/AlertsAdmin";

export const metadata = { title: "Avisos del sitio — Administración" };

/**
 * Banner de avisos públicos (Dirección). Protegida por el layout de
 * /portal/admin y por el middleware (solo rol ADMIN).
 */
export default function AdminAlertasPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-[var(--institutional)] p-6 text-white">
        <h2 className="text-xl font-extrabold">Avisos del sitio</h2>
        <p className="mt-1 text-sm text-stone-200">
          Un mensaje corto arriba de la página para anuncios urgentes: suspensión de clases,
          inscripciones, reuniones. No hace falta crear una noticia.
        </p>
      </section>
      <AlertsAdmin />
    </div>
  );
}
