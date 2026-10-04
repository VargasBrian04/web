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
 * Inscripción online en 3 pasos + confirmación:
 * 1) Datos del aspirante  2) Tutor/encargado  3) Bachillerato + documentos.
 * Los archivos se registran como manifiesto (nombre/tipo/tamaño); la guarda
 * binaria definitiva (S3/UploadThing) y la verificación quedan en Secretaría.
 */
export default function EnrollmentWizard({ academics }: { academics: AcademicOption[] }) {
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "", lastName: "", ci: "", birthDate: "", phone: "",
    email: "", password: "", address: "",
    guardianName: "", guardianRelation: "madre", guardianPhone: "", guardianEmail: "",
    academicId: ""
  });
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validStep(): string | null {
    if (step === 0) {
      if (!form.firstName.trim() || !form.lastName.trim()) return "Nombres y apellidos obligatorios.";
      if (!/^\d{6,10}$/.test(form.ci.trim())) return "Cédula inválida (6 a 10 dígitos).";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Correo inválido.";
      if (form.password.length < 8) return "Contraseña mínima de 8 caracteres.";
    }
    if (step === 1) {
      if (!form.guardianName.trim() || !form.guardianPhone.trim())
        return "Nombre y teléfono del tutor son obligatorios.";
    }
    if (step === 2) {
      if (!form.academicId) return "Seleccioná un bachillerato.";
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
          academicId: form.academicId, documents
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo enviar la solicitud");
      setTracking(json.data.enrollmentId);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setSending(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-[var(--institutional)]";

  if (step === 3 && tracking) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-3xl">✅</p>
        <h2 className="mt-2 text-2xl font-extrabold text-[var(--institutional)]">¡Solicitud recibida!</h2>
        <p className="mt-2 text-slate-600">
          Estado inicial: <strong>PENDIENTE</strong>. Secretaría revisará tus datos y documentos.
        </p>
        <p className="mt-4 inline-block rounded-lg bg-white px-4 py-2 font-mono text-sm text-slate-700">
          Código de seguimiento: {tracking}
        </p>
        <p className="mt-4 text-sm text-slate-500">Guardá este código para consultar en Secretaría.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md sm:p-8">
      {/* Indicador de pasos */}
      <ol className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
        {["Aspirante", "Tutor", "Bachillerato"].map((label, i) => (
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

      {step === 1 && (
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

      {step === 2 && (
        <div className="grid gap-4">
          <label className="text-sm font-semibold text-slate-700">Bachillerato de preferencia*
            <select value={form.academicId} onChange={set("academicId")} className={inputCls}>
              <option value="">— Seleccioná —</option>
              {academics.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.shortName})</option>
              ))}
            </select>
          </label>
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
        {step < 2 ? (
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
