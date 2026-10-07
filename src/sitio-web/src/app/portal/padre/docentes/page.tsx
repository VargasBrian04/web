import TeachersDirectory from "@/components/portal/TeachersDirectory";

export const metadata = { title: "Docentes — Portal del Tutor" };

/** Zona de docentes para tutores: directorio completo del plantel. */
export default function PadreDocentesPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-[var(--institutional)] p-6 text-white">
        <h2 className="text-xl font-extrabold">Docentes del colegio</h2>
        <p className="mt-1 text-sm text-stone-200">
          Plantel docente, materias y horarios de atención.
        </p>
      </section>
      <TeachersDirectory />
    </div>
  );
}
