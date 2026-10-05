"use client";

import { useEffect, useState } from "react";

export const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[var(--institutional)] disabled:bg-slate-100 min-h-[44px]";

export type Catalog = {
  eebGrades: string[];
  mediaCourses: string[];
  secciones: string[];
  bachilleratos: { code: string; shortName: string; name: string }[];
  subjects: { code: string; name: string; gradeYear: number; academicCode: string; academicShort: string }[];
};

export function useCatalog() {
  const [cat, setCat] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/catalogo")
      .then((r) => r.json())
      .then((j) => {
        if (j.data) setCat(j.data);
        else setError("No se pudo cargar la oferta académica");
      })
      .catch(() => setError("Sin conexión con el servidor"));
  }, []);
  return { cat, error };
}

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs font-semibold text-red-600">{msg}</p>;
}

export function SectionTitle({ n, title, desc }: { n: string; title: string; desc?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--institutional)] text-sm font-extrabold text-white">
        {n}
      </span>
      <div>
        <h3 className="font-extrabold text-[var(--institutional)]">{title}</h3>
        {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
      </div>
    </div>
  );
}

export type Person = { ci: string; firstName: string; lastName: string; phone: string; email: string };
export type PersonErrors = Partial<Record<keyof Person, string>>;

export function PersonFields({
  value, errors, onChange, disabled,
}: {
  value: Person;
  errors: PersonErrors;
  onChange: (k: keyof Person, v: string) => void;
  disabled?: boolean;
}) {
  const f = (
    k: keyof Person, label: string, extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>
  ) => (
    <label className="block text-sm font-semibold text-slate-700">
      {label} <span className="text-red-600">*</span>
      <input
        value={value[k]}
        onChange={(e) => onChange(k, e.target.value)}
        disabled={disabled}
        className={`${inputCls} ${errors[k] ? "!border-red-500" : ""}`}
        {...extra}
      />
      <FieldError msg={errors[k]} />
    </label>
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {f("ci", "Número de cédula", { inputMode: "numeric", placeholder: "Ej: 4567890" })}
      {f("phone", "Número de teléfono", { inputMode: "tel", placeholder: "Ej: 0981 123 456" })}
      {f("firstName", "Nombres", { placeholder: "Ej: María" })}
      {f("lastName", "Apellidos", { placeholder: "Ej: Ayala" })}
      <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
        Correo electrónico <span className="text-red-600">*</span>
        <input
          type="email"
          value={value.email}
          onChange={(e) => onChange("email", e.target.value)}
          disabled={disabled}
          placeholder="correo@ejemplo.com"
          className={`${inputCls} ${errors.email ? "!border-red-500" : ""}`}
        />
        <FieldError msg={errors.email} />
      </label>
    </div>
  );
}

export function SuccessView({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
      <p className="text-5xl">✅</p>
      <h2 className="mt-3 text-2xl font-extrabold text-emerald-900">{title}</h2>
      <div className="mt-3 text-sm text-emerald-800">{children}</div>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <a href="/" className="btn-primary justify-center">Volver al inicio</a>
        <a href="/#contacto" className="rounded-lg border border-emerald-300 px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-100">
          Contactar a Secretaría
        </a>
      </div>
    </div>
  );
}
