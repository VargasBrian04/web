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

/* ------------------------------------------------------------------ */
/* Iconos SVG (línea, sin emojis como elemento principal)             */
/* ------------------------------------------------------------------ */
const I = {
  user: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  cap: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  child: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="3" />
      <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="M2 12l10 5 10-5M2 17l10 5 10-5" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
};

/** Iconos disponibles para títulos de sección y controles. */
export const Icon = I;

/** Ilustración decorativa (dibujo de línea) de la institución: fachada clásica. */
function SchoolArt() {
  return (
    <svg className="reg-side-art" viewBox="0 0 320 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* suelo */}
      <line x1="16" y1="122" x2="304" y2="122" />
      {/* árbol izquierdo */}
      <g>
        <line x1="30" y1="122" x2="30" y2="100" />
        <circle cx="30" cy="80" r="13" />
        <circle cx="18" cy="89" r="9.5" />
        <circle cx="42" cy="89" r="9.5" />
        <path d="M20 84c6-5 18-5 24 0" />
      </g>
      {/* árbol derecho (espejo del izquierdo) */}
      <g transform="translate(320,0) scale(-1,1)">
        <line x1="30" y1="122" x2="30" y2="100" />
        <circle cx="30" cy="80" r="13" />
        <circle cx="18" cy="89" r="9.5" />
        <circle cx="42" cy="89" r="9.5" />
        <path d="M20 84c6-5 18-5 24 0" />
      </g>
      {/* ala izquierda con cornisa y ventanas de 4 paños */}
      <path d="M52 122V82h70v40" />
      <path d="M46 76h82M46 83h82" />
      <rect x="62" y="94" width="20" height="20" />
      <path d="M72 94v20M62 104h20" />
      <rect x="92" y="94" width="20" height="20" />
      <path d="M102 94v20M92 104h20" />
      {/* ala derecha con cornisa y ventanas de 4 paños */}
      <path d="M198 122V82h70v40" />
      <path d="M192 76h82M192 83h82" />
      <rect x="208" y="94" width="20" height="20" />
      <path d="M218 94v20M208 104h20" />
      <rect x="238" y="94" width="20" height="20" />
      <path d="M248 94v20M238 104h20" />
      {/* bloque central con frontón triangular */}
      <path d="M122 122V62h76v60" />
      <path d="M118 56L160 34L202 56Z" />
      <path d="M114 56h92M114 62h92" />
      {/* óculo redondo con cruz */}
      <circle cx="160" cy="46" r="8" />
      <path d="M160 38v16M152 46h16" />
      {/* columnas con capitel y basa */}
      <path d="M136 69v49M184 69v49" />
      <path d="M131 69h10M179 69h10M131 118h10M179 118h10" />
      {/* ventanas superiores */}
      <rect x="146" y="76" width="12" height="12" />
      <path d="M152 76v12M146 82h12" />
      <rect x="162" y="76" width="12" height="12" />
      <path d="M168 76v12M162 82h12" />
      {/* puerta de arco doble */}
      <path d="M144 122V96a16 16 0 0 1 32 0v26" />
      <path d="M148 122V98a12 12 0 0 1 24 0v24" />
      <path d="M160 98v24" />
      {/* escalones */}
      <path d="M140 118h40M134 122h52" />
      {/* mástil con bandera ondeando */}
      <line x1="160" y1="34" x2="160" y2="16" />
      <path d="M162 17c8-3 16-3 24 0-8 3-16 3-24 0Z" />
      <path d="M163 22c8-3 16-3 22 1" />
      {/* arbustos y césped */}
      <path d="M106 122c0-10 7-15 15-15s15 5 15 15" />
      <path d="M184 122c0-10 7-15 15-15s15 5 15 15" />
      <path d="M62 122v-5M68 122v-4M76 122v-5M238 122v-5M244 122v-4M252 122v-5" />
    </svg>
  );
}

/** Beneficios del panel institucional (icono + texto). */
const BENEFICIOS: { icon: React.ReactNode; titulo: string; texto: string }[] = [
  { icon: I.cap, titulo: "Acceso a tus clases y recursos", texto: "Plataforma educativa siempre disponible." },
  { icon: I.doc, titulo: "Seguimiento de tu progreso académico", texto: "Consultá tus calificaciones y avances." },
  { icon: I.people, titulo: "Comunidad educativa siempre conectada", texto: "Estudiantes, docentes y familias." },
  { icon: I.star, titulo: "Construye tu futuro", texto: "Con educación, disciplina y valores." },
];

/** Escudo oficial (colores y proporciones originales, sin alterar). */
function Crest() {
  return (
    <div className="reg-crest">
      <img
        src="/images/escudo-nuevo.webp"
        alt="Escudo del Colegio Nacional E.M.D. Caaguazú"
        width={93}
        height={110}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/images/logo-colegio.png";
        }}
      />
    </div>
  );
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
  icon?: React.ReactNode;
}) {
  return (
    <div className="reg-block-head">
      <span className="reg-block-num" aria-hidden="true">{n}</span>
      {icon && <span className="reg-block-ico">{icon}</span>}
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
          placeholder="Ej: Juan Carlos"
          autoComplete="given-name"
          className={inputCls}
        />
      </Field>
      <Field label="Apellidos" required error={errors.lastName}>
        <input
          value={value.lastName}
          onChange={(e) => onChange("lastName", e.target.value)}
          disabled={disabled}
          placeholder="Ej: Pérez López"
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
          placeholder="Ej: 0975 1234567"
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
 * Contenedor del registro: panel institucional a la IZQUIERDA y formulario a
 * la DERECHA, en una sola tarjeta centrada.
 *
 * El grid también va como estilo inline: garantiza las dos columnas en
 * escritorio aunque el CSS externo no cargue. El quiebre a una columna en
 * móvil se hace desde el CSS con `!important` (único del archivo).
 */
export function RegShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="reg-shell"
      style={{
        display: "grid",
        gridTemplateColumns: "clamp(18rem, 32%, 24rem) minmax(0, 1fr)",
        /* el panel marrón cubre TODA la altura de la tarjeta */
        alignItems: "stretch",
      }}
    >
      <aside className="reg-side">
        <Crest />
        <h2 className="reg-side-title">Colegio Nacional E.M.D. Caaguazú</h2>
        <p className="reg-side-motto">“Formando jóvenes con valores para un mejor mañana”</p>
        <hr className="reg-side-rule" />
        <ul className="reg-benefits">
          {BENEFICIOS.map((b) => (
            <li key={b.titulo}>
              <div className="reg-benefit-ico">{b.icon}</div>
              <div>
                <b>{b.titulo}</b>
                <span>{b.texto}</span>
              </div>
            </li>
          ))}
        </ul>
        <SchoolArt />
        <p className="reg-side-note">
          Dirección revisa cada solicitud antes de crear la cuenta y te
          contactará al correo o teléfono indicados.
        </p>
      </aside>
      <div className="reg-main">
        <div className="reg-main-head">
          <span className="reg-head-ico">{I.user}</span>
          <div>
            <h2>Solicitud de registro</h2>
            <p>Completá tus datos para crear tu cuenta en el sistema</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Botón principal de envío. */
export function SubmitButton({ sending, label = "Enviar solicitud" }: { sending: boolean; label?: string }) {
  return (
    <button type="submit" disabled={sending} className="reg-btn reg-btn-primary">
      {sending ? "Enviando…" : <>{label} <span aria-hidden="true">→</span></>}
    </button>
  );
}

/** Pie del formulario: aviso y acceso al inicio de sesión. */
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
        <Crest />
        <h2 className="reg-side-title">Colegio Nacional E.M.D. Caaguazú</h2>
        <p className="reg-side-motto">“Formando jóvenes con valores para un mejor mañana”</p>
        <hr className="reg-side-rule" />
        <ul className="reg-benefits">
          {BENEFICIOS.slice(0, 3).map((b) => (
            <li key={b.titulo}>
              <div className="reg-benefit-ico">{b.icon}</div>
              <div>
                <b>{b.titulo}</b>
                <span>{b.texto}</span>
              </div>
            </li>
          ))}
        </ul>
        <SchoolArt />
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
