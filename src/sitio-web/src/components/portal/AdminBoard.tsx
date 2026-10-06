"use client";

import { useEffect, useState } from "react";

type Enrollment = {
  id: string;
  status: string;
  periodLabel: string;
  createdAt: string;
  tutorName?: string | null;
  nivel?: string | null;
  curso?: string | null;
  seccion?: string | null;
  turno?: string | null;
  emailSent?: boolean;
  academic: { code: string; name: string; shortName: string } | null;
  student: { user: { firstName: string; lastName: string; ci: string; email: string; phone?: string | null } };
};

type Stats = {
  usersByRole: { role: string; _count: { role: number } }[];
  enrollByStatus: { status: string; _count: { status: number } }[];
  gradesCount: number;
  assignCount: number;
  attendanceCount: number;
  academics: { code: string; shortName: string; name: string; _count: { students: number } }[];
};

const ROLE_ES: Record<string, string> = {
  ADMIN: "Dirección",
  TEACHER: "Docentes",
  PARENT: "Tutores",
  STUDENT: "Alumnos",
  ASPIRANT: "Aspirantes",
};

const inputCls =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

/** Panel funcional de Dirección/Secretaría: estadísticas + bandeja de inscripciones. */
export default function AdminBoard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [sRes, eRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch(`/api/enrollments${statusFilter ? `?status=${statusFilter}` : ""}`),
      ]);
      const sJson = await sRes.json();
      const eJson = await eRes.json();
      if (sRes.ok) setStats(sJson.data);
      if (eRes.ok) setEnrollments(eJson.data);
      if (!sRes.ok && !eRes.ok) setMsg("No se pudo cargar el panel. Verificá la base de datos.");
    } catch {
      setMsg("Error de red al cargar el panel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function setStatus(id: string, status: string) {
    setMsg(null);
    const res = await fetch("/api/enrollments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo actualizar");
    else {
      setMsg(`Solicitud ${status}. ${status === "APROBADA" ? "El aspirante ya es ALUMNO." : ""}`);
      load();
    }
  }

  const statusColor = (s: string) =>
    s === "APROBADA"
      ? "bg-emerald-100 text-emerald-800"
      : s === "RECHAZADA" || s === "CANCELADA"
        ? "bg-red-100 text-red-800"
        : s === "EN_REVISION"
          ? "bg-blue-100 text-blue-800"
          : "bg-amber-100 text-amber-800";

  return (
    <div className="grid gap-6">
      {msg && <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{msg}</p>}

      {/* Estadísticas */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Resumen institucional</h2>
        {loading && !stats ? (
          <p className="mt-3 text-sm text-slate-500">Cargando estadísticas…</p>
        ) : stats ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.usersByRole.map((u) => (
              <div key={u.role} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{ROLE_ES[u.role] ?? u.role}</p>
                <p className="text-2xl font-extrabold text-slate-900">{u._count.role}</p>
              </div>
            ))}
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Notas cargadas</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.gradesCount}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tareas</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.assignCount}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Asistencias</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.attendanceCount}</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Sin datos. Levantá la base de datos y corré el seed.</p>
        )}
        {stats && (
          <div className="mt-4">
            <p className="text-sm font-bold text-slate-700">Solicitudes por estado</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {stats.enrollByStatus.map((e) => (
                <span key={e.status} className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor(e.status)}`}>
                  {e.status}: {e._count.status}
                </span>
              ))}
              {stats.enrollByStatus.length === 0 && (
                <span className="text-sm text-slate-400">Sin solicitudes todavía.</span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Bandeja */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--institutional)]">Bandeja de inscripciones</h2>
            <p className="mt-1 text-sm text-slate-500">Revisá, poné en revisión, aprobá o rechazá. Al aprobar, el aspirante pasa a ALUMNO.</p>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
            <option value="">Todas</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="EN_REVISION">En revisión</option>
            <option value="APROBADA">Aprobadas</option>
            <option value="RECHAZADA">Rechazadas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-4">Aspirante</th>
                <th className="py-2 pr-4">Nivel / Bachillerato</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-slate-500">Sin solicitudes para este filtro.</td></tr>
              ) : (
                enrollments.map((e) => (
                  <tr key={e.id} className="border-b align-top last:border-0">
                    <td className="py-2 pr-4">
                      <p className="font-semibold">{e.student.user.firstName} {e.student.user.lastName}</p>
                      <p className="text-xs text-slate-500">CI {e.student.user.ci} · {e.student.user.email ?? "sin correo"}</p>
                      <p className="text-xs text-slate-500">Tutor: {e.tutorName ?? "—"} · Período {e.periodLabel}</p>
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      {e.academic ? e.academic.name : `EEB ${e.curso ?? ""}${e.seccion ? ` "${e.seccion}"` : ""}`.trim()}
                      <p className="text-xs text-slate-500">
                        Turno {e.turno === "MAÑANA" ? "Mañana" : e.turno === "TARDE" ? "Tarde" : "—"}
                        {e.emailSent === false ? " · ✉️ aviso pendiente" : ""}
                      </p>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`rounded px-2 py-0.5 font-bold ${statusColor(e.status)}`}>{e.status}</span>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => setStatus(e.id, "EN_REVISION")} className="rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">Revisar</button>
                        <button onClick={() => setStatus(e.id, "APROBADA")} className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">Aprobar</button>
                        <button onClick={() => setStatus(e.id, "RECHAZADA")} className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-800">Rechazar</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {stats && stats.academics.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-extrabold text-[var(--institutional)]">Matrícula por bachillerato</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {stats.academics.map((a) => (
              <p key={a.code} className="flex justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm">
                <span>{a.name}</span>
                <strong>{a._count.students}</strong>
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
