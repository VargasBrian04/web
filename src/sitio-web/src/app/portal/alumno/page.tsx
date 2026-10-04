import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MecLinksCenter from "@/components/portal/MecLinksCenter";

export const metadata = { title: "Portal del Alumno" };

function avg(scores: number[]) {
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Panel del Alumno: Centro MEC + notas internas con promedio,
 * asistencia resumida, tareas con estado de entrega y mis solicitudes.
 */
export default async function AlumnoPage() {
  const session = await auth();

  let grades: { subject: string; code: string; period: string; score: number }[] = [];
  let attendance: { date: Date; status: string; subject: string | null }[] = [];
  let assignments: {
    id: string;
    title: string;
    subject: string;
    due: Date | null;
    delivered: boolean;
    score: number | null;
  }[] = [];
  let enrollments: { academic: string; period: string; status: string }[] = [];
  let docs: { id: string; title: string; type: string; subject: string | null }[] = [];
  let obs: { id: string; text: string; date: Date }[] = [];
  let dbReady = true;

  try {
    const student = await prisma.student.findUnique({ where: { userId: session!.user.id } });
    if (student) {
      const [gRows, aRows, tRows, eRows, dRows, oRows] = await Promise.all([
        prisma.grade.findMany({
          where: { studentId: student.id },
          include: { subject: { select: { name: true, code: true } }, period: { select: { name: true, label: true } } },
          orderBy: [{ period: { label: "desc" } }, { subject: { name: "asc" } }],
        }),
        prisma.attendance.findMany({
          where: { studentId: student.id },
          include: { subject: { select: { name: true } } },
          orderBy: { classDate: "desc" },
          take: 60,
        }),
        prisma.assignment.findMany({
          where: student.academicId ? { subject: { academicId: student.academicId } } : {},
          include: {
            subject: { select: { name: true } },
            submissions: { where: { studentId: student.id }, select: { status: true, score: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
        prisma.enrollment.findMany({
          where: { studentId: student.id },
          include: { academic: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.document.findMany({
          where: {
            OR: [
              { studentId: student.id },
              { studentId: null, subject: { academicId: student.academicId ?? undefined } },
            ],
          },
          include: { subject: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 30,
        }).catch(() => []),
        prisma.observation.findMany({
          where: { studentId: student.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        }).catch(() => []),
      ]);
      grades = gRows.map((g: any) => ({ subject: g.subject.name, code: g.subject.code, period: g.period.name, score: g.score }));
      attendance = aRows.map((a: any) => ({ date: a.classDate, status: a.status, subject: a.subject?.name ?? null }));
      assignments = tRows.map((t: any) => ({
        id: t.id,
        title: t.title,
        subject: t.subject?.name ?? "—",
        due: t.dueDate,
        delivered: t.submissions.length > 0 && t.submissions[0].status !== "PENDIENTE",
        score: t.submissions[0]?.score ?? null,
      }));
      enrollments = eRows.map((e: any) => ({ academic: e.academic.name, period: e.periodLabel, status: e.status }));
      docs = (dRows as any[]).map((d: any) => ({ id: d.id, title: d.title, type: d.type, subject: d.subject?.name ?? null }));
      obs = (oRows as any[]).map((o: any) => ({ id: o.id, text: o.text, date: o.createdAt }));
    }
  } catch {
    dbReady = false;
  }

  const promedio = avg(grades.map((g) => g.score));
  const pres = attendance.filter((a) => a.status === "PRESENTE" || a.status === "TARDE").length;
  const aus = attendance.filter((a) => a.status === "AUSENTE").length;
  const pendingTasks = assignments.filter((t) => !t.delivered);

  return (
    <div className="grid gap-8">
      <MecLinksCenter />

      {/* Resumen */}
      <section className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Promedio interno", value: promedio !== null ? promedio.toFixed(2) : "—", hint: "Escala 1–5" },
          { label: "Materias con nota", value: String(grades.length), hint: "Períodos cargados" },
          { label: "Asistencia", value: attendance.length ? `${pres}/${attendance.length}` : "—", hint: aus ? `${aus} ausencias` : "Sin faltas registradas" },
          { label: "Tareas pendientes", value: String(pendingTasks.length), hint: "Por entregar" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{c.label}</p>
            <p className="text-2xl font-extrabold text-[var(--institutional)]">{c.value}</p>
            <p className="text-xs text-slate-500">{c.hint}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-extrabold text-[var(--institutional)]">Mis notas internas</h2>
        <p className="mt-1 text-sm text-slate-500">Escala 1–5 · Lo oficial se consulta en el MEC (arriba).</p>
        {!dbReady && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Base de datos no disponible. Levantala con <code>docker compose up -d</code>.
          </p>
        )}
        {dbReady && grades.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">Todavía no tenés calificaciones cargadas. Tu docente las publica aquí tras cada período.</p>
        )}
        {grades.length > 0 && (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-4">Materia</th>
                  <th className="py-2 pr-4">Período</th>
                  <th className="py-2">Nota</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4">{g.subject}</td>
                    <td className="py-2 pr-4 text-slate-500">{g.period}</td>
                    <td className="py-2">
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
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-extrabold text-[var(--institutional)]">Mi asistencia</h2>
          <p className="mt-1 text-sm text-slate-500">Últimos 60 registros pasados por tus docentes.</p>
          {attendance.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Sin registros todavía.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {attendance.slice(0, 12).map((a, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>
                    {a.date.toLocaleDateString("es-PY")} {a.subject ? `· ${a.subject}` : ""}
                  </span>
                  <span className={`rounded px-2 py-0.5 font-bold ${a.status === "PRESENTE" ? "bg-emerald-100 text-emerald-800" : a.status === "TARDE" ? "bg-amber-100 text-amber-800" : a.status === "JUSTIFICADO" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-extrabold text-[var(--institutional)]">Mis tareas</h2>
          <p className="mt-1 text-sm text-slate-500">Publicadas por tus docentes. Entregalas en clase y avisá para que la marquen.</p>
          {assignments.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Sin tareas publicadas para tu bachillerato.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {assignments.slice(0, 12).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                  <span>
                    <strong>{t.title}</strong>
                    <span className="block text-xs text-slate-500">
                      {t.subject} {t.due ? `· Vence ${t.due.toLocaleDateString("es-PY")}` : ""}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded px-2 py-0.5 font-bold ${t.delivered ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {t.delivered ? "Entregada" : "Pendiente"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {enrollments.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-extrabold text-[var(--institutional)]">Mis inscripciones</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {enrollments.map((e, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span>{e.academic} · Período {e.period}</span>
                <span className="rounded bg-slate-200 px-2 py-0.5 font-bold">{e.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-extrabold text-[var(--institutional)]">Mis documentos</h2>
          <p className="mt-1 text-sm text-slate-500">Planillas y archivos publicados por tus docentes.</p>
          {docs.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Sin documentos todavía.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {docs.slice(0, 12).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                  <span><strong>{d.title}</strong>
                    <span className="block text-xs text-slate-500">{d.type}{d.subject ? ` · ${d.subject}` : ""}</span>
                  </span>
                  <a href={`/api/documents/${d.id}/file`} target="_blank" rel="noreferrer" className="shrink-0 font-bold text-[var(--institutional)] underline">Ver</a>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-extrabold text-[var(--institutional)]">Observaciones</h2>
          {obs.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Sin observaciones.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {obs.slice(0, 10).map((o) => (
                <li key={o.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <p>{o.text}</p>
                  <p className="mt-1 text-xs text-slate-400">{o.date.toLocaleDateString("es-PY")}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
