/**
 * Limitador de tasa en memoria (best-effort por instancia).
 * En Vercel cada instancia tiene su propio Map; sirve para frenar abuso
 * simple (formularios públicos, login) sin depender de servicios externos.
 * Si más adelante se necesita un límite global, reemplazar por Upstash/Redis.
 */
type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, v] of buckets) {
      if (now > v.reset) buckets.delete(k);
    }
  }
  const cur = buckets.get(key);
  if (!cur || now > cur.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  cur.count += 1;
  if (cur.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((cur.reset - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

/** IP del cliente detrás del proxy de Vercel. */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  const raw = fwd?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "desconocida";
  return raw.slice(0, 80);
}
