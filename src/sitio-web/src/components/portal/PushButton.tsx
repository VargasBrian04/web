"use client";

import { useEffect, useState } from "react";

/** Activa/desactiva avisos push del navegador en este dispositivo. */
export default function PushButton() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setOk(false);
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setOk(!!sub))
      .catch(() => setOk(false));
  }, []);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const current = await reg.pushManager.getSubscription();
      if (current) {
        await current.unsubscribe();
        await fetch("/api/push", { method: "DELETE" });
        setOk(false);
      } else {
        const vapid = process.env.NEXT_PUBLIC_PUSH_VAPID || "BGsmsBDW7vKTYCWHf8nVhCgt-sOsKLPzLAfp2gMcsqshzqiEeRG2V2ADgOSHz9Tn32oFe4JdOaTk1aBd_7E1m_4";
        if (!vapid) {
          alert("Avisos no configurados todavía.");
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapid,
        });
        const json = sub.toJSON();
        const res = await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: json.endpoint,
            p256dh: json.keys?.p256dh,
            auth: json.keys?.auth,
          }),
        });
        if (res.ok) setOk(true);
      }
    } finally {
      setBusy(false);
    }
  }

  if (ok === null) return null;
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      title="Avisos del navegador en este dispositivo"
    >
      🔔 {busy ? "…" : ok ? "Avisos activados" : "Activar avisos"}
    </button>
  );
}
