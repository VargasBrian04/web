"use client";

import { useState } from "react";

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

/** Nuevo comunicado (solo Dirección). El listado vive en /portal/avisos. */
export default function ComunicadosAdmin() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("TODOS");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function send() {
    if (saving) return;
    if (!title.trim() || !body.trim()) {
      setMsg("Título y texto obligatorios.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/comunicados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), audience }),
      });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo publicar");
      else {
        setMsg("Comunicado publicado.");
        setTitle("");
        setBody("");
      }
    } catch {
      setMsg("Error de red al publicar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-[var(--institutional)]">Comunicados</h2>
      <p className="mt-1 text-sm text-slate-500">
        Publicá avisos por rol. Cada usuario confirma su lectura en /portal/avisos.
      </p>
      {msg && (
        <p className="mt-3 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-900">{msg}</p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Título
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} className={inputCls} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Destinatarios
          <select value={audience} onChange={(e) => setAudience(e.target.value)} className={inputCls}>
            <option value="TODOS">Todos</option>
            <option value="TEACHER">Docentes</option>
            <option value="PARENT">Tutores</option>
            <option value="STUDENT">Alumnos</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
          Texto
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={5000} className={`${inputCls} leading-relaxed`} />
        </label>
      </div>
      <button type="button" onClick={send} disabled={saving} className="btn-gold mt-3 disabled:opacity-50">
        {saving ? "Publicando…" : "Publicar comunicado"}
      </button>
    </section>
  );
}
