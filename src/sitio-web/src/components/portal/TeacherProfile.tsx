"use client";

import { useState } from "react";

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

/**
 * Ficha pública del docente (repositorio): título, presentación y horario.
 * Lo que guarda aquí aparece en la tarjeta pública del docente.
 */
export default function TeacherProfile() {
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [schedule, setSchedule] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/teacher/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), bio: bio.trim(), schedule: schedule.trim() }),
      });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo guardar");
      else setMsg("Ficha pública actualizada.");
    } catch {
      setMsg("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-extrabold text-[var(--institutional)]">Mi ficha pública</h2>
      <p className="mt-1 text-sm text-slate-500">
        Esto se muestra en el repositorio de docentes junto a tu nombre y materias.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Título
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Ej: Prof. de Matemática"
            className={inputCls}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Horario
          <input
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            maxLength={300}
            placeholder="Ej: Lun–Vie 7:00–12:00"
            className={inputCls}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
          Presentación
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Contanos sobre vos, tu formación y tu forma de enseñar…"
            className={`${inputCls} leading-relaxed`}
          />
        </label>
      </div>
      {msg && (
        <p className="mt-3 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-900">{msg}</p>
      )}
      <div className="mt-3">
        <button type="button" onClick={save} disabled={saving} className="btn-gold disabled:opacity-50">
          {saving ? "Guardando…" : "Guardar ficha"}
        </button>
      </div>
    </section>
  );
}
