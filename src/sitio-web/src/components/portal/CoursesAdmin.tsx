"use client";

import { useEffect, useState } from "react";

type Course = {
  id: string; nombre: string; nivel: string; curso: string;
  seccion: string | null; turno: string; active: boolean;
  academic: { code: string; shortName: string } | null;
};

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

/** Cursos y secciones formales (solo Dirección). */
export default function CoursesAdmin() {
  const [items, setItems] = useState<Course[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", nivel: "EEB", curso: "", seccion: "", turno: "MAÑANA" });

  async function load() {
    try {
      const res = await fetch("/api/courses", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setItems(json.data ?? []);
    } catch {
      setMsg("Error de red al cargar");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setMsg(null);
    if (!form.nombre.trim() || !form.curso.trim()) {
      setMsg("Nombre y curso obligatorios.");
      return;
    }
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, nombre: form.nombre.trim(), curso: form.curso.trim() }),
      });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo crear");
      else {
        setMsg("Curso creado.");
        setForm({ nombre: "", nivel: "EEB", curso: "", seccion: "", turno: "MAÑANA" });
        load();
      }
    } catch {
      setMsg("Error de red al crear");
    }
  }

  async function toggle(c: Course) {
    try {
      const res = await fetch("/api/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, active: !c.active }),
      });
      if (res.ok) load();
    } catch {
      /* ignore */
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar este curso?")) return;
    try {
      const res = await fetch(`/api/courses?id=${id}`, { method: "DELETE" });
      if (res.ok) load();
      else setMsg("No se pudo eliminar");
    } catch {
      setMsg("Error de red al eliminar");
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-[var(--institutional)]">Cursos y secciones</h2>
      <p className="mt-1 text-sm text-slate-500">Nómina formal de cursos (antes solo texto).</p>
      {msg && (
        <p className="mt-3 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-900">{msg}</p>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
          Nombre
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: 7.º A — Mañana" maxLength={120} className={inputCls} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Nivel
          <select value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })} className={inputCls}>
            <option value="EEB">Escolar Básica</option>
            <option value="MEDIA">Media</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Curso
          <input value={form.curso} onChange={(e) => setForm({ ...form, curso: e.target.value })} placeholder="7.º / 1.º" className={inputCls} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Sección
          <select value={form.seccion} onChange={(e) => setForm({ ...form, seccion: e.target.value })} className={inputCls}>
            <option value="">—</option>
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Turno
          <select value={form.turno} onChange={(e) => setForm({ ...form, turno: e.target.value })} className={inputCls}>
            <option value="MAÑANA">Mañana</option>
            <option value="TARDE">Tarde</option>
          </select>
        </label>
      </div>
      <button type="button" onClick={create} className="btn-gold mt-3">
        Crear curso
      </button>
      <div className="mt-4 grid gap-2">
        {items.length === 0 && <p className="text-sm text-slate-500">Sin cursos cargados.</p>}
        {items.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 px-4 py-2.5 text-sm">
            <span>
              <b>{c.nombre}</b>{" "}
              <span className="text-slate-500">
                {c.nivel} {c.curso}{c.seccion ? ` "${c.seccion}"` : ""} · {c.turno === "MAÑANA" ? "Mañana" : "Tarde"}
              </span>{" "}
              {!c.active && <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-bold">Inactivo</span>}
            </span>
            <span className="flex gap-1">
              <button type="button" onClick={() => toggle(c)} className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                {c.active ? "Desactivar" : "Activar"}
              </button>
              <button type="button" onClick={() => remove(c.id)} className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                ✕
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
