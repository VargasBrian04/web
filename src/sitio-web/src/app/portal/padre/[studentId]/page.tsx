import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MecLinksCenter from "@/components/portal/MecLinksCenter";
import PhotoLogView from "@/components/portal/PhotoLogView";

export const metadata = { title: "Ficha del estudiante" };

function avg(scores: number[]) {
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Ficha individual del estudiante para el tutor:
 * datos, curso, notas, asistencia, documentos publicados y observaciones.
 * Solo accesible si el tutor está vinculado (student_guardians).
 */
export default async function FichaEstudiantePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/portal/padre");
  const { studentId } = await params;

  let allowed = session.user.role === "ADMIN";
  if (session.user.role === "PARENT" && !allowed) {
    const link = await prisma.studentGuardian.findFirst({
      where: { studentId, guardian: { userId: session.user.id } },
    }).catch(() => null);
    allowed = !!link;
  }
  if (!allowed) notFound();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { firstName: true, lastName: true, ci: true, email: true, profileImageUrl: true } },
      academic: { select: { name: true, shortName: true } },
      group: { select: { name: true, shift: true, gradeYear: true, section: true } },
      grades: {
        include: { subject: { select: { name: true, code: true } }, period: { select: { name: true, label: true } } },
        orderBy: [{ period: { label: "desc" } }, { subject: { name: "asc" } }],
      },
      attendance: {
        include: { subject: { select: { name: true } } },
        orderBy: { classDate: "desc" },
        take: 60,
      },
    },
  }).catch(() => null);
  if (!student) notFound();

  const [docs, obs] = await Promise.all([
    prisma.document.findMany({
      where: { studentId, visibleToTutor: true },
      include: { subject: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }).catch(() => []),
    prisma.observation.findMany({
      where: { studentId, visibleToTutor: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }).catch(() => []),
  ]);

  const promedio = avg(student.grades.map((g) => g.score));
  const pres = student.attendance.filter((a) => a.status === "PRESENTE" || a.status === "TARDE").length;

  return (
    <div className="grid gap-6">
      <Link href="/portal/padre" className="text-sm font-bold text-[var(--institutional)] underline">
        ← Volver a Mis estudiantes
      </Link>

      <section className="rounded-2xl bg-[var(--institutional)] px-6 py-5 text-white">
        <p className="text-xs uppercase tracking-wide text-stone-300">Ficha del estudiante</p>
        <h1 className="text-xl font-extrabold">
          {student.user.firstName} {student.user.lastName}
        </h1>
        <p className="mt-1 text-sm text-stone-200">
          {student.academic?.name ?? "Bachillerato por confirmar"}
          {student.group ? ` · ${student.group.name}${student.group.section ? ` - Sección ${student.group.section}` : ""}` : ""}
        </p>
        <p className="mt-1 text-xs text-stone-300">CI {student.user.ci} · {student.user.email ?? "sin correo vinculado"}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-white/15 px-3 py-1">Promedio {promedio !== null ? promedio.toFixed(2) : "—"}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Asistencia {student.attendance.length ? `${pres}/${student.attendance.length}` : "—"}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">{docs.length} documentos</span>
          <Link href={`/portal/padre/docentes?hijo=${studentId}`} className="rounded-full bg-[var(--gold)] px-3 py-1 text-white hover:opacity-90">
            Ver docentes de su curso →
          </Link>
        </div>
      </section>

      <MecLinksCenter />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-extrabold text-[var(--institutional)]">Fotos de listas</h2>
          <PhotoLogView kind="ASISTENCIA" />
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-extrabold text-[var(--institutional)]">Fotos de planillas</h2>
          <PhotoLogView kind="TAREA" />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-extrabold text-[var(--institutional)]">Calificaciones</h2>
          {student.grades.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Sin notas todavía.</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-4">Materia</th><th className="py-2 pr-4">Período</th><th className="py-2">Nota</th>
                </tr></thead>
                <tbody>
                  {student.grades.map((g) => (
                    <tr key={g.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{g.subject.name}</td>
                      <td className="py-2 pr-4 text-slate-500">{g.period.name}</td>
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-extrabold text-[var(--institutional)]">Asistencia (últimos 60)</h2>
          {student.attendance.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Sin registros.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {student.attendance.slice(0, 12).map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>{new Date(a.classDate).toLocaleDateString("es-PY")}{a.subject ? ` · ${a.subject.name}` : ""}</span>
                  <span className="rounded bg-slate-200 px-2 py-0.5 font-bold">{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-extrabold text-[var(--institutional)]">Documentos y planillas</h2>
          <p className="mt-1 text-xs text-slate-500">Publicados por el docente y visibles para el tutor.</p>
          {docs.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Sin documentos publicados.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                  <span><strong>{d.title}</strong>
                    <span className="block text-xs text-slate-500">{d.type}{d.subject ? ` · ${d.subject.name}` : ""} · {(d.size / 1024).toFixed(0)} KB</span>
                  </span>
                  <a href={`/api/documents/${d.id}/file`} target="_blank" rel="noreferrer" className="shrink-0 font-bold text-[var(--institutional)] underline">Ver</a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-extrabold text-[var(--institutional)]">Observaciones</h2>
          {obs.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Sin observaciones.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {obs.map((o) => (
                <li key={o.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <p>{o.text}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString("es-PY")}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
