"use client";

import { useState } from "react";
import {
  FieldError, Field, FormError, Person, PersonErrors, PersonFields, RegFoot, RegShell,
  SectionTitle, SuccessView, inputCls, useCatalog,
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

  // Materias reales agrupadas por bachiller y curso (selector navegable)
  const subjectGroups = (() => {
    const map = new Map<string, typeof subjects>();
    for (const s of subjects) {
      const key = `${s.academicShort} · ${s.gradeYear}º`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  })();

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
    <RegShell>
      <form onSubmit={submit} noValidate>
        <section className="reg-block">
          <SectionTitle n="1" title="Datos personales" desc="Tus datos como docente." icon="👤" />
          <PersonFields
            value={person}
            errors={pErr}
            disabled={sending}
            onChange={(k, v) => setPerson((p) => ({ ...p, [k]: v }))}
          />
        </section>

        <section className="reg-block">
          <SectionTitle n="2" title="Materia principal" desc="La materia que más horas enseñás." icon="📘" />
          <div className="reg-grid">
            <Field label="Materia" required error={mpErr}>
              <select
                value={materiaPrincipal}
                onChange={(e) => setMateriaPrincipal(e.target.value)}
                disabled={sending || !cat}
                className="reg-select"
              >
                <option value="">Seleccionar…</option>
                {subjectGroups.map(([grupo, lista]) => (
                  <optgroup key={grupo} label={grupo}>
                    {lista.map((s) => (
                      <option key={s.code} value={s.code}>{s.name}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="__OTRA__">Otra materia (especificar)…</option>
              </select>
            </Field>
            {materiaPrincipal === "__OTRA__" && (
              <Field label="¿Cuál?" required>
                <input
                  value={materiaPrincipalOtra}
                  onChange={(e) => setMateriaPrincipalOtra(e.target.value)}
                  disabled={sending}
                  maxLength={80}
                  placeholder="Ej: Física"
                  className={inputCls}
                />
              </Field>
            )}
          </div>
          {subjects.length === 0 && (
            <p className="reg-hint" style={{ marginTop: "0.5rem" }}>
              Aún no hay materias cargadas en el sistema: usá “Otra materia” y Dirección la registrará.
            </p>
          )}
        </section>

        <section className="reg-block">
          <SectionTitle
            n="3"
            title="Otras materias que enseña"
            desc="Podés completar esta información ahora o agregarla después desde tu perfil."
            icon="📚"
          />
          <div className="reg-chips" style={{ alignItems: "flex-end", gap: "0.5rem" }}>
            <label className="reg-field" style={{ flex: "1 1 auto" }}>
              <span>Materia</span>
              <select
                value={otraSel}
                onChange={(e) => setOtraSel(e.target.value)}
                disabled={sending || !cat}
                className="reg-select"
              >
                <option value="">Seleccionar…</option>
                {subjectGroups.map(([grupo, lista]) => (
                  <optgroup key={grupo} label={grupo}>
                    {lista.map((s) => (
                      <option key={s.code} value={s.code}>{s.name}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="__OTRA__">Otra materia (especificar)…</option>
              </select>
            </label>
            {otraSel === "__OTRA__" && (
              <label className="reg-field" style={{ flex: "0 0 10rem" }}>
                <span>¿Cuál?</span>
                <input
                  value={otraLibre}
                  onChange={(e) => setOtraLibre(e.target.value)}
                  disabled={sending}
                  maxLength={80}
                  placeholder="Ej: Química"
                  className={inputCls}
                />
              </label>
            )}
            <button type="button" onClick={addOtra} disabled={sending} className="reg-btn-add">
              ＋ Agregar materia
            </button>
          </div>
          <FieldError msg={otrasErr} />
          {otras.length > 0 && (
            <div className="reg-tags">
              {otras.map((o) => (
                <span key={o} className="reg-tag">
                  {materiaLabel(o)}
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => setOtras((l) => l.filter((x) => x !== o))}
                    aria-label={`Quitar ${o}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="reg-block">
          <SectionTitle
            n="4"
            title="Asignación académica"
            desc="Niveles y cursos en los que enseñás. Podés marcar Básica y Media a la vez."
            icon="🎓"
          />
          <p className="reg-hint" style={{ marginBottom: "0.5rem" }}>
            Niveles <em className="req not-italic" style={{ color: "var(--reg-err)" }}>*</em> (podés marcar Básica y Media)
          </p>
          <div className="reg-chips">
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
                  className={`reg-chip${on ? " on" : ""}`}
                >
                  {on ? "✓ " : ""}{n === "EEB" ? "Escolar Básica (7.º–9.º)" : "Media (1.º–3.º)"}
                </button>
              );
            })}
          </div>

          <p className="reg-hint" style={{ margin: "0.9rem 0 0.5rem" }}>
            Cursos en los que enseña <em className="req not-italic" style={{ color: "var(--reg-err)" }}>*</em>
          </p>
          {niveles.length === 0 ? (
            <p className="reg-hint">Primero elegí al menos un nivel.</p>
          ) : (
            <div className="reg-chips">
              {niveles.includes("EEB") && eeb.map((c) => {
                const on = cursos.includes(`${c}`);
                return (
                  <button
                    key={`EEB-${c}`}
                    type="button"
                    disabled={sending}
                    onClick={() => setCursos((l) => toggle(l, `${c}`))}
                    aria-pressed={on}
                    title="Escolar Básica"
                    className={`reg-chip${on ? " on" : ""}`}
                  >
                    {on ? "✓ " : ""}{c} EEB
                  </button>
                );
              })}
              {niveles.includes("MEDIA") && media.map((c) => {
                const on = cursos.includes(`${c}`);
                return (
                  <button
                    key={`MEDIA-${c}`}
                    type="button"
                    disabled={sending}
                    onClick={() => setCursos((l) => toggle(l, `${c}`))}
                    aria-pressed={on}
                    title="Educación Media"
                    className={`reg-chip${on ? " on" : ""}`}
                  >
                    {on ? "✓ " : ""}{c} Media
                  </button>
                );
              })}
            </div>
          )}

          {niveles.includes("MEDIA") && (
            <div style={{ marginTop: "0.9rem" }}>
              <p className="reg-hint" style={{ marginBottom: "0.5rem" }}>
                ¿En qué bachiller(es) enseñás?{" "}
                <em className="req not-italic" style={{ color: "var(--reg-err)" }}>*</em>
              </p>
              <div className="reg-chips">
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
                      className={`reg-chip${on ? " on" : ""}`}
                    >
                      {on ? "✓ " : ""}{b.shortName}
                    </button>
                  );
                })}
              </div>
              {(cat?.bachilleratos.length ?? 0) === 0 && (
                <p className="reg-hint">Aún no hay bachilleratos cargados.</p>
              )}
            </div>
          )}
        </section>

        <FormError msg={serverError} />
        {catError && <p className="reg-field-err show" style={{ marginTop: "0.6rem" }}>{catError}</p>}

        <div style={{ marginTop: "1.2rem" }}>
          <button type="submit" disabled={sending} className="reg-btn reg-btn-primary">
            {sending ? "Enviando…" : "Enviar solicitud →"}
          </button>
        </div>
        <RegFoot note="Podés completar o modificar materias y asignaciones después desde tu perfil, sin nueva solicitud." />
      </form>
    </RegShell>
  );
}
