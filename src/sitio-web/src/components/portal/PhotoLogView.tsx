"use client";

import { useEffect, useState } from "react";

type Log = {
  id: string;
  kind: string;
  photoData: string;
  caption: string | null;
  logDate: string;
  subject: { code: string; name: string } | null;
  teacher: { user: { firstName: string; lastName: string } } | null;
};

/** Fotos de listas y planillas que sube el docente (vista alumno/tutor). */
export default function PhotoLogView({ kind }: { kind: "ASISTENCIA" | "TAREA" }) {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    fetch(`/api/fotolog?kind=${kind}&take=20`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.data)) setLogs(j.data);
      })
      .catch(() => {});
  }, [kind]);

  if (logs.length === 0) return null;
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {logs.map((l) => (
        <figure key={l.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={l.photoData} alt={l.caption ?? ""} className="max-h-72 w-full object-contain bg-stone-100" loading="lazy" />
          <figcaption className="px-3 py-2 text-xs text-slate-500">
            {new Date(l.logDate).toLocaleDateString("es-PY")}
            {l.subject ? ` · ${l.subject.name}` : ""}
            {l.teacher ? ` · ${l.teacher.user.firstName} ${l.teacher.user.lastName}` : ""}
            {l.caption ? <span className="mt-1 block text-sm font-semibold text-amber-900">📝 {l.caption}</span> : null}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
