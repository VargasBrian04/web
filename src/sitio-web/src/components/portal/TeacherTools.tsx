"use client";

import { useEffect, useMemo, useState } from "react";
import TeacherProfile from "./TeacherProfile";

type Subject = { id: string; code: string; name: string; gradeYear: number; academic?: { shortName: string; name: string } | null };
type Period = { id: string; label: string; name: string };

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

function cursoLabel(s: Subject): string {
  return `${s.gradeYear}.º ${s.academic?.shortName ?? "Curso"}`;
}

/** Panel del docente organizado por curso: planilla, lista y tarea de cada materia. */
export default function TeacherTools() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [catalog, setCatalog] = useState<Subject[]>([]);
  const [addCode, setAddCode] = useState("");
  const [periods, setPeriods] = useState<Period[]>([]);
  const [curso, setCurso] = useState("");
  const [subject, setSubject] = useState("");
  const [period, setPeriod] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [logs, setLogs] = useState<PhotoLog[]>([]);
  const [logFile, setLogFile] = useState<File | null>(null);
  const [logCaption, setLogCaption] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));

  type PhotoLog = {
    id: string; kind: string; photoData: string; caption: string | null;
    logDate: string;
    subject: { code: string; name: string } | null;
    teacher: { user: { firstName: string; lastName: string } } | null;
  };

  const cursos = useMemo(() => {
    const map = new Map<string, Subject[]>();
    for (const s of subjects) {
      const k = cursoLabel(s);
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return [...map.entries()].map(([label, list]) => ({ label, list }));
  }, [subjects]);
  const materiasCurso = cursos.find((c) => c.label === curso)?.list ?? [];
  const materiaNombre = subjects.find((s) => s.code === subject)?.name ?? "";

  async function loadLogs() {
    try {
      const qs = new URLSearchParams();
      if (subject) qs.set("subject", subject);
      const res = await fetch(`/api/fotolog?${qs.toString()}`, { signal: AbortSignal.timeout(20000) });
      const json = await res.json();
      if (res.ok) {
        setLogs(json.data ?? []);
        setLoadError(false);
      } else {
        setMsg(json.error || "No se pudo cargar la bitácora");
        setLoadError(true);
      }
    } catch {
      setMsg("Tardó demasiado o falló la red al cargar la bitácora");
      setLoadError(true);
    }
  }

  async function submitLog(kind: "ASISTENCIA" | "TAREA") {
    setMsg(null);
    if (!subject) {
      setMsg("Elegí el curso y la materia arriba.");
      return;
    }
    if (!logFile) {
      setMsg("Sacá o elegí la foto de la lista.");
      return;
    }
    if (logFile.size > 4 * 1024 * 1024) {
      setMsg("Foto muy pesada (máx 4 MB).");
      return;
    }
    const fd = new FormData();
    fd.set("photo", logFile);
    fd.set("kind", kind);
    fd.set("logDate", logDate);
    fd.set("caption", logCaption.trim());
    fd.set("subjectCode", subject);
    const res = await fetch("/api/fotolog", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo subir");
    else {
      setMsg(kind === "ASISTENCIA" ? `Lista guardada en ${curso} · ${materiaNombre}.` : `Planilla guardada en ${curso} · ${materiaNombre}.`);
      setLogFile(null);
      setLogCaption("");
      loadLogs();
    }
  }

  async function confirmDeleteLog() {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!id) return;
    try {
      const res = await fetch(`/api/fotolog?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg("Foto eliminada.");
        loadLogs();
      } else setMsg("No se pudo eliminar");
    } catch {
      setMsg("Error de red al eliminar");
    }
  }

  const [taskForm, setTaskForm] = useState({ title: "", description: "", dueDate: "", notes: "" });
  const [taskFile, setTaskFile] = useState<File | null>(null);
  const [savingTask, setSavingTask] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const logToDelete = logs.find((l) => l.id === confirmDeleteId) ?? null;

  async function loadCatalog() {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/teacher/subjects", { signal: AbortSignal.timeout(20000) });
      const json = await res.json();
      if (res.ok) {
        setSubjects(json.data.links ?? []);
        setCatalog(json.data.catalog ?? []);
        setPeriods(json.data.periods ?? []);
        if (json.data.periods?.[0]) setPeriod((p) => p || json.data.periods[0].label);
      } else {
        setMsg(json.error || "No se pudieron cargar tus cursos");
        setLoadError(true);
      }
    } catch {
      setMsg("Tardó demasiado o falló la red al cargar tus cursos");
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  async function linkSubject(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!addCode) {
      setMsg("Elegí la materia para agregarla a tus cursos.");
      return;
    }
    const res = await fetch("/api/teacher/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectCode: addCode }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo agregar");
    else {
      setMsg(`Agregada a tus cursos: ${json.data.name}.`);
      setAddCode("");
      loadCatalog();
    }
  }

  async function unlinkSubject() {
    if (!subject) return;
    setMsg(null);
    const res = await fetch(`/api/teacher/subjects?subjectCode=${encodeURIComponent(subject)}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo quitar");
    else {
      setMsg("Materia desvinculada de tus cursos.");
      loadCatalog();
    }
  }

  function retryLoad() {
    setMsg(null);
    setLoadError(false);
    loadCatalog();
    loadLogs();
  }

  useEffect(() => {
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!subjects.length) return;
    const list = cursos.find((c) => c.label === curso)?.list ?? cursos[0]?.list ?? [];
    if (!cursos.some((c) => c.label === curso) && cursos[0]) setCurso(cursos[0].label);
    if (!list.some((s) => s.code === subject)) setSubject(list[0]?.code ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects]);

  useEffect(() => {
    if (subject) loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  function pickCurso(label: string) {
    setCurso(label);
    const list = cursos.find((c) => c.label === label)?.list ?? [];
    setSubject(list[0]?.code ?? "");
  }

  async function submitTask(e: React.FormEvent) {
    e.preventDefault();
    if (savingTask) return;
    setMsg(null);
    if (!subject || !taskForm.title.trim()) {
      setMsg("Elegí el curso y la materia arriba, y escribí el título de la tarea.");
      return;
    }
    if (taskFile && (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(taskFile.type) || taskFile.size > 4 * 1024 * 1024)) {
      setMsg("El adjunto debe ser PDF o foto de máx 4 MB.");
      return;
    }
    setSavingTask(true);
    try {
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
        setMsg(`Tarea publicada en ${curso} · ${materiaNombre}.`);
        setTaskForm({ title: "", description: "", dueDate: "", notes: "" });
        setTaskFile(null);
      }
    } catch {
      setMsg("Error de red al publicar la tarea");
    } finally {
      setSavingTask(false);
    }
  }

  const scopeLine = curso && materiaNombre ? `${curso} · ${materiaNombre}` : "";

  return (
    <div className="grid gap-6">
      {msg && (
        <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{msg}</p>
      )}
      {loadError && (
        <button
          type="button"
          onClick={retryLoad}
          className="w-fit rounded-lg bg-[var(--institutional)] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          Reintentar carga
        </button>
      )}

      <TeacherProfile />

      <section className="rounded-2xl border-2 border-[var(--institutional)] bg-white p-6">
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Mi curso y materia</h2>
        <p className="mt-1 text-sm text-slate-500">
          Todo lo que subas (planilla, lista o tarea) queda en el curso y materia elegidos.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">
            Curso
            <select value={curso} onChange={(e) => pickCurso(e.target.value)} className={inputCls} disabled={loading}>
              {loading ? (
                <option>Cargando cursos…</option>
              ) : cursos.length === 0 ? (
                <option value="">Sin cursos asignados</option>
              ) : (
                cursos.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Materia
            <span className="flex items-center gap-1.5">
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} disabled={loading}>
                {materiasCurso.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
              {subject && (
                <button
                  type="button"
                  onClick={unlinkSubject}
                  title="Dejar de enseñar esta materia"
                  className="mt-1 shrink-0 rounded-lg border border-red-200 px-2.5 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                >
                  Quitar
                </button>
              )}
            </span>
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
        </div>
        <form onSubmit={linkSubject} className="mt-4 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-4">
          <label className="min-w-0 flex-1 text-sm font-semibold text-slate-700">
            Agregar materia que enseño
            <select value={addCode} onChange={(e) => setAddCode(e.target.value)} className={inputCls} disabled={loading}>
              <option value="">— Elegí del catálogo —</option>
              {catalog
                .filter((s) => !subjects.some((m) => m.code === s.code))
                .map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.gradeYear}.º {s.academic?.shortName ?? ""} · {s.name}
                  </option>
                ))}
            </select>
          </label>
          <button type="submit" className="rounded-lg bg-[var(--institutional)] px-4 py-2 text-sm font-bold text-white hover:opacity-90">
            Vincularme
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Registro de tareas</h2>
        {scopeLine && <p className="mt-1 text-sm font-semibold text-[var(--gold)]">{scopeLine}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block text-sm font-semibold text-slate-700">
            Foto de la planilla
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setLogFile(e.target.files?.[0] ?? null)}
              className={inputCls}
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Fecha
            <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className={inputCls} />
          </label>
        </div>
        <label className="mt-3 block text-sm font-semibold text-slate-700">
          Observación
          <input
            value={logCaption}
            onChange={(e) => setLogCaption(e.target.value)}
            maxLength={500}
            placeholder="Ej: Ana Gómez no pasa la materia"
            className={inputCls}
          />
        </label>
        <button type="button" onClick={() => submitLog("TAREA")} className="btn-gold mt-3">
          Subir planilla
        </button>
        <div className="mt-4 grid gap-3">
          {logs.filter((l) => l.kind === "TAREA").length === 0 ? (
            <p className="text-sm text-slate-500">Sin planillas todavía.</p>
          ) : (
            logs
              .filter((l) => l.kind === "TAREA")
              .map((l) => (
                <article key={l.id} className="overflow-hidden rounded-xl border border-stone-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.photoData} alt="Planilla" className="max-h-96 w-full object-contain bg-stone-100" loading="lazy" />
                  <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <p className="text-sm text-slate-600">
                      {new Date(l.logDate).toLocaleDateString("es-PY")}
                      {l.caption ? ` — ${l.caption}` : ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(l.id)}
                      className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-200"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Lista de asistencias</h2>
        {scopeLine && <p className="mt-1 text-sm font-semibold text-[var(--gold)]">{scopeLine}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block text-sm font-semibold text-slate-700">
            Foto de la lista (con fecha de hoy)
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setLogFile(e.target.files?.[0] ?? null)}
              className={inputCls}
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Fecha
            <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className={inputCls} />
          </label>
        </div>
        <label className="mt-3 block text-sm font-semibold text-slate-700">
          Observación
          <input
            value={logCaption}
            onChange={(e) => setLogCaption(e.target.value)}
            maxLength={500}
            placeholder="Ej: Pedro falta demasiado"
            className={inputCls}
          />
        </label>
        <button type="button" onClick={() => submitLog("ASISTENCIA")} className="btn-gold mt-3">
          Subir lista
        </button>
        <div className="mt-4 grid gap-3">
          {logs.filter((l) => l.kind === "ASISTENCIA").length === 0 ? (
            <p className="text-sm text-slate-500">Sin listas todavía.</p>
          ) : (
            logs
              .filter((l) => l.kind === "ASISTENCIA")
              .map((l) => (
                <article key={l.id} className="overflow-hidden rounded-xl border border-stone-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.photoData} alt="Lista" className="max-h-96 w-full object-contain bg-stone-100" loading="lazy" />
                  <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <p className="text-sm text-slate-600">
                      {new Date(l.logDate).toLocaleDateString("es-PY")}
                      {l.caption ? ` — ${l.caption}` : ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(l.id)}
                      className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-200"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))
          )}
        </div>
      </section>

      <form
        onSubmit={submitTask}
        className="relative rounded-2xl border-2 border-[var(--gold)] bg-white p-6 shadow-sm"
      >
        {savingTask && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/85">
            <span className="h-11 w-11 animate-spin rounded-full border-4 border-slate-300 border-t-[var(--institutional)]" />
            <p className="text-sm font-extrabold text-[var(--institutional)]">
              Subiendo tarea{scopeLine ? ` a ${scopeLine}` : ""}…
            </p>
          </div>
        )}
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Crear tarea</h2>
        {scopeLine && <p className="mt-1 text-sm font-semibold text-[var(--gold)]">{scopeLine}</p>}
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
        <button className="btn-gold mt-4 w-full justify-center disabled:opacity-50 sm:w-auto" type="submit" disabled={savingTask}>{savingTask ? "Subiendo…" : "Publicar tarea"}</button>
      </form>

      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[var(--institutional)] p-5 text-white">
              <h3 className="text-lg font-extrabold">Eliminar foto</h3>
              <p className="mt-1 text-sm text-stone-200">
                {logToDelete.kind === "ASISTENCIA" ? "Lista de asistencia" : "Planilla de tareas"}
                {" · "}
                {new Date(logToDelete.logDate).toLocaleDateString("es-PY")}
                {logToDelete.caption ? ` — ${logToDelete.caption}` : ""}
              </p>
            </div>
            <p className="px-5 pt-4 text-sm text-slate-600">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2 p-5">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteLog}
                className="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-800"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
