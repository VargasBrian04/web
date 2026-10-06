"use client";

import { useEffect, useState } from "react";

type Aviso = { id: string; title: string; body: string; createdAt: string; leido: boolean };

/** Bandeja de comunicados con confirmación de lectura. */
export default function Avisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/comunicados", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setAvisos(json.data ?? []);
      else setMsg(json.error || "No se pudo cargar");
    } catch {
      setMsg("Error de red al cargar");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function leer(id: string) {
    try {
      const res = await fetch("/api/comunicados/leer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) load();
    } catch {
      /* ignore */
    }
  }

  const pendientes = avisos.filter((a) => !a.leido).length;

  return (
    <div className="grid gap-4">
      {msg && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{msg}</p>
      )}
      <p className="text-sm text-slate-500">
        {pendientes === 0 ? "Estás al día. ✅" : `${pendientes} sin leer.`}
      </p>
      {avisos.length === 0 && !msg && (
        <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-slate-500">
          Sin comunicados.
        </p>
      )}
      {avisos.map((a) => (
        <article
          key={a.id}
          className={`rounded-2xl border-2 bg-white p-6 shadow-sm ${
            a.leido ? "border-stone-200" : "border-[var(--gold)]"
          }`}
        >
          <p className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {new Date(a.createdAt).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" })}
            {!a.leido && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800">Sin leer</span>
            )}
          </p>
          <h2 className="mt-1 font-extrabold text-[var(--institutional)]">{a.title}</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{a.body}</p>
          {!a.leido && (
            <button
              type="button"
              onClick={() => leer(a.id)}
              className="btn-gold mt-4"
            >
              Marcar como leído ✓
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
