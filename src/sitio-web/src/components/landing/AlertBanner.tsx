"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Alerta = {
  id: string;
  message: string;
  level: string;
  link: string | null;
  linkLabel: string | null;
};

const ESTILO: Record<string, string> = {
  INFO: "border-[#e6d8c9] bg-[#fbf7f1] text-[var(--institutional)]",
  AVISO: "border-amber-200 bg-amber-50 text-amber-900",
  URGENTE: "border-[#e6c4c4] bg-[#fdf2f2] text-[#7a1b1b]",
};

const ETIQUETA: Record<string, string> = {
  INFO: "Aviso",
  AVISO: "Importante",
  URGENTE: "Urgente",
};

const CLAVE = "csl-aviso-cerrado-";

/**
 * Avisos institucionales que Dirección publica desde el panel.
 * Cada visitante puede cerrarlos; se recuerdan en este navegador.
 */
export default function AlertBanner() {
  const pathname = usePathname();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [ocultas, setOcultas] = useState<string[]>([]);

  useEffect(() => {
    try {
      const guardadas = Object.keys(localStorage).filter((k) => k.startsWith(CLAVE));
      setOcultas(guardadas.map((k) => k.slice(CLAVE.length)));
    } catch {
      // Sin almacenamiento: se muestran siempre.
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    fetch("/api/alertas", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (vivo && Array.isArray(j?.data)) setAlertas(j.data);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [pathname]);

  if (pathname.startsWith("/portal")) return null;

  const visibles = alertas.filter((a) => !ocultas.includes(a.id));
  if (visibles.length === 0) return null;

  function cerrar(id: string) {
    setOcultas((l) => [...l, id]);
    try {
      localStorage.setItem(CLAVE + id, "1");
    } catch {
      // Sin almacenamiento: se oculta solo en esta página.
    }
  }

  return (
    <div aria-label="Avisos del colegio" className="border-b border-black/5 bg-[var(--paper)]">
      <ul className="container-c grid gap-2 py-2">
        {visibles.map((a) => (
          <li
            key={a.id}
            role="status"
            className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-sm ${ESTILO[a.level] ?? ESTILO.INFO}`}
          >
            <span className="mt-0.5 shrink-0 rounded-md bg-white/70 px-1.5 py-0.5 text-[0.62rem] font-black uppercase tracking-wide">
              {ETIQUETA[a.level] ?? "Aviso"}
            </span>
            <p className="min-w-0 flex-1 font-semibold leading-snug">
              {a.message}
              {a.link && (
                <>
                  {" "}
                  <a href={a.link} className="font-extrabold underline underline-offset-2">
                    {a.linkLabel || "Ver más"}
                  </a>
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => cerrar(a.id)}
              aria-label={`Cerrar aviso: ${a.message.slice(0, 40)}`}
              className="-mr-1 -mt-0.5 shrink-0 rounded-md px-1.5 text-lg leading-none opacity-60 transition-opacity hover:opacity-100"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
