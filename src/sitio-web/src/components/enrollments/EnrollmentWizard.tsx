"use client";

import { useState } from "react";

export type AcademicOption = {
  id: string;
  code: string;
  shortName: string;
  name: string;
  type: string;
};

const REQUIRED_DOCS = [
  "Cédula de identidad (fotocopia)",
  "Certificado de nacimiento",
  "Certificado de estudios / libreta anterior",
  "Foto carnet"
];

/**
 * Inscripción online en 4 pasos + confirmación:
 * 0) Nivel y curso (EEB 7.º–9.º o Media 1.º–3.º + bachillerato, turno y sección
 *    solo donde corresponde)  1) Datos del aspirante  2) Tutor/encargado
 * 3) Documentos. Los archivos se registran como manifiesto (nombre/tipo/
 * tamaño); la guarda binaria definitiva (S3/UploadThing) y la verificación
 * quedan en Secretaría. Al enviar se avisa por correo a Dirección.
 */
const EEB_GRADES = ["7.º", "8.º", "9.º"];
const MEDIA_COURSES = ["1.º", "2.º", "3.º"];
const CONTACTOS = ["0975 493753", "0982 296194", "0971 884497"];

export default function EnrollmentWizard({ academics }: { academics: AcademicOption[] }) {
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<string | null>(null);

  const [nivel, setNivel] = useState<"" | "EEB" | "MEDIA">("");
  const [curso, setCurso] = useState("");
  const [turno, setTurno] = useState("");
  const [seccion, setSeccion] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", ci: "", birthDate: "", phone: "",
    email: "", password: "", address: "",
    guardianName: "", guardianRelation: "madre", guardianPhone: "", guardianEmail: "",
    academicId: ""
  });
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const necesitaSeccion =
    nivel === "EEB" ||
    (nivel === "MEDIA" &&
      (academics.find((a) => a.id === form.academicId)?.code === "CCB"));
  const cursos = nivel === "EEB" ? EEB_GRADES : nivel === "MEDIA" ? MEDIA_COURSES : [];

  function validStep(): string | null {
    if (step === 0) {
      if (!nivel) return "Elegí el nivel (Escolar Básica o Media).";
      if (!curso) return "Elegí el curso.";
      if (turno !== "MAÑANA" && turno !== "TARDE") return "Elegí el turno.";
      if (necesitaSeccion && seccion !== "A" && seccion !== "B")
        return "Elegí la sección (A o B).";
      if (nivel === "MEDIA" && !form.academicId) return "Seleccioná un bachillerato.";
    }
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) return "Nombres y apellidos obligatorios.";
      if (!/^\d{6,10}$/.test(form.ci.trim())) return "Cédula inválida (6 a 10 dígitos).";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Correo inválido.";
      if (form.password.length < 8) return "Contraseña mínima de 8 caracteres.";
    }
    if (step === 2) {
      if (!form.guardianName.trim() || !form.guardianPhone.trim())
        return "Nombre y teléfono del tutor son obligatorios.";
    }
    if (step === 3) {
      if (Object.values(files).filter(Boolean).length === 0)
        return "Adjuntá al menos un documento.";
    }
    return null;
  }

  async function submit() {
    const v = validStep();
    if (v) { setError(v); return; }
    setError(null);
    setSending(true);
    try {
      const documents = Object.entries(files)
        .filter(([, f]) => f)
        .map(([docName, f]) => ({ name: `${docName} — ${f!.name}`, type: f!.type || "desconocido", size: f!.size }));
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(), lastName: form.lastName.trim(),
          ci: form.ci.trim(), birthDate: form.birthDate || undefined,
          phone: form.phone.trim() || undefined, email: form.email.trim(),
          password: form.password, address: form.address.trim() || undefined,
          guardian: {
            name: form.guardianName.trim(), relation: form.guardianRelation,
            phone: form.guardianPhone.trim(), email: form.guardianEmail.trim() || undefined
          },
          academicId: form.academicId, documents,
          nivel, curso, turno, seccion: necesitaSeccion ? seccion : null,
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo enviar la solicitud");
      setTracking(json.data.enrollmentId);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setSending(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-[var(--institutional)]";

  if (step === 4 && tracking) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-3xl">✅</p>
        <h2 className="mt-2 text-2xl font-extrabold text-[var(--institutional)]">¡Solicitud recibida!</h2>
        <p className="mt-2 text-slate-600">
          Estado inicial: <strong>PENDIENTE</strong>. Dirección ya fue avisada por correo y
          revisará tus datos.
        </p>
        <p className="mt-4 inline-block rounded-lg bg-white px-4 py-2 font-mono text-sm text-slate-700">
          Código de seguimiento: {tracking}
        </p>
        <div className="mx-auto mt-5 max-w-md rounded-xl border border-[var(--gold)] bg-white p-4">
          <p className="text-sm font-bold text-[var(--institutional)]">¿Dudas? Escribinos o llamanos:</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {CONTACTOS.map((t) => (
              <a key={t} href={`tel:+595${t.replace(/\s/g, "").slice(1)}`} className="text-sm font-bold text-[var(--institutional)] hover:underline">
                📞 {t}
              </a>
            ))}
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500">Guardá este código para consultar en Secretaría.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md sm:p-8">
      {/* Indicador de pasos */}
      <ol className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
        {["Nivel", "Aspirante", "Tutor", "Documentos"].map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-white ${
                i < step ? "bg-emerald-600" : i === step ? "bg-[var(--institutional)]" : "bg-slate-300"
              }`}
            >
              {i + 1}
            </span>
            <span className={i === step ? "text-[var(--institutional)]" : "text-slate-400"}>{label}</span>
          </li>
        ))}
      </ol>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      )}

      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Nivel*
            <select
              value={nivel}
              onChange={(e) => {
                const v = e.target.value as "" | "EEB" | "MEDIA";
                setNivel(v); setCurso(""); setSeccion("");
                setForm((f) => ({ ...f, academicId: "" }));
              }}
              className={inputCls}
            >
              <option value="">— Seleccioná —</option>
              <option value="EEB">Educación Escolar Básica (7.º–9.º)</option>
              <option value="MEDIA">Educación Media (1.º–3.º + bachillerato)</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Curso*
            <select value={curso} onChange={(e) => setCurso(e.target.value)} disabled={!nivel} className={inputCls}>
              <option value="">{nivel ? "— Seleccioná —" : "Primero elegí el nivel"}</option>
              {cursos.map((c) => (
                <option key={c} value={c}>{nivel === "EEB" ? `${c} grado` : `${c} curso`}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Turno*
            <select value={turno} onChange={(e) => setTurno(e.target.value)} disabled={!nivel} className={inputCls}>
              <option value="">{nivel ? "— Seleccioná —" : "Primero elegí el nivel"}</option>
              <option value="MAÑANA">Mañana</option>
              <option value="TARDE">Tarde</option>
            </select>
          </label>
          {necesitaSeccion ? (
            <label className="text-sm font-semibold text-slate-700">Sección* (A o B)
              <select value={seccion} onChange={(e) => setSeccion(e.target.value)} disabled={!nivel} className={inputCls}>
                <option value="">— Seleccioná —</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </label>
          ) : (
            <p className="self-end text-xs text-slate-500">
              {nivel === "MEDIA"
                ? "Elegí el bachillerato abajo. Solo Básica y Ciencias Básicas tienen sección."
                : "La sección (A/B) aplica a Escolar Básica y Ciencias Básicas."}
            </p>
          )}
          {nivel === "MEDIA" && (
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Bachillerato*
              <select value={form.academicId} onChange={set("academicId")} className={inputCls}>
                <option value="">— Seleccioná —</option>
                {academics.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.shortName})</option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Nombres*<input required value={form.firstName} onChange={set("firstName")} className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">Apellidos*<input required value={form.lastName} onChange={set("lastName")} className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">Cédula de identidad*<input required inputMode="numeric" value={form.ci} onChange={set("ci")} className={inputCls} placeholder="Ej: 5123456" /></label>
          <label className="text-sm font-semibold text-slate-700">Fecha de nacimiento<input type="date" value={form.birthDate} onChange={set("birthDate")} className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">Teléfono<input value={form.phone} onChange={set("phone")} className={inputCls} placeholder="Ej: 0971 123456" /></label>
          <label className="text-sm font-semibold text-slate-700">Correo electrónico*<input type="email" value={form.email} onChange={set("email")} className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">Contraseña (mín. 8)*<input type="password" value={form.password} onChange={set("password")} className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">Dirección<input value={form.address} onChange={set("address")} className={inputCls} /></label>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Nombre del tutor/encargado*<input required value={form.guardianName} onChange={set("guardianName")} className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">Parentesco*
            <select value={form.guardianRelation} onChange={set("guardianRelation")} className={inputCls}>
              <option value="madre">Madre</option>
              <option value="padre">Padre</option>
              <option value="tutor">Tutor/a legal</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Teléfono del tutor*<input required value={form.guardianPhone} onChange={set("guardianPhone")} className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">Correo del tutor<input type="email" value={form.guardianEmail} onChange={set("guardianEmail")} className={inputCls} /></label>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-4">
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">Documentos requeridos*</legend>
            <div className="mt-2 grid gap-3">
              {REQUIRED_DOCS.map((doc) => (
                <label key={doc} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm">
                  <span className="text-slate-700">{doc}</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFiles((f) => ({ ...f, [doc]: e.target.files?.[0] ?? null }))}
                    className="text-xs text-slate-500"
                  />
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">PDF o imagen. La verificación final la hace Secretaría con los originales.</p>
          </fieldset>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          disabled={step === 0 || sending}
          onClick={() => { setError(null); setStep((s) => s - 1); }}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-500 disabled:opacity-40"
        >
          ← Atrás
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={() => { const v = validStep(); if (v) setError(v); else { setError(null); setStep((s) => s + 1); } }}
            className="btn-primary"
          >
            Siguiente →
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={sending} className="btn-gold">
            {sending ? "Enviando…" : "Enviar solicitud"}
          </button>
        )}
      </div>
    </div>
  );
}
