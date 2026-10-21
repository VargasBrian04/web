"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  canRoleAccessZone,
  portalZoneFromPath,
  wrongZoneMessage,
} from "@/lib/portal-access";

/**
 * Formulario de ingreso RBAC. Tras validar credenciales (bcrypt en el
 * servidor, ver src/lib/auth.ts) deriva a /portal, que redirige según rol.
 */
export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const zone = portalZoneFromPath(next);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (params.get("code") === "wrong_zone" && zone) return wrongZoneMessage(zone);
    return params.get("error");
  });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Con sesión activa se verifica la zona antes de seguir al destino.
  useEffect(() => {
    let active = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        if (!j?.user) {
          setChecking(false);
          return;
        }

        if (zone && !canRoleAccessZone(j.user.role, zone)) {
          setError(wrongZoneMessage(zone));
          setChecking(false);
          return;
        }

        router.replace(next);
        router.refresh();
      })
      .catch(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [next, router, zone]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        identifier: identifier.trim().replace(/^@/, ""),
        password,
        zone: zone ?? "",
        redirect: false,
      });
      if (!res || res.error) {
        if (zone && res?.code === "wrong_zone") {
          setError(wrongZoneMessage(zone));
        } else {
          setError("Usuario o contraseña incorrectos.");
        }
        return;
      }
      // "/" es la portada estática (rewrite sin RSC): requiere carga completa.
      if (next === "/") {
        try { sessionStorage.setItem("csl-just-logged", "1"); } catch { /* solo memoria */ }
        window.location.href = "/";
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

  const isWrongZone = error?.startsWith("Zona de Ingreso Incorrecta");

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-md sm:p-8"
    >
      {checking ? (
        <p className="py-8 text-center text-sm text-slate-500">Verificando sesión…</p>
      ) : (
        <>
          <h1 className="text-xl font-extrabold text-[var(--institutional)] sm:text-2xl">
            Acceso al portal
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Dirección, docentes, alumnos y familias. Tu rol define lo que ves.
          </p>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <p className="font-extrabold">{error}</p>
              {isWrongZone && (
                <a
                  href="/acceso"
                  className="mt-2 inline-flex font-bold text-red-800 underline underline-offset-2"
                >
                  Elegir otro perfil
                </a>
              )}
            </div>
          )}

          <label className="mt-5 block text-sm font-semibold text-slate-700 sm:mt-6">
            Correo o nombre de usuario
            <input
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[var(--institutional)]"
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
                className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-[var(--institutional)]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-lg text-slate-500 hover:bg-slate-100"
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </span>
          </label>

          <button type="submit" disabled={loading} className="btn-primary mt-5 w-full justify-center sm:mt-6">
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
