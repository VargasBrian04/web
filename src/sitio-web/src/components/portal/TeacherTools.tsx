"use client";

import { useEffect, useMemo, useState } from "react";
import TeacherProfile from "./TeacherProfile";

type Subject = { id: string; code: string; name: string; gradeYear: number; academic?: { shortName: string; name: string } | null };

const inputCls =
  "mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

function cursoLabel(s: Subject): string {
  return `${s.gradeYear}.º ${s.academic?.shortName ?? "Curso"}`;
}

function isHeic(f: File): boolean {
  return f.type === "image/heic" || f.type === "image/heif" || /\.hei(c|f)$/i.test(f.name);
}

const HEIC_MSG = "Tu foto está en formato HEIC (iPhone). Cambialo en Ajustes → Cámara → Formatos → Más compatible, o elegí la foto desde la galería.";

/** Comprime una foto en el teléfono (máx 1920px, JPEG) hasta ≤4 MB. */
function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      const steps: [number, number][] = [[1920, 0.82], [1280, 0.72], [960, 0.62]];
      const attempt = (i: number) => {
        if (i >= steps.length) {
          reject(new Error("pesada"));
          return;
        }
        const [max, q] = steps[i];
        const r = Math.min(1, max / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * r));
        canvas.height = Math.max(1, Math.round(img.height * r));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (b) => {
            if (b && b.size <= 4 * 1024 * 1024) {
              resolve(new File([b], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }));
            } else attempt(i + 1);
          },
          "image/jpeg",
          q
        );
      };
      attempt(0);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("formato"));
    };
    img.src = url;
  });
}

/** Panel del docente: curso y materia globales, planilla, lista y tarea. */
export default function TeacherTools() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [catalog, setCatalog] = useState<Subject[]>([]);
  const [addCode, setAddCode] = useState("");
  const [curso, setCurso] = useState("");
  const [subject, setSubject] = useState("");
  const [period, setPeriod] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [logs, setLogs] = useState<PhotoLog[]>([]);
  const [planFile, setPlanFile] = useState<File | null>(null);
  const [planCaption, setPlanCaption] = useState("");
  const [planDate, setPlanDate] = useState(new Date().toISOString().slice(0, 10));
  const [listaFile, setListaFile] = useState<File | null>(null);
  const [listaCaption, setListaCaption] = useState("");
  const [listaDate, setListaDate] = useState(new Date().toISOString().slice(0, 10));

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

  const fotoPreview = useMemo(() => {
    if (!planFile || !planFile.type.startsWith("image/")) return null;
    return URL.createObjectURL(planFile);
  }, [planFile]);
  useEffect(() => () => {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
  }, [fotoPreview]);
  const listaPreview = useMemo(() => {
    if (!listaFile || !listaFile.type.startsWith("image/")) return null;
    return URL.createObjectURL(listaFile);
  }, [listaFile]);
  useEffect(() => () => {
    if (listaPreview) URL.revokeObjectURL(listaPreview);
  }, [listaPreview]);

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
    const fileRaw = kind === "TAREA" ? planFile : listaFile;
    const caption = (kind === "TAREA" ? planCaption : listaCaption).trim();
    const date = kind === "TAREA" ? planDate : listaDate;
    if (!fileRaw) {
      setMsg("Sacá o elegí la foto.");
      return;
    }
    if (isHeic(fileRaw)) {
      setMsg(HEIC_MSG);
      return;
    }
    let file = fileRaw;
    if (file.size > 4 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      if (!file.type.startsWith("image/")) {
        setMsg("La foto debe ser PNG, JPG o WEBP.");
        return;
      }
      setMsg("Comprimiendo foto para subirla…");
      try {
        file = await compressImage(fileRaw);
        setMsg(null);
      } catch {
        setMsg("No se pudo procesar la foto. Probá con una más liviana.");
        return;
      }
    }
    const fd = new FormData();
    fd.set("photo", file);
    fd.set("kind", kind);
    fd.set("logDate", date);
    fd.set("caption", caption);
    fd.set("subjectCode", subject);
    const res = await fetch("/api/fotolog", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo subir");
    else {
      setMsg(kind === "ASISTENCIA" ? `Lista guardada en ${curso} · ${materiaNombre}.` : `Planilla guardada en ${curso} · ${materiaNombre}.`);
      if (kind === "TAREA") {
        setPlanFile(null);
        setPlanCaption("");
      } else {
        setListaFile(null);
        setListaCaption("");
      }
      loadLogs();
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* sin scroll */ }
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

  const taskPreview = useMemo(() => {
    if (!taskFile || !taskFile.type.startsWith("image/")) return null;
    return URL.createObjectURL(taskFile);
  }, [taskFile]);
  useEffect(() => () => {
    if (taskPreview) URL.revokeObjectURL(taskPreview);
  }, [taskPreview]);

  async function loadCatalog() {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/teacher/subjects", { signal: AbortSignal.timeout(20000) });
      const json = await res.json();
      if (res.ok) {
        setSubjects(json.data.links ?? []);
        setCatalog(json.data.catalog ?? []);
        const ps: { label: string }[] = json.data.periods ?? [];
        if (ps[0]) setPeriod((p) => p || ps[0].label);
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
    if (!subjects.length || !cursos.length) return;
    const list = cursos.find((c) => c.label === curso)?.list ?? cursos[0].list;
    if (!cursos.some((c) => c.label === curso)) setCurso(cursos[0].label);
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

  async function submitTask(e: React.FormEvent) {
    e.preventDefault();
    if (savingTask) return;
    setMsg(null);
    if (!subject || !taskForm.title.trim()) {
      setMsg("Elegí el curso y la materia arriba, y escribí el título de la tarea.");
      return;
    }
    let fileToSend = taskFile;
    if (taskFile) {
      if (taskFile.type === "application/pdf") {
        if (taskFile.size > 4 * 1024 * 1024) {
          setMsg("El PDF supera los 4 MB.");
          return;
        }
      } else if (isHeic(taskFile)) {
        setMsg(HEIC_MSG);
        return;
      } else if (taskFile.type.startsWith("image/")) {
        if (!["image/png", "image/jpeg", "image/webp"].includes(taskFile.type) || taskFile.size > 4 * 1024 * 1024) {
          setMsg("Comprimiendo foto para subirla…");
          try {
            fileToSend = await compressImage(taskFile);
            setMsg(null);
          } catch {
            setMsg("No se pudo procesar la foto. Probá con una más liviana o PDF.");
            return;
          }
        }
      } else {
        setMsg("El adjunto debe ser PDF o foto.");
        return;
      }
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
      if (fileToSend) fd.set("file", fileToSend);
      const res = await fetch("/api/assignments", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo crear la tarea");
      else {
        setMsg(`Tarea publicada en ${curso} · ${materiaNombre}.`);
        setTaskForm({ title: "", description: "", dueDate: "", notes: "" });
        setTaskFile(null);
        try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* sin scroll */ }
      }
    } catch {
      setMsg("Error de red al publicar la tarea");
    } finally {
      setSavingTask(false);
    }
  }

  const scopeLine = curso && materiaNombre ? `${curso} · ${materiaNombre}` : "";

  return (
    <div className="grid gap-4 sm:gap-6">
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

      <section className="rounded-2xl border-2 border-[var(--institutional)] bg-white p-4 sm:p-6">
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Mi curso y materia</h2>
        <p className="mt-1 text-sm text-slate-500">
          Todo lo que subas (planilla, lista o tarea) queda en el curso y materia elegidos.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
        </div>
        <form onSubmit={linkSubject} className="mt-4 flex flex-col gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-sm font-semibold text-slate-700">
            Agregar materia que enseño
            <select value={addCode} onChange={(e) => setAddCode(e.target.value)} className={inputCls} disabled={loading}>
              <option value="">— Todas las materias —</option>
              {catalog.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.gradeYear}.º {s.academic?.shortName ?? ""} · {s.name}
                  {subjects.some((m) => m.code === s.code) ? " ✓" : ""}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-lg bg-[var(--institutional)] px-4 py-2 text-sm font-bold text-white hover:opacity-90">
            Vincularme
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Registro de tareas</h2>
        {scopeLine && <p className="mt-1 text-sm font-semibold text-[var(--gold)]">{scopeLine}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block min-w-0 text-sm font-semibold text-slate-700">
            Foto de la planilla
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setPlanFile(e.target.files?.[0] ?? null)}
              className={inputCls}
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Fecha
            <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} className={inputCls} />
          </label>
        </div>
        {fotoPreview && (
          <div className="relative mt-3 w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoPreview} alt="Vista previa" className="max-h-48 rounded-xl border border-stone-200 object-contain" />
            <button
              type="button"
              onClick={() => setPlanFile(null)}
              title="Quitar foto"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        )}
        <label className="mt-3 block text-sm font-semibold text-slate-700">
          Observación
          <input
            value={planCaption}
            onChange={(e) => setPlanCaption(e.target.value)}
            maxLength={500}
            placeholder="Observación de la planilla"
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

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Lista de asistencias</h2>
        {scopeLine && <p className="mt-1 text-sm font-semibold text-[var(--gold)]">{scopeLine}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block min-w-0 text-sm font-semibold text-slate-700">
            Foto de la lista (con fecha de hoy)
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setListaFile(e.target.files?.[0] ?? null)}
              className={inputCls}
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Fecha
            <input type="date" value={listaDate} onChange={(e) => setListaDate(e.target.value)} className={inputCls} />
          </label>
        </div>
        {listaPreview && (
          <div className="relative mt-3 w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={listaPreview} alt="Vista previa" className="max-h-48 rounded-xl border border-stone-200 object-contain" />
            <button
              type="button"
              onClick={() => setListaFile(null)}
              title="Quitar foto"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        )}
        <label className="mt-3 block text-sm font-semibold text-slate-700">
          Observación
          <input
            value={listaCaption}
            onChange={(e) => setListaCaption(e.target.value)}
            maxLength={500}
            placeholder="Observación de la lista"
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
        className="relative rounded-2xl border-2 border-[var(--gold)] bg-white p-4 shadow-sm sm:p-6"
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
            <input value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} placeholder="Título de la tarea" maxLength={160} className={inputCls} />
          </label>
          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
            Descripción
            <textarea value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Descripción de la tarea" className={inputCls} />
          </label>
          <label className="block min-w-0 text-sm font-semibold text-slate-700">
            Foto o PDF adjunto (máx 4 MB)
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" onChange={(e) => setTaskFile(e.target.files?.[0] ?? null)} className={inputCls} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Vencimiento
            <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))} className={inputCls} />
          </label>
          {taskFile ? (
            taskPreview ? (
              <div className="relative w-fit sm:col-span-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={taskPreview} alt="Vista previa del adjunto" className="max-h-48 rounded-xl border border-stone-200 object-contain" />
                <button
                  type="button"
                  onClick={() => setTaskFile(null)}
                  title="Quitar adjunto"
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  ✕
                </button>
              </div>
            ) : (
              <p className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-slate-600 sm:col-span-2">
                <span className="font-bold">PDF:</span> {taskFile.name} ({(taskFile.size / 1024 / 1024).toFixed(1)} MB)
                <button
                  type="button"
                  onClick={() => setTaskFile(null)}
                  className="rounded-lg bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 hover:bg-red-200"
                >
                  Quitar
                </button>
              </p>
            )
          ) : null}
          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
            Observaciones
            <textarea
              value={taskForm.notes}
              onChange={(e) => setTaskForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              maxLength={2000}
              placeholder="Observaciones de la tarea"
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
            <div className="mt-5 flex flex-col gap-2 p-5 sm:flex-row sm:justify-end">
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
