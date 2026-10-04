"use client";

import { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  username: string;
  ci: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  active: boolean;
};

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

/**
 * Gestión de usuarios solo-Dirección: crear docentes/tutores/admins,
 * vincular tutor ↔ alumno y asignar docente ↔ materia/curso.
 * Nadie puede auto-registrarse con estos roles: no hay botón público.
 */
export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    ci: "",
    password: "",
    role: "TEACHER",
    email: "",
    phone: "",
  });
  const [link, setLink] = useState({ guardian: "", student: "", relation: "tutor" });
  const [assign, setAssign] = useState({ teacher: "", subjectCode: "", classId: "" });

  async function loadUsers() {
    try {
      const res = await fetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const json = await res.json();
      if (res.ok) setUsers(json.data ?? []);
    } catch {
      /* panel sigue útil */
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.username,
        firstName: form.firstName,
        lastName: form.lastName,
        ci: form.ci,
        password: form.password,
        role: form.role,
        email: form.email || null,
        phone: form.phone || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo crear");
    else {
      setMsg(`Usuario @${json.data.username} creado (${json.data.role}).`);
      setForm({ username: "", firstName: "", lastName: "", ci: "", password: "", role: "TEACHER", email: "", phone: "" });
      loadUsers();
    }
  }

  async function toggleActive(u: AdminUser) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, active: !u.active }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo actualizar");
    else {
      setMsg(`@${u.username} ${u.active ? "desactivado" : "activado"}.`);
      loadUsers();
    }
  }

  async function linkTutor(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(link),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo vincular");
    else {
      setMsg(`Vinculado: ${json.data.tutor} ↔ ${json.data.alumno} (${json.data.relation}).`);
      setLink({ guardian: "", student: "", relation: "tutor" });
    }
  }

  async function assignTeacher(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacher: assign.teacher,
        subjectCode: assign.subjectCode,
        classId: assign.classId || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo asignar");
    else {
      setMsg(`Asignado: ${json.data.docente} → ${json.data.materia}${json.data.curso ? ` (curso ${json.data.curso})` : ""}.`);
      setAssign({ teacher: "", subjectCode: "", classId: "" });
    }
  }

  return (
    <div className="grid gap-6">
      {msg && (
        <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{msg}</p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-[var(--institutional)]">Registrar docente / tutor / admin</h2>
        <p className="mt-1 text-sm text-slate-500">
          Solo Dirección crea cuentas con rol. El correo es opcional: el usuario lo vincula después en Mi perfil.
        </p>
        <form onSubmit={createUser} className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">Usuario*<input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="ej: maria.ayala" className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">Rol*<select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className={inputCls}><option value="TEACHER">Docente</option><option value="PARENT">Tutor / Padre</option><option value="ADMIN">Dirección / Admin</option><option value="STUDENT">Alumno</option></select></label>
          <label className="text-sm font-semibold text-slate-700">Contraseña inicial (8+)*<input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Mínimo 8 caracteres" className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">Nombres*<input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">Apellidos*<input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">C.I.*<input value={form.ci} onChange={(e) => setForm((f) => ({ ...f, ci: e.target.value }))} placeholder="6 a 10 dígitos" className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">Correo (opcional)<input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">Teléfono (opcional)<input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} /></label>
          <div className="flex items-end"><button className="btn-primary w-full justify-center" type="submit">Crear cuenta</button></div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-[var(--institutional)]">Cuentas</h2>
          <div className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar usuario, CI…" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]" />
            <button onClick={loadUsers} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700" type="button">Buscar</button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="py-2 pr-4">Usuario</th><th className="py-2 pr-4">Nombre</th><th className="py-2 pr-4">Rol</th><th className="py-2 pr-4">Contacto</th><th className="py-2">Estado</th></tr></thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="py-4 text-slate-500">Sin resultados.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-semibold">@{u.username}<span className="block text-xs font-normal text-slate-400">CI {u.ci}</span></td>
                  <td className="py-2 pr-4">{u.firstName} {u.lastName}</td>
                  <td className="py-2 pr-4"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold">{u.role}</span></td>
                  <td className="py-2 pr-4 text-xs text-slate-500">{u.email ?? "sin correo"}{u.phone ? ` · ${u.phone}` : ""}</td>
                  <td className="py-2"><button onClick={() => toggleActive(u)} type="button" className={`rounded px-2 py-1 text-xs font-bold ${u.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{u.active ? "Activo" : "Inactivo"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={linkTutor} className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-extrabold text-[var(--institutional)]">Vincular tutor ↔ alumno</h3>
          <label className="mt-3 block text-sm font-semibold text-slate-700">Tutor (usuario o CI)<input value={link.guardian} onChange={(e) => setLink((l) => ({ ...l, guardian: e.target.value }))} placeholder="ej: ana.gomez" className={inputCls} /></label>
          <label className="mt-3 block text-sm font-semibold text-slate-700">Alumno (CI)<input value={link.student} onChange={(e) => setLink((l) => ({ ...l, student: e.target.value }))} placeholder="CI del alumno" className={inputCls} /></label>
          <label className="mt-3 block text-sm font-semibold text-slate-700">Parentesco<select value={link.relation} onChange={(e) => setLink((l) => ({ ...l, relation: e.target.value }))} className={inputCls}><option value="tutor">Tutor</option><option value="padre">Padre</option><option value="madre">Madre</option><option value="encargado">Encargado</option></select></label>
          <button className="btn-primary mt-4 w-full justify-center" type="submit">Vincular</button>
        </form>

        <form onSubmit={assignTeacher} className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-extrabold text-[var(--institutional)]">Asignar docente ↔ materia</h3>
          <label className="mt-3 block text-sm font-semibold text-slate-700">Docente (usuario o CI)<input value={assign.teacher} onChange={(e) => setAssign((a) => ({ ...a, teacher: e.target.value }))} placeholder="ej: juan.perez" className={inputCls} /></label>
          <label className="mt-3 block text-sm font-semibold text-slate-700">Código de materia<input value={assign.subjectCode} onChange={(e) => setAssign((a) => ({ ...a, subjectCode: e.target.value }))} placeholder="ej: BTI-MAT" className={inputCls} /></label>
          <label className="mt-3 block text-sm font-semibold text-slate-700">ID de curso (opcional)<input value={assign.classId} onChange={(e) => setAssign((a) => ({ ...a, classId: e.target.value }))} placeholder="Vacío = solo materia" className={inputCls} /></label>
          <button className="btn-gold mt-4 w-full justify-center" type="submit">Asignar</button>
        </form>
      </div>
    </div>
  );
}
