"use client";

import { useEffect, useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Formulario de ingreso RBAC. Tras validar credenciales (bcrypt en el
 * servidor, ver src/lib/auth.ts) deriva a /portal, que redirige según rol.
 */
export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/portal";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error"));
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeUser, setActiveUser] = useState<{ name?: string; username?: string; role?: string } | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Con sesión activa se ofrece seguir o salir: antes redirigía sin
  // mostrar el formulario y era imposible cambiar de cuenta.
  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j?.user) setActiveUser(j.user);
        setChecking(false);
      })
      .catch(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function switchAccount() {
    setLeaving(true);
    try {
      await signOut({ redirect: false });
    } catch {
      /* igual se limpia el formulario local */
    } finally {
      setActiveUser(null);
      setIdentifier("");
      setPassword("");
      setLeaving(false);
      router.refresh();
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        identifier: identifier.trim(),
        password,
        redirect: false,
      });
      if (!res || res.error) {
        setError("Usuario/correo o contraseña incorrectos, o cuenta inactiva.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Error de red al ingresar. Revisá tu conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-md"
    >
      {checking ? (
        <p className="py-8 text-center text-sm text-slate-500">Verificando sesión…</p>
      ) : activeUser ? (
        <>
          <h1 className="text-2xl font-extrabold text-[var(--institutional)]">
            Ya hay sesión activa
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Estás ingresado como <strong>{activeUser.name || activeUser.username}</strong>
            {activeUser.username ? ` (@${activeUser.username})` : ""}
            {activeUser.role ? ` · rol ${activeUser.role}` : ""}. Cada cuenta ve solo su panel.
          </p>
          <button
            type="button"
            onClick={() => { router.push(next); router.refresh(); }}
            className="btn-primary mt-6 w-full justify-center"
          >
            Continuar a mi panel
          </button>
          <button
            type="button"
            onClick={switchAccount}
            disabled={leaving}
            className="mt-3 w-full justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {leaving ? "Cerrando…" : "Salir e ingresar con otra cuenta"}
          </button>
        </>
      ) : (
        <>
      <h1 className="text-2xl font-extrabold text-[var(--institutional)]">
        Acceso al portal
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Dirección, docentes, alumnos y familias. Tu rol define lo que ves.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <label className="mt-6 block text-sm font-semibold text-slate-700">
        Correo o nombre de usuario
        <input
          type="text"
          required
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-[var(--institutional)]"
          placeholder="usuario@colegio.edu.py o tu usuario"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-slate-700">
        Contraseña
        <span className="relative mt-1 block">
          <input
            type={showPass ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-12 outline-none focus:border-[var(--institutional)]"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-lg text-slate-500 hover:bg-slate-100"
          >
            {showPass ? "🙈" : "👁️"}
          </button>
        </span>
      </label>

      <button type="submit" disabled={loading} className="btn-primary mt-6 w-full justify-center">
        {loading ? "Verificando…" : "Ingresar"}
      </button>

      <p className="mt-4 text-center text-sm text-slate-500">
        ¿Aspirante nuevo?{" "}
        <a href="/inscripciones" className="font-bold text-[var(--institutional)] underline">
          Inscribite aquí
        </a>
      </p>
        </>
      )}
    </form>
  );
}
