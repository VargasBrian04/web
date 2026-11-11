"use client";

import { useEffect, useState } from "react";

type Stats = {
  usersByRole: { role: string; _count: { role: number } }[];
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

/** Panel funcional de Dirección/Secretaría: estadísticas y matrícula. */
export default function AdminBoard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const sRes = await fetch("/api/admin/stats");
      const sJson = await sRes.json();
      if (sRes.ok) setStats(sJson.data);
      else setMsg("No se pudo cargar el panel. Verificá la base de datos.");
    } catch {
      setMsg("Error de red al cargar el panel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
