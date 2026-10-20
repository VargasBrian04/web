"use client";

import { useState } from "react";
import PortalIcon from "./PortalIcon";
import { extFromMime, isImageMime, isPdfMime } from "@/lib/file-types";

export type PlanillaItem = {
  id: string;
  kind: string;
  photoData?: string | null;
  photoUrl?: string | null;
  photoMime?: string | null;
  photoSize?: number | null;
  caption: string | null;
  logDate: string;
  subject: { code: string; name: string } | null;
};

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  fileData?: string | null;
  fileUrl?: string | null;
  fileMime?: string | null;
  fileSize?: number | null;
  dueDate: string | null;
  createdAt?: string | null;
  subject: { code: string; name: string } | null;
};

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Para fechas sin hora (por ejemplo, entrega): evita corrimientos por zona horaria. */
export function fmtDateOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function fmtLongDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-PY", { weekday: "short", day: "2-digit", month: "short" });
}

export function dataUriInfo(src: string | null | undefined): {
  mime: string;
  ext: string;
  size: number | null;
} | null {
  if (!src) return null;
  if (src.startsWith("data:")) {
    const match = /^data:([^;,]+)(;base64)?,/i.exec(src);
    if (!match) return null;
    const mime = match[1].toLowerCase();
    const base64 = src.slice(match[0].length);
    let size: number | null = null;
    if (match[2]) {
      const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
      size = Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
    }
    return { mime, ext: extFromMime(mime), size };
  }

  try {
    const url = new URL(src, "http://local");
    const lastSegment = url.pathname.split("/").pop() ?? "";
    const ext = lastSegment.includes(".") ? lastSegment.split(".").pop()!.toLowerCase() : "";
    const mime =
      ext === "pdf"
        ? "application/pdf"
        : ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : ext === "gif"
              ? "image/gif"
              : /jpe?g/.test(ext)
                ? "image/jpeg"
                : "application/octet-stream";
    return { mime, ext: ext || extFromMime(mime), size: null };
  } catch {
    return null;
  }
}

function metaFrom(source: string | null | undefined, mime: string | null | undefined, size: number | null | undefined) {
  if (mime) return { mime, ext: extFromMime(mime), size: size ?? null };
  return dataUriInfo(source);
}

export function formatBytes(size: number | null): string {
  if (size == null || size <= 0) return "Tamaño no disponible";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageSource(src: string | null | undefined): boolean {
  if (!src) return false;
  return src.startsWith("data:image/") || /\.(jpe?g|png|webp|gif)(?:[?#]|$)/i.test(src);
}

export function isPdfSource(src: string | null | undefined): boolean {
  if (!src) return false;
  return src.startsWith("data:application/pdf") || /\.pdf(?:[?#]|$)/i.test(src);
}

export function slugFileName(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "archivo"
  );
}

export function downloadSource(src: string, fileName: string) {
  const a = document.createElement("a");
  a.href = src;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function PlanillaCard({
  item,
  kind,
  onOpen,
}: {
  item: PlanillaItem;
  kind: "TAREA" | "ASISTENCIA";
  onOpen: (src: string, label: string, fileName: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const src = item.photoUrl || item.photoData || "";
  const meta = metaFrom(item.photoData, item.photoMime, item.photoSize);
  const title = kind === "TAREA" ? "Planilla de tareas" : "Planilla de asistencia";
  const dateLabel = fmtDate(item.logDate);
  const label = `${title} · ${dateLabel}`;
  const fileName = `planilla-${kind === "TAREA" ? "tareas" : "asistencia"}-${item.logDate.slice(0, 10)}.${meta?.ext ?? "jpg"}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => src && onOpen(src, label, fileName)}
        className="group relative block w-full cursor-zoom-in bg-stone-100 text-left"
        aria-label={`Ampliar ${label}`}
      >
        <span className="flex h-[280px] items-center justify-center p-2 sm:h-[340px] xl:h-[360px]">
          {failed || !src ? (
            <span className="flex flex-col items-center gap-2 px-4 text-center text-sm text-slate-500">
              <PortalIcon name="alert-circle" className="h-9 w-9 text-amber-600" />
              <span className="font-semibold">No se pudo cargar la fotografía</span>
              <span className="text-xs">Cerrá y volvé a intentar.</span>
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={label}
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className="max-h-full max-w-full object-contain"
            />
          )}
        </span>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-slate-700 shadow-sm ring-1 ring-stone-200">
          <PortalIcon name="maximize" className="h-3.5 w-3.5" />
          Ampliar
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
            <PortalIcon name="calendar" className="h-3.5 w-3.5" />
            {dateLabel}
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">
            {kind === "TAREA" ? "Publicada" : "Registrada"}
          </span>
          {meta && (
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-stone-200">
              {meta.ext.toUpperCase()}
              {meta.size ? ` · ${formatBytes(meta.size)}` : ""}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{fmtLongDate(item.logDate)}</p>
          {item.caption ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{item.caption}</p>
          ) : (
            <p className="mt-2 text-sm italic text-slate-400">Sin observación del docente.</p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => src && onOpen(src, label, fileName)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#5d4037] px-3.5 py-2 text-xs font-bold text-white hover:opacity-90"
          >
            <PortalIcon name="maximize" className="h-3.5 w-3.5" />
            Ver completa
          </button>
          <button
            type="button"
            onClick={() => src && downloadSource(src, fileName)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <PortalIcon name="download" className="h-3.5 w-3.5" />
            Descargar
          </button>
        </div>
      </div>
    </article>
  );
}

export function TaskCard({
  task,
  subjectLabel,
  expanded,
  onToggle,
  onOpenImage,
  onOpenPdf,
}: {
  task: TaskItem;
  subjectLabel?: string;
  expanded: boolean;
  onToggle: () => void;
  onOpenImage: (src: string, label: string, fileName: string) => void;
  onOpenPdf: (src: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const src = task.fileUrl || task.fileData || "";
  const meta = metaFrom(task.fileData, task.fileMime, task.fileSize);
  const image = isImageMime(task.fileMime) || isImageSource(src);
  const pdf = isPdfMime(task.fileMime) || isPdfSource(src);
  const fileName = `tarea-${slugFileName(task.title)}.${meta?.ext ?? (pdf ? "pdf" : "jpg")}`;
  const longDescription = !!task.description && task.description.length > 180;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#5d4037] px-3 py-1 text-[11px] font-extrabold text-white">
            {task.subject?.name ?? "Tarea"}
          </span>
          {subjectLabel && (
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-stone-200">
              {subjectLabel}
            </span>
          )}
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">
            Publicada
          </span>
        </div>

        <div>
          <h4 className="text-lg font-extrabold leading-snug text-slate-900 sm:text-xl">{task.title}</h4>
          {task.description ? (
            <p className={`mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 ${expanded ? "" : "line-clamp-3"}`}>
              {task.description}
            </p>
          ) : (
            <p className="mt-2 text-sm italic text-slate-400">Sin descripción.</p>
          )}
          {longDescription && (
            <button type="button" onClick={onToggle} className="mt-1.5 text-xs font-bold text-[var(--institutional)] underline">
              {expanded ? "Ver menos" : "Leer completa"}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <PortalIcon name="calendar" className="h-3.5 w-3.5" />
            Publicada: {fmtDate(task.createdAt)}
          </span>
          {task.dueDate && (
            <span className="inline-flex items-center gap-1.5">
              <PortalIcon name="clock" className="h-3.5 w-3.5" />
              Entrega: {fmtDateOnly(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto border-t border-stone-100 bg-slate-50 p-4 sm:p-5">
        {image && src ? (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onOpenImage(src, `Adjunto · ${task.title}`, fileName)}
              className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
              aria-label={`Ampliar adjunto de ${task.title}`}
            >
              {failed ? (
                <span className="flex h-[250px] flex-col items-center justify-center gap-2 px-4 text-center text-sm text-slate-500 sm:h-[320px]">
                  <PortalIcon name="alert-circle" className="h-9 w-9 text-amber-600" />
                  <span className="font-semibold">No se pudo cargar el adjunto</span>
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={`Adjunto de ${task.title}`}
                  loading="lazy"
                  decoding="async"
                  onError={() => setFailed(true)}
                  className="mx-auto h-[250px] w-full object-contain p-1.5 sm:h-[320px]"
                />
              )}
              <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold text-slate-700 shadow-sm ring-1 ring-stone-200">
                <PortalIcon name="maximize" className="h-3.5 w-3.5" />
                Ampliar
              </span>
            </button>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500">
                {meta ? `${meta.ext.toUpperCase()}${meta.size ? ` · ${formatBytes(meta.size)}` : ""}` : "Imagen adjunta"}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onOpenImage(src, `Adjunto · ${task.title}`, fileName)}
                  className="rounded-lg bg-[#5d4037] px-3 py-1.5 text-[11px] font-bold text-white hover:opacity-90"
                >
                  Ver en grande
                </button>
                <button
                  type="button"
                  onClick={() => downloadSource(src, fileName)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-white"
                >
                  Descargar
                </button>
              </div>
            </div>
          </div>
        ) : pdf && src ? (
          <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-3.5 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-100">
              <PortalIcon name="file-text" className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900">Documento PDF</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {meta?.size ? `${formatBytes(meta.size)} · ` : ""}Abrir para leer el documento
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => onOpenPdf(src)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#5d4037] px-3 py-2 text-[11px] font-bold text-white hover:opacity-90"
              >
                <PortalIcon name="external-link" className="h-3.5 w-3.5" />
                Abrir PDF
              </button>
              <button
                type="button"
                onClick={() => downloadSource(src, fileName)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
              >
                <PortalIcon name="download" className="h-3.5 w-3.5" />
                Descargar
              </button>
            </div>
          </div>
        ) : src ? (
          <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-3.5 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <PortalIcon name="folder" className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900">Archivo adjunto</p>
              <p className="mt-0.5 text-xs text-slate-500">{meta ? `${meta.ext.toUpperCase()}${meta.size ? ` · ${formatBytes(meta.size)}` : ""}` : "Archivo del docente"}</p>
            </div>
            <button
              type="button"
              onClick={() => downloadSource(src, fileName)}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
            >
              <PortalIcon name="download" className="h-3.5 w-3.5" />
              Descargar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-stone-200 bg-white px-3.5 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <PortalIcon name="file-text" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-slate-700">Sin adjuntos</p>
              <p className="text-[11px] text-slate-400">El docente no subió archivos para esta tarea.</p>
            </div>
          </div>
        )}

        {task.notes && (
          <p className="mt-3 rounded-lg border-l-4 border-[var(--gold)] bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            <span className="font-extrabold">Observaciones: </span>
            {task.notes}
          </p>
        )}
      </div>
    </article>
  );
}
