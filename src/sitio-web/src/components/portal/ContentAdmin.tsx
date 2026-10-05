"use client";

import { useEffect, useState } from "react";

const ZONAS = [
  { key: "historia", label: "Historia de la institución" },
  { key: "mision", label: "Misión" },
  { key: "vision", label: "Visión" },
];

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

/**
 * Contenido editable del sitio (solo Dirección). Cada zona guarda su texto
 * en la DB; la portada lo muestra con respaldo fijo si aún no se editó.
 */
export default function ContentAdmin() {
  const [key, setKey] = useState("historia");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load(k: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/contenido", { cache: "no-store" });
      const json = await res.json();
      const row = (json.data ?? []).find((r: { key: string }) => r.key === k);
      setTitle(row?.title ?? "");
      setBody(row?.body ?? "");
      if (!row) setMsg("Esta zona aún usa el texto original del sitio.");
      else setMsg(null);
    } catch {
      setMsg("Error de red al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function save() {
    if (saving) return;
    if (body.trim().length < 10) {
      setMsg("Texto muy corto (mínimo 10 caracteres).");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/contenido", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, title: title.trim() || null, body: body.trim() }),
      });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo guardar");
      else setMsg("Contenido actualizado. Ya se ve en la portada.");
    } catch {
      setMsg("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-[var(--institutional)]">Contenido del sitio</h2>
      <p className="mt-1 text-sm text-slate-500">
        Historia, misión y visión sin tocar código. Se publica al instante.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {ZONAS.map((z) => (
          <button
            key={z.key}
            type="button"
            onClick={() => setKey(z.key)}
            className={`rounded-full border-2 px-4 py-2 text-sm font-bold ${
              key === z.key
                ? "border-[var(--institutional)] bg-[var(--institutional)] text-white"
                : "border-slate-300 text-slate-600"
            }`}
          >
            {z.label}
          </button>
        ))}
      </div>
      {msg && (
        <p className="mt-3 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-900">{msg}</p>
      )}
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando…</p>
      ) : (
        <div className="mt-4 grid gap-4">
          <label className="block text-sm font-semibold text-slate-700">
            Título (opcional)
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} className={inputCls} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Texto
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              maxLength={20000}
              placeholder="Escribí aquí el texto de la zona…"
              className={`${inputCls} leading-relaxed`}
            />
          </label>
          <div>
            <button type="button" onClick={save} disabled={saving} className="btn-gold disabled:opacity-50">
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
