"use client";

import { useEffect, useState } from "react";

type Teacher = {
  id: string;
  nombre: string;
  titulo: string | null;
  materias: { code: string; name: string }[];
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
  dueDate: string | null;
  subject: { code: string; name: string } | null;
};

type Detail = {
  loading: boolean;
  error: string | null;
  logs: PhotoItem[];
  tasks: TaskItem[];
};

/** Directorio de docentes con detalle por curso (planillas, listas y tareas). */
export default function TeachersDirectory() {
  const [items, setItems] = useState<Teacher[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selSubject, setSelSubject] = useState<Record<string, string>>({});
  const [details, setDetails] = useState<Record<string, Detail>>({});

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

  const filtered = items.filter((t) =>
    `${t.nombre} ${t.titulo ?? ""} ${(t.materias ?? []).map((m) => m.name).join(" ")}`
      .toLowerCase()
      .includes(q.trim().toLowerCase())
  );

  async function loadDetail(teacherId: string, subjectCode: string) {
    const key = `${teacherId}|${subjectCode}`;
    setDetails((d) => ({ ...d, [key]: { loading: true, error: null, logs: [], tasks: [] } }));
    try {
      const [lRes, tRes] = await Promise.all([
        fetch(`/api/fotolog?subject=${encodeURIComponent(subjectCode)}&teacher=${encodeURIComponent(teacherId)}&take=20`),
        fetch(`/api/assignments?subject=${encodeURIComponent(subjectCode)}&teacher=${encodeURIComponent(teacherId)}`),
      ]);
      const [lJson, tJson] = await Promise.all([lRes.json(), tRes.json()]);
      if (!lRes.ok) throw new Error(lJson.error || "No se pudo cargar la bitácora");
      if (!tRes.ok) throw new Error(tJson.error || "No se pudieron cargar las tareas");
      setDetails((d) => ({ ...d, [key]: { loading: false, error: null, logs: lJson.data ?? [], tasks: tJson.data ?? [] } }));
    } catch (e) {
      setDetails((d) => ({
        ...d,
        [key]: { loading: false, error: e instanceof Error ? e.message : "Error de red", logs: [], tasks: [] },
      }));
    }
  }

  function pickSubject(teacherId: string, code: string) {
    setSelSubject((s) => ({ ...s, [teacherId]: code }));
    loadDetail(teacherId, code);
  }

  function fmtDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-PY");
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
            const activeCode = selSubject[t.id] ?? t.materias[0]?.code ?? "";
            const detail = details[`${t.id}|${activeCode}`];
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
                    {(t.materias ?? []).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(t.materias ?? []).map((m) => (
                          <span key={m.code} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                            {m.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {t.bio && <p className="mt-1.5 text-sm text-slate-600">{t.bio}</p>}
                    {t.horario && <p className="mt-1 text-xs text-slate-500">Horario: {t.horario}</p>}
                    <button
                      type="button"
                      onClick={() => {
                        if (isOpen) {
                          setExpanded(null);
                        } else {
                          setExpanded(t.id);
                          const code = selSubject[t.id] ?? t.materias[0]?.code;
                          if (code) pickSubject(t.id, code);
                        }
                      }}
                      className="mt-2 rounded-lg bg-[var(--institutional)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                    >
                      {isOpen ? "Ocultar cursos" : "Ver cursos"}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-stone-200 bg-stone-50/60 p-4">
                    {(t.materias ?? []).length === 0 ? (
                      <p className="text-sm text-slate-500">Sin cursos asignados todavía.</p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {(t.materias ?? []).map((m) => (
                            <button
                              key={m.code}
                              type="button"
                              onClick={() => pickSubject(t.id, m.code)}
                              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                                activeCode === m.code
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
                            <p className="text-sm text-red-600">{detail.error}</p>
                          ) : (
                            <div className="grid gap-3">
                              <div>
                                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                                  Planillas y listas publicadas
                                </p>
                                {detail.logs.length === 0 ? (
                                  <p className="mt-1 text-sm text-slate-500">Sin fotos publicadas en este curso.</p>
                                ) : (
                                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    {detail.logs.map((l) => (
                                      <figure key={l.id} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={l.photoData} alt={l.kind === "ASISTENCIA" ? "Lista de asistencia" : "Planilla"} className="max-h-48 w-full bg-stone-100 object-contain" loading="lazy" />
                                        <figcaption className="px-3 py-2 text-xs text-slate-500">
                                          <span className="font-bold text-slate-700">
                                            {l.kind === "ASISTENCIA" ? "Asistencia" : "Planilla"} · {fmtDate(l.logDate)}
                                          </span>
                                          {l.caption ? ` — ${l.caption}` : ""}
                                        </figcaption>
                                      </figure>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                                  Tareas publicadas
                                </p>
                                {detail.tasks.length === 0 ? (
                                  <p className="mt-1 text-sm text-slate-500">Sin tareas publicadas en este curso.</p>
                                ) : (
                                  <ul className="mt-2 grid gap-2">
                                    {detail.tasks.map((a) => (
                                      <li key={a.id} className="rounded-lg border border-stone-200 bg-white px-3 py-2">
                                        <p className="text-sm font-bold text-slate-900">{a.title}</p>
                                        {a.description && <p className="mt-0.5 text-sm text-slate-600">{a.description}</p>}
                                        <p className="mt-0.5 text-xs text-slate-400">Vence: {fmtDate(a.dueDate)}</p>
                                      </li>
                                    ))}
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
    </section>
  );
}
