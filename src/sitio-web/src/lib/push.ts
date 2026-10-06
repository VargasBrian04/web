import webpush from "web-push";

/**
 * Push del navegador. Requiere en Vercel:
 * PUSH_VAPID_PUBLIC, PUSH_VAPID_PRIVATE, PUSH_CONTACT=mailto:....
 * La pública también va en NEXT_PUBLIC_PUSH_VAPID (para suscribirse).
 */

export function pushConfigurado(): boolean {
  return !!(process.env.PUSH_VAPID_PUBLIC && process.env.PUSH_VAPID_PRIVATE);
}

export async function enviarPush(
  subs: { endpoint: string; p256dh: string; auth: string }[],
  titulo: string,
  cuerpo: string,
  url = "/portal/avisos"
): Promise<{ ok: number; fallidas: string[] }> {
  const fallidas: string[] = [];
  let ok = 0;
  if (!pushConfigurado()) return { ok, fallidas };
  webpush.setVapidDetails(
    process.env.PUSH_CONTACT || "mailto:colegionacionalemd6@gmail.com",
    process.env.PUSH_VAPID_PUBLIC!,
    process.env.PUSH_VAPID_PRIVATE!
  );
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } } as never,
        JSON.stringify({ title: titulo, body: cuerpo, url })
      );
      ok++;
    } catch {
      fallidas.push(s.endpoint);
    }
  }
  return { ok, fallidas };
}

/** Borra suscripciones muertas (410/404 de la push API). */
export async function limpiarPush(prisma: {
  pushSubscription: { deleteMany: (a: { where: { endpoint: { in: string[] } } }) => Promise<unknown> };
}, endpoints: string[]) {
  if (!endpoints.length) return;
  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: endpoints } } });
  } catch {
    /* ignore */
  }
}
