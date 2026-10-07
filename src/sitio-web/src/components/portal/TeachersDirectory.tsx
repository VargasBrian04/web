"use client";

import { useEffect, useState } from "react";

type Materia = {
  code: string;
  name: string;
  gradeYear: number;
  academic: { code: string; shortName: string; name: string } | null;
};

type Teacher = {
  id: string;
  nombre: string;
  titulo: string | null;
  materias: Materia[];
  bio: string | null;
  horario: string | null;
  foto: string | null;
};

type PhotoItem = {
  id: string;
  kind: string;
  photoData: string;
  caption: string | null;
  logDate: string;
  subject: { code: string; name: string } | null;
};

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  fileData: string | null;
  dueDate: string | null;
  subject: { code: string; name: string } | null;
};

type Detail = {
  loading: boolean;
  error: string | null;
  logs: PhotoItem[];
  tasks: TaskItem[];
};

function cursoLabel(m: Materia): string {
  const bach = m.academic?.shortName ?? "Curso";
  return `${m.gradeYear}.º ${bach}`;
}

/** Filtro opcional al curso de un hijo (verificado en el servidor). */
export type TeachersScope = {
  academicCode: string;
  academicShort: string;
  gradeYear: number | null;
  hijoNombre: string;
};

/** Directorio de docentes: cursos que enseña → materias → planillas y tareas. */
export default function TeachersDirectory({ scope: initialScope = null }: { scope?: TeachersScope | null }) {
  const [items, setItems] = useState<Teacher[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<TeachersScope | null>(initialScope);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selCurso, setSelCurso] = useState<Record<string, string>>({});
  const [selMateria, setSelMateria] = useState<Record<string, string>>({});
  const [details, setDetails] = useState<Record<string, Detail>>({});
  const [zoom, setZoom] = useState<{ src: string; label: string } | null>(null);
  const [openTask, setOpenTask] = useState<string | null>(null);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  useEffect(() => {
    fetch("/api/teachers", { cache: "no-store" })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (ok) setItems(j.data ?? []);
        else setMsg(j.error || "No se pudo cargar el directorio");
      })
      .catch(() => setMsg("Error de red al cargar"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((t) => {
    if (
      scope &&
      !(t.materias ?? []).some(
        (m) =>
          m.academic?.code === scope.academicCode &&
          (scope.gradeYear == null || m.gradeYear === scope.gradeYear)
      )
    )
      return false;
    return `${t.nombre} ${t.titulo ?? ""} ${(t.materias ?? []).map((m) => m.name).join(" ")}`
      .toLowerCase()
      .includes(q.trim().toLowerCase());
  });

  const scopeLabel = scope
    ? `${scope.gradeYear != null ? `${scope.gradeYear}.º ` : ""}${scope.academicShort} · ${scope.hijoNombre}`
    : "";

  const [scopeOpened, setScopeOpened] = useState(false);
  useEffect(() => {
    if (!scope || scopeOpened || loading || filtered.length === 0) return;
    setScopeOpened(true);
    const t = filtered[0];
    setExpanded(t.id);
    const mat = (t.materias ?? []).find(
      (m) =>
        m.academic?.code === scope.academicCode &&
        (scope.gradeYear == null || m.gradeYear === scope.gradeYear)
    );
    const cursos = cursosDe(t);
    const curso =
      (mat && `${mat.gradeYear}.º ${mat.academic?.shortName ?? ""}`) || cursos[0]?.label;
    if (curso) {
      setSelCurso((s) => ({ ...s, [t.id]: curso }));
      const code = mat?.code ?? cursos.find((c) => c.label === curso)?.materias[0]?.code;
      if (code) {
        setSelMateria((s) => ({ ...s, [`${t.id}|${curso}`]: code }));
        loadDetail(t.id, code);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  function cursosDe(t: Teacher): { label: string; materias: Materia[] }[] {
    const map = new Map<string, { label: string; materias: Materia[] }>();
    for (const m of t.materias ?? []) {
      const label = cursoLabel(m);
      const g = map.get(label) ?? { label, materias: [] };
      g.materias.push(m);
      map.set(label, g);
    }
    return [...map.values()];
  }

  async function loadDetail(teacherId: string, subjectCode: string) {
    const key = `${teacherId}|${subjectCode}`;
    setDetails((d) => ({ ...d, [key]: { loading: true, error: null, logs: [], tasks: [] } }));
    try {
      const [lRes, tRes] = await Promise.all([
        fetch(`/api/fotolog?subject=${encodeURIComponent(subjectCode)}&teacher=${encodeURIComponent(teacherId)}&take=20`, { signal: AbortSignal.timeout(20000) }),
        fetch(`/api/assignments?subject=${encodeURIComponent(subjectCode)}&teacher=${encodeURIComponent(teacherId)}`, { signal: AbortSignal.timeout(20000) }),
      ]);
      const [lJson, tJson] = await Promise.all([lRes.json(), tRes.json()]);
      if (!lRes.ok) throw new Error(lJson.error || "No se pudo cargar la bitácora");
      if (!tRes.ok) throw new Error(tJson.error || "No se pudieron cargar las tareas");
      setDetails((d) => ({ ...d, [key]: { loading: false, error: null, logs: lJson.data ?? [], tasks: tJson.data ?? [] } }));
    } catch (e) {
      const slow = e instanceof DOMException && e.name === "TimeoutError";
      setDetails((d) => ({
        ...d,
        [key]: { loading: false, error: slow ? "Tardó demasiado (servidor frío). Tocá Reintentar." : e instanceof Error ? e.message : "Error de red", logs: [], tasks: [] },
      }));
    }
  }

  function openTeacher(t: Teacher) {
    setExpanded(t.id);
    const cursos = cursosDe(t);
    const curso = selCurso[t.id] ?? cursos[0]?.label;
    const mat = selMateria[`${t.id}|${curso}`] ?? cursos.find((c) => c.label === curso)?.materias[0]?.code;
    if (curso) setSelCurso((s) => ({ ...s, [t.id]: curso }));
    if (curso && mat) {
      setSelMateria((s) => ({ ...s, [`${t.id}|${curso}`]: mat }));
      loadDetail(t.id, mat);
    }
  }

  function pickCurso(t: Teacher, label: string) {
    setSelCurso((s) => ({ ...s, [t.id]: label }));
    const cursos = cursosDe(t);
    const mat = selMateria[`${t.id}|${label}`] ?? cursos.find((c) => c.label === label)?.materias[0]?.code;
    if (mat) {
      setSelMateria((s) => ({ ...s, [`${t.id}|${label}`]: mat }));
      loadDetail(t.id, mat);
    }
  }

  function pickMateria(t: Teacher, curso: string, code: string) {
    setSelMateria((s) => ({ ...s, [`${t.id}|${curso}`]: code }));
    loadDetail(t.id, code);
  }

  function fmtDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-PY");
  }

  async function openPdf(dataUri: string, title: string) {
    try {
      const res = await fetch(dataUri);
      const blob = await res.blob();
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setMsg("No se pudo abrir el PDF");
    }
  }

  async function downloadPdf(dataUri: string, title: string) {
    try {
      const res = await fetch(dataUri);
      const blob = await res.blob();
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.slice(0, 60) || "tarea"}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setMsg("No se pudo descargar el PDF");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--institutional)]">Docentes del colegio</h2>
          <p className="mt-1 text-sm text-slate-500">Conocé a quienes enseñan a tus hijos.</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o materia…"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]"
        />
      </div>
      {scope && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--paper)] px-4 py-3">
          <p className="text-sm font-bold text-[var(--institutional)]">
            Docentes del curso de {scopeLabel}
          </p>
          <button
            type="button"
            onClick={() => setScope(null)}
            className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-stone-200 hover:bg-stone-100"
          >
            Ver todos
          </button>
        </div>
      )}
      {msg && <p className="mt-3 rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{msg}</p>}
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando docentes…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Sin docentes para mostrar.</p>
      ) : (
        <div className="mt-4 grid gap-4">
          {filtered.map((t) => {
            const initials = t.nombre.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
            const isOpen = expanded === t.id;
            const cursos = cursosDe(t);
            const cursoActivo = selCurso[t.id] ?? cursos[0]?.label ?? "";
            const materiasCurso = cursos.find((c) => c.label === cursoActivo)?.materias ?? [];
            const materiaActiva = selMateria[`${t.id}|${cursoActivo}`] ?? materiasCurso[0]?.code ?? "";
            const detail = details[`${t.id}|${materiaActiva}`];
            return (
              <article key={t.id} className="overflow-hidden rounded-xl border border-stone-200">
                <div className="flex gap-4 p-4">
                  {t.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.foto} alt={t.nombre} className="h-20 w-20 shrink-0 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--institutional)] text-xl font-extrabold text-white">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900">{t.nombre}</h3>
                    {t.titulo && <p className="text-sm font-semibold text-[var(--gold)]">{t.titulo}</p>}
                    {cursos.length > 0 && (
                      <p className="mt-1 text-xs text-slate-500">
                        Enseña en: {cursos.map((c) => c.label).join(" · ")}
                      </p>
                    )}
                    {t.bio && <p className="mt-1.5 text-sm text-slate-600">{t.bio}</p>}
                    {t.horario && <p className="mt-1 text-xs text-slate-500">Horario: {t.horario}</p>}
                    <button
                      type="button"
                      onClick={() => (isOpen ? setExpanded(null) : openTeacher(t))}
                      className="mt-2 rounded-lg bg-[var(--institutional)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                    >
                      {isOpen ? "Ocultar cursos" : "Ver cursos"}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-stone-200 bg-stone-50/60 p-4">
                    {cursos.length === 0 ? (
                      <p className="text-sm text-slate-500">Sin cursos asignados todavía.</p>
                    ) : (
                      <>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Cursos</p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {cursos.map((c) => (
                            <button
                              key={c.label}
                              type="button"
                              onClick={() => pickCurso(t, c.label)}
                              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                                cursoActivo === c.label
                                  ? "bg-[var(--institutional)] text-white"
                                  : "bg-white text-slate-600 ring-1 ring-stone-200 hover:bg-stone-100"
                              }`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                        <p className="mt-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                          Materias en {cursoActivo || "el curso"}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {materiasCurso.map((m) => (
                            <button
                              key={m.code}
                              type="button"
                              onClick={() => pickMateria(t, cursoActivo, m.code)}
                              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                                materiaActiva === m.code
                                  ? "bg-[var(--gold)] text-white"
                                  : "bg-white text-slate-600 ring-1 ring-stone-200 hover:bg-stone-100"
                              }`}
                            >
                              {m.name}
                            </button>
                          ))}
                        </div>
                        <div className="mt-3">
                          {!detail || detail.loading ? (
                            <p className="text-sm text-slate-500">Cargando material del curso…</p>
                          ) : detail.error ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm text-red-600">{detail.error}</p>
                              <button
                                type="button"
                                onClick={() => loadDetail(t.id, materiaActiva)}
                                className="rounded-lg bg-[var(--institutional)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                              >
                                Reintentar
                              </button>
                            </div>
                          ) : (
                            <div className="grid gap-3">
                              <div>
                                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                                  Planillas y listas publicadas
                                </p>
                                {detail.logs.length === 0 ? (
                                  <p className="mt-1 text-sm text-slate-500">Sin fotos publicadas en este curso y materia.</p>
                                ) : (
                                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    {detail.logs.map((l) => {
                                      const label = `${l.kind === "ASISTENCIA" ? "Asistencia" : "Planilla"} · ${fmtDate(l.logDate)}${l.caption ? ` — ${l.caption}` : ""}`;
                                      return (
                                        <figure key={l.id} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                                          <button
                                            type="button"
                                            onClick={() => setZoom({ src: l.photoData, label })}
                                            title="Click para ampliar"
                                            className="block w-full cursor-zoom-in"
                                          >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={l.photoData} alt={l.kind === "ASISTENCIA" ? "Lista de asistencia" : "Planilla"} className="max-h-48 w-full bg-stone-100 object-contain" loading="lazy" />
                                          </button>
                                          <figcaption className="px-3 py-2 text-xs text-slate-500">
                                            <span className="font-bold text-slate-700">{label}</span>
                                          </figcaption>
                                        </figure>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                                  Tareas publicadas
                                </p>
                                {detail.tasks.length === 0 ? (
                                  <p className="mt-1 text-sm text-slate-500">Sin tareas publicadas en este curso y materia.</p>
                                ) : (
                                  <ul className="mt-2 grid gap-3">
                                    {detail.tasks.map((a) => {
                                      const isPdf = (a.fileData ?? "").startsWith("data:application/pdf");
                                      const isImg = (a.fileData ?? "").startsWith("data:image/");
                                      const isOpen = openTask === a.id;
                                      return (
                                        <li key={a.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                                          <button
                                            type="button"
                                            onClick={() => setOpenTask(isOpen ? null : a.id)}
                                            title="Click para ver la tarea completa"
                                            className="block w-full bg-gradient-to-r from-[var(--paper)] to-white px-4 py-3 text-left hover:brightness-[0.98]"
                                          >
                                            <span className="flex flex-wrap items-center gap-2">
                                              <span className="rounded-full bg-[var(--institutional)] px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                                                {a.subject?.name ?? "Tarea"}
                                              </span>
                                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                                                Vence: {fmtDate(a.dueDate)}
                                              </span>
                                              {a.fileData && (
                                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                                                  {isPdf ? "📄 PDF adjunto" : "🖼️ Foto adjunta"}
                                                </span>
                                              )}
                                            </span>
                                            <span className="mt-1 block text-base font-extrabold text-slate-900">
                                              {a.title} <span className="text-sm font-normal text-slate-400">{isOpen ? "▾" : "▸"}</span>
                                            </span>
                                            {a.description && !isOpen && (
                                              <span className="mt-0.5 block truncate text-sm text-slate-500">{a.description}</span>
                                            )}
                                          </button>
                                          {isOpen && (
                                            <div className="grid gap-3 border-t border-dashed border-stone-200 px-4 py-3">
                                              {a.description && (
                                                <p className="text-sm leading-relaxed text-slate-700">{a.description}</p>
                                              )}
                                              {isImg && a.fileData && (
                                                <button
                                                  type="button"
                                                  onClick={() => setZoom({ src: a.fileData as string, label: a.title })}
                                                  title="Click para ampliar"
                                                  className="block w-fit cursor-zoom-in"
                                                >
                                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                                  <img src={a.fileData} alt={a.title} className="max-h-56 rounded-lg border border-stone-200 object-contain shadow-sm transition-transform hover:scale-[1.01]" loading="lazy" />
                                                </button>
                                              )}
                                              {isPdf && a.fileData && (
                                                <div className="flex flex-wrap gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => openPdf(a.fileData as string, a.title)}
                                                    className="rounded-lg bg-[var(--institutional)] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                                                  >
                                                    Ver PDF ↗
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => downloadPdf(a.fileData as string, a.title)}
                                                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                                  >
                                                    Descargar
                                                  </button>
                                                </div>
                                              )}
                                              {a.notes ? (
                                                <p className="rounded-lg border-l-4 border-[var(--gold)] bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                                  <span className="font-extrabold">Observaciones: </span>{a.notes}
                                                </p>
                                              ) : (
                                                <p className="text-xs italic text-slate-400">Sin observaciones del docente.</p>
                                              )}
                                            </div>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setZoom(null)}>
          <button
            type="button"
            onClick={() => setZoom(null)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl font-bold text-white hover:bg-white/30"
          >
            ✕
          </button>
          <figure className="max-w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoom.src} alt={zoom.label} className="max-h-[82vh] max-w-[92vw] rounded-lg bg-white object-contain" />
            <figcaption className="mt-2 text-center text-sm font-semibold text-white">{zoom.label}</figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
