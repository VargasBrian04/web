"use client";

import { useEffect, useState } from "react";
import TeacherProfile from "./TeacherProfile";

type Subject = { id: string; code: string; name: string; gradeYear: number; academic?: { shortName: string; name: string } | null };
type Period = { id: string; label: string; name: string };
type Student = {
  id: string;
  academic?: { shortName: string; name: string } | null;
  user: { firstName: string; lastName: string; ci: string; email: string };
  grades: { id: string; score: number; note?: string | null; subject: { code: string; name: string }; period: { label: string; name: string } }[];
};
type Task = {
  id: string; title: string; description: string | null; fileData: string | null;
  notes: string | null; dueDate: string | null; createdAt: string;
  subject: { code: string; name: string };
  submissions: { id: string; studentId: string; status: string; submittedAt: string | null; feedback: string | null; student?: { user?: { firstName: string; lastName: string } } }[];
};
type Att = {
  id: string; classDate: string; status: string; note: string | null;
  student: { id: string; user: { firstName: string; lastName: string } };
  subject: { code: string; name: string } | null;
};

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

const ATT_NEXT: Record<string, string> = {
  PRESENTE: "TARDE",
  TARDE: "AUSENTE",
  AUSENTE: "JUSTIFICADO",
  JUSTIFICADO: "PRESENTE",
};
const ATT_SHORT: Record<string, string> = {
  PRESENTE: "P",
  TARDE: "T",
  AUSENTE: "A",
  JUSTIFICADO: "J",
};
const ATT_CLS: Record<string, string> = {
  PRESENTE: "bg-emerald-100 text-emerald-800",
  TARDE: "bg-amber-100 text-amber-800",
  AUSENTE: "bg-red-100 text-red-800",
  JUSTIFICADO: "bg-blue-100 text-blue-800",
};

/** Panel del docente: nómina, registro de tareas, lista de asistencias y crear tareas con PDF. */
export default function TeacherTools() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subject, setSubject] = useState("");
  const [period, setPeriod] = useState("");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [atts, setAtts] = useState<Att[]>([]);
  const [quickGrade, setQuickGrade] = useState<Record<string, string>>({});

  const [taskForm, setTaskForm] = useState({ title: "", description: "", dueDate: "", notes: "" });
  const [taskFile, setTaskFile] = useState<File | null>(null);

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (subject) qs.set("subject", subject);
      if (period) qs.set("period", period);
      const res = await fetch(`/api/teacher/roster?${qs.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setSubjects(json.data.subjects?.length ? json.data.subjects : json.data.allSubjects ?? []);
        setPeriods(json.data.periods ?? []);
        setStudents(json.data.students ?? []);
        if (!period && json.data.periods?.[0]) setPeriod(json.data.periods[0].label);
      } else {
        setMsg(json.error || "No se pudo cargar la nómina");
      }
    } catch {
      setMsg("Error de red al cargar la nómina");
    } finally {
      setLoading(false);
    }
  }

  async function loadTasks() {
    try {
      const qs = new URLSearchParams();
      if (subject) qs.set("subject", subject);
      const res = await fetch(`/api/assignments?${qs.toString()}`);
      const json = await res.json();
      if (res.ok) setTasks(json.data ?? []);
    } catch { /* opcional */ }
  }

  async function loadAtts() {
    try {
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const qs = new URLSearchParams({ from: from.toISOString().slice(0, 10) });
      if (subject) qs.set("subject", subject);
      const res = await fetch(`/api/attendance?${qs.toString()}`);
      const json = await res.json();
      if (res.ok) setAtts(json.data ?? []);
    } catch { /* opcional */ }
  }

  useEffect(() => {
    load();
    loadTasks();
    loadAtts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, period]);

  const filtered = students.filter((s) =>
    `${s.user.firstName} ${s.user.lastName} ${s.user.ci}`.toLowerCase().includes(search.toLowerCase())
  );

  async function saveQuickGrade(studentId: string) {
    const raw = (quickGrade[studentId] || "").trim().replace(",", ".");
    const score = Number(raw);
    if (!studentId || !subject || !period || Number.isNaN(score) || score < 1 || score > 5) {
      setMsg("Nota inválida (1 a 5) o falta materia/período.");
      return;
    }
    const res = await fetch("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, subjectCode: subject, periodLabel: period, score }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo guardar la nota");
    else {
      setMsg(`Nota ${score.toFixed(1)} guardada.`);
      setQuickGrade((q) => ({ ...q, [studentId]: "" }));
      load();
    }
  }

  async function cycleAttendance(studentId: string, current: Att | undefined) {
    const next = current ? ATT_NEXT[current.status] ?? "PRESENTE" : "PRESENTE";
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        subjectCode: subject || undefined,
        classDate: new Date().toISOString(),
        status: next,
      }),
    });
    if (res.ok) loadAtts();
    else setMsg("No se pudo marcar asistencia.");
  }

  async function deleteTask(id: string) {
    if (!window.confirm("¿Eliminar esta tarea y sus entregas?")) return;
    try {
      const res = await fetch(`/api/assignments?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo eliminar");
      else {
        setMsg("Tarea eliminada.");
        loadTasks();
      }
    } catch {
      setMsg("Error de red al eliminar");
    }
  }

  async function submitTask(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!subject || !taskForm.title.trim()) {
      setMsg("Elegí la materia y escribí el título de la tarea.");
      return;
    }
    if (taskFile && (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(taskFile.type) || taskFile.size > 4 * 1024 * 1024)) {
      setMsg("El adjunto debe ser PDF o foto de máx 4 MB.");
      return;
    }
    const fd = new FormData();
    fd.set("subjectCode", subject);
    fd.set("title", taskForm.title.trim());
    fd.set("description", taskForm.description);
    fd.set("dueDate", taskForm.dueDate);
    fd.set("periodLabel", period);
    fd.set("notes", taskForm.notes);
    if (taskFile) fd.set("file", taskFile);
    const res = await fetch("/api/assignments", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo crear la tarea");
    else {
      setMsg("Tarea publicada.");
      setTaskForm({ title: "", description: "", dueDate: "", notes: "" });
      setTaskFile(null);
      loadTasks();
    }
  }

  const dates = [...new Set(atts.map((a) => a.classDate.slice(0, 10)))].sort().reverse().slice(0, 8);
  const attByStudentDate: Record<string, Att> = {};
  atts.forEach((a) => {
    attByStudentDate[`${a.student.id}|${a.classDate.slice(0, 10)}`] = a;
  });
  const nameById: Record<string, string> = {};
  students.forEach((s) => {
    nameById[s.id] = `${s.user.firstName} ${s.user.lastName}`;
  });

  return (
    <div className="grid gap-6">
      {msg && (
        <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{msg}</p>
      )}

      <TeacherProfile />

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Mis cursos</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">
            Materia
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls}>
              <option value="">— Todas / Elegí —</option>
              {subjects.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Período
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className={inputCls}>
              <option value="">— Todos —</option>
              {periods.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Buscar alumno
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre o C.I." className={inputCls} />
          </label>
        </div>
        <div className="mt-3">
          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={() => {
              const rows = [
                ["Alumno", "CI", "Bachillerato", "Nota", "Materia"],
                ...filtered.map((s) => {
                  const g = s.grades[0];
                  return [
                    `${s.user.firstName} ${s.user.lastName}`,
                    s.user.ci,
                    s.academic?.shortName ?? "",
                    g ? String(g.score) : "",
                    g ? g.subject.code : "",
                  ];
                }),
              ];
              const csv = rows
                .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
                .join("\n");
              const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
              const a = document.createElement("a");
              a.href = url;
              a.download = `planilla-${subject || "todas"}-${period || "todos"}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            ⬇ Exportar planilla (Excel/CSV)
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="sticky top-0">
              <tr className="bg-[var(--institutional)] text-left text-white">
                <th className="px-4 py-3 font-bold">Alumno</th>
                <th className="px-4 py-3 font-bold">Bachillerato</th>
                <th className="px-4 py-3 text-center font-bold">Nota</th>
                <th className="px-4 py-3 text-center font-bold">Cargar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Cargando nómina…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Sin alumnos.</td></tr>
              ) : (
                filtered.slice(0, 80).map((s, idx) => {
                  const g = s.grades[0];
                  const initials = `${s.user.firstName[0] ?? ""}${s.user.lastName[0] ?? ""}`.toUpperCase();
                  return (
                    <tr key={s.id} className={`border-b last:border-0 transition-colors hover:bg-amber-50/60 ${idx % 2 ? "bg-stone-50/60" : ""}`}>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--institutional)] text-sm font-extrabold text-white">
                            {initials}
                          </span>
                          <span>
                            <span className="block font-bold text-slate-900">{s.user.firstName} {s.user.lastName}</span>
                            <span className="block text-xs text-slate-400">CI {s.user.ci}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          {s.academic?.shortName ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {g ? (
                          <span className={`inline-block min-w-12 rounded-lg px-2.5 py-1 font-extrabold ${g.score >= 4 ? "bg-emerald-100 text-emerald-800" : g.score >= 3 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                            {g.score.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={5}
                            step={0.1}
                            placeholder="1–5"
                            value={quickGrade[s.id] ?? ""}
                            onChange={(e) => setQuickGrade((q) => ({ ...q, [s.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") saveQuickGrade(s.id); }}
                            className="w-[70px] rounded-lg border border-slate-300 px-2 py-1.5 text-center text-sm font-bold outline-none focus:border-[var(--institutional)]"
                          />
                          <button
                            type="button"
                            onClick={() => saveQuickGrade(s.id)}
                            title="Guardar nota"
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gold)] text-base font-bold text-white shadow hover:opacity-90"
                          >
                            ✓
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Registro de tareas</h2>
        {tasks.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Sin tareas en esta materia.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {tasks.map((t) => {
              const pend = t.submissions.filter((s) => s.status === "PENDIENTE");
              const isImg = !!t.fileData && t.fileData.startsWith("data:image");
              return (
                <article key={t.id} className="overflow-hidden rounded-xl border border-stone-200">
                  {isImg && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.fileData as string} alt={t.title} className="max-h-64 w-full object-cover" loading="lazy" />
                  )}
                  <div className="p-4">
                    <p className="flex flex-wrap items-center justify-between gap-2 font-bold text-slate-900">
                      {t.title}
                      <button
                        type="button"
                        onClick={() => deleteTask(t.id)}
                        title="Eliminar tarea"
                        className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-200"
                      >
                        Eliminar
                      </button>
                    </p>
                    {t.description && <p className="mt-1 text-sm text-slate-600">{t.description}</p>}
                    {t.notes && (
                      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        📝 {t.notes}
                      </p>
                    )}
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold">
                        {pend.length} pendiente(s) / {t.submissions.length}
                      </span>
                      {t.dueDate && <span>Vence {new Date(t.dueDate).toLocaleDateString("es-PY")}</span>}
                      {t.fileData && !isImg && (
                        <a
                          href={t.fileData}
                          download={`${t.title}.pdf`}
                          className="font-bold text-[var(--institutional)] underline"
                        >
                          📄 Ver PDF
                        </a>
                      )}
                    </p>
                    {pend.length > 0 && (
                      <p className="mt-2 text-xs text-slate-500">
                        Pendientes:{" "}
                        {pend
                          .slice(0, 12)
                          .map((s) => nameById[s.studentId] ?? "—")
                          .join(", ")}
                        {pend.length > 12 ? ` (+${pend.length - 12})` : ""}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Lista de asistencias</h2>
        {filtered.length === 0 || dates.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Sin registros recientes.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {dates.map((d) => {
              const day = atts.filter((a) => a.classDate.slice(0, 10) === d);
              const pres = day.filter((a) => a.status === "PRESENTE" || a.status === "TARDE").length;
              const notes = day.filter((a) => a.note);
              const label = new Date(d + "T12:00:00").toLocaleDateString("es-PY", { weekday: "long", day: "2-digit", month: "2-digit" });
              return (
                <article key={d} className="overflow-hidden rounded-xl border border-stone-200">
                  <div className="p-4">
                    <p className="flex flex-wrap items-center justify-between gap-2 font-bold text-slate-900">
                      <span className="capitalize">{label}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                        {pres} presente(s) / {day.length}
                      </span>
                    </p>
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      {filtered.slice(0, 60).map((s) => {
                        const a = attByStudentDate[`${s.id}|${d}`];
                        const today = d === new Date().toISOString().slice(0, 10);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            disabled={!today && !!a}
                            title={`${s.user.firstName} ${s.user.lastName}${a?.note ? ` — ${a.note}` : ""}`}
                            onClick={() => cycleAttendance(s.id, a)}
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              a ? ATT_CLS[a.status] ?? "bg-slate-100" : "bg-slate-100 text-slate-400"
                            } ${!today && !!a ? "" : "hover:ring-2 hover:ring-[var(--gold)]"}`}
                          >
                            {s.user.firstName} {a ? ATT_SHORT[a.status] ?? "" : ""}
                          </button>
                        );
                      })}
                    </p>
                    {notes.length > 0 && (
                      <div className="mt-2 grid gap-1">
                        {notes.map((a) => (
                          <p key={a.id} className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
                            📝 {nameById[a.student.id] ?? ""}: {a.note}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <form
        onSubmit={submitTask}
        className="rounded-2xl border-2 border-[var(--gold)] bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Crear tarea</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
            Título <span className="text-red-600">*</span>
            <input value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ej: Práctico N.º 3" maxLength={160} className={inputCls} />
          </label>
          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
            Descripción
            <textarea value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} rows={3} className={inputCls} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Foto o PDF adjunto (máx 4 MB)
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" onChange={(e) => setTaskFile(e.target.files?.[0] ?? null)} className={inputCls} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Vencimiento
            <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))} className={inputCls} />
          </label>
          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
            Observaciones
            <textarea
              value={taskForm.notes}
              onChange={(e) => setTaskForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              maxLength={2000}
              placeholder="Ej: Ana Gómez comunicarse al 0981… · Pedro falta demasiado · Tarea en PDF de psicología caps. 3 y 4"
              className={inputCls}
            />
          </label>
        </div>
        <button className="btn-gold mt-4 w-full justify-center sm:w-auto" type="submit">Publicar tarea</button>
      </form>
    </div>
  );
}
