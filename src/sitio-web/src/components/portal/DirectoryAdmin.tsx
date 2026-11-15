"use client";

import { useEffect, useState } from "react";

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

type Area = {
  id: string;
  name: string;
  detail: string | null;
  phone: string | null;
  email: string | null;
  hours: string | null;
  order: number;
  active: boolean;
};

/** Directorio público (solo Dirección): áreas de contacto y horarios. */
export default function DirectoryAdmin() {
  const [lista, setLista] = useState<Area[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [hours, setHours] = useState("");
  const [order, setOrder] = useState("0");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/directorio", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setLista(json.data ?? []);
      else {
        setError(true);
        setMsg(json.error || "No se pudo cargar el directorio");
      }
    } catch {
      setError(true);
      setMsg("Error de red al cargar el directorio");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function nuevo() {
    setEditando(null);
    setName("");
    setDetail("");
    setPhone("");
    setEmail("");
    setHours("");
    setOrder("0");
    setMsg(null);
    setError(false);
  }

  function editar(a: Area) {
    setEditando(a.id);
    setName(a.name);
    setDetail(a.detail ?? "");
    setPhone(a.phone ?? "");
    setEmail(a.email ?? "");
    setHours(a.hours ?? "");
    setOrder(String(a.order));
    setMsg(null);
    setError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardar() {
    if (busy) return;
    if (!name.trim()) {
      setError(true);
      setMsg("Escribí el nombre del área (ej.: Secretaría).");
      return;
    }
    setBusy(true);
    setError(false);
    setMsg(null);
    try {
      const res = await fetch("/api/directorio", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editando ? { id: editando } : {}),
          name,
          detail,
          phone,
          email,
          hours,
          order: Number(order) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(true);
        setMsg(json.error || "No se pudo guardar");
      } else {
        setMsg(editando ? "Área actualizada." : "Área publicada en /directorio.");
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

  async function alternar(a: Area) {
    setBusy(true);
    try {
      const res = await fetch("/api/directorio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, active: !a.active }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(true);
        setMsg(json.error || "No se pudo cambiar el estado");
      } else {
        setMsg(!a.active ? "Área visible de nuevo." : "Área oculta del directorio.");
        load();
      }
    } catch {
      setError(true);
      setMsg("Error de red");
    } finally {
      setBusy(false);
    }
  }

  async function eliminar(a: Area) {
    if (!window.confirm(`¿Eliminar "${a.name}" del directorio?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/directorio?id=${encodeURIComponent(a.id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(true);
        setMsg(json.error || "No se pudo eliminar");
      } else {
        setMsg("Área eliminada.");
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
      <h2 className="text-lg font-extrabold text-[var(--institutional)]">Directorio público</h2>
      <p className="mt-1 text-sm text-slate-500">
        Contactos y horarios por área. Aparecen en /directorio. Podés dejarlos en
        blanco: solo se muestra el dato que cargues.
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
          Área
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Ej.: Secretaría"
            className={inputCls}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Qué se atiende (opcional)
          <input
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={200}
            placeholder="Inscripciones, certificados, constancias"
            className={inputCls}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Teléfono (opcional)
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            placeholder="0971 123 456"
            className={inputCls}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Correo (opcional)
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={120}
            placeholder="secretaria@colegio.edu.py"
            className={inputCls}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Horario de atención (opcional)
          <input
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            maxLength={120}
            placeholder="Lun a Vie 07:00 - 12:00"
            className={inputCls}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Orden (menor aparece primero)
          <input
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            inputMode="numeric"
            className={inputCls}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={guardar} disabled={busy} className="btn-gold disabled:opacity-50">
          {editando ? "Guardar cambios" : "Publicar área"}
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

      <div className="mt-6 border-t border-stone-200 pt-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
          Áreas cargadas ({lista.length})
        </h3>
        {lista.length === 0 ? (
          <p className="mt-3 rounded-xl bg-[var(--paper)] px-4 py-3 text-sm text-slate-500">
            Todavía no hay áreas. /directorio muestra el mensaje de “sin cargar”
            hasta que publiques la primera.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {lista.map((a) => (
              <li key={a.id} className="rounded-xl border border-stone-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-extrabold text-slate-800">{a.name}</p>
                  {!a.active && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wide text-slate-500">
                      Oculta
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {[a.phone, a.email, a.hours].filter(Boolean).join(" · ") || "sin datos de contacto"}
                </p>
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