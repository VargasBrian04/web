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

export async function middleware(req: NextRequest) {
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

export const config = { matcher: ["/portal/:path*"] };
