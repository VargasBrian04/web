import TeacherTools from "@/components/portal/TeacherTools";
import { auth } from "@/lib/auth";

export const metadata = { title: "Panel docente" };

/**
 * Panel docente: nómina, carga de notas (1-5), bitácora de fotos y tareas.
 * Los datos se leen de /api/teacher/roster y se escriben en
 * POST /api/grades, /api/fotolog y /api/assignments.
 * ADMIN puede verlo (Ver como docente), pero su cuenta sigue siendo Dirección.
 */
export default async function ProfesorPage() {
  const session = await auth();
  const isAdminView = session?.user?.role === "ADMIN";
  return (
    <div className="grid gap-6">
      {isAdminView && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Estás viendo el panel docente como Dirección ({session?.user?.username ?? "admin"}).
          Para entrar como docente, salí y accedé con su cuenta (ej: brianlucianovargascrista).
        </p>
      )}
      <section className="rounded-2xl bg-[var(--institutional)] p-6 text-white">
        <h2 className="text-xl font-extrabold">Panel docente</h2>
        <p className="mt-1 text-sm text-stone-200">
          Subí planillas y listas por curso y materia, y publicá tareas digitales.
          Lo oficial se emite en el MEC; aquí va el seguimiento diario.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-stone-200">
          <li>Elegí tu curso y materia arriba (ej: 3.º Salud).</li>
          <li>Subí la foto de la planilla o lista con su observación.</li>
          <li>Publicá la tarea digital con PDF/foto para ese curso.</li>
        </ol>
      </section>
      <TeacherTools />
    </div>
  );
}
