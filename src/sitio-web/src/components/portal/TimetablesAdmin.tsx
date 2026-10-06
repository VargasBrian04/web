"use client";

import { useEffect, useState } from "react";

type Row = { id: string; curso: string; turno: string; detalle: string; active: boolean };

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

/** Horarios por curso (solo Dirección). Se publican en /horarios. */
export default function TimetablesAdmin() {
  const [items, setItems] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ curso: "", turno: "MAÑANA", detalle: "" });

  async function load() {
    try {
      const res = await fetch("/api/horarios", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) {
        // incluir inactivos: pedir todo no filtra; el GET público solo trae activos,
        // para admin alcanza con re-cargar tras cada cambio
        setItems(json.data ?? []);
      }
    } catch {
      setMsg("Error de red al cargar");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!form.curso.trim() || !form.detalle.trim()) {
      setMsg("Curso y detalle obligatorios.");
      return;
    }
    try {
      const res = await fetch("/api/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo crear");
      else {
        setMsg("Horario publicado.");
        setForm({ curso: "", turno: "MAÑANA", detalle: "" });
        load();
      }
    } catch {
      setMsg("Error de red al crear");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar este horario?")) return;
    try {
      const res = await fetch(`/api/horarios?id=${id}`, { method: "DELETE" });
      if (res.ok) load();
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-[var(--institutional)]">Horarios</h2>
      <p className="mt-1 text-sm text-slate-500">Grillas por curso y turno (página /horarios).</p>
      {msg && (
        <p className="mt-3 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-900">{msg}</p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Curso
          <input value={form.curso} onChange={(e) => setForm({ ...form, curso: e.target.value })} placeholder="Ej: 1.º Media BTI" maxLength={120} className={inputCls} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Turno
          <select value={form.turno} onChange={(e) => setForm({ ...form, turno: e.target.value })} className={inputCls}>
            <option value="MAÑANA">Mañana</option>
            <option value="TARDE">Tarde</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
          Detalle (una materia por línea)
          <textarea value={form.detalle} onChange={(e) => setForm({ ...form, detalle: e.target.value })} rows={5} maxLength={5000} className={`${inputCls} leading-relaxed`} />
        </label>
      </div>
      <button type="button" onClick={create} className="btn-gold mt-3">
        Publicar horario
      </button>
      <div className="mt-4 grid gap-2">
        {items.map((h) => (
          <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 px-4 py-2.5 text-sm">
            <span><b>{h.curso}</b> <span className="text-slate-500">· {h.turno === "MAÑANA" ? "Mañana" : "Tarde"}</span></span>
            <button type="button" onClick={() => remove(h.id)} className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">✕</button>
          </div>
        ))}
      </div>
    </section>
  );
}
