"use client";

import { useEffect, useState } from "react";

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--institutional)]";

type Me = {
  username: string;
  ci: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
};

/**
 * Mi perfil estilo red social: el usuario vincula su correo y teléfono
 * cuando quiera, y cambia su contraseña con la actual como confirmación.
 */
export default function ProfileForm() {
  const [me, setMe] = useState<Me | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/profile");
    const json = await res.json();
    if (res.ok) {
      setMe(json.data);
      setEmail(json.data.email ?? "");
      setPhone(json.data.phone ?? "");
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email || null, phone: phone || null }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo guardar");
    else {
      setMsg("Contacto actualizado.");
      load();
    }
  }

  async function changePass(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error || "No se pudo cambiar la clave");
    else {
      setMsg("Contraseña actualizada.");
      setCurrent("");
      setNext("");
    }
  }

  if (!me) return <p className="text-sm text-slate-500">Cargando perfil…</p>;

  return (
    <div className="grid gap-6">
      {msg && (
        <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{msg}</p>
      )}
      <section className="flex items-center gap-4 rounded-2xl bg-[var(--institutional)] p-6 text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--gold)] text-2xl font-extrabold">
          {me.firstName[0]}
          {me.lastName[0]}
        </div>
        <div>
          <p className="text-lg font-bold">{me.firstName} {me.lastName}</p>
          <p className="text-sm text-stone-200">@{me.username} · CI {me.ci} · {me.role}</p>
        </div>
      </section>

      <form onSubmit={saveContact} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-extrabold text-[var(--institutional)]">Correo y teléfono vinculados</h3>
        <p className="mt-1 text-sm text-slate-500">
          Podés agregarlos ahora o después. Se usan para avisos y para recuperar el acceso.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">Teléfono<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxx" className={inputCls} /></label>
        </div>
        <button className="btn-primary mt-4 justify-center" type="submit">Guardar contacto</button>
      </form>

      <form onSubmit={changePass} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-extrabold text-[var(--institutional)]">Cambiar contraseña</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Contraseña actual<input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} /></label>
          <label className="text-sm font-semibold text-slate-700">Nueva (8+ caracteres)<input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} /></label>
        </div>
        <button className="btn-gold mt-4 justify-center" type="submit">Actualizar clave</button>
      </form>
    </div>
  );
}
