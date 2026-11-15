"use client";

import { useEffect, useRef, useState } from "react";

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

type Archivo = { id: string; name: string; mime: string; size: number };

type Comunicado = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  category: string;
  pinned: boolean;
  active: boolean;
  publishedAt: string | null;
  files: Archivo[];
};

type Adjunto = { name: string; mime: string; data: string };

const CATEGORIAS = ["Comunicado", "Inscripciones", "Secretaría", "Institucional"];

/** Comunicados públicos (solo Dirección): crear, editar, publicar y borrar. */
export default function NoticesAdmin() {
  const [lista, setLista] = useState<Comunicado[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Comunicado");
  const [pinned, setPinned] = useState(false);
  const [files, setFiles] = useState<Adjunto[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/comunicados-publicos?all=1", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setLista(json.data ?? []);
      else {
        setError(true);
        setMsg(json.error || "No se pudieron cargar los comunicados");
      }
    } catch {
      setError(true);
      setMsg("Error de red al cargar los comunicados");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function nuevo() {
    setEditando(null);
    setTitle("");
    setSummary("");
    setBody("");
    setCategory("Comunicado");
    setPinned(false);
    setFiles([]);
    setMsg(null);
    setError(false);
  }

  function editar(c: Comunicado) {
    setEditando(c.id);
    setTitle(c.title);
    setSummary(c.summary ?? "");
    setBody(c.body);
    setCategory(c.category);
    setPinned(c.pinned);
    setFiles([]);
    setMsg(null);
    setError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function subirArchivos(sel: FileList | null) {
    if (!sel) return;
    setBusy(true);
    setError(false);
    setMsg(null);
    const nuevos: Adjunto[] = [];
    try {
      for (const f of Array.from(sel)) {
        const buffer = await f.arrayBuffer();
        const data = `data:${f.type};base64,${Buffer.from(buffer).toString("base64")}`;
        nuevos.push({ name: f.name, mime: f.type, data });
      }
      setFiles((l) => [...l, ...nuevos].slice(0, 5));
      setMsg(`${nuevos.length} archivo(s) listos para guardar con el comunicado.`);
    } catch {
      setError(true);
      setMsg("No se pudo leer el archivo");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function guardar() {
    if (busy) return;
    if (!title.trim()) {
      setError(true);
      setMsg("Escribí el título del comunicado.");
      return;
    }
    if (!body.trim()) {
      setError(true);
      setMsg("Escribí el texto del comunicado.");
      return;
    }
    setBusy(true);
    setError(false);
    setMsg(null);
    try {
      const res = await fetch("/api/comunicados-publicos", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editando ?? undefined,
          title,
          summary,
          body,
          category,
          pinned,
          publish: true,
          ...(editando ? (files.length ? { files } : {}) : { files }),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(true);
        setMsg(json.error || "No se pudo guardar");
      } else {
        setMsg(
          editando
            ? "Comunicado actualizado."
            : "Comunicado publicado en /comunicados."
        );
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

  async function alternar(c: Comunicado) {
    setBusy(true);
    try {
      const res = await fetch("/api/comunicados-publicos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, active: !c.active }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(true);
        setMsg(json.error || "No se pudo cambiar el estado");
      } else {
        setMsg(!c.active ? "Comunicado publicado de nuevo." : "Comunicado oculto del sitio.");
        load();
      }
    } catch {
      setError(true);
      setMsg("Error de red");
    } finally {
      setBusy(false);
    }
  }

  async function eliminar(c: Comunicado) {
    if (!window.confirm(`¿Eliminar este comunicado?\n\n"${c.title}"`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/comunicados-publicos?id=${encodeURIComponent(c.id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(true);
        setMsg(json.error || "No se pudo eliminar");
      } else {
        setMsg("Comunicado eliminado.");
        if (editando === c.id) nuevo();
        load();
      }
    } catch {
      setError(true);
      setMsg("Error de red al eliminar");
    } finally {
      setBusy(false);
    }
  }

  function fmtFecha(s: string | null): string {
    if (!s) return "sin publicar";
    return s.slice(0, 10).split("-").reverse().join("/");
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-[var(--institutional)]">Comunicados públicos</h2>
      <p className="mt-1 text-sm text-slate-500">
        Circulares y avisos formales con PDF adjuntos. Se publican en /comunicados y
        quedan descargables para las familias sin necesidad de iniciar sesión.
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
          Título
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={180}
            placeholder="Ej.: Cronograma de exámenes finales — Nivel Medio"
            className={inputCls}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Categoría
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Resumen (opcional)
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={240}
              placeholder="Se genera del texto si lo dejás vacío"
              className={inputCls}
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-slate-700">
          Texto del comunicado
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="Podés escribir con párrafos separados por un salto de línea."
            className={inputCls}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="text-sm font-semibold text-slate-700">
            Adjuntos (PDF/JPG/PNG, máx 5, 10 MB c/u)
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              multiple
              onChange={(e) => subirArchivos(e.target.files)}
              className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-600"
            />
            {files.length > 0 && (
              <ul className="mt-2 grid gap-1">
                {files.map((f) => (
                  <li key={f.name} className="flex items-center justify-between rounded-lg bg-[var(--paper)] px-3 py-1.5 text-xs font-bold text-slate-600">
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((l) => l.filter((x) => x.name !== f.name))}
                      className="text-red-600"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {editando && (
              <p className="mt-1 text-xs font-normal text-slate-400">
                Solo se reemplazan los adjuntos si elegís archivos nuevos.
              </p>
            )}
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4" />
            Fijar arriba en /comunicados
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={guardar} disabled={busy} className="btn-gold disabled:opacity-50">
            {editando ? "Guardar cambios" : "Publicar comunicado"}
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
          Comunicados cargados ({lista.length})
        </h3>
        {lista.length === 0 ? (
          <p className="mt-3 rounded-xl bg-[var(--paper)] px-4 py-3 text-sm text-slate-500">
            Todavía no hay comunicados. /comunicados muestra el mensaje de “sin
            comunicados” hasta que publiques el primero.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {lista.map((c) => (
              <li key={c.id} className="rounded-xl border border-stone-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#fbf7f1] px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wide text-[var(--gold)]">
                    {c.category}
                  </span>
                  {c.pinned && (
                    <span className="rounded-md bg-[var(--institutional)] px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wide text-white">
                      Fijado
                    </span>
                  )}
                  <span
                    className={`rounded-md px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wide ${
                      c.active && c.publishedAt ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c.active && c.publishedAt ? "Publicado" : "Oculto"}
                  </span>
                  <span className="text-xs text-slate-400">{fmtFecha(c.publishedAt)}</span>
                  {c.files.length > 0 && (
                    <span className="text-xs font-bold text-slate-400">{c.files.length} adjunto(s)</span>
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-800">{c.title}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                  <button type="button" onClick={() => editar(c)} disabled={busy} className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 disabled:opacity-50">
                    Editar
                  </button>
                  <button type="button" onClick={() => alternar(c)} disabled={busy} className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 disabled:opacity-50">
                    {c.active ? "Ocultar" : "Publicar"}
                  </button>
                  <button type="button" onClick={() => eliminar(c)} disabled={busy} className="rounded-lg border border-red-200 px-3 py-1.5 text-red-700 disabled:opacity-50">
                    Eliminar
                  </button>
                  <a href={`/comunicados/${c.slug}`} target="_blank" rel="noopener" className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-500">
                    Ver
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}