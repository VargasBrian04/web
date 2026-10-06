import TeacherTools from "@/components/portal/TeacherTools";

export const metadata = { title: "Panel del Profesor" };

/**
 * Panel del Docente: nómina, carga de notas (1-5), bitácora de fotos y tareas.
 * Los datos se leen de /api/teacher/roster y se escriben en
 * POST /api/grades, /api/fotolog y /api/assignments.
 * Noticias en /portal/profesor/noticias, inscripciones en /portal/profesor/inscripciones.
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
          <li>Subí la foto de la lista o planilla y publicá la tarea digital con PDF/foto.</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/portal/profesor/noticias" className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">
            Gestionar noticias
          </a>
          <a href="/portal/profesor/inscripciones" className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">
            Ver inscripciones
          </a>
        </div>
      </section>
      <TeacherTools />
    </div>
  );
}
