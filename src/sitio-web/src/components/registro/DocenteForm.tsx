"use client";

import { useState } from "react";
import {
  FieldError, Person, PersonErrors, PersonFields, SectionTitle, SuccessView,
  inputCls, useCatalog,
} from "./shared";

/** Formulario de solicitud de cuenta para docentes. */
export default function DocenteForm() {
  const { cat, error: catError } = useCatalog();
  const [person, setPerson] = useState<Person>({ ci: "", firstName: "", lastName: "", phone: "", email: "" });
  const [pErr, setPErr] = useState<PersonErrors>({});
  const [materiaPrincipal, setMateriaPrincipal] = useState("");
  const [materiaPrincipalOtra, setMateriaPrincipalOtra] = useState("");
  const [mpErr, setMpErr] = useState<string | undefined>();
  const [otraSel, setOtraSel] = useState("");
  const [otraLibre, setOtraLibre] = useState("");
  const [otras, setOtras] = useState<string[]>([]);
  const [otrasErr, setOtrasErr] = useState<string | undefined>();
  const [niveles, setNiveles] = useState<("EEB" | "MEDIA")[]>([]);
  const [cursos, setCursos] = useState<string[]>([]);
  const [bachilleres, setBachilleres] = useState<string[]>([]);
  const [asigErr, setAsigErr] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const subjects = cat?.subjects ?? [];
  const eeb = cat?.eebGrades ?? [];
  const media = cat?.mediaCourses ?? [];
  const courses = [...(niveles.includes("EEB") ? eeb : []), ...(niveles.includes("MEDIA") ? media : [])];

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  function addOtra() {
    setOtrasErr(undefined);
    if (!otraSel) {
      setOtrasErr("Elegí una materia de la lista");
      return;
    }
    let value = otraSel;
    if (otraSel === "__OTRA__") {
      if (!otraLibre.trim()) {
        setOtrasErr("Describí la materia");
        return;
      }
      value = `OTRA:${otraLibre.trim().slice(0, 80)}`;
    }
    const main = materiaPrincipal === "__OTRA__" ? `OTRA:${materiaPrincipalOtra.trim()}` : materiaPrincipal;
    if ((value === main && main) || otras.includes(value)) {
      setOtrasErr("Esa materia ya está agregada");
      return;
    }
    if (otras.length >= 6) {
      setOtrasErr("Máximo 6 materias");
      return;
    }
    setOtras((o) => [...o, value]);
    setOtraSel("");
    setOtraLibre("");
  }

  function materiaLabel(code: string): string {
    if (code.startsWith("OTRA:")) return `${code.slice(5)} (a revisar)`;
    const s = subjects.find((x) => x.code === code);
    return s ? `${s.name} (${s.code})` : code;
  }

  function validate(): boolean {
    const pe: PersonErrors = {};
    if (!/^\d{6,10}$/.test(person.ci.trim())) pe.ci = "Cédula inválida (6 a 10 dígitos)";
    if (!person.firstName.trim()) pe.firstName = "Obligatorio";
    if (!person.lastName.trim()) pe.lastName = "Obligatorio";
    if (person.phone.replace(/\D/g, "").length < 6) pe.phone = "Mínimo 6 dígitos";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email.trim())) pe.email = "Correo inválido";
    setPErr(pe);

    let mp: string | undefined;
    if (!materiaPrincipal) mp = "Elegí tu materia principal";
    else if (materiaPrincipal === "__OTRA__" && !materiaPrincipalOtra.trim())
      mp = "Describí la materia";
    setMpErr(mp);

    let ae: string | undefined;
    if (niveles.length < 1) ae = "Elegí al menos un nivel";
    else if (cursos.length < 1) ae = "Elegí al menos un curso";
    else if (niveles.includes("MEDIA") && bachilleres.length < 1)
      ae = "Indicá en qué bachiller(es) enseñás";
    setAsigErr(ae);

    return Object.keys(pe).length === 0 && !mp && !ae;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setServerError(null);
    if (!validate()) {
      setServerError("Revisá los campos marcados en rojo");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "docente",
          ci: person.ci.trim(),
          firstName: person.firstName.trim(),
          lastName: person.lastName.trim(),
          phone: person.phone.trim(),
          email: person.email.trim(),
          materiaPrincipal:
            materiaPrincipal === "__OTRA__" ? `OTRA:${materiaPrincipalOtra.trim()}` : materiaPrincipal,
          otrasMaterias: otras,
          niveles,
          cursos,
          bachilleres: niveles.includes("MEDIA") ? bachilleres : [],
        }),
      });
      const json = await res.json();
      if (!res.ok) setServerError(json.error || "No se pudo enviar");
      else setDone(true);
    } catch {
      setServerError("Sin conexión con el servidor");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <SuccessView title="¡Solicitud enviada!">
        <p>
          Recibimos tu solicitud como docente. Dirección la revisará, creará tu cuenta
          y te contactará al teléfono o correo indicados.
        </p>
      </SuccessView>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-8" noValidate>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <SectionTitle n="1" title="Datos personales" desc="Tus datos como docente." />
        <div className="mt-5">
          <PersonFields
            value={person}
            errors={pErr}
            disabled={sending}
            onChange={(k, v) => setPerson((p) => ({ ...p, [k]: v }))}
          />
        </div>
      </section>

      <section className="rounded-2xl border-2 border-[var(--gold)] bg-white p-6 shadow-sm sm:p-8">
        <SectionTitle n="2" title="Materia principal" desc="La materia que más horas enseñás." />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Materia <span className="text-red-600">*</span>
            <select
              value={materiaPrincipal}
              onChange={(e) => setMateriaPrincipal(e.target.value)}
              disabled={sending || !cat}
              className={`${inputCls} ${mpErr ? "!border-red-500" : ""}`}
            >
              <option value="">Seleccionar…</option>
              {subjects.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
              <option value="__OTRA__">Otra materia (especificar)…</option>
            </select>
            <FieldError msg={mpErr} />
          </label>
          {materiaPrincipal === "__OTRA__" && (
            <label className="block text-sm font-semibold text-slate-700">
              ¿Cuál? <span className="text-red-600">*</span>
              <input
                value={materiaPrincipalOtra}
                onChange={(e) => setMateriaPrincipalOtra(e.target.value)}
                disabled={sending}
                maxLength={80}
                placeholder="Ej: Física"
                className={inputCls}
              />
            </label>
          )}
        </div>
        {subjects.length === 0 && (
          <p className="mt-2 text-xs text-slate-500">
            Aún no hay materias cargadas en el sistema: usá “Otra materia” y Dirección la registrará.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <SectionTitle
          n="3"
          title="Otras materias que enseña (opcional)"
          desc="Podés completar esta información ahora o agregarla posteriormente desde tu perfil."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block text-sm font-semibold text-slate-700">
            Materia
            <select value={otraSel} onChange={(e) => setOtraSel(e.target.value)} disabled={sending || !cat} className={inputCls}>
              <option value="">Seleccionar…</option>
              {subjects.map((s) => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
              <option value="__OTRA__">Otra materia (especificar)…</option>
            </select>
          </label>
          {otraSel === "__OTRA__" && (
            <label className="block text-sm font-semibold text-slate-700">
              ¿Cuál?
              <input value={otraLibre} onChange={(e) => setOtraLibre(e.target.value)} disabled={sending} maxLength={80} placeholder="Ej: Química" className={inputCls} />
            </label>
          )}
          <button type="button" onClick={addOtra} disabled={sending}
            className="rounded-lg border-2 border-dashed border-[var(--gold)] px-4 py-2.5 text-sm font-bold text-[var(--institutional)] hover:bg-amber-50 disabled:opacity-40">
            ＋ Agregar materia
          </button>
        </div>
        <FieldError msg={otrasErr} />
        {otras.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {otras.map((o) => (
              <span key={o} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                {materiaLabel(o)}
                <button type="button" disabled={sending} onClick={() => setOtras((l) => l.filter((x) => x !== o))}
                  className="rounded-full bg-white px-2 text-xs font-bold text-red-600 hover:bg-red-50" aria-label={`Quitar ${o}`}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <SectionTitle n="4" title="Asignación académica" desc="Niveles y cursos en los que enseñás. Podés marcar Básica y Media a la vez." />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Niveles <span className="text-red-600">*</span>
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {(["EEB", "MEDIA"] as const).map((n) => {
                const on = niveles.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={sending}
                    onClick={() => {
                      setNiveles((l) => (l.includes(n) ? l.filter((x) => x !== n) : [...l, n]));
                      setCursos([]);
                      setBachilleres([]);
                    }}
                    aria-pressed={on}
                    className={`min-h-[44px] rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${on ? "border-[var(--institutional)] bg-[var(--institutional)] text-white" : "border-slate-300 text-slate-600 hover:border-[var(--institutional)]"}`}
                  >
                    {on ? "✓ " : ""}{n === "EEB" ? "Escolar Básica (7.º–9.º)" : "Media (1.º–3.º)"}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Cursos en los que enseña <span className="text-red-600">*</span>
            </p>
            {niveles.length === 0 ? (
              <p className="mt-1 text-sm text-slate-400">Primero elegí al menos un nivel.</p>
            ) : (
              <div className="mt-1 flex flex-wrap gap-2">
                {niveles.includes("EEB") && (
                  <>
                    {eeb.map((c) => {
                      const on = cursos.includes(`${c}`);
                      return (
                        <button
                          key={`EEB-${c}`}
                          type="button"
                          disabled={sending}
                          onClick={() => setCursos((l) => toggle(l, `${c}`))}
                          aria-pressed={on}
                          title="Escolar Básica"
                          className={`min-h-[44px] rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${on ? "border-[var(--institutional)] bg-[var(--institutional)] text-white" : "border-slate-300 text-slate-600 hover:border-[var(--institutional)]"}`}
                        >
                          {on ? "✓ " : ""}{c} EEB
                        </button>
                      );
                    })}
                  </>
                )}
                {niveles.includes("MEDIA") && (
                  <>
                    {media.map((c) => {
                      const on = cursos.includes(`${c}`);
                      return (
                        <button
                          key={`MEDIA-${c}`}
                          type="button"
                          disabled={sending}
                          onClick={() => setCursos((l) => toggle(l, `${c}`))}
                          aria-pressed={on}
                          title="Educación Media"
                          className={`min-h-[44px] rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${on ? "border-[var(--institutional)] bg-[var(--institutional)] text-white" : "border-slate-300 text-slate-600 hover:border-[var(--institutional)]"}`}
                        >
                          {on ? "✓ " : ""}{c} Media
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
          {niveles.includes("MEDIA") && (
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-slate-700">
                ¿En qué bachiller(es) enseñás? <span className="text-red-600">*</span>
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {(cat?.bachilleratos ?? []).map((b) => {
                  const on = bachilleres.includes(b.code);
                  return (
                    <button
                      key={b.code}
                      type="button"
                      disabled={sending}
                      onClick={() => setBachilleres((l) => toggle(l, b.code))}
                      aria-pressed={on}
                      title={b.name}
                      className={`min-h-[44px] rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${on ? "border-[var(--gold)] bg-[var(--gold)] text-white" : "border-slate-300 text-slate-600 hover:border-[var(--gold)]"}`}
                    >
                      {on ? "✓ " : ""}{b.shortName}
                    </button>
                  );
                })}
              </div>
              {(cat?.bachilleratos.length ?? 0) === 0 && (
                <p className="mt-1 text-xs text-slate-500">Aún no hay bachilleratos cargados.</p>
              )}
            </div>
          )}
        </div>
        <FieldError msg={asigErr} />
        {catError && <p className="mt-2 text-sm font-semibold text-red-600">{catError}</p>}
        <p className="mt-3 text-xs text-slate-500">
          Podés completar o modificar materias y asignaciones después desde tu perfil, sin nueva solicitud.
        </p>
      </section>

      {serverError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{serverError}</p>
      )}
      <div>
        <button type="submit" disabled={sending} className="btn-primary w-full justify-center sm:w-auto">
          {sending ? "Enviando…" : "Enviar solicitud"}
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Los campos con * son obligatorios.
        </p>
      </div>
    </form>
  );
}
