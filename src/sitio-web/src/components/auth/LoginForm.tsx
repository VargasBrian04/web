"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
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
  const [error, setError] = useState<string | null>(params.get("error"));
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      identifier: identifier.trim(),
      password,
      redirect: false
    });
    setLoading(false);
    if (res?.error) {
      setError("Usuario/correo o contraseña incorrectos, o cuenta inactiva.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-md"
    >
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
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-[var(--institutional)]"
          placeholder="••••••••"
        />
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
    </form>
  );
}
