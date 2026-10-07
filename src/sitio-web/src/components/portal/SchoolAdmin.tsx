"use client";

import { useEffect, useState } from "react";

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

type Poll = {
  id: string;
  question: string;
  options: string[];
  active: boolean;
  total: number;
  createdAt: string;
};

/** Encuestas (solo Dirección): crear, listar y eliminar. */
export function PollsAdmin() {
  const [question, setQuestion] = useState("");
  const [opts, setOpts] = useState(["", ""]);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [deleting, setDeleting] = useState<Poll | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/encuestas?all=1", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setPolls(json.data ?? []);
      else setMsg(json.error || "No se pudieron cargar las encuestas");
    } catch {
      setMsg("Error de red al cargar las encuestas");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (saving) return;
    const options = opts.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || options.length < 2) {
      setMsg("Pregunta + 2 opciones mínimo.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/encuestas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), options }),
      });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo crear");
      else {
        setMsg("Encuesta publicada en /encuestas.");
        setQuestion("");
        setOpts(["", ""]);
        load();
      }
    } catch {
      setMsg("Error de red al crear");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true);
    try {
      const res = await fetch(`/api/encuestas?id=${deleting.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo eliminar");
      else {
        setMsg("Encuesta eliminada.");
        load();
      }
    } catch {
      setMsg("Error de red al eliminar");
    } finally {
      setDeletingBusy(false);
      setDeleting(null);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-[var(--institutional)]">Encuestas</h2>
      <p className="mt-1 text-sm text-slate-500">Preguntas con un voto por persona (página /encuestas).</p>
      {msg && (
        <p className="mt-3 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-900">{msg}</p>
      )}
      <label className="mt-4 block text-sm font-semibold text-slate-700">
        Pregunta
        <input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={280} className={inputCls} />
      </label>
      <div className="mt-3 grid gap-2">
        {opts.map((o, i) => (
          <input
            key={i}
            value={o}
            onChange={(e) => setOpts((l) => l.map((x, j) => (j === i ? e.target.value : x)))}
            maxLength={160}
            placeholder={`Opción ${i + 1}`}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]"
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {opts.length < 8 && (
          <button type="button" onClick={() => setOpts((l) => [...l, ""])} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600">
            + Opción
          </button>
        )}
        <button type="button" onClick={create} disabled={saving} className="btn-gold disabled:opacity-50">
          {saving ? "Publicando…" : "Publicar encuesta"}
        </button>
      </div>

      <div className="mt-6 border-t border-stone-100 pt-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-400">Creadas ({polls.length})</h3>
        {polls.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Sin encuestas todavía.</p>
        ) : (
          <ul className="mt-2 grid gap-2">
            {polls.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900" title={p.question}>{p.question}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {p.options.length} opciones · {p.total} votos ·{" "}
                    <span className={`font-bold ${p.active ? "text-emerald-700" : "text-amber-700"}`}>
                      {p.active ? "Publicada" : "Oculta"}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleting(p)}
                  className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleting(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[var(--institutional)] p-5 text-white">
              <h3 className="text-lg font-extrabold">Eliminar encuesta</h3>
              <p className="mt-1 truncate text-sm text-stone-200" title={deleting.question}>“{deleting.question}”</p>
            </div>
            <p className="px-5 pt-4 text-sm text-slate-600">
              Se borran la pregunta y sus {deleting.total} votos. No se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 p-5">
              <button type="button" onClick={() => setDeleting(null)} disabled={deletingBusy} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={confirmDelete} disabled={deletingBusy} className="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50">{deletingBusy ? "Eliminando…" : "Eliminar"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
