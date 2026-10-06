"use client";

import { useState } from "react";

const NUMS = [
  { n: "0975 493753", wa: "595975493753" },
  { n: "0982 296194", wa: "595982296194" },
  { n: "0971 884497", wa: "595971884497" },
];

/** Botón flotante de WhatsApp con los 3 contactos de Secretaría. */
export default function WhatsAppFloat() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-20 left-4 z-40 sm:bottom-5 sm:left-5">
      {open && (
        <div className="mb-2 w-60 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
          <p className="bg-[var(--institutional)] px-4 py-2.5 text-sm font-bold text-white">
            Secretaría por WhatsApp
          </p>
          {NUMS.map((c) => (
            <a
              key={c.wa}
              href={`https://wa.me/${c.wa}?text=${encodeURIComponent("Hola, consulta desde la web del colegio.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-emerald-50"
            >
              <span className="text-lg">💬</span> {c.n}
            </a>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-2xl text-white shadow-xl transition-transform hover:scale-105"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
