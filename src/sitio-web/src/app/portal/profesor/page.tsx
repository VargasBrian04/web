import TeacherTools from "@/components/portal/TeacherTools";

export const metadata = { title: "Panel del Profesor" };

/**
 * Panel del Docente: nómina, carga de notas (1-5), asistencia y tareas.
 * Los datos se leen de /api/teacher/roster y se escriben en
 * POST /api/grades, POST /api/attendance y POST /api/assignments.
 */
export default function ProfesorPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-[var(--institutional)] p-6 text-white">
        <h2 className="text-xl font-extrabold">Panel del Profesor</h2>
        <p className="mt-1 text-sm text-stone-200">
          Pasá lista, cargá notas internas (escala Paraguay 1–5) y publicá tareas.
          Lo oficial se emite en el MEC; aquí va el seguimiento diario.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-stone-200">
          <li>Elegí tu materia y el período en “Mis cursos”.</li>
          <li>Cargá la nota del alumno (se crea o actualiza).</li>
          <li>Registrá asistencia y publicá tareas para la materia.</li>
        </ol>
      </section>
      <TeacherTools />
    </div>
  );
}
