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

/** Filtro opcional al curso de un hijo (verificado en el servidor). */
export type TeachersScope = {
  academicCode: string;
  academicShort: string;
  gradeYear: number | null;
  hijoNombre: string;
};

function cursoDe(m: Materia): string {
  return `${m.gradeYear}.º ${m.academic?.shortName ?? ""}`;
}

/** Zona de docentes del tutor: tarjetas, pestañas por materia y planillas. */
export default function TeachersDirectory({ scope: initialScope = null }: { scope?: TeachersScope | null }) {
  const [items, setItems] = useState<Teacher[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<TeachersScope | null>(initialScope);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selMateria, setSelMateria] = useState<Record<string, string>>({});
  const [details, setDetails] = useState<Record<string, Detail>>({});
  const [zoom, setZoom] = useState<{ src: string; label: string } | null>(null);
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [showAll, setShowAll] = useState({ logs: false, lists: false, tasks: false });
  const [scopeOpened, setScopeOpened] = useState(false);

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

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  const matchesScope = (t: Teacher) =>
    !scope ||
    (t.materias ?? []).some(
      (m) =>
        m.academic?.code === scope.academicCode &&
        (scope.gradeYear == null || m.gradeYear === scope.gradeYear)
    );

  const filtered = items
    .filter((t) =>
      `${t.nombre} ${t.titulo ?? ""} ${(t.materias ?? []).map((m) => m.name).join(" ")}`
        .toLowerCase()
        .includes(q.trim().toLowerCase())
    )
    .sort((a, b) => Number(matchesScope(b)) - Number(matchesScope(a)));

  const scopeLabel = scope
    ? `${scope.gradeYear != null ? `${scope.gradeYear}.º ` : ""}${scope.academicShort} · ${scope.hijoNombre}`
    : "";

  async function loadDetail(teacherId: string, subjectCode: string) {
    const key = `${teacherId}|${subjectCode}`;
    setDetails((d) => ({ ...d, [key]: { loading: true, error: null, logs: [], tasks: [] } }));
    try {
      const [lRes, tRes] = await Promise.all([
        fetch(`/api/fotolog?subject=${encodeURIComponent(subjectCode)}&teacher=${encodeURIComponent(teacherId)}&take=30`, { signal: AbortSignal.timeout(20000) }),
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
        [key]: { loading: false, error: slow ? "Tardó demasiado (servidor frío). Elegí otra materia para reintentar." : e instanceof Error ? e.message : "Error de red", logs: [], tasks: [] },
      }));
    }
  }

  function pickTeacher(t: Teacher, materiaCode?: string) {
    setSelectedId(t.id);
    setOpenTask(null);
    setShowAll({ logs: false, lists: false, tasks: false });
    const code = materiaCode ?? selMateria[t.id] ?? (t.materias ?? [])[0]?.code;
    if (code) {
      setSelMateria((s) => ({ ...s, [t.id]: code }));
      loadDetail(t.id, code);
    }
  }

  useEffect(() => {
    if (!scope || scopeOpened || loading || filtered.length === 0) return;
    setScopeOpened(true);
    const t = filtered.find((x) => matchesScope(x)) ?? filtered[0];
    const mat =
      (t.materias ?? []).find(
        (m) =>
          m.academic?.code === scope.academicCode &&
          (scope.gradeYear == null || m.gradeYear === scope.gradeYear)
      ) ?? (t.materias ?? [])[0];
    setSelectedId(t.id);
    if (mat) {
      setSelMateria((s) => ({ ...s, [t.id]: mat.code }));
      loadDetail(t.id, mat.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  function fmtDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  async function blobUrl(dataUri: string, mime: string): Promise<string | null> {
    try {
      const res = await fetch(dataUri);
      const blob = await res.blob();
      return URL.createObjectURL(new Blob([blob], { type: mime }));
    } catch {
      setMsg("No se pudo abrir el adjunto");
      return null;
    }
  }

  async function openPdf(dataUri: string) {
    const url = await blobUrl(dataUri, "application/pdf");
    if (url) {
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  }

  async function downloadPdf(dataUri: string, title: string) {
    const url = await blobUrl(dataUri, "application/pdf");
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.slice(0, 60) || "tarea"}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  const selected = items.find((t) => t.id === selectedId) ?? null;
  const selCode = selected ? (selMateria[selected.id] ?? selected.materias[0]?.code ?? "") : "";
  const detail = selected && selCode ? details[`${selected.id}|${selCode}`] : undefined;
  const planillas = (detail?.logs ?? []).filter((l) => l.kind === "TAREA");
  const listas = (detail?.logs ?? []).filter((l) => l.kind === "ASISTENCIA");
  const tasks = detail?.tasks ?? [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--institutional)]">Docentes</h2>
          <p className="mt-1 text-sm text-slate-500">Conocé a los docentes y las materias que dictan.</p>
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
            Docentes del curso de {scopeLabel} primero
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
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => {
              const initials = t.nombre.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
              const active = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickTeacher(t)}
                  title={`Ver a ${t.nombre}`}
                  className={`flex items-center gap-3 rounded-xl border bg-white p-4 text-left transition-all hover:shadow-md ${
                    active ? "border-[var(--institutional)] shadow-md ring-1 ring-[var(--institutional)]" : "border-stone-200"
                  }`}
                >
                  {t.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.foto} alt={t.nombre} className="h-14 w-14 shrink-0 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--institutional)] text-lg font-extrabold text-white">
                      {initials}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-slate-900">{t.nombre}</span>
                    <span className="block truncate text-xs text-slate-500">{t.titulo ?? "Docente"}</span>
                  </span>
                  <span className="shrink-0 text-lg text-slate-400">›</span>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
              <div className="flex items-center gap-4 bg-white p-4 sm:p-5">
                {selected.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.foto} alt={selected.nombre} className="h-16 w-16 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--institutional)] text-xl font-extrabold text-white">
                    {selected.nombre.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-extrabold text-slate-900">{selected.nombre}</h3>
                  <p className="truncate text-sm text-slate-500">{selected.titulo ?? "Docente"}</p>
                  <p className="truncate text-xs text-slate-400">
                    {(selected.materias ?? []).map((m) => `${m.name} (${cursoDe(m)})`).join(" · ") || "Sin cursos asignados"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  title="Ocultar"
                  className="shrink-0 rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100"
                >
                  ▾
                </button>
              </div>

              {(selected.materias ?? []).length > 0 && (
                <div className="flex gap-1 overflow-x-auto bg-stone-100/70 px-3 py-2">
                  {(selected.materias ?? []).map((m) => (
                    <button
                      key={m.code}
                      type="button"
                      onClick={() => {
                        setSelMateria((s) => ({ ...s, [selected.id]: m.code }));
                        setOpenTask(null);
                        loadDetail(selected.id, m.code);
                      }}
                      title={`${m.name} · ${cursoDe(m)}`}
                      className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                        selCode === m.code ? "bg-[var(--institutional)] text-white" : "text-slate-500 hover:bg-white"
                      }`}
                    >
                      {m.name}
                      <span className={`block text-[11px] font-semibold ${selCode === m.code ? "text-stone-200" : "text-slate-400"}`}>
                        {cursoDe(m)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="grid gap-4 bg-stone-50/50 p-4 sm:p-5">
                {!detail || detail.loading ? (
                  <p className="text-sm text-slate-500">Cargando material…</p>
                ) : detail.error ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-red-600">{detail.error}</p>
                    <button
                      type="button"
                      onClick={() => selCode && loadDetail(selected.id, selCode)}
                      className="rounded-lg bg-[var(--institutional)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-extrabold text-slate-900">📋 Planilla de tareas</h4>
                        {planillas.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setShowAll((s) => ({ ...s, logs: !s.logs }))}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
                          >
                            {showAll.logs ? "Ver menos" : "Ver todas"}
                          </button>
                        )}
                      </div>
                      {planillas.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">Sin planillas en esta materia.</p>
                      ) : (
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full min-w-[480px] text-sm">
                            <thead>
                              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400">
                                <th className="py-2 pr-4 font-bold">Fecha</th>
                                <th className="py-2 pr-4 font-bold">Foto</th>
                                <th className="py-2 pr-4 font-bold">Observación</th>
                                <th className="py-2 font-bold">Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(showAll.logs ? planillas : planillas.slice(0, 3)).map((l) => (
                                <tr key={l.id} className="border-b last:border-0">
                                  <td className="whitespace-nowrap py-2 pr-4 text-slate-600">{fmtDate(l.logDate)}</td>
                                  <td className="py-2 pr-4">
                                    <button type="button" onClick={() => setZoom({ src: l.photoData, label: `Planilla · ${fmtDate(l.logDate)}` })} title="Click para ampliar">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={l.photoData} alt="Planilla" className="h-14 w-14 rounded-lg border border-stone-200 object-cover hover:opacity-85" loading="lazy" />
                                    </button>
                                  </td>
                                  <td className="max-w-[220px] truncate py-2 pr-4 text-slate-600" title={l.caption ?? ""}>{l.caption || "—"}</td>
                                  <td className="py-2"><span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">Publicada</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-extrabold text-slate-900">👤 Planilla de asistencias</h4>
                        {listas.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setShowAll((s) => ({ ...s, lists: !s.lists }))}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
                          >
                            {showAll.lists ? "Ver menos" : "Ver todas"}
                          </button>
                        )}
                      </div>
                      {listas.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">Sin listas en esta materia.</p>
                      ) : (
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full min-w-[480px] text-sm">
                            <thead>
                              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400">
                                <th className="py-2 pr-4 font-bold">Fecha</th>
                                <th className="py-2 pr-4 font-bold">Foto</th>
                                <th className="py-2 pr-4 font-bold">Observación</th>
                                <th className="py-2 font-bold">Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(showAll.lists ? listas : listas.slice(0, 3)).map((l) => (
                                <tr key={l.id} className="border-b last:border-0">
                                  <td className="whitespace-nowrap py-2 pr-4 text-slate-600">{fmtDate(l.logDate)}</td>
                                  <td className="py-2 pr-4">
                                    <button type="button" onClick={() => setZoom({ src: l.photoData, label: `Asistencia · ${fmtDate(l.logDate)}` })} title="Click para ampliar">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={l.photoData} alt="Lista" className="h-14 w-14 rounded-lg border border-stone-200 object-cover hover:opacity-85" loading="lazy" />
                                    </button>
                                  </td>
                                  <td className="max-w-[220px] truncate py-2 pr-4 text-slate-600" title={l.caption ?? ""}>{l.caption || "—"}</td>
                                  <td className="py-2"><span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">Publicada</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-extrabold text-slate-900">📄 Tarea publicada</h4>
                        {tasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setShowAll((s) => ({ ...s, tasks: !s.tasks }))}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
                          >
                            {showAll.tasks ? "Ver menos" : "Ver todas"}
                          </button>
                        )}
                      </div>
                      {tasks.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">Sin tareas en esta materia.</p>
                      ) : (
                        <div className="mt-2 grid gap-2">
                          {(showAll.tasks ? tasks : tasks.slice(0, 1)).map((a) => {
                            const isPdf = (a.fileData ?? "").startsWith("data:application/pdf");
                            const isImg = (a.fileData ?? "").startsWith("data:image/");
                            const isOpen = openTask === a.id;
                            return (
                              <div key={a.id} className="overflow-hidden rounded-xl bg-stone-50">
                                <button
                                  type="button"
                                  onClick={() => setOpenTask(isOpen ? null : a.id)}
                                  title="Click para ver la tarea completa"
                                  className="block w-full px-4 py-3 text-left hover:bg-stone-100/70"
                                >
                                  <span className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-[var(--institutional)] px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                                      {a.subject?.name ?? "Tarea"}
                                    </span>
                                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-500 ring-1 ring-stone-200">
                                      Vence: {fmtDate(a.dueDate)}
                                    </span>
                                    {a.fileData && (
                                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-500 ring-1 ring-stone-200">
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
                                  <div className="grid gap-3 border-t border-dashed border-stone-200 bg-white px-4 py-3">
                                    {a.description && <p className="text-sm leading-relaxed text-slate-700">{a.description}</p>}
                                    {isImg && a.fileData && (
                                      <button type="button" onClick={() => setZoom({ src: a.fileData as string, label: a.title })} title="Click para ampliar" className="block w-fit cursor-zoom-in">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={a.fileData} alt={a.title} className="max-h-56 rounded-lg border border-stone-200 object-contain shadow-sm" loading="lazy" />
                                      </button>
                                    )}
                                    {isPdf && a.fileData && (
                                      <div className="flex flex-wrap gap-2">
                                        <button type="button" onClick={() => openPdf(a.fileData as string)} className="rounded-lg bg-[var(--institutional)] px-4 py-2 text-xs font-bold text-white hover:opacity-90">
                                          Ver PDF ↗
                                        </button>
                                        <button type="button" onClick={() => downloadPdf(a.fileData as string, a.title)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
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
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
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
