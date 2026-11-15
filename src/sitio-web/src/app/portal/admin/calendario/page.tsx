import CalendarAdmin from "@/components/portal/CalendarAdmin";

export const metadata = { title: "Calendario escolar — Administración" };

/**
 * Carga de fechas del calendario público (Dirección). Protegida por el
 * layout de /portal/admin y por el middleware (solo rol ADMIN).
 */
export default function AdminCalendarioPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-[var(--institutional)] p-6 text-white">
        <h2 className="text-xl font-extrabold">Calendario escolar</h2>
        <p className="mt-1 text-sm text-stone-200">
          Las fechas cargadas aparecen en /calendario y se descargan en formato
          .ics para que las familias las agreguen a su teléfono.
        </p>
      </section>
      <CalendarAdmin />
    </div>
  );
}