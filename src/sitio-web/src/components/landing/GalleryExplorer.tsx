"use client";

import { useMemo, useState } from "react";
import { galleryCategories, galleryItems } from "@/data/institucional";

/** Galería con filtros por categoría y ampliación al seleccionar. */
export default function GalleryExplorer() {
  const [filter, setFilter] = useState<(typeof galleryCategories)[number]>("Todas");
  const [active, setActive] = useState<number | null>(null);

  const items = useMemo(
    () => galleryItems.filter((g) => filter === "Todas" || g.category === filter),
    [filter]
  );

  return (
    <div>
      <div className="mt-6 flex flex-wrap gap-2">
        {galleryCategories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              filter === c
                ? "bg-[var(--institutional)] text-white shadow"
                : "border border-stone-300 bg-white text-stone-600 hover:border-[var(--institutional)] hover:text-[var(--institutional)]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((g, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <figure
            key={g.src}
            onClick={() => setActive(i)}
            className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-2xl bg-[var(--institutional)]"
          >
            <img
              src={g.src}
              alt={g.caption}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--institutional)]/40 to-[var(--institutional-light)]/20" />
            <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/0" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-white">
              <span className="mb-1 inline-block rounded bg-[var(--gold)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                {g.category}
              </span>
              <p className="text-sm font-semibold">{g.caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      {items.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">
          Aún no hay fotos en esta categoría. Información pendiente.
        </p>
      )}

      {active !== null && items[active] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setActive(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={items[active].src}
            alt={items[active].caption}
            className="max-h-[85vh] max-w-full rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
