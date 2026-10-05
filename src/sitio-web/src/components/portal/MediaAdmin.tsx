"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  slot: string;
  category: string | null;
  caption: string | null;
  url: string;
  createdAt: string;
};

const SLOTS = [
  { id: "GALERIA", label: "Galería general" },
  { id: "btm", label: "Mecánica (BTM)" },
  { id: "bts", label: "Salud (BTS)" },
  { id: "bti", label: "Informática (BTI)" },
  { id: "btc", label: "Contabilidad (BTC)" },
  { id: "adn", label: "Negocios (ADN)" },
  { id: "bte", label: "Electricidad (BTE)" },
  { id: "btcc", label: "Construcciones (BTCC)" },
  { id: "bta", label: "Agropecuaria (BTA)" },
  { id: "cb", label: "Ciencias Básicas (CB)" },
  { id: "cs", label: "Ciencias Sociales (CS)" },
  { id: "eeb7", label: "7.º EEB" },
  { id: "eeb8", label: "8.º EEB" },
  { id: "eeb9", label: "9.º EEB" },
];

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

/**
 * Fotos de galería y de cada curso (solo Dirección). Sube a la DB y la
 * portada las muestra junto a su material fijo.
 */
export default function MediaAdmin() {
  const [items, setItems] = useState<Item[]>([]);
  const [slot, setSlot] = useState("GALERIA");
  const [filter, setFilter] = useState("GALERIA");
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("Actos escolares");
  const [caption, setCaption] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(f: string) {
    try {
      const res = await fetch(`/api/media?slot=${f}`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setItems(json.data ?? []);
      else setMsg(json.error || "No se pudo cargar");
    } catch {
      setMsg("Error de red al cargar");
    }
  }

  useEffect(() => {
    load(filter);
  }, [filter]);

  async function upload() {
    if (busy) return;
    if (!file) {
      setMsg("Elegí una imagen.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMsg("Imagen muy pesada (máx 10 MB).");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.set("image", file);
      fd.set("slot", slot);
      fd.set("category", category);
      fd.set("caption", caption.trim());
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo subir");
      else {
        setMsg("Foto publicada en " + (SLOTS.find((s) => s.id === slot)?.label ?? slot) + ".");
        setFile(null);
        setCaption("");
        if (slot === filter) load(filter);
      }
    } catch {
      setMsg("Error de red al subir");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar esta foto?")) return;
    try {
      const res = await fetch(`/api/media?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo eliminar");
      else {
        setMsg("Foto eliminada.");
        load(filter);
      }
    } catch {
      setMsg("Error de red al eliminar");
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-[var(--institutional)]">Galería y fotos de cursos</h2>
      <p className="mt-1 text-sm text-slate-500">
        Subí fotos a la galería general o a cada orientación. Aparecen en la portada.
      </p>
      {msg && (
        <p className="mt-3 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-900">{msg}</p>
      )}

      <div className="mt-4 grid gap-4 rounded-xl border border-dashed border-[var(--gold)] p-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Zona
          <select value={slot} onChange={(e) => setSlot(e.target.value)} className={inputCls}>
            {SLOTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Foto (PNG/JPG/WEBP · máx 10 MB)
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className={inputCls}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Categoría
          <input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={60} className={inputCls} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Descripción
          <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={160} className={inputCls} />
        </label>
        <div className="sm:col-span-2">
          <button type="button" onClick={upload} disabled={busy} className="btn-gold disabled:opacity-50">
            {busy ? "Subiendo…" : "Publicar foto"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-600">Ver zona:</span>
        {SLOTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setFilter(s.id)}
            className={`rounded-full border px-3 py-1 text-xs font-bold ${
              filter === s.id
                ? "border-[var(--institutional)] bg-[var(--institutional)] text-white"
                : "border-slate-300 text-slate-600"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Sin fotos en esta zona.</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((g) => (
            <div key={g.id} className="relative overflow-hidden rounded-xl border border-stone-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt={g.caption ?? ""} className="h-28 w-full object-cover" loading="lazy" />
              <button
                type="button"
                onClick={() => remove(g.id)}
                title="Eliminar foto"
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                ✕
              </button>
              {g.caption && <p className="truncate px-2 py-1 text-xs text-slate-500">{g.caption}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
