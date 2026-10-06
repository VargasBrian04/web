"use client";

import { useState } from "react";
import AdminBoard from "@/components/portal/AdminBoard";
import AdminUsers from "@/components/portal/AdminUsers";
import AccountRequests from "@/components/portal/AccountRequests";
import ContentAdmin from "@/components/portal/ContentAdmin";
import MediaAdmin from "@/components/portal/MediaAdmin";
import { PollsAdmin } from "@/components/portal/SchoolAdmin";

const TABS = [
  { id: "insc", label: "📝 Inscripciones" },
  { id: "cuentas", label: "👥 Cuentas" },
  { id: "contenido", label: "🖼️ Contenido" },
  { id: "encuestas", label: "📊 Encuestas" },
] as const;

/** Panel de Dirección ordenado por pestañas (una zona a la vez). */
export default function AdminTabs() {
  const [tab, setTab] = useState<string>("insc");
  return (
    <div className="grid gap-4">
      <nav className="sticky top-16 z-30 -mx-1 flex gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-selected={tab === t.id}
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-extrabold transition-all ${
              tab === t.id
                ? "bg-[var(--institutional)] text-white shadow-md"
                : "text-slate-600 hover:bg-[var(--paper)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "insc" && (
        <div className="grid gap-6">
          <AdminBoard />
        </div>
      )}
      {tab === "cuentas" && (
        <div className="grid gap-6">
          <AccountRequests />
          <AdminUsers />
        </div>
      )}
      {tab === "contenido" && (
        <div className="grid gap-6">
          <ContentAdmin />
          <MediaAdmin />
        </div>
      )}
      {tab === "encuestas" && (
        <div className="grid gap-6">
          <PollsAdmin />
        </div>
      )}
    </div>
  );
}
