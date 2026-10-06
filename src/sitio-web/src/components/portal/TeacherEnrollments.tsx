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
  academic: { code: string; name: string; shortName: string } | null;
  student: { user: { firstName: string; lastName: string; ci: string } };
};

const inputCls =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

/** Inscripciones en solo lectura para el docente (sin aprobar/rechazar). */
export default function TeacherEnrollments() {
  const [items, setItems] = useState<Enrollment[]>([]);
  const [status, setStatus] = useState("PENDIENTE");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/enrollments${status ? `?status=${status}` : ""}`);
      const json = await res.json();
      if (res.ok) setItems(json.data ?? []);
      else setMsg(json.error || "No se pudo cargar");
    } catch {
      setMsg("Error de red al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--institutional)]">Inscripciones (solo lectura)</h2>
          <p className="mt-1 text-sm text-slate-500">Solo Dirección aprueba o rechaza. Aquí ves el movimiento.</p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
          <option value="">Todas</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="EN_REVISION">En revisión</option>
          <option value="APROBADA">Aprobadas</option>
          <option value="RECHAZADA">Rechazadas</option>
        </select>
      </div>
      {msg && <p className="mt-3 rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{msg}</p>}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2 pr-4">Aspirante</th>
              <th className="py-2 pr-4">Nivel / Bachillerato</th>
              <th className="py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="py-4 text-slate-500">Cargando…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={3} className="py-4 text-slate-500">Sin solicitudes para este filtro.</td></tr>
            ) : (
              items.slice(0, 100).map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    <p className="font-semibold">{e.student.user.firstName} {e.student.user.lastName}</p>
                    <p className="text-xs text-slate-500">CI {e.student.user.ci} · {e.periodLabel}</p>
                  </td>
                  <td className="py-2 pr-4 text-slate-600">
                    {e.academic ? `${e.academic.shortName} — ${e.academic.name}` : `${e.nivel ?? ""} ${e.curso ?? ""}${e.seccion ? ` "${e.seccion}"` : ""}`.trim()}
                    <p className="text-xs text-slate-500">Turno {e.turno ?? "—"}</p>
                  </td>
                  <td className="py-2"><span className="rounded bg-slate-100 px-2 py-0.5 font-bold">{e.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
