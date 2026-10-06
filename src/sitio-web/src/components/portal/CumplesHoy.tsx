"use client";

import { useEffect, useState } from "react";

/** Cumpleaños del día en el portal. */
export default function CumplesHoy() {
  const [items, setItems] = useState<{ nombre: string; edad: number | null }[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/cumpleanos", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.data)) setItems(j.data);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  if (!ready || items.length === 0) return null;
  return (
    <div className="rounded-2xl border-2 border-[var(--gold)] bg-white px-6 py-4">
      <p className="font-extrabold text-[var(--institutional)]">
        🎂 Cumpleaños de hoy: {items.map((c) => c.nombre).join(" · ")}
      </p>
    </div>
  );
}
