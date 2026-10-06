"use client";

import { useEffect, useState } from "react";

type Row = { id: string; actorName: string | null; action: string; detail: string | null; createdAt: string };

/** Auditoría: quién hizo qué (solo Dirección). */
export default function AuditAdmin() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch("/api/auditoria?take=60", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j.data) setRows(j.data);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-[var(--institutional)]">Auditoría</h2>
      <p className="mt-1 text-sm text-slate-500">Últimas acciones registradas.</p>
      <a
        href="/api/admin/backup"
        className="mt-3 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
      >
        ⬇ Descargar respaldo (JSON)
      </a>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Sin registros todavía.</p>
      ) : (
        <ol className="mt-3 grid max-h-72 gap-1.5 overflow-y-auto text-sm">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg bg-slate-50 px-3 py-2">
              <b>{r.action}</b>{" "}
              <span className="text-slate-600">{r.detail ?? ""}</span>
              <span className="block text-xs text-slate-400">
                {r.actorName ?? "sistema"} · {new Date(r.createdAt).toLocaleString("es-PY")}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
