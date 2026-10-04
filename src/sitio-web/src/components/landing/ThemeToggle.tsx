"use client";

import { useEffect, useState } from "react";

const KEY = "csl-theme";

function current(): "marrón" | "oscuro" {
  if (typeof document === "undefined") return "marrón";
  return document.documentElement.dataset.theme === "oscuro" ? "oscuro" : "marrón";
}

/** Interruptor de apariencia: marrón/blanco institucional o negro/blanco. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"marrón" | "oscuro">("marrón");

  useEffect(() => {
    setTheme(current());
  }, []);

  function toggle() {
    const next = theme === "marrón" ? "oscuro" : "marrón";
    document.documentElement.dataset.theme = next === "oscuro" ? "oscuro" : "";
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* sin almacenamiento: solo sesión */
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "marrón" ? "Cambiar a tema negro y blanco" : "Volver al tema marrón y blanco"}
      aria-label="Cambiar apariencia"
      className="rounded-lg px-3 py-2 text-base transition-colors hover:bg-white/10"
    >
      {theme === "marrón" ? "🌙" : "☀️"}
    </button>
  );
}
