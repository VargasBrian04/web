"use client";

import { useState } from "react";
import AdminBoard from "@/components/portal/AdminBoard";
import AdminUsers from "@/components/portal/AdminUsers";
import AccountRequests from "@/components/portal/AccountRequests";
import ContentAdmin from "@/components/portal/ContentAdmin";
import MediaAdmin from "@/components/portal/MediaAdmin";
import CoursesAdmin from "@/components/portal/CoursesAdmin";
import ComunicadosAdmin from "@/components/portal/ComunicadosAdmin";
import TimetablesAdmin from "@/components/portal/TimetablesAdmin";
import { CalendarAdmin, PollsAdmin } from "@/components/portal/SchoolAdmin";
import AuditAdmin from "@/components/portal/AuditAdmin";

const TABS = [
  { id: "insc", label: "Inscripciones" },
  { id: "cuentas", label: "Cuentas" },
  { id: "contenido", label: "Contenido" },
  { id: "acad", label: "Académico" },
  { id: "auditoria", label: "Auditoría" },
] as const;

/** Panel de Dirección ordenado por pestañas (una zona a la vez). */
export default function AdminTabs() {
  const [tab, setTab] = useState<string>("insc");
  return (
    <div className="grid gap-4">
      <nav className="sticky top-16 z-30 -mx-1 flex gap-2 overflow-x-auto bg-[var(--paper)] px-1 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-selected={tab === t.id}
            className={`whitespace-nowrap rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${
              tab === t.id
                ? "border-[var(--institutional)] bg-[var(--institutional)] text-white"
                : "border-slate-300 bg-white text-slate-600"
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
      {tab === "acad" && (
        <div className="grid gap-6">
          <CoursesAdmin />
          <ComunicadosAdmin />
          <TimetablesAdmin />
          <CalendarAdmin />
          <PollsAdmin />
        </div>
      )}
      {tab === "auditoria" && (
        <div className="grid gap-6">
          <AuditAdmin />
        </div>
      )}
    </div>
  );
}
