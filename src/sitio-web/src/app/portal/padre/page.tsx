import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MecLinksCenter from "@/components/portal/MecLinksCenter";

export const metadata = { title: "Portal del Padre" };

function avg(scores: number[]) {
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Panel de Padres/Encargados: Centro MEC + por cada hijo:
 * notas internas con promedio, asistencia resumida y tareas pendientes.
 */
export default async function PadrePage() {
  const session = await auth();

  type Child = {
    id: string;
    name: string;
    academic: string | null;
    grades: { subject: string; period: string; score: number }[];
    attendance: { status: string }[];
    pendingTasks: number;
    docs: { id: string; title: string; type: string }[];
    obsCount: number;
  };
  let children: Child[] = [];
  let dbReady = true;

  try {
    const links = await prisma.studentGuardian.findMany({
      where: { guardian: { userId: session!.user.id } },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            academic: { select: { name: true } },
            grades: {
              include: { subject: { select: { name: true } }, period: { select: { name: true } } },
              orderBy: [{ period: { label: "desc" } }, { subject: { name: "asc" } }],
            },
            attendance: { select: { status: true } },
          },
        },
      },
    });

    children = await Promise.all(
      links.map(async (l: any) => {
        const pending = l.student.academicId
          ? await prisma.assignment.count({
              where: {
                subject: { academicId: l.student.academicId },
                submissions: { none: { studentId: l.studentId } },
              },
            })
          : 0;
        const [docs, obsCount] = await Promise.all([
          prisma.document.findMany({
            where: { studentId: l.studentId, visibleToTutor: true },
            select: { id: true, title: true, type: true },
            orderBy: { createdAt: "desc" },
            take: 5,
          }).catch(() => []),
          prisma.observation.count({ where: { studentId: l.studentId, visibleToTutor: true } }).catch(() => 0),
        ]);
        return {
          id: l.studentId,
          name: `${l.student.user.firstName} ${l.student.user.lastName}`,
          academic: l.student.academic?.name ?? null,
          grades: l.student.grades.map((g: any) => ({
            subject: g.subject.name,
            period: g.period.name,
            score: g.score,
          })),
          attendance: l.student.attendance.map((a: any) => ({ status: a.status as string })),
          pendingTasks: pending,
          docs,
          obsCount,
        };
      })
    );
  } catch {
    dbReady = false;
  }

  return (
    <div className="grid gap-8">
      <MecLinksCenter />

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-extrabold text-[var(--institutional)]">
          Seguimiento académico de mis hijos
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Notas internas cargadas por los docentes (escala 1–5), asistencia y tareas.
          Lo oficial está en el MEC (arriba).
        </p>

        {!dbReady && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Base de datos no disponible. Levantala con <code>docker compose up -d</code>.
          </p>
        )}

        {dbReady && children.length === 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
            <p className="font-bold text-slate-900">Aún no tenés hijos vinculados.</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Acercate a Secretaría con tu C.I. y la de tu hijo/a.</li>
              <li>Pedí que asocien tu cuenta de padre/madre/encargado al alumno.</li>
              <li>Volvé a ingresar: verás aquí notas, asistencia y tareas.</li>
            </ol>
            <p className="mt-2 text-xs text-slate-500">
              Cuenta actual: @{session?.user.username}{session?.user.email ? ` · ${session.user.email}` : ""} · Si sos alumno o docente e ingresaste aquí por error, pedí tu rol correcto en Secretaría.
            </p>
          </div>
        )}

        {children.map((child) => {
          const promedio = avg(child.grades.map((g) => g.score));
          const pres = child.attendance.filter((a) => a.status === "PRESENTE" || a.status === "TARDE").length;
          const aus = child.attendance.filter((a) => a.status === "AUSENTE").length;
          return (
            <article key={child.id} className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{child.name}</h3>
                  <p className="text-xs text-slate-500">{child.academic ?? "Bachillerato por confirmar"}</p>
                  <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <a href={`/portal/padre/${child.id}`} className="inline-block text-sm font-bold text-[var(--institutional)] underline">
                      Ver ficha completa →
                    </a>
                    <a href={`/portal/padre/docentes?hijo=${child.id}`} className="inline-block text-sm font-bold text-[var(--institutional)] underline">
                      Docentes de su curso →
                    </a>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                    Promedio {promedio !== null ? promedio.toFixed(2) : "—"}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                    Asistencia {child.attendance.length ? `${pres}/${child.attendance.length}` : "—"}
                    {aus ? ` (${aus} aus.)` : ""}
                  </span>
                  <span className={`rounded-full px-3 py-1 ${child.pendingTasks ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                    {child.pendingTasks ? `${child.pendingTasks} tareas pendientes` : "Tareas al día"}
                  </span>
                </div>
              </div>

              {child.grades.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Sin notas internas todavía. El docente las carga por período.</p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-xl bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="py-2 pl-4 pr-4">Materia</th>
                        <th className="py-2 pr-4">Período</th>
                        <th className="py-2 pr-4">Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {child.grades.map((g, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pl-4 pr-4">{g.subject}</td>
                          <td className="py-2 pr-4 text-slate-500">{g.period}</td>
                          <td className="py-2 pr-4">
                            <span className={`rounded px-2 py-0.5 font-bold ${g.score >= 4 ? "bg-emerald-100 text-emerald-800" : g.score >= 3 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                              {g.score.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-white p-3">
                  <p className="font-bold text-slate-700">Documentos ({child.docs.length}{child.docs.length === 5 ? "+" : ""})</p>
                  {child.docs.length === 0 ? (
                    <p className="mt-1 text-slate-500">Sin documentos publicados.</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {child.docs.map((d) => (
                        <li key={d.id}>
                          <a href={`/api/documents/${d.id}/file`} target="_blank" rel="noreferrer" className="font-semibold text-[var(--institutional)] underline">
                            {d.title}
                          </a>{" "}
                          <span className="text-xs text-slate-400">({d.type})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="font-bold text-slate-700">Observaciones</p>
                  <p className="mt-1 text-slate-500">{child.obsCount ? `${child.obsCount} en la ficha` : "Sin observaciones."}</p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        <h2 className="font-extrabold text-[var(--institutional)]">¿Cómo funciona esta zona?</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Notas internas:</strong> las carga el docente en su panel y aparecen aquí al instante.</li>
          <li><strong>Asistencia:</strong> presente / tarde / ausente / justificado, pasada por el docente cada clase.</li>
          <li><strong>Tareas:</strong> el docente publica y el alumno entrega en clase; aquí ves el conteo de pendientes.</li>
          <li><strong>Documentos oficiales:</strong> libretas y certificados solo en el botón azul del MEC.</li>
        </ul>
      </section>
    </div>
  );
}
