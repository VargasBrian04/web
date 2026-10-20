"use client";

import { useEffect, useState } from "react";
import ImageViewer from "./ImageViewer";
import PortalIcon, { type PortalIconName } from "./PortalIcon";
import {
  PlanillaCard,
  TaskCard,
  type PlanillaItem,
  type TaskItem,
} from "./TeacherMaterialCards";

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

type Detail = {
  loading: boolean;
  error: string | null;
  logs: PlanillaItem[];
  tasks: TaskItem[];
  hasMoreLogs: boolean;
  loadingMore: boolean;
};

type Tab = "logs" | "lists" | "tasks";

/** Filtro opcional al curso de un hijo (verificado en el servidor). */
export type TeachersScope = {
  academicCode: string;
  academicShort: string;
  gradeYear: number | null;
  hijoNombre: string;
};

const TAB_ORDER: Tab[] = ["logs", "lists", "tasks"];

const TAB_COPY: Record<
  Tab,
  {
    label: string;
    description: string;
    emptyTitle: string;
    emptyText: string;
    icon: PortalIconName;
  }
> = {
  logs: {
    label: "Planilla de tareas",
    description: "Fotografías de las planillas de tareas publicadas para esta materia.",
    emptyTitle: "Sin planillas de tareas",
    emptyText: "El docente todavía no publicó fotografías de planillas de tareas para esta materia.",
    icon: "clipboard",
  },
  lists: {
    label: "Planilla de asistencias",
    description: "Listas y planillas de asistencia cargadas por el docente.",
    emptyTitle: "Sin planillas de asistencias",
    emptyText: "El docente todavía no publicó listas de asistencia para esta materia.",
    icon: "calendar",
  },
  tasks: {
    label: "Tareas publicadas",
    description: "Consignas, fechas de entrega y archivos adjuntos de las tareas.",
    emptyTitle: "Sin tareas publicadas",
    emptyText: "El docente todavía no publicó tareas para esta materia.",
    icon: "file-text",
  },
};

const PAGE_SIZE: Record<Tab, number> = { logs: 4, lists: 4, tasks: 4 };
const LOG_FETCH_SIZE = 25;

function cursoDe(m: Materia): string {
  return `${m.gradeYear}.º ${m.academic?.shortName ?? ""}`.trim();
}

function initialsOf(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function subjectIcon(name: string): PortalIconName {
  const n = name.toLowerCase();
  if (/(matem|álgebra|algebra|cálculo|calculo)/.test(n)) return "calculator";
  if (/(fís|fis)/.test(n)) return "atom";
  if (/(quím|quim)/.test(n)) return "flask";
  if (/(inform|program|comput)/.test(n)) return "code";
  if (/(social|hist|geograf|ciudad)/.test(n)) return "globe";
  if (/(constru|edil|arquit)/.test(n)) return "building";
  if (/(salud|biolog|anat)/.test(n)) return "heart";
  if (/(agro|agric|ambient)/.test(n)) return "leaf";
  if (/(mecán|mecan|electr|taller)/.test(n)) return "wrench";
  if (/(contab|admin|econom|empresa)/.test(n)) return "briefcase";
  return "book";
}

function TeacherAvatar({
  nombre,
  foto,
  className = "h-14 w-14",
  textClass = "text-base",
}: {
  nombre: string;
  foto: string | null;
  className?: string;
  textClass?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [foto]);

  if (!foto || failed) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-[#5d4037] font-extrabold text-white ${className} ${textClass}`}
      >
        {initialsOf(nombre)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={foto}
      alt={nombre}
      onError={() => setFailed(true)}
      loading="lazy"
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}

function TeacherChoice({
  teacher,
  active,
  compact,
  onClick,
}: {
  teacher: Teacher;
  active: boolean;
  compact: boolean;
  onClick: () => void;
}) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`Ver a ${teacher.nombre}`}
        className={`flex min-w-[230px] max-w-[290px] shrink-0 items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:shadow-md ${
          active
            ? "border-[var(--institutional)] bg-[var(--paper)] shadow-sm ring-1 ring-[var(--institutional)]"
            : "border-stone-200 bg-white hover:border-[var(--institutional)]/35"
        }`}
      >
        <TeacherAvatar nombre={teacher.nombre} foto={teacher.foto} className="h-11 w-11" textClass="text-sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold text-slate-900">{teacher.nombre}</span>
          <span className="block truncate text-[11px] font-semibold text-slate-500">
            {teacher.titulo ?? "Docente"}
          </span>
          <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {teacher.materias.length} materia{teacher.materias.length === 1 ? "" : "s"}
          </span>
        </span>
        <PortalIcon
          name="chevron-right"
          className={`h-4 w-4 shrink-0 ${active ? "text-[var(--institutional)]" : "text-slate-300"}`}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Ver a ${teacher.nombre}`}
      className={`flex items-center gap-4 rounded-2xl border bg-white p-4 text-left transition-all hover:shadow-md ${
        active
          ? "border-[var(--institutional)] shadow-md ring-1 ring-[var(--institutional)]"
          : "border-stone-200 hover:border-[var(--institutional)]/35"
      }`}
    >
      <TeacherAvatar nombre={teacher.nombre} foto={teacher.foto} className="h-14 w-14" textClass="text-lg" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-extrabold text-slate-900">{teacher.nombre}</span>
        <span className="block truncate text-xs text-slate-500">{teacher.titulo ?? "Docente"}</span>
        <span className="mt-1 block truncate text-[11px] font-semibold text-slate-400">
          {teacher.materias.length} materia{teacher.materias.length === 1 ? "" : "s"} ·{" "}
          {teacher.materias[0]?.name ?? "Sin materias"}
        </span>
      </span>
      <PortalIcon name="chevron-right" className="h-4 w-4 shrink-0 text-slate-300" />
    </button>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: PortalIconName;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-slate-50 px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--institutional)] ring-1 ring-stone-200">
        <PortalIcon name={icon} className="h-6 w-6" />
      </span>
      <p className="mt-3 font-extrabold text-slate-800">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-500">{text}</p>
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-label="Cargando material">
      {[0, 1].map((i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="h-[280px] animate-pulse bg-stone-100 sm:h-[340px]" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-stone-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-stone-100" />
            <div className="h-8 w-40 animate-pulse rounded bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadMoreButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <div className="mt-4 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-stone-50 disabled:cursor-wait disabled:opacity-60"
      >
        <PortalIcon
          name={loading ? "refresh" : "chevron-down"}
          className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
        />
        {loading ? "Cargando planillas…" : "Cargar planillas anteriores"}
      </button>
    </div>
  );
}

/** Zona de docentes del tutor: ficha amplia, materias y planillas. */
export default function TeachersDirectory({ scope: initialScope = null }: { scope?: TeachersScope | null }) {
  const [items, setItems] = useState<Teacher[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<TeachersScope | null>(initialScope);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selMateria, setSelMateria] = useState<Record<string, string>>({});
  const [details, setDetails] = useState<Record<string, Detail>>({});
  const [viewer, setViewer] = useState<{ src: string; label: string; fileName: string } | null>(null);
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [showAll, setShowAll] = useState({ logs: false, lists: false, tasks: false });
  const [tab, setTab] = useState<Tab>("logs");
  const [initialOpenDone, setInitialOpenDone] = useState(false);

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

  async function loadDetail(teacherId: string, subjectCode: string, force = false) {
    const key = `${teacherId}|${subjectCode}`;
    const cached = details[key];
    if (!force && cached && !cached.error) return;
    setMsg(null);
    setDetails((d) => ({
      ...d,
      [key]: { loading: true, error: null, logs: [], tasks: [], hasMoreLogs: false, loadingMore: false },
    }));
    try {
      const [lRes, tRes] = await Promise.all([
        fetch(
          `/api/fotolog?subject=${encodeURIComponent(subjectCode)}&teacher=${encodeURIComponent(teacherId)}&take=${LOG_FETCH_SIZE}&fields=meta`,
          { signal: AbortSignal.timeout(20000), cache: "no-store" }
        ),
        fetch(
          `/api/assignments?subject=${encodeURIComponent(subjectCode)}&teacher=${encodeURIComponent(teacherId)}&fields=meta`,
          { signal: AbortSignal.timeout(20000), cache: "no-store" }
        ),
      ]);
      const [lJson, tJson] = await Promise.all([lRes.json(), tRes.json()]);
      if (!lRes.ok) throw new Error(lJson.error || "No se pudo cargar la bitácora");
      if (!tRes.ok) throw new Error(tJson.error || "No se pudieron cargar las tareas");
      const logs: PlanillaItem[] = lJson.data ?? [];
      setDetails((d) => ({
        ...d,
        [key]: {
          loading: false,
          error: null,
          logs,
          tasks: tJson.data ?? [],
          hasMoreLogs: logs.length >= LOG_FETCH_SIZE,
          loadingMore: false,
        },
      }));
    } catch (e) {
      const slow = e instanceof DOMException && e.name === "TimeoutError";
      setDetails((d) => ({
        ...d,
        [key]: {
          loading: false,
          error: slow
            ? "Tardó demasiado (servidor frío). Elegí otra materia para reintentar."
            : e instanceof Error
              ? e.message
              : "Error de red",
          logs: [],
          tasks: [],
          hasMoreLogs: false,
          loadingMore: false,
        },
      }));
    }
  }

  async function loadMoreLogs() {
    if (!selectedId || !selCode) return;
    const key = `${selectedId}|${selCode}`;
    const current = details[key];
    if (!current || current.loading || current.loadingMore || !current.hasMoreLogs) return;

    setMsg(null);
    setDetails((d) => ({ ...d, [key]: { ...current, loadingMore: true } }));
    try {
      const res = await fetch(
        `/api/fotolog?subject=${encodeURIComponent(selCode)}&teacher=${encodeURIComponent(selectedId)}&take=${LOG_FETCH_SIZE}&skip=${current.logs.length}&fields=meta`,
        { signal: AbortSignal.timeout(20000), cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudieron cargar más planillas");
      const more: PlanillaItem[] = json.data ?? [];
      setDetails((d) => {
        const base = d[key] ?? current;
        const existing = new Set(base.logs.map((l) => l.id));
        return {
          ...d,
          [key]: {
            ...base,
            logs: [...base.logs, ...more.filter((l) => !existing.has(l.id))],
            hasMoreLogs: more.length >= LOG_FETCH_SIZE,
            loadingMore: false,
          },
        };
      });
      setShowAll((s) => ({ ...s, [tab]: true }));
    } catch (e) {
      setDetails((d) => {
        const base = d[key] ?? current;
        return { ...d, [key]: { ...base, loadingMore: false } };
      });
      setMsg(e instanceof Error ? e.message : "No se pudieron cargar más planillas");
    }
  }

  function pickTeacher(t: Teacher, materiaCode?: string) {
    setInitialOpenDone(true);
    setMsg(null);
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
    if (initialOpenDone || loading || filtered.length === 0) return;
    const scoped = scope ? filtered.find((x) => matchesScope(x)) : null;
    const t = scoped ?? filtered[0];
    const mat = scope
      ? (t.materias ?? []).find(
          (m) =>
            m.academic?.code === scope.academicCode &&
            (scope.gradeYear == null || m.gradeYear === scope.gradeYear)
        ) ?? (t.materias ?? [])[0]
      : (t.materias ?? [])[0];
    pickTeacher(t, mat?.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, filtered.length, initialOpenDone, scope]);

  function selectSubject(code: string) {
    if (!selectedId) return;
    setMsg(null);
    setSelMateria((s) => ({ ...s, [selectedId]: code }));
    setOpenTask(null);
    setShowAll({ logs: false, lists: false, tasks: false });
    loadDetail(selectedId, code);
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

  async function openPdf(src: string) {
    // Con la URL autenticada se abre en el mismo gesto del clic; con un
    // data URI (compatibilidad) se convierte a blob para evitar bloqueos.
    if (!src.startsWith("data:")) {
      window.open(src, "_blank", "noopener,noreferrer");
      return;
    }
    const url = await blobUrl(src, "application/pdf");
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  }

  const selected = items.find((t) => t.id === selectedId) ?? null;
  const selCode = selected ? selMateria[selected.id] ?? selected.materias[0]?.code ?? "" : "";
  const selectedMateria = selected?.materias.find((m) => m.code === selCode) ?? null;
  const detail = selected && selCode ? details[`${selected.id}|${selCode}`] : undefined;
  const planillas = (detail?.logs ?? []).filter((l) => l.kind === "TAREA");
  const listas = (detail?.logs ?? []).filter((l) => l.kind === "ASISTENCIA");
  const tasks = detail?.tasks ?? [];
  const activeMeta = TAB_COPY[tab];
  const activeCount = tab === "logs" ? planillas.length : tab === "lists" ? listas.length : tasks.length;
  const activeLogs = tab === "lists" ? listas : planillas;
  const visibleLogs = showAll[tab] ? activeLogs : activeLogs.slice(0, PAGE_SIZE[tab]);
  const visibleTasks = showAll.tasks ? tasks : tasks.slice(0, PAGE_SIZE.tasks);
  const canShowMore = activeCount > PAGE_SIZE[tab];
  const counts = !selCode
    ? { logs: 0, lists: 0, tasks: 0 }
    : detail?.loading || !detail
      ? null
      : { logs: planillas.length, lists: listas.length, tasks: tasks.length };
  const countLabel = !selCode
    ? "Sin materia"
    : !detail || detail.loading
      ? "Cargando…"
      : `${activeCount} ${tab === "lists" ? "registrada" : "publicada"}${activeCount === 1 ? "" : "s"}`;

  function toggleShowAll() {
    setShowAll((s) => ({ ...s, [tab]: !s[tab] }));
  }

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--gold)]">
              Portal del tutor
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Docentes y planillas
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Identificá al docente, elegí la materia y consultá con comodidad las planillas de tareas,
              las asistencias y las tareas publicadas.
            </p>
          </div>
          <label className="relative block">
            <span className="sr-only">Buscar docente</span>
            <PortalIcon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar docente o materia…"
              className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[var(--institutional)] focus:ring-2 focus:ring-[var(--institutional)]/15 sm:w-80"
            />
          </label>
        </div>

        {scope && (
          <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-[var(--gold)]/25 bg-[var(--paper)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm font-bold text-[var(--institutional)]">
              <PortalIcon name="users" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Docentes del curso de {scopeLabel} primero</span>
            </p>
            <button
              type="button"
              onClick={() => setScope(null)}
              className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-stone-200 hover:bg-stone-100"
            >
              Ver todos
            </button>
          </div>
        )}

        {msg && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
            <PortalIcon name="alert-circle" className="mt-0.5 h-4 w-4 shrink-0" />
            {msg}
          </p>
        )}
      </div>

      {loading ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 h-4 w-48 animate-pulse rounded bg-stone-100" />
          <LoadingCards />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <EmptyState
            icon="search"
            title="No encontramos docentes"
            text={
              q
                ? `No hay coincidencias para “${q}”. Probá con otro nombre o materia.`
                : "Todavía no hay docentes para mostrar."
            }
          />
          {q && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setQ("")}
                className="rounded-lg bg-[#5d4037] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
              >
                Limpiar búsqueda
              </button>
            </div>
          )}
        </div>
      ) : !selected ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Elegí un docente</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Abrí su ficha para ver las materias, planillas y tareas publicadas.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold text-slate-600">
              {filtered.length} docente{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => (
              <TeacherChoice
                key={t.id}
                teacher={t}
                active={t.id === selectedId}
                compact={false}
                onClick={() => pickTeacher(t)}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-7">
              <TeacherAvatar
                nombre={selected.nombre}
                foto={selected.foto}
                className="h-20 w-20 sm:h-24 sm:w-24"
                textClass="text-2xl"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--gold)]">
                  Ficha del docente
                </p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {selected.nombre}
                </h2>
                <p className="mt-1 text-sm font-bold text-[var(--institutional)]">
                  {selected.titulo ?? "Docente del colegio"}
                </p>
                {selected.bio && (
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">{selected.bio}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
                    <PortalIcon name="book" className="h-3.5 w-3.5" />
                    {selected.materias.length} materia{selected.materias.length === 1 ? "" : "s"}
                  </span>
                  {selected.horario && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
                      <PortalIcon name="clock" className="h-3.5 w-3.5" />
                      {selected.horario}
                    </span>
                  )}
                </div>
                {selected.materias.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.materias.map((m) => (
                      <span
                        key={m.code}
                        title={`${m.name} (${cursoDe(m)})`}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
                      >
                        <PortalIcon name={subjectIcon(m.name)} className="h-3.5 w-3.5 text-[var(--gold)]" />
                        <span className="truncate">{m.name}</span>
                        <span className="shrink-0 font-semibold text-slate-400">({cursoDe(m)})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-stone-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
              >
                <PortalIcon name="close" className="h-4 w-4" />
                Ocultar ficha
              </button>
            </div>

            <div className="border-t border-stone-100 bg-stone-50 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Materias y cursos</p>
                  <p className="text-xs text-slate-500">Elegí una materia para consultar únicamente su material.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-500 ring-1 ring-stone-200">
                  {selected.materias.length} asignación{selected.materias.length === 1 ? "" : "es"}
                </span>
              </div>

              {selected.materias.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-stone-200 bg-white p-4 text-sm text-slate-500">
                  Este docente todavía no tiene materias asignadas.
                </p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {selected.materias.map((m) => {
                    const active = selCode === m.code;
                    return (
                      <button
                        key={m.code}
                        type="button"
                        onClick={() => selectSubject(m.code)}
                        aria-pressed={active}
                        title={`${m.name} · ${cursoDe(m)}`}
                        className={`group flex min-h-[78px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                          active
                            ? "border-[#5d4037] bg-[#5d4037] text-white shadow-md"
                            : "border-stone-200 bg-white text-slate-700 hover:border-[var(--institutional)]/40 hover:bg-stone-50"
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                            active ? "bg-white/15 text-white" : "bg-stone-100 text-[var(--institutional)]"
                          }`}
                        >
                          <PortalIcon name={subjectIcon(m.name)} className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block break-words text-[13px] font-extrabold leading-tight">
                            {m.name}
                          </span>
                          <span
                            className={`mt-0.5 block text-[11px] font-semibold ${
                              active ? "text-stone-200" : "text-slate-400"
                            }`}
                          >
                            {cursoDe(m)}
                          </span>
                        </span>
                        {active && <PortalIcon name="check-circle" className="h-4 w-4 shrink-0 text-white/80" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-extrabold text-slate-900">Cambiar docente</p>
                <p className="text-xs text-slate-500">Seleccioná otro docente del directorio.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold text-slate-600">
                {filtered.length} docente{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {filtered.map((t) => (
                <TeacherChoice
                  key={t.id}
                  teacher={t}
                  active={t.id === selected.id}
                  compact
                  onClick={() => pickTeacher(t)}
                />
              ))}
            </div>
          </div>

          <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 border-b border-stone-100 pb-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--gold)]">
                  Material de la materia
                </p>
                <h3
                  className="mt-1 truncate text-xl font-extrabold text-slate-900 sm:text-2xl"
                  title={selectedMateria?.name}
                >
                  {selectedMateria?.name ?? "Materia"}
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  {selectedMateria ? cursoDe(selectedMateria) : ""} · {selected.nombre}
                </p>
              </div>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Contenidos del docente">
                {TAB_ORDER.map((key) => {
                  const meta = TAB_COPY[key];
                  const active = tab === key;
                  const count = counts ? counts[key] : null;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      id={`tab-${key}`}
                      aria-selected={active}
                      aria-controls="material-panel"
                      onClick={() => setTab(key)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition-colors ${
                        active
                          ? "bg-[#5d4037] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <PortalIcon name={meta.icon} className="h-4 w-4" />
                      <span>{meta.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                          active ? "bg-white/20 text-white" : "bg-white text-slate-500"
                        }`}
                      >
                        {count == null ? "…" : count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5" role="tabpanel" id="material-panel" aria-labelledby={`tab-${tab}`}>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900">{activeMeta.label}</h4>
                  <p className="mt-0.5 text-sm text-slate-500">{activeMeta.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold text-slate-600">
                    {countLabel}
                  </span>
                  {canShowMore && (
                    <button
                      type="button"
                      onClick={toggleShowAll}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                    >
                      <PortalIcon
                        name="chevron-down"
                        className={`h-3.5 w-3.5 transition-transform ${showAll[tab] ? "rotate-180" : ""}`}
                      />
                      {showAll[tab] ? "Ver menos" : `Ver todas (${activeCount})`}
                    </button>
                  )}
                </div>
              </div>

              {!selCode ? (
                <EmptyState
                  icon="book"
                  title="Sin materias asignadas"
                  text="Este docente todavía no tiene materias o cursos asignados."
                />
              ) : !detail || detail.loading ? (
                <LoadingCards />
              ) : detail.error ? (
                <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2">
                    <PortalIcon name="alert-circle" className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
                    <div>
                      <p className="font-extrabold text-red-900">No se pudo cargar el material</p>
                      <p className="mt-0.5 text-sm text-red-700">{detail.error}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => selected && selCode && loadDetail(selected.id, selCode, true)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#5d4037] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                  >
                    <PortalIcon name="refresh" className="h-4 w-4" />
                    Reintentar
                  </button>
                </div>
              ) : tab === "tasks" ? (
                tasks.length === 0 ? (
                  <EmptyState icon="file-text" title={activeMeta.emptyTitle} text={activeMeta.emptyText} />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {visibleTasks.map((a) => (
                      <TaskCard
                        key={a.id}
                        task={a}
                        subjectLabel={selectedMateria ? cursoDe(selectedMateria) : undefined}
                        expanded={openTask === a.id}
                        onToggle={() => setOpenTask((id) => (id === a.id ? null : a.id))}
                        onOpenImage={(src, label, fileName) => setViewer({ src, label, fileName })}
                        onOpenPdf={openPdf}
                      />
                    ))}
                  </div>
                )
              ) : activeLogs.length === 0 ? (
                <>
                  <EmptyState icon={activeMeta.icon} title={activeMeta.emptyTitle} text={activeMeta.emptyText} />
                  {detail.hasMoreLogs && (
                    <LoadMoreButton loading={detail.loadingMore} onClick={loadMoreLogs} />
                  )}
                </>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {visibleLogs.map((l) => (
                      <PlanillaCard
                        key={l.id}
                        item={l}
                        kind={tab === "lists" ? "ASISTENCIA" : "TAREA"}
                        onOpen={(src, label, fileName) => setViewer({ src, label, fileName })}
                      />
                    ))}
                  </div>
                  {detail.hasMoreLogs && (
                    <LoadMoreButton loading={detail.loadingMore} onClick={loadMoreLogs} />
                  )}
                </>
              )}
            </div>
          </section>
        </>
      )}

      {viewer && (
        <ImageViewer
          src={viewer.src}
          label={viewer.label}
          fileName={viewer.fileName}
          onClose={() => setViewer(null)}
        />
      )}
    </section>
  );
}
