import TeacherEnrollments from "@/components/portal/TeacherEnrollments";

export const metadata = { title: "Inscripciones — Docente" };

/** Docente ve inscripciones en solo lectura (Dirección aprueba). */
export default function ProfesorInscripcionesPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-[var(--institutional)] p-6 text-white">
        <h2 className="text-xl font-extrabold">Inscripciones</h2>
        <p className="mt-1 text-sm text-stone-200">
          Movimiento de solicitudes. La aprobación la hace Dirección en /portal/admin.
        </p>
      </section>
      <TeacherEnrollments />
    </div>
  );
}
