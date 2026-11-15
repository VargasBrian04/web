"use client";

import { useEffect, useState } from "react";

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

type Alerta = {
  id: string;
  message: string;
  level: string;
  link: string | null;
  linkLabel: string | null;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

type Form = {
  message: string;
  level: string;
  link: string;
  linkLabel: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

const VACIO: Form = {
  message: "",
  level: "INFO",
  link: "",
  linkLabel: "",
  startsAt: "",
  endsAt: "",
  active: true,
};

const NIVELES = [
  { v: "INFO", t: "Informativo" },
  { v: "AVISO", t: "Importante" },
  { v: "URGENTE", t: "Urgente" },
];

const ETIQUETA: Record<string, string> = { INFO: "Informativo", AVISO: "Importante", URGENTE: "Urgente" };
const CHIP: Record<string, string> = {
  INFO: "bg-[#fbf7f1] text-[var(--institutional)] border-[#e6d8c9]",
  AVISO: "bg-amber-50 text-amber-900 border-amber-200",
  URGENTE: "bg-[#fdf2f2] text-[#7a1b1b] border-[#e6c4c4]",
};

function paraInput(fecha: string | null): string {
  if (!fecha) return "";
  return fecha.slice(0, 10);
}

function rango(a: Alerta): string {
  if (!a.startsAt && !a.endsAt) return "Sin límite de fechas";
  const f = (s: string) => s.slice(0, 10).split("-").reverse().join("/");
  if (a.startsAt && a.endsAt) return `Del ${f(a.startsAt)} al ${f(a.endsAt)}`;
  if (a.startsAt) return `Desde el ${f(a.startsAt)}`;
  return `Hasta el ${f(a.endsAt as string)}`;
}

/** Avisos del sitio (solo Dirección): crear, editar, activar y eliminar. */
export default function AlertsAdmin() {
  const [form, setForm] = useState<Form>(VACIO);
  const [editando, setEditando] = useState<string | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/alertas?all=1", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setAlertas(json.data ?? []);
      else {
        setError(true);
        setMsg(json.error || "No se pudieron cargar los avisos");
      }
    } catch {
      setError(true);
      setMsg("Error de red al cargar los avisos");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function set<K extends keyof Form>(campo: K, valor: Form[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function nuevo() {
    setForm(VACIO);
    setEditando(null);
    setMsg(null);
    setError(false);
  }

  function editar(a: Alerta) {
    setForm({
      message: a.message,
      level: a.level,
      link: a.link ?? "",
      linkLabel: a.linkLabel ?? "",
      startsAt: paraInput(a.startsAt),
      endsAt: paraInput(a.endsAt),
      active: a.active,
    });
    setEditando(a.id);
    setMsg(null);
    setError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardar() {
    if (busy) return;
    if (!form.message.trim()) {
      setError(true);
      setMsg("Escribí el mensaje del aviso.");
      return;
    }
    setBusy(true);
    setError(false);
    setMsg(null);
    try {
      const res = await fetch("/api/alertas", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(editando ? { id: editando } : {}) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(true);
        setMsg(json.error || "No se pudo guardar el aviso");
      } else {
        setMsg(editando ? "Aviso actualizado." : "Aviso publicado en el sitio.");
        setForm(VACIO);
        setEditando(null);
        load();
      }
    } catch {
      setError(true);
      setMsg("Error de red al guardar");
    } finally {
      setBusy(false);
    }
  }

  async function alternar(a: Alerta) {
    setBusy(true);
    try {
      const res = await fetch("/api/alertas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, active: !a.active }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(true);
        setMsg(json.error || "No se pudo cambiar el estado");
      } else {
        setMsg(!a.active ? "Aviso activado." : "Aviso desactivado (ya no se muestra).");
        load();
      }
    } catch {
      setError(true);
      setMsg("Error de red al cambiar el estado");
    } finally {
      setBusy(false);
    }
  }

  async function eliminar(a: Alerta) {
    if (!window.confirm(`¿Eliminar este aviso?\n\n"${a.message}"`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/alertas?id=${encodeURIComponent(a.id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(true);
        setMsg(json.error || "No se pudo eliminar");
      } else {
        setMsg("Aviso eliminado.");
        if (editando === a.id) nuevo();
        load();
      }
    } catch {
      setError(true);
      setMsg("Error de red al eliminar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-[var(--institutional)]">Banner de avisos</h2>
      <p className="mt-1 text-sm text-slate-500">
        Se muestra arriba de todo el sitio público. Podés fijar fechas de vigencia; el aviso
        desaparece solo cuando termina. Cada persona puede cerrarlo.
      </p>

      {msg && (
        <p
          className={`mt-3 rounded-lg px-4 py-2.5 text-sm font-semibold ${
            error ? "bg-red-50 text-red-900" : "bg-blue-50 text-blue-900"
          }`}
        >
          {msg}
        </p>
      )}

      <div className="mt-4 grid gap-3">
        <label className="block text-sm font-semibold text-slate-700">
          Mensaje
          <textarea
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            rows={2}
            maxLength={280}
            placeholder="Ej.: Inscripciones abiertas hasta el 12 de diciembre en Secretaría."
            className={inputCls}
          />
          <span className="mt-1 block text-xs font-normal text-slate-400">
            {form.message.length}/280 caracteres
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-slate-700">
            Nivel
            <select value={form.level} onChange={(e) => set("level", e.target.value)} className={inputCls}>
              {NIVELES.map((n) => (
                <option key={n.v} value={n.v}>
                  {n.t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Enlace (opcional)
            <input
              value={form.link}
              onChange={(e) => set("link", e.target.value)}
              maxLength={300}
              placeholder="/noticias/inscripciones-2026"
              className={inputCls}
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Texto del enlace
            <input
              value={form.linkLabel}
              onChange={(e) => set("linkLabel", e.target.value)}
              maxLength={40}
              placeholder="Ver más"
              className={inputCls}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-slate-700">
            Desde (opcional)
            <input type="date" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={inputCls} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Hasta (opcional)
            <input type="date" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} className={inputCls} />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="h-4 w-4"
            />
            Activo (visible en el sitio)
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={guardar} disabled={busy} className="btn-gold disabled:opacity-50">
            {editando ? "Guardar cambios" : "Publicar aviso"}
          </button>
          {editando && (
            <button
              type="button"
              onClick={nuevo}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600"
            >
              Cancelar edición
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-stone-200 pt-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
          Avisos cargados ({alertas.length})
        </h3>
        {alertas.length === 0 ? (
          <p className="mt-3 rounded-xl bg-[var(--paper)] px-4 py-3 text-sm text-slate-500">
            Todavía no hay avisos. El sitio no muestra el banner mientras no haya ninguno activo.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {alertas.map((a) => (
              <li key={a.id} className="rounded-xl border border-stone-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wide ${
                      CHIP[a.level] ?? CHIP.INFO
                    }`}
                  >
                    {ETIQUETA[a.level] ?? a.level}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wide ${
                      a.active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {a.active ? "Visible" : "Oculto"}
                  </span>
                  <span className="text-xs text-slate-400">{rango(a)}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-800">{a.message}</p>
                {a.link && (
                  <p className="mt-1 text-xs text-slate-500">
                    Enlace: <span className="font-mono">{a.link}</span>
                    {a.linkLabel ? ` (${a.linkLabel})` : ""}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                  <button type="button" onClick={() => editar(a)} disabled={busy} className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 disabled:opacity-50">
                    Editar
                  </button>
                  <button type="button" onClick={() => alternar(a)} disabled={busy} className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 disabled:opacity-50">
                    {a.active ? "Ocultar" : "Activar"}
                  </button>
                  <button type="button" onClick={() => eliminar(a)} disabled={busy} className="rounded-lg border border-red-200 px-3 py-1.5 text-red-700 disabled:opacity-50">
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
