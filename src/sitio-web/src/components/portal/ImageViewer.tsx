"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import PortalIcon from "./PortalIcon";

type Props = {
  src: string;
  label: string;
  fileName: string;
  onClose: () => void;
};

/**
 * Visor ampliado de planillas y adjuntos.
 * Mantiene la proporción original, permite zoom/desplazamiento y descarga.
 */
export default function ImageViewer({ src, label, fileName, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setZoom(1);
    setFailed(false);
  }, [src]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(4, z + 0.25));
      if (e.key === "-" || e.key === "_") setZoom((z) => Math.max(1, z - 0.25));
      if (e.key === "0") setZoom(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const stop = (e: MouseEvent) => e.stopPropagation();

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-stone-950/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
    >
      <div
        className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-stone-900/85 px-3 py-2 text-white sm:px-5 sm:py-3"
        onClick={stop}
      >
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{label}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            disabled={zoom <= 1}
            aria-label="Alejar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <PortalIcon name="zoom-out" className="h-5 w-5" />
          </button>
          <span className="w-12 text-center text-xs font-bold tabular-nums text-white/80">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
            disabled={zoom >= 4}
            aria-label="Acercar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <PortalIcon name="zoom-in" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="rounded-lg px-2.5 py-2 text-xs font-bold text-white/85 hover:bg-white/10"
          >
            Ajustar
          </button>
          <a
            href={src}
            download={fileName}
            aria-label={`Descargar ${fileName}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-2 text-xs font-bold text-white hover:bg-white/20"
          >
            <PortalIcon name="download" className="h-4 w-4" />
            <span className="hidden sm:inline">Descargar</span>
          </a>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar visor"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            <PortalIcon name="close" className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-auto p-3 sm:p-6"
        onClick={onClose}
      >
        {failed ? (
          <div
            onClick={stop}
            className="mx-auto mt-16 max-w-md rounded-2xl border border-white/15 bg-white/10 p-6 text-center text-white"
          >
            <PortalIcon name="alert-circle" className="mx-auto h-9 w-9 text-amber-300" />
            <p className="mt-3 font-bold">No se pudo cargar la imagen</p>
            <p className="mt-1 text-sm text-white/70">
              Cerrá el visor e intentá de nuevo. Si el problema continúa, el archivo puede no estar disponible.
            </p>
          </div>
        ) : (
          <div style={{ width: zoom > 1 ? `${zoom * 100}%` : "100%" }} className="min-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={label}
              onError={() => setFailed(true)}
              onClick={stop}
              draggable={false}
              className={
                zoom > 1
                  ? "block h-auto w-full max-w-none rounded-lg bg-white"
                  : "mx-auto block h-auto max-h-[74vh] w-auto max-w-full rounded-lg bg-white object-contain"
              }
            />
          </div>
        )}
      </div>

      <p className="pb-2 text-center text-[11px] text-white/55">
        Usá + / − para acercar · 0 para ajustar · Esc para cerrar
      </p>
    </div>,
    document.body
  );
}
