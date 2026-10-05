"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NEWS_CATEGORIES } from "@/lib/news";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  imageUrl: string | null;
  imageFile: string | null;
  status: "BORRADOR" | "PUBLICADA";
  publishedAt: string | null;
  createdAt?: string | null;
  authorName: string | null;
};

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";
const labelCls = "block text-sm font-semibold text-slate-700";
const PAGE_SIZE = 6;

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function thumbOf(p: Post): string | null {
  if (p.imageFile) return `/api/news/${p.id}/image`;
  return p.imageUrl;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function NewsAdmin() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [fCat, setFCat] = useState("todas");
  const [fStatus, setFStatus] = useState("todos");
  const [page, setPage] = useState(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(NEWS_CATEGORIES[0]);
  const [publishDate, setPublishDate] = useState(todayISO());
  const [status, setStatus] = useState<"BORRADOR" | "PUBLICADA">("BORRADOR");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dirty, setDirty] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [deleting, setDeleting] = useState<Post | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/news?all=1");
      const json = await res.json();
      if (res.ok) setPosts(json.data ?? []);
      else setMsg(json.error || "No se pudo cargar el listado");
    } catch {
      setMsg("Error de red al cargar las noticias");
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter((p) => {
      if (fCat !== "todas" && p.category !== fCat) return false;
      if (fStatus !== "todos" && p.status !== fStatus) return false;
      if (needle && !p.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [posts, q, fCat, fStatus]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const cats = useMemo(() => [...new Set(posts.map((p) => p.category))], [posts]);

  function pickFile(f: File | null) {
    if (!f) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
      setMsg("Formato no permitido (solo PNG, JPG o WEBP)");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setMsg("Imagen muy pesada (máx 10 MB)");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setRemoveImage(false);
    setDirty(true);
  }

  function exec(cmd: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    setDirty(true);
  }

  function insertLink() {
    const url = window.prompt("Pegá el enlace (https://…)", "https://");
    if (url) exec("createLink", url);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setCategory(NEWS_CATEGORIES[0]);
    setPublishDate(todayISO());
    setStatus("BORRADOR");
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setCurrentImage(null);
    setRemoveImage(false);
    setDirty(false);
    if (editorRef.current) editorRef.current.innerHTML = "";
    if (fileRef.current) fileRef.current.value = "";
  }

  function openCreate() {
    resetForm();
    setMsg(null);
    setOpen(true);
  }

  function startEdit(p: Post) {
    setEditingId(p.id);
    setTitle(p.title);
    setCategory((NEWS_CATEGORIES as readonly string[]).includes(p.category) ? p.category : NEWS_CATEGORIES[0]);
    setPublishDate(p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 10) : todayISO());
    setStatus(p.status);
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setCurrentImage(thumbOf(p));
    setRemoveImage(false);
    setDirty(false);
    setMsg(null);
    setOpen(true);
    requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.innerHTML = p.content || "";
    });
  }

  function tryClose() {
    if (dirty && !window.confirm("Tenés cambios sin guardar. ¿Cerrar igual?")) return;
    setOpen(false);
    resetForm();
  }

  async function submit(wantStatus: "BORRADOR" | "PUBLICADA") {
    if (saving) return;
    setMsg(null);
    const content = editorRef.current?.innerHTML.trim() || "";
    const textOnly = editorRef.current?.innerText.trim() || "";
    if (title.trim().length < 4) { setMsg("El título es obligatorio (mínimo 4 caracteres)"); return; }
    if (wantStatus === "PUBLICADA" && textOnly.length < 10) { setMsg("El contenido es obligatorio para publicar"); return; }
    if (!publishDate) { setMsg("La fecha de publicación es obligatoria"); return; }
    setSaving(true);
    try {
      let res: Response;
      if (editingId) {
        const hasImageChange = !!file || removeImage;
        if (hasImageChange) {
          const fd = new FormData();
          fd.set("title", title.trim());
          fd.set("category", category);
          fd.set("publishDate", publishDate);
          fd.set("status", wantStatus);
          fd.set("content", content);
          if (file) fd.set("image", file);
          if (removeImage && !file) fd.set("removeImage", "1");
          res = await fetch(`/api/news/${editingId}`, { method: "PATCH", body: fd });
        } else {
          res = await fetch(`/api/news/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: title.trim(), category, publishDate, status: wantStatus, content }),
          });
        }
      } else {
        const fd = new FormData();
        fd.set("title", title.trim());
        fd.set("category", category);
        fd.set("publishDate", publishDate);
        fd.set("status", wantStatus);
        fd.set("content", content);
        if (file) fd.set("image", file);
        res = await fetch("/api/news", { method: "POST", body: fd });
      }
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo guardar");
      else {
        setMsg(editingId ? "Noticia actualizada correctamente." : wantStatus === "PUBLICADA" ? "Noticia publicada correctamente." : "Noticia guardada como borrador.");
        setOpen(false);
        resetForm();
        load();
      }
    } catch {
      setMsg("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true);
    try {
      const res = await fetch(`/api/news/${deleting.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo eliminar");
      else {
        setMsg("Noticia eliminada correctamente.");
        if (editingId === deleting.id) { setOpen(false); resetForm(); }
        load();
      }
    } catch {
      setMsg("Error de red al eliminar");
    } finally {
      setDeletingBusy(false);
      setDeleting(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--institutional)] sm:text-3xl">Blog / Noticias</h1>
            <p className="mt-1 text-sm text-slate-500">Anuncios, actividades y comunicados.</p>
          </div>
          <button type="button" onClick={openCreate} className="btn-gold">
            + Crear noticia
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Buscar por título…" className={inputCls} aria-label="Buscar por título" />
          <select value={fCat} onChange={(e) => { setFCat(e.target.value); setPage(0); }} className={inputCls} aria-label="Filtrar por categoría">
            <option value="todas">Todas las categorías</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={fStatus} onChange={(e) => { setFStatus(e.target.value); setPage(0); }} className={inputCls} aria-label="Filtrar por estado">
            <option value="todos">Todos los estados</option>
            <option value="PUBLICADA">Publicadas</option>
            <option value="BORRADOR">Borradores</option>
          </select>
        </div>

        {msg && <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{msg}</p>}

        {visible.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Sin resultados. Creá la primera con “Crear noticia”.</p>
        ) : (
          <>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {visible.map((p) => (
                <article key={p.id} className="flex gap-4 rounded-xl border border-stone-200 p-4">
                  {thumbOf(p) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbOf(p)!} alt={p.title} className="h-20 w-20 shrink-0 rounded-lg object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-[var(--paper)] text-3xl">📰</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold uppercase tracking-wide text-[var(--gold)]">{p.category}</span>
                      <span className="text-slate-400">Pub: {fmtDate(p.publishedAt)}</span>
                      <span className={`rounded-full px-2 py-0.5 font-bold ${p.status === "PUBLICADA" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {p.status === "PUBLICADA" ? "Publicada" : "Borrador"}
                      </span>
                    </p>
                    <h3 className="mt-1 truncate font-bold text-slate-900" title={p.title}>{p.title}</h3>
                    <p className="text-xs text-slate-400">Creada: {fmtDate(p.createdAt)}</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => startEdit(p)} className="rounded-lg bg-[var(--institutional)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">
                        Editar
                      </button>
                      <button type="button" onClick={() => setDeleting(p)} title="Eliminar noticia" className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>Página {safePage + 1} de {pages} · {filtered.length} noticias</span>
              <div className="flex gap-2">
                <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 font-bold disabled:opacity-40">←</button>
                <button type="button" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 font-bold disabled:opacity-40">→</button>
              </div>
            </div>
          </>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center" onClick={tryClose}>
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 border-b border-stone-100 p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8d3a3] text-2xl">📰</span>
              <div className="flex-1">
                <h2 className="text-xl font-extrabold text-[var(--institutional)]">{editingId ? "Editar noticia" : "Crear nueva noticia"}</h2>
                <p className="text-sm text-slate-500">Completa la información de la noticia. Luego publícala para que aparezca en la sección de noticias del sitio.</p>
              </div>
              <button type="button" onClick={tryClose} aria-label="Cerrar" className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100">✕</button>
            </div>

            <div className="grid max-h-[75vh] gap-5 overflow-y-auto p-6">
              <label className={labelCls}>
                Título de la noticia <span className="text-red-600">*</span>
                <input value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} placeholder="Lanzamiento de la página web oficial del colegio" maxLength={160} className={inputCls} />
              </label>

              <div className="grid gap-5 sm:grid-cols-3">
                <label className={labelCls}>
                  Categoría <span className="text-red-600">*</span>
                  <select value={category} onChange={(e) => { setCategory(e.target.value); setDirty(true); }} className={inputCls}>
                    {NEWS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className={labelCls}>
                  Fecha de publicación <span className="text-red-600">*</span>
                  <input type="date" value={publishDate} onChange={(e) => { setPublishDate(e.target.value); setDirty(true); }} className={inputCls} />
                </label>
                <label className={labelCls}>
                  Estado <span className="text-red-600">*</span>
                  <select value={status} onChange={(e) => { setStatus(e.target.value as "BORRADOR" | "PUBLICADA"); setDirty(true); }} className={inputCls}>
                    <option value="BORRADOR">Borrador</option>
                    <option value="PUBLICADA">Publicada</option>
                  </select>
                </label>
              </div>

              <div>
                <p className={labelCls}>Contenido de la noticia <span className="text-red-600">*</span></p>
                <div className="mt-1 overflow-hidden rounded-lg border border-slate-300 focus-within:border-[var(--institutional)]">
                  <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
                    <button type="button" title="Negrita" onClick={() => exec("bold")} className="rounded px-2.5 py-1 text-sm font-extrabold text-slate-700 hover:bg-slate-200">B</button>
                    <button type="button" title="Cursiva" onClick={() => exec("italic")} className="rounded px-2.5 py-1 text-sm italic text-slate-700 hover:bg-slate-200">I</button>
                    <button type="button" title="Título" onClick={() => exec("formatBlock", "h3")} className="rounded px-2.5 py-1 text-sm font-bold text-slate-700 hover:bg-slate-200">H</button>
                    <button type="button" title="Lista con viñetas" onClick={() => exec("insertUnorderedList")} className="rounded px-2.5 py-1 text-sm text-slate-700 hover:bg-slate-200">•☰</button>
                    <button type="button" title="Lista ordenada" onClick={() => exec("insertOrderedList")} className="rounded px-2.5 py-1 text-sm text-slate-700 hover:bg-slate-200">1.☰</button>
                    <button type="button" title="Insertar enlace" onClick={insertLink} className="rounded px-2.5 py-1 text-sm text-slate-700 hover:bg-slate-200">🔗</button>
                  </div>
                  <div ref={editorRef} contentEditable data-placeholder="Escribí aquí el contenido de la noticia..." className="min-h-[180px] bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6" />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0] ?? null); }} onClick={() => fileRef.current?.click()} className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${dragOver ? "border-[var(--institutional)] bg-[var(--paper)]" : "border-[#c9a35c]"}`}>
                  <span className="text-4xl">🖼️</span>
                  <p className="mt-3 text-sm font-bold text-[var(--institutional)]">Arrastra una imagen o selecciona un archivo</p>
                  <p className="mt-1 text-xs text-slate-500">JPG, JPEG, PNG, WEBP · Máx. 10 MB</p>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Seleccionar archivo</span>
                  <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
                </div>
                <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                  {preview || (!removeImage && currentImage) ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview ?? currentImage ?? ""} alt="Vista previa de la imagen" className="max-h-64 w-full bg-[var(--paper)] object-contain" />
                      <button type="button" onClick={() => { if (preview) { URL.revokeObjectURL(preview); setPreview(null); setFile(null); } else { setRemoveImage(true); setCurrentImage(null); } if (fileRef.current) fileRef.current.value = ""; setDirty(true); }} title="Quitar imagen" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">✕</button>
                      <p className="border-t border-stone-100 px-3 py-2 text-xs text-slate-500">Vista previa de la imagen</p>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-400">
                      <span className="text-3xl">🖼️</span>
                      Sin imagen: se publica solo con texto.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-stretch justify-end gap-2 border-t border-stone-100 pt-5 sm:flex-row">
                <button type="button" onClick={() => submit("BORRADOR")} disabled={saving} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  {saving ? "Guardando…" : "Guardar borrador"}
                </button>
                <button type="button" onClick={() => submit(editingId ? status : "PUBLICADA")} disabled={saving} className="btn-gold justify-center disabled:opacity-50">
                  {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Publicar noticia"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-extrabold text-red-700">Eliminar noticia</h3>
            <p className="mt-2 text-sm text-slate-600">¿Estás seguro de que deseas eliminar <strong>“{deleting.title}”</strong>? Esta acción no se puede deshacer.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleting(null)} disabled={deletingBusy} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={confirmDelete} disabled={deletingBusy} className="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50">{deletingBusy ? "Eliminando…" : "Eliminar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
