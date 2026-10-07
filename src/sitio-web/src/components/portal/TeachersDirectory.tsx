"use client";

import { useEffect, useState } from "react";

type Teacher = {
  nombre: string;
  titulo: string | null;
  materias: { code: string; name: string }[];
  bio: string | null;
  horario: string | null;
  foto: string | null;
};

/** Directorio de docentes (repositorio público, sin datos sensibles). */
export default function TeachersDirectory() {
  const [items, setItems] = useState<Teacher[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teachers", { cache: "no-store" })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (ok) setItems(j.data ?? []);
        else setMsg(j.error || "No se pudo cargar el directorio");
      })
      .catch(() => setMsg("Error de red al cargar"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((t) =>
    `${t.nombre} ${t.titulo ?? ""} ${(t.materias ?? []).map((m) => m.name).join(" ")}`
      .toLowerCase()
      .includes(q.trim().toLowerCase())
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--institutional)]">Docentes del colegio</h2>
          <p className="mt-1 text-sm text-slate-500">Conocé a quienes enseñan a tus hijos.</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o materia…"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]"
        />
      </div>
      {msg && <p className="mt-3 rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{msg}</p>}
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando docentes…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Sin docentes para mostrar.</p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {filtered.map((t) => {
            const initials = t.nombre.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
            return (
              <article key={t.nombre} className="flex gap-4 rounded-xl border border-stone-200 p-4">
                {t.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.foto} alt={t.nombre} className="h-20 w-20 shrink-0 rounded-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--institutional)] text-xl font-extrabold text-white">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900">{t.nombre}</h3>
                  {t.titulo && <p className="text-sm font-semibold text-[var(--gold)]">{t.titulo}</p>}
                  {(t.materias ?? []).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(t.materias ?? []).map((m) => (
                        <span key={m.code} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {t.bio && <p className="mt-1.5 text-sm text-slate-600">{t.bio}</p>}
                  {t.horario && <p className="mt-1 text-xs text-slate-500">Horario: {t.horario}</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
