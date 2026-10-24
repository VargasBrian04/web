"use client";

import { useEffect, useState } from "react";

export const inputCls = "reg-input";

export type Catalog = {
  eebGrades: string[];
  mediaCourses: string[];
  secciones: string[];
  seccionesCCB: string[];
  turnos: string[];
  seccionBachiller: string;
  bachilleratos: { code: string; shortName: string; name: string }[];
  subjects: { code: string; name: string; gradeYear: number; academicCode: string; academicShort: string }[];
};

const CCB = "CCB";

/**
 * Secciones válidas: Escolar Básica A–D, Ciencias Básicas A–B,
 * resto de bachilleratos sin sección ([]).
 */
export function seccionesPara(nivel: string, bachiller: string): string[] {
  if (nivel === "EEB") return ["A", "B", "C", "D"];
  if (bachiller === CCB) return ["A", "B"];
  return [];
}

/** La sección solo aplica a Escolar Básica y a Ciencias Básicas. */
export function necesitaSeccion(nivel: string, bachiller: string): boolean {
  return seccionesPara(nivel, bachiller).length > 0;
}

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
  return <p className="reg-field-err show">{msg}</p>;
}

/** Título de sección numerada, con icono discreto. */
export function SectionTitle({
  n, title, desc, icon,
}: {
  n: string;
  title: string;
  desc?: string;
  icon?: string;
}) {
  return (
    <div className="reg-block-head">
      <span className="reg-block-num" aria-hidden="true">{n}</span>
      {icon && <span className="reg-block-ico" aria-hidden="true">{icon}</span>}
      <span>
        <b>{title}</b>
        {desc && <small>{desc}</small>}
      </span>
    </div>
  );
}

export type Person = { ci: string; firstName: string; lastName: string; phone: string; email: string };
export type PersonErrors = Partial<Record<keyof Person, string>>;

/** Campo con etiqueta visible, altura uniforme y error junto al control. */
export function Field({
  label, required, error, children, className = "",
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`reg-field ${className}`}>
      <span>
        {label} {required && <em className="req not-italic">*</em>}
      </span>
      {children}
      <FieldError msg={error} />
    </label>
  );
}

export function PersonFields({
  value, errors, onChange, disabled,
}: {
  value: Person;
  errors: PersonErrors;
  onChange: (k: keyof Person, v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="reg-grid">
      <Field label="Nombres" required error={errors.firstName}>
        <input
          value={value.firstName}
          onChange={(e) => onChange("firstName", e.target.value)}
          disabled={disabled}
          placeholder="Ej: María"
          autoComplete="given-name"
          className={inputCls}
        />
      </Field>
      <Field label="Apellidos" required error={errors.lastName}>
        <input
          value={value.lastName}
          onChange={(e) => onChange("lastName", e.target.value)}
          disabled={disabled}
          placeholder="Ej: Ayala"
          autoComplete="family-name"
          className={inputCls}
        />
      </Field>
      <Field label="Cédula" required error={errors.ci}>
        <input
          value={value.ci}
          onChange={(e) => onChange("ci", e.target.value)}
          disabled={disabled}
          inputMode="numeric"
          placeholder="Ej: 4567890"
          className={inputCls}
        />
      </Field>
      <Field label="Teléfono" required error={errors.phone}>
        <input
          value={value.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          disabled={disabled}
          inputMode="tel"
          placeholder="Ej: 0975 123456"
          autoComplete="tel"
          className={inputCls}
        />
      </Field>
      <Field label="Correo electrónico" required error={errors.email} className="reg-col-full">
        <input
          type="email"
          value={value.email}
          onChange={(e) => onChange("email", e.target.value)}
          disabled={disabled}
          placeholder="tu@correo.com"
          autoComplete="email"
          className={inputCls}
        />
      </Field>
    </div>
  );
}

/**
 * Contenedor del registro: panel institucional a la izquierda y
 * formulario a la derecha. En móvil pasa a una sola columna.
 */
export function RegShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="reg-shell">
      <aside className="reg-side">
        <div className="reg-crest">
          {/* Escudo oficial del Colegio Nacional E.M.D. Caaguazú */}
          <img
            src="/images/logo-colegio.png"
            alt="Escudo del Colegio Nacional E.M.D. Caaguazú"
            width={104}
            height={116}
          />
        </div>
        <h2 className="reg-side-title">Colegio Nacional E.M.D. Caaguazú</h2>
        <p className="reg-side-motto">“Formando jóvenes con valores para un mejor mañana”</p>
        <ul className="reg-benefits">
          <li>
            <span className="reg-benefit-ico" aria-hidden="true">🎓</span>
            <div>
              <b>Acceso a tus clases y recursos</b>
              <span>Plataforma educativa siempre disponible.</span>
            </div>
          </li>
          <li>
            <span className="reg-benefit-ico" aria-hidden="true">📄</span>
            <div>
              <b>Seguimiento de tu progreso</b>
              <span>Consultá tus calificaciones y avances.</span>
            </div>
          </li>
          <li>
            <span className="reg-benefit-ico" aria-hidden="true">👥</span>
            <div>
              <b>Comunidad educativa conectada</b>
              <span>Estudiantes, docentes y familias.</span>
            </div>
          </li>
          <li>
            <span className="reg-benefit-ico" aria-hidden="true">⭐</span>
            <div>
              <b>Construí tu futuro</b>
              <span>Con educación, disciplina y valores.</span>
            </div>
          </li>
        </ul>
        <p className="reg-side-note">
          Dirección revisa cada solicitud antes de crear la cuenta y te
          contactará al correo o teléfono indicados.
        </p>
      </aside>
      <div className="reg-main">
        <div className="reg-main-head">
          <h2>Solicitud de registro</h2>
          <p>Completá tus datos para crear tu cuenta en el sistema</p>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Pie del formulario: aviso de obligatorios y acceso al login. */
export function RegFoot({ note }: { note?: string }) {
  return (
    <p className="reg-foot">
      {note ?? "Los campos con * son obligatorios."} ·{" "}
      <a href="/login">Iniciá sesión</a>
    </p>
  );
}

/** Aviso de error general del formulario. */
export function FormError({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return <p className="reg-error-top show">{msg}</p>;
}

export function SuccessView({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="reg-shell">
      <aside className="reg-side">
        <div className="reg-crest">
          <img
            src="/images/logo-colegio.png"
            alt="Escudo del Colegio Nacional E.M.D. Caaguazú"
            width={104}
            height={116}
          />
        </div>
        <h2 className="reg-side-title">Colegio Nacional E.M.D. Caaguazú</h2>
        <p className="reg-side-motto">“Formando jóvenes con valores para un mejor mañana”</p>
        <ul className="reg-benefits">
          <li>
            <span className="reg-benefit-ico" aria-hidden="true">🎓</span>
            <div>
              <b>Acceso a tus clases y recursos</b>
              <span>Plataforma educativa siempre disponible.</span>
            </div>
          </li>
          <li>
            <span className="reg-benefit-ico" aria-hidden="true">📄</span>
            <div>
              <b>Seguimiento de tu progreso</b>
              <span>Consultá tus calificaciones y avances.</span>
            </div>
          </li>
          <li>
            <span className="reg-benefit-ico" aria-hidden="true">👥</span>
            <div>
              <b>Comunidad educativa conectada</b>
              <span>Estudiantes, docentes y familias.</span>
            </div>
          </li>
        </ul>
        <p className="reg-side-note">Gracias por formar parte de la comunidad educativa.</p>
      </aside>
      <div className="reg-main">
        <div className="reg-ok">
          <div className="reg-ok-ico" aria-hidden="true">✅</div>
          <h3>{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
}
