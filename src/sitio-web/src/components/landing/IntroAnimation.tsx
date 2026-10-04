"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SEEN_KEY = "csl-intro-seen";

const ROLES = [
  {
    id: "docente",
    icon: "👨‍🏫",
    title: "Soy Docente",
    desc: "Ingresá con tu usuario al portal docente.",
    msg: "El portal docente estará disponible próximamente."
  },
  {
    id: "padre",
    icon: "👨‍👩‍👧",
    title: "Soy Padre / Tutor",
    desc: "Ingresá para ver las notas de tus hijos.",
    msg: "El portal de padres estará disponible próximamente."
  },
  {
    id: "alumno",
    icon: "🎒",
    title: "Soy Alumno",
    desc: "Ingresá para ver tus calificaciones.",
    msg: "El portal del alumno estará disponible próximamente."
  }
];

function Escudo() {
  return (
    <svg className="fi-crest" viewBox="0 0 320 380" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="flameGlowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffcc00" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#ff3b30" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="outerFlameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#d52b1e" />
          <stop offset="50%" stopColor="#ff5e00" />
          <stop offset="100%" stopColor="#ffcc00" />
        </linearGradient>
        <linearGradient id="innerFlameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ff3b30" />
          <stop offset="70%" stopColor="#ffcc00" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <path d="M 10 10 L 310 10 L 310 320 Q 310 370 160 375 Q 10 370 10 320 Z" fill="#ffffff" stroke="#111111" strokeWidth="4" />
      <path d="M 220 10 L 310 10 L 310 110 L 220 110 Z" fill="#E31B23" stroke="#111111" strokeWidth="2" />
      <path d="M 220 110 L 310 110 L 310 210 L 220 210 Z" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
      <path d="M 220 210 L 310 210 L 310 320 Q 310 370 220 360 Z" fill="#203864" stroke="#111111" strokeWidth="2" />
      <text x="265" y="32" fontFamily="'Times New Roman', serif" fontWeight="bold" fontSize="20" fill="#FFFFFF" textAnchor="middle">M</text>
      <text x="265" y="52" fontFamily="'Times New Roman', serif" fontWeight="bold" fontSize="20" fill="#FFFFFF" textAnchor="middle">C</text>
      <text x="265" y="72" fontFamily="'Times New Roman', serif" fontWeight="bold" fontSize="20" fill="#FFFFFF" textAnchor="middle">A</text>
      <text x="265" y="92" fontFamily="'Times New Roman', serif" fontWeight="bold" fontSize="20" fill="#FFFFFF" textAnchor="middle">L.</text>
      <text x="265" y="150" fontFamily="'Times New Roman', serif" fontWeight="bold" fontSize="22" fill="#111111" textAnchor="middle">F.</text>
      <text x="265" y="185" fontFamily="'Times New Roman', serif" fontWeight="bold" fontSize="22" fill="#111111" textAnchor="middle">S.</text>
      <text x="265" y="240" fontFamily="'Times New Roman', serif" fontWeight="bold" fontSize="20" fill="#FFFFFF" textAnchor="middle">L</text>
      <text x="265" y="260" fontFamily="'Times New Roman', serif" fontWeight="bold" fontSize="20" fill="#FFFFFF" textAnchor="middle">O</text>
      <text x="265" y="280" fontFamily="'Times New Roman', serif" fontWeight="bold" fontSize="20" fill="#FFFFFF" textAnchor="middle">P</text>
      <text x="265" y="300" fontFamily="'Times New Roman', serif" fontWeight="bold" fontSize="20" fill="#FFFFFF" textAnchor="middle">E</text>
      <text x="265" y="320" fontFamily="'Times New Roman', serif" fontWeight="bold" fontSize="20" fill="#FFFFFF" textAnchor="middle">Z</text>
      <line x1="10" y1="75" x2="220" y2="75" stroke="#111111" strokeWidth="2" />
      <text x="115" y="35" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="16" fill="#111111" textAnchor="middle">COL. NACIONAL</text>
      <text x="115" y="60" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="16" fill="#111111" textAnchor="middle">E. M. D.</text>
      <g stroke="#111111" strokeWidth="2.5">
        <line x1="115" y1="90" x2="115" y2="78" />
        <line x1="130" y1="95" x2="142" y2="83" />
        <line x1="145" y1="105" x2="162" y2="92" />
        <line x1="155" y1="120" x2="175" y2="110" />
        <line x1="160" y1="138" x2="182" y2="132" />
        <line x1="160" y1="155" x2="182" y2="158" />
        <line x1="100" y1="95" x2="88" y2="83" />
        <line x1="85" y1="105" x2="68" y2="92" />
        <line x1="75" y1="120" x2="55" y2="110" />
        <line x1="70" y1="138" x2="48" y2="132" />
        <line x1="70" y1="155" x2="48" y2="158" />
      </g>
      <g>
        <circle cx="115" cy="135" r="50" fill="url(#flameGlowGrad)" className="flame-glow-effect" />
        <path className="flame-base" d="M 115 82 Q 138 108 138 132 Q 148 116 152 130 Q 158 148 146 164 Q 135 177 115 177 Q 95 177 84 164 Q 72 148 78 130 Q 82 116 92 132 Q 92 108 115 82 Z" fill="url(#outerFlameGrad)" stroke="#111111" strokeWidth="2" />
        <path className="flame-inner" d="M 115 98 Q 130 118 130 138 Q 136 128 140 138 Q 144 150 136 162 Q 128 172 115 172 Q 102 172 94 162 Q 86 150 90 138 Q 94 128 100 138 Q 100 118 115 98 Z" fill="url(#innerFlameGrad)" />
        <path className="flame-core" d="M 115 120 Q 124 135 124 148 Q 128 142 130 148 Q 132 156 126 164 Q 122 168 115 168 Q 108 168 104 164 Q 98 156 100 148 Q 102 142 106 148 Q 106 135 115 120 Z" fill="#ffffff" />
        <circle cx="110" cy="110" r="2.5" fill="#ffcc00" className="spark-1" />
        <circle cx="122" cy="105" r="2" fill="#ff5e00" className="spark-2" />
        <circle cx="115" cy="95" r="1.8" fill="#ffffff" className="spark-3" />
      </g>
      <path d="M 98 175 L 132 175 L 126 188 L 104 188 Z" fill="#D1D5DB" stroke="#111111" strokeWidth="2" />
      <g stroke="#111111" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M 115 195 L 40 185 L 25 260 L 115 280 Z" fill="#FFFFFF" />
        <path d="M 115 195 L 190 185 L 205 260 L 115 280 Z" fill="#FFFFFF" />
        <path d="M 115 198 L 45 190 L 32 263 L 115 280 Z" fill="#FFFFFF" />
        <path d="M 115 198 L 185 190 L 198 263 L 115 280 Z" fill="#FFFFFF" />
        <path d="M 52 205 Q 80 210 110 205" fill="none" />
        <path d="M 50 218 Q 80 223 110 218" fill="none" />
        <path d="M 48 231 Q 80 236 110 231" fill="none" />
        <path d="M 46 244 Q 80 249 110 244" fill="none" />
        <path d="M 120 205 Q 150 210 178 205" fill="none" />
        <path d="M 120 218 Q 150 223 180 218" fill="none" />
        <path d="M 120 231 Q 150 236 182 231" fill="none" />
        <path d="M 120 244 Q 150 249 184 244" fill="none" />
        <polygon points="115,280 110,295 120,295" fill="#111111" />
      </g>
      <text x="115" y="330" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="22" fill="#111111" textAnchor="middle" letterSpacing="1">CAAGUAZU</text>
    </svg>
  );
}

export default function IntroAnimation() {
  const [stage, setStage] = useState<"flame" | "roles" | null>(null);
  const [flameLeaving, setFlameLeaving] = useState(false);
  const [rolesLeaving, setRolesLeaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      /* sin sessionStorage: mostrar igual */
    }
    setStage("flame");
  }, []);

  const goRoles = useCallback(() => {
    setStage((s) => {
      if (s !== "flame") return s;
      setFlameLeaving(true);
      window.setTimeout(() => setStage("roles"), 850);
      return s;
    });
  }, []);

  const close = useCallback(() => {
    setRolesLeaving(true);
    window.setTimeout(() => {
      setStage(null);
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
      document.body.style.overflow = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 850);
  }, []);

  useEffect(() => {
    if (!stage) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "flame") return;
    const t = window.setTimeout(goRoles, 6000);
    return () => window.clearTimeout(t);
  }, [stage, goRoles]);

  useEffect(() => {
    if (!stage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar" && e.code !== "Space") return;
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      if (stage === "flame") goRoles();
      else close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [stage, goRoles, close]);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  if (!stage) return null;

  return (
    <>
      {stage === "flame" && (
        <div
          className={`csl-flame${flameLeaving ? " leaving" : ""}`}
          onClick={goRoles}
          role="button"
          aria-label="Tocá para elegir tu ingreso"
        >
          <div
            className="csl-flame-bg"
            style={{ backgroundImage: "url('/images/institucion-frente.jpg')" }}
          />
          <div className="csl-veil" />
          <div className="fi-box">
            <div style={{ position: "relative", display: "inline-block" }}>
              <div className="fi-glow" />
              <Escudo />
            </div>
            <div className="fi-title">Mariscal Francisco Solano López</div>
            <div className="fi-sub">Caaguazú · Paraguay</div>
          </div>
          <div className="fi-hint">✦ Tocá para elegir tu ingreso ✦</div>
        </div>
      )}

      {stage === "roles" && (
        <div className={`csl-roles${rolesLeaving ? " leaving" : ""}`}>
          <div
            className="csl-flame-bg"
            style={{ backgroundImage: "url('/images/institucion-frente.jpg')" }}
          />
          <div className="csl-veil" />
          <div className="rg-box">
            <h2>
              ¿Cómo querés <span>ingresar</span>?
            </h2>
            <p>Elegí tu perfil para ir a tu zona.</p>
            <div className="rg-cards">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="rg-card"
                  onClick={() => showToast(r.msg)}
                >
                  <div className="ico">{r.icon}</div>
                  <h3>{r.title}</h3>
                  <p>{r.desc}</p>
                </button>
              ))}
            </div>
            <button type="button" className="rg-visit" onClick={close}>
              Entrar como visita →
            </button>
          </div>
        </div>
      )}

      {toast && <div className="csl-toast show">{toast}</div>}
    </>
  );
}
