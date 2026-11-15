"use client";

import { useEffect, useState } from "react";

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

type Evento = {
  id: string;
  date: string;
  title: string;
  body: string | null;
  active: boolean;
};

const HOY = new Date().toISOString().slice(0, 10);

function fmt(s: string): string {
  return s.slice(0, 10).split("-").reverse().join("/");
}

/** Calendario escolar (solo Dirección): cargar fechas, editar y eliminar. */
export default function CalendarAdmin() {
  const [todos, setTodos] = useState<Evento[]>([]);
  const [date, setDate] = useState(HOY);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/calendario", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setTodos(json.data ?? []);
      else {
        setError(true);
        setMsg(json.error || "No se pudieron cargar las fechas");
      }
    } catch {
      setError(true);
      setMsg("Error de red al cargar el calendario");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function nuevo() {
    setEditando(null);
    setDate(HOY);
    setTitle("");
    setBody("");
    setMsg(null);
    setError(false);
  }

  function editar(e: Evento) {
    setEditando(e.id);
    setDate(e.date.slice(0, 10));
    setTitle(e.title);
    setBody(e.body ?? "");
    setMsg(null);
    setError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardar() {
    if (busy) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
      setError(true);
      setMsg("Elegí una fecha válida.");
      return;
    }
    if (!title.trim()) {
      setError(true);
      setMsg("Escribí el título del evento.");
      return;
    }
    setBusy(true);
    setError(false);
    setMsg(null);
    try {
      const res = await fetch("/api/calendario", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editando ? { id: editando } : {}),
          date,
          title: title.trim(),
          body: body.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(true);
        setMsg(json.error || "No se pudo guardar la fecha");
      } else {
        setMsg(editando ? "Fecha actualizada." : "Fecha publicada en /calendario.");
        nuevo();
        load();
      }
    } catch {
      setError(true);
      setMsg("Error de red al guardar");
    } finally {
      setBusy(false);
    }
  }

  async function alternar(e: Evento) {
    setBusy(true);
    try {
      const res = await fetch("/api/calendario", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: e.id, active: !e.active }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(true);
        setMsg(json.error || "No se pudo cambiar el estado");
      } else {
        setMsg(!e.active ? "Fecha visible de nuevo." : "Fecha oculta (no se muestra).");
        load();
      }
    } catch {
      setError(true);
      setMsg("Error de red");
    } finally {
      setBusy(false);
    }
  }

  async function eliminar(e: Evento) {
    if (!window.confirm(`¿Eliminar esta fecha?\n\n${e.title} — ${fmt(e.date)}`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/calendario?id=${encodeURIComponent(e.id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(true);
        setMsg(json.error || "No se pudo eliminar");
      } else {
        setMsg("Fecha eliminada.");
        if (editando === e.id) nuevo();
        load();
      }
    } catch {
      setError(true);
      setMsg("Error de red al eliminar");
    } finally {
      setBusy(false);
    }
  }

  const hoy = HOY;
  const proximos = todos.filter((e) => e.active && e.date.slice(0, 10) >= hoy);
  const pasados = todos.filter((e) => e.active && e.date.slice(0, 10) < hoy);
  const ocultos = todos.filter((e) => !e.active);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-[var(--institutional)]">Calendario escolar</h2>
      <p className="mt-1 text-sm text-slate-500">
        Cargá las fechas del año: exámenes, actos, reuniones, entrega de boletines.
        Se publican en /calendario y se pueden descargar como .ics.
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Fecha
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Título
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
            placeholder="Ej.: Exámenes finales — 1.º a 3.º curso"
            className={inputCls}
          />
        </label>
      </div>
      <label className="mt-3 block text-sm font-semibold text-slate-700">
        Detalle (opcional)
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Horario, cursos incluidos, si se suspende por lluvia, etc."
          className={inputCls}
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={guardar} disabled={busy} className="btn-gold disabled:opacity-50">
          {editando ? "Guardar cambios" : "Publicar fecha"}
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

      <div className="mt-6 grid gap-4 border-t border-stone-200 pt-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
            Próximas ({proximos.length})
          </h3>
          {proximos.length === 0 ? (
            <p className="mt-2 rounded-xl bg-[var(--paper)] px-4 py-3 text-sm text-slate-500">
              Sin fechas próximas.
            </p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {proximos.map((e) => (
                <li key={e.id} className="rounded-xl border border-stone-200 p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-[var(--gold)]">{fmt(e.date)}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{e.title}</p>
                  <Fila evento={e} busy={busy} onEditar={editar} onOcultar={alternar} onEliminar={eliminar} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
            Ya pasadas ({pasados.length}) · ocultas ({ocultos.length})
          </h3>
          {(pasados.length === 0 && ocultos.length === 0) ? (
            <p className="mt-2 rounded-xl bg-[var(--paper)] px-4 py-3 text-sm text-slate-500">
              Nada por acá.
            </p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {[...pasados, ...ocultos].map((e) => (
                <li key={e.id} className="rounded-xl border border-stone-200 p-3 opacity-75">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">{fmt(e.date)}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{e.title}</p>
                  {!e.active && <p className="text-xs font-bold text-slate-400">Oculta</p>}
                  <Fila evento={e} busy={busy} onEditar={editar} onOcultar={alternar} onEliminar={eliminar} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Fila({
  evento,
  busy,
  onEditar,
  onOcultar,
  onEliminar,
}: {
  evento: Evento;
  busy: boolean;
  onEditar: (e: Evento) => void;
  onOcultar: (e: Evento) => void;
  onEliminar: (e: Evento) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
      <button type="button" onClick={() => onEditar(evento)} disabled={busy} className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 disabled:opacity-50">
        Editar
      </button>
      <button type="button" onClick={() => onOcultar(evento)} disabled={busy} className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 disabled:opacity-50">
        {evento.active ? "Ocultar" : "Activar"}
      </button>
      <button type="button" onClick={() => onEliminar(evento)} disabled={busy} className="rounded-lg border border-red-200 px-3 py-1.5 text-red-700 disabled:opacity-50">
        Eliminar
      </button>
    </div>
  );
}