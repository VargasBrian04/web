"use client";

import { useEffect, useRef, useState } from "react";

/** Envuelve el contenido con animación de aparición al hacer scroll. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(28px)",
        transition: `opacity .7s ease ${delay}ms, transform .7s cubic-bezier(.2,.7,.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Encabezado reutilizable de sección: título + descripción. */
export function SectionHeader({
  title,
  desc,
  light = false,
}: {
  title: string;
  desc?: string;
  light?: boolean;
}) {
  return (
    <Reveal>
      <h2 className={`section-title ${light ? "!text-white" : ""}`}>{title}</h2>
      {desc ? (
        <p className={`mt-3 max-w-3xl ${light ? "text-stone-200" : "text-slate-600"}`}>
          {desc}
        </p>
      ) : null}
    </Reveal>
  );
}

/** Etiqueta para datos aún no confirmados por la Dirección. */
export function PendingBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 align-middle text-[11px] font-bold uppercase tracking-wide text-amber-800">
      Información pendiente
    </span>
  );
}
