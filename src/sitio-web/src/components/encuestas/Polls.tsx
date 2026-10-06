"use client";

import { useEffect, useState } from "react";

type Poll = {
  id: string;
  question: string;
  options: string[];
  counts: number[];
  total: number;
  miVoto: number | null;
};

/** Encuestas públicas: votar (con sesión) y ver resultados. */
export default function Polls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [login, setLogin] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/encuestas", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) {
        setPolls(json.data ?? []);
        setLogin(!!json.login);
      }
    } catch {
      /* sin red */
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function vote(pollId: string, optionIdx: number) {
    setMsg(null);
    try {
      const res = await fetch("/api/encuestas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, optionIdx }),
      });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "No se pudo votar");
      else load();
    } catch {
      setMsg("Error de red al votar");
    }
  }

  return (
    <div className="grid gap-4">
      {msg && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{msg}</p>
      )}
      {polls.length === 0 && (
        <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-slate-500">
          No hay encuestas activas.
        </p>
      )}
      {polls.map((p) => (
        <article key={p.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-extrabold text-[var(--institutional)]">{p.question}</h2>
          <p className="mt-1 text-xs text-slate-400">{p.total} votos</p>
          <div className="mt-4 grid gap-2">
            {p.options.map((op, i) => {
              const pct = p.total ? Math.round((p.counts[i] / p.total) * 100) : 0;
              const mine = p.miVoto === i;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!login || p.miVoto !== null}
                  onClick={() => vote(p.id, i)}
                  title={!login ? "Ingresá para votar" : p.miVoto !== null ? "Ya votaste" : "Votar"}
                  className={`relative overflow-hidden rounded-lg border-2 px-4 py-2.5 text-left text-sm font-semibold transition-colors disabled:cursor-default ${
                    mine
                      ? "border-[var(--institutional)]"
                      : "border-slate-200 hover:border-[var(--institutional)]"
                  }`}
                >
                  <span
                    className="absolute inset-y-0 left-0 bg-amber-100"
                    style={{ width: `${pct}%` }}
                  />
                  <span className="relative flex justify-between gap-2">
                    <span>{mine ? "✓ " : ""}{op}</span>
                    <span className="text-slate-500">{pct}%</span>
                  </span>
                </button>
              );
            })}
          </div>
          {!login && (
            <p className="mt-3 text-xs text-slate-500">
              <a href="/login?next=/encuestas" className="font-bold underline">Ingresá</a> para votar.
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
