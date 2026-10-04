"use client";

import { useEffect, useState } from "react";

type Subject = { id: string; code: string; name: string; gradeYear: number; academic?: { shortName: string; name: string } | null };
type Period = { id: string; label: string; name: string };
type Student = {
  id: string;
  academic?: { shortName: string; name: string } | null;
  user: { firstName: string; lastName: string; ci: string; email: string };
  grades: { id: string; score: number; note?: string | null; subject: { code: string; name: string }; period: { label: string; name: string } }[];
};

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

/** Panel funcional del docente: cargar notas, pasar asistencia y crear tareas. */
export default function TeacherTools() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subject, setSubject] = useState("");
  const [period, setPeriod] = useState("");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form nota
  const [gradeForm, setGradeForm] = useState({ studentId: "", score: "", note: "" });
  // Form asistencia
  const [attForm, setAttForm] = useState({ studentId: "", date: new Date().toISOString().slice(0, 10), status: "PRESENTE", note: "" });
  // Form tarea
  const [taskForm, setTaskForm] = useState({ title: "", description: "", dueDate: "" });
  // Documentos / planillas
  type DocItem = {
    id: string; title: string; type: string; mime: string; size: number;
    fileUrl: string; visibleToTutor: boolean; createdAt: string;
    subject?: { code: string; name: string } | null;
  };
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [docForm, setDocForm] = useState({ title: "", type: "PLANILLA", visible: true });
  const [docFile, setDocFile] = useState<File | null>(null);

  async function loadDocs() {
    try {
      const qs = new URLSearchParams();
      if (subject) qs.set("subject", subject);
      const res = await fetch(`/api/documents?${qs.toString()}`);
      const json = await res.json();
      if (res.ok) setDocs(json.data ?? []);
    } catch { /* panel sigue útil sin documentos */ }
  }

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, period]);

  const filtered = students.filter((s) =>
    `${s.user.firstName} ${s.user.lastName} ${s.user.ci}`.toLowerCase().includes(search.toLowerCase())
  );

  async function submitGrade(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const score = Number(gradeForm.score);
    if (!gradeForm.studentId || !subject || !period || Number.isNaN(score) || score < 1 || score > 5) {
      setMsg("Elegí alumno, materia, período y una nota entre 1 y 5.");
      return;
    }
    const res = await fetch("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: gradeForm.studentId,
        subjectCode: subject,
        periodLabel: period,
        score,
        note: gradeForm.note || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo guardar la nota");
    else {
      setMsg(`Nota ${score.toFixed(1)} guardada correctamente.`);
      setGradeForm({ studentId: "", score: "", note: "" });
      load();
    }
  }

  async function submitAttendance(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!attForm.studentId || !attForm.date || !attForm.status) {
      setMsg("Elegí alumno, fecha y estado para la asistencia.");
      return;
    }
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: attForm.studentId,
        subjectCode: subject || undefined,
        classDate: new Date(attForm.date).toISOString(),
        status: attForm.status,
        note: attForm.note || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo registrar la asistencia");
    else {
      setMsg(`Asistencia (${attForm.status}) registrada.`);
      setAttForm((f) => ({ ...f, studentId: "", note: "" }));
    }
  }

  async function submitTask(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!subject || !taskForm.title.trim()) {
      setMsg("Elegí la materia y escribí el título de la tarea.");
      return;
    }
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectCode: subject,
        title: taskForm.title.trim(),
        description: taskForm.description || undefined,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined,
        periodLabel: period || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo crear la tarea");
    else {
      setMsg("Tarea publicada para los alumnos de la materia.");
      setTaskForm({ title: "", description: "", dueDate: "" });
    }
  }

  async function submitDoc(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!docFile || !docForm.title.trim()) {
      setMsg("Elegí un archivo PDF/JPG/PNG y un título.");
      return;
    }
    const fd = new FormData();
    fd.set("file", docFile);
    fd.set("title", docForm.title.trim());
    fd.set("type", docForm.type);
    fd.set("visibleToTutor", docForm.visible ? "true" : "false");
    if (subject) fd.set("subjectCode", subject);
    if (period) fd.set("periodLabel", period);
    const res = await fetch("/api/documents", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo subir el documento");
    else {
      setMsg(`Planilla "${docForm.title.trim()}" subida.`);
      setDocForm({ title: "", type: "PLANILLA", visible: true });
      setDocFile(null);
      loadDocs();
    }
  }

  async function deleteDoc(id: string) {
    if (!confirm("¿Eliminar este documento?")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo eliminar");
    else {
      setMsg("Documento eliminado.");
      loadDocs();
    }
  }

  return (
    <div className="grid gap-6">
      {msg && (
        <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{msg}</p>
      )}

      {/* Filtros */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Mis cursos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Filtrá por materia y período. La lista muestra alumnos con su nota actual en ese filtro.
        </p>
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

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-4">Alumno</th>
                <th className="py-2 pr-4">C.I.</th>
                <th className="py-2 pr-4">Bachillerato</th>
                <th className="py-2">Nota actual</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="py-4 text-slate-500">Cargando nómina…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-slate-500">Sin alumnos para este filtro.</td></tr>
              ) : (
                filtered.slice(0, 80).map((s) => {
                  const g = s.grades[0];
                  return (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-semibold">{s.user.firstName} {s.user.lastName}</td>
                      <td className="py-2 pr-4 text-slate-500">{s.user.ci}</td>
                      <td className="py-2 pr-4 text-slate-500">{s.academic?.shortName ?? "—"}</td>
                      <td className="py-2">
                        {g ? (
                          <span className={`rounded px-2 py-0.5 font-bold ${g.score >= 4 ? "bg-emerald-100 text-emerald-800" : g.score >= 3 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                            {g.score.toFixed(1)} · {g.subject.code}
                          </span>
                        ) : (
                          <span className="text-slate-400">Sin nota</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {filtered.length > 80 && (
            <p className="mt-2 text-xs text-slate-400">Mostrando 80 de {filtered.length}. Usá el buscador para filtrar.</p>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cargar nota */}
        <form onSubmit={submitGrade} className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-extrabold text-[var(--institutional)]">Cargar nota (1–5)</h3>
          <label className="mt-3 block text-sm font-semibold text-slate-700">
            Alumno
            <select value={gradeForm.studentId} onChange={(e) => setGradeForm((f) => ({ ...f, studentId: e.target.value }))} className={inputCls}>
              <option value="">— Seleccioná —</option>
              {filtered.slice(0, 200).map((s) => (
                <option key={s.id} value={s.id}>{s.user.firstName} {s.user.lastName} · {s.user.ci}</option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-sm font-semibold text-slate-700">
            Nota
            <input type="number" min={1} max={5} step={0.1} value={gradeForm.score} onChange={(e) => setGradeForm((f) => ({ ...f, score: e.target.value }))} placeholder="Ej: 4.5" className={inputCls} />
          </label>
          <label className="mt-3 block text-sm font-semibold text-slate-700">
            Observación (opcional)
            <input value={gradeForm.note} onChange={(e) => setGradeForm((f) => ({ ...f, note: e.target.value }))} placeholder="Ej: Recuperatorio" className={inputCls} />
          </label>
          <button className="btn-primary mt-4 w-full justify-center" type="submit">Guardar nota</button>
          <p className="mt-2 text-xs text-slate-400">Usa la materia y período del filtro superior.</p>
        </form>

        {/* Asistencia */}
        <form onSubmit={submitAttendance} className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-extrabold text-[var(--institutional)]">Pasar asistencia</h3>
          <label className="mt-3 block text-sm font-semibold text-slate-700">
            Alumno
            <select value={attForm.studentId} onChange={(e) => setAttForm((f) => ({ ...f, studentId: e.target.value }))} className={inputCls}>
              <option value="">— Seleccioná —</option>
              {filtered.slice(0, 200).map((s) => (
                <option key={s.id} value={s.id}>{s.user.firstName} {s.user.lastName}</option>
              ))}
            </select>
          </label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Fecha
              <input type="date" value={attForm.date} onChange={(e) => setAttForm((f) => ({ ...f, date: e.target.value }))} className={inputCls} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Estado
              <select value={attForm.status} onChange={(e) => setAttForm((f) => ({ ...f, status: e.target.value }))} className={inputCls}>
                <option value="PRESENTE">Presente</option>
                <option value="TARDE">Tarde</option>
                <option value="AUSENTE">Ausente</option>
                <option value="JUSTIFICADO">Justificado</option>
              </select>
            </label>
          </div>
          <label className="mt-3 block text-sm font-semibold text-slate-700">
            Nota (opcional)
            <input value={attForm.note} onChange={(e) => setAttForm((f) => ({ ...f, note: e.target.value }))} className={inputCls} />
          </label>
          <button className="btn-primary mt-4 w-full justify-center" type="submit">Registrar</button>
        </form>

        {/* Tarea */}
        <form onSubmit={submitTask} className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-extrabold text-[var(--institutional)]">Crear tarea</h3>
          <label className="mt-3 block text-sm font-semibold text-slate-700">
            Título
            <input value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ej: Práctico N.º 3" className={inputCls} />
          </label>
          <label className="mt-3 block text-sm font-semibold text-slate-700">
            Descripción
            <textarea value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} rows={3} className={inputCls} />
          </label>
          <label className="mt-3 block text-sm font-semibold text-slate-700">
            Vencimiento
            <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))} className={inputCls} />
          </label>
          <button className="btn-gold mt-4 w-full justify-center" type="submit">Publicar tarea</button>
          <p className="mt-2 text-xs text-slate-400">Se publica para la materia del filtro superior.</p>
        </form>
      </div>

      {/* Subir planilla + documentos */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Planillas y documentos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Subí PDF/JPG/PNG (máx 10 MB). Marcá si el tutor puede verlo.
        </p>
        <form onSubmit={submitDoc} className="mt-4 grid gap-3 sm:grid-cols-4">
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Título
            <input value={docForm.title} onChange={(e) => setDocForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ej: Planilla 2ºB Matemática" className={inputCls} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Tipo
            <select value={docForm.type} onChange={(e) => setDocForm((f) => ({ ...f, type: e.target.value }))} className={inputCls}>
              <option value="PLANILLA">Planilla</option>
              <option value="BOLETIN">Boletín</option>
              <option value="CERTIFICADO">Certificado</option>
              <option value="DOCUMENTO">Documento</option>
              <option value="FOTO">Foto</option>
              <option value="OTRO">Otro</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Archivo
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} className={inputCls} />
          </label>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={docForm.visible} onChange={(e) => setDocForm((f) => ({ ...f, visible: e.target.checked }))} />
            Visible para el tutor
          </label>
          <button onClick={submitDoc} className="btn-primary justify-center" type="button">Subir planilla</button>
          <p className="text-xs text-slate-400">Usa la materia y período del filtro superior.</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-4">Título</th>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Tamaño</th>
                <th className="py-2 pr-4">Tutor</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr><td colSpan={5} className="py-4 text-slate-500">Sin documentos para este filtro.</td></tr>
              ) : (
                docs.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-semibold">{d.title}</td>
                    <td className="py-2 pr-4 text-slate-500">{d.type}</td>
                    <td className="py-2 pr-4 text-slate-500">{(d.size / 1024).toFixed(0)} KB</td>
                    <td className="py-2 pr-4 text-slate-500">{d.visibleToTutor ? "Sí" : "No"}</td>
                    <td className="py-2">
                      <a href={d.fileUrl} target="_blank" rel="noreferrer" className="mr-3 font-bold text-[var(--institutional)] underline">Ver</a>
                      <button onClick={() => deleteDoc(d.id)} className="font-bold text-red-700 underline" type="button">Eliminar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
