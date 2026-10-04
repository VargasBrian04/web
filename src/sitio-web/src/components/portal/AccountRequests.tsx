"use client";

import { useEffect, useState } from "react";

type Req = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: string;
  note: string | null;
  createdAt: string;
};

const inputCls =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

function asText(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(", ") || "—";
  if (v == null) return "—";
  return String(v);
}

/** Bandeja de solicitudes de cuenta (tutores/docentes) para Dirección. */
export default function AccountRequests() {
  const [items, setItems] = useState<Req[]>([]);
  const [filter, setFilter] = useState("PENDIENTE");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/solicitudes${filter ? `?status=${filter}` : ""}`);
      const json = await res.json();
      if (res.ok) setItems(json.data ?? []);
      else setMsg(json.error || "No se pudo cargar");
    } catch {
      setMsg("Error de red");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function act(id: string, action: "aprobar" | "rechazar" | "revision") {
    if (busy) return;
    const note =
      action === "rechazar"
        ? window.prompt("Motivo del rechazo (opcional):", "") ?? undefined
        : undefined;
    if (action === "rechazar" && note === undefined) return;
    setBusy(id);
    setMsg(null);
    setResult(null);
    try {
      const res = await fetch("/api/solicitudes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, note }),
      });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo actualizar");
      else {
        if (action === "aprobar") {
          setResult(json.data);
          setMsg("Cuenta creada. Copiá la clave temporal antes de cerrar este aviso.");
        } else setMsg(`Solicitud ${action === "rechazar" ? "rechazada" : "en revisión"}.`);
        load();
      }
    } catch {
      setMsg("Error de red");
    } finally {
      setBusy(null);
    }
  }

  const color = (s: string) =>
    s === "APROBADA"
      ? "bg-emerald-100 text-emerald-800"
      : s === "RECHAZADA" || s === "CANCELADA"
        ? "bg-red-100 text-red-800"
        : s === "EN_REVISION"
          ? "bg-blue-100 text-blue-800"
          : "bg-amber-100 text-amber-800";

  return (
    <div className="grid gap-4">
      {msg && (
        <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{msg}</p>
      )}
      {result && (
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 text-sm">
          <p className="font-extrabold text-emerald-900">✅ Cuenta creada</p>
          <p className="mt-1">
            Usuario: <strong>@{asText((result.cuenta as Record<string, unknown> | undefined)?.username)}</strong>
          </p>
          {(result.cuenta as Record<string, unknown> | undefined)?.tempPassword ? (
            <p className="mt-1">
              Clave temporal (mostrar una sola vez):{" "}
              <strong className="rounded bg-white px-2 py-0.5 font-mono">
                {asText((result.cuenta as Record<string, unknown>).tempPassword)}
              </strong>
            </p>
          ) : (
            <p className="mt-1 text-emerald-800">Se reutilizó una cuenta existente (sin clave nueva).</p>
          )}
          {!!(result.vinculados as unknown[])?.length && (
            <p className="mt-1">Hijos vinculados: {asText(result.vinculados)}</p>
          )}
          {!!(result.pendientesSecretaria as unknown[])?.length && (
            <p className="mt-1 font-semibold text-amber-800">
              Pendiente en Secretaría: {asText(result.pendientesSecretaria)}
            </p>
          )}
          {!!(result.materiasVinculadas as unknown[])?.length && (
            <p className="mt-1">Materias vinculadas: {asText(result.materiasVinculadas)}</p>
          )}
          {!!(result.materiasLibres as unknown[])?.length && (
            <p className="mt-1 font-semibold text-amber-800">
              Materias a registrar: {asText(result.materiasLibres)}
            </p>
          )}
          <button type="button" onClick={() => setResult(null)} className="mt-2 text-xs font-bold underline">
            Cerrar aviso
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--institutional)]">
              Solicitudes de registro
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Tutores y docentes que piden cuenta. Al aprobar se crea el usuario real.
            </p>
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={inputCls}>
            <option value="">Todas</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="EN_REVISION">En revisión</option>
            <option value="APROBADA">Aprobadas</option>
            <option value="RECHAZADA">Rechazadas</option>
          </select>
        </div>

        <div className="mt-4 grid gap-3">
          {items.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">Sin solicitudes para este filtro.</p>
          ) : (
            items.map((r) => {
              const p = r.payload;
              return (
                <article key={r.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-slate-900">
                      {asText(p.firstName)} {asText(p.lastName)}{" "}
                      <span className="ml-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                        {r.type === "TUTOR" ? "Tutor" : "Docente"}
                      </span>
                    </p>
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${color(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    CI {asText(p.ci)} · {asText(p.phone)} · {asText(p.email)}
                  </p>
                  <div className="mt-2 text-xs text-slate-600">
                    {r.type === "TUTOR" ? (
                      <p>
                        Hijos:{" "}
                        {((p.hijos as unknown[]) ?? [])
                          .map((h) => {
                            const hh = h as Record<string, unknown>;
                            return `${asText(hh.nombre)} (${asText(hh.nivel)} ${asText(hh.curso)}${hh.bachiller ? ` · ${asText(hh.bachiller)}` : ""})`;
                          })
                          .join(" · ") || "—"}
                      </p>
                    ) : (
                      <>
                        <p>
                          Principal: {asText(p.materiaPrincipal) ?? asText(p.materiaPrincipalOtra)}
                          {(p.otrasMaterias as unknown[])?.length
                            ? ` · Otras: ${asText(p.otrasMaterias)}`
                            : ""}
                          {(p.otrasLibres as unknown[])?.length
                            ? ` · Libres: ${asText(p.otrasLibres)}`
                            : ""}
                        </p>
                        <p className="mt-0.5">
                          {asText(p.nivel)} · {asText(p.cursos)}
                          {(p.bachilleres as unknown[])?.length
                            ? ` · ${asText(p.bachilleres)}`
                            : ""}
                        </p>
                      </>
                    )}
                  </div>
                  {r.status !== "APROBADA" && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => act(r.id, "aprobar")}
                        className="rounded bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-200 disabled:opacity-50"
                      >
                        {busy === r.id ? "…" : "Aprobar y crear cuenta"}
                      </button>
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => act(r.id, "revision")}
                        className="rounded bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-200 disabled:opacity-50"
                      >
                        En revisión
                      </button>
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => act(r.id, "rechazar")}
                        className="rounded bg-red-100 px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-200 disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
