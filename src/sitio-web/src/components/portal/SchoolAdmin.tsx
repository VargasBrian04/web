"use client";

import { useState } from "react";

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

/** Encuestas (solo Dirección). */
export function PollsAdmin() {
  const [question, setQuestion] = useState("");
  const [opts, setOpts] = useState(["", ""]);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      }
    } catch {
      setMsg("Error de red al crear");
    } finally {
      setSaving(false);
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
    </section>
  );
}
