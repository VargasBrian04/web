import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

/**
 * RBAC por ruta. Las sesiones son JWT (stateless): el rol viaja en el
 * token, por lo que no se necesita tabla de sesiones ("accesos").
 * Sin sesión -> /login?next=<ruta>. Con sesión pero sin rol -> /no-autorizado.
 */
const routeRoles: { prefix: string; roles: string[] }[] = [
  { prefix: "/portal/admin", roles: ["ADMIN"] },
  { prefix: "/portal/profesor", roles: ["TEACHER", "ADMIN"] },
  { prefix: "/portal/alumno", roles: ["STUDENT", "ADMIN"] },
  { prefix: "/portal/padre", roles: ["PARENT", "ADMIN"] }
];

// Rate-limit básico de login (best-effort por instancia edge):
// 20 intentos por IP cada 10 minutos en el callback de credenciales.
const loginHits = new Map<string, { n: number; reset: number }>();

function loginLimit(req: NextRequest): NextResponse | null {
  if (!req.nextUrl.pathname.startsWith("/api/auth/callback/credentials")) return null;
  if (req.method !== "POST") return null;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "desconocida";
  const now = Date.now();
  const cur = loginHits.get(ip);
  if (!cur || now > cur.reset) {
    loginHits.set(ip, { n: 1, reset: now + 10 * 60 * 1000 });
    return null;
  }
  cur.n += 1;
  if (cur.n > 20) {
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá 10 minutos." },
      { status: 429 }
    );
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const limited = loginLimit(req);
  if (limited) return limited;

  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/portal")) return NextResponse.next();

  // La cookie de sesión cambia de nombre según el contexto
  // (__Secure- en HTTPS, simple en HTTP). Se prueban ambas: el endpoint
  // /api/auth/session la lee bien, pero getToken por defecto a veces
  // busca el nombre equivocado y rebotaba a /login en bucle.
  const secret = process.env.NEXTAUTH_SECRET;
  let token: { role?: string } | null = null;
  for (const [cookieName, secureCookie] of [
    ["__Secure-authjs.session-token", true],
    ["authjs.session-token", false],
  ] as const) {
    try {
      const t = (await getToken({ req, secret, cookieName, secureCookie })) as {
        role?: string;
      } | null;
      if (t) {
        token = t;
        break;
      }
    } catch {
      /* probar el siguiente nombre */
    }
  }
  const role = token?.role;
  if (!token || !role) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const rule = routeRoles.find((r) => pathname.startsWith(r.prefix));
  if (rule && !rule.roles.includes(role)) {
    return NextResponse.redirect(new URL("/no-autorizado", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/portal/:path*", "/api/auth/callback/credentials"] };
