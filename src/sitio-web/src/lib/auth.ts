import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeUsername } from "@/lib/users";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: UserRole;
      name: string;
      email: string | null;
    };
  }
}

export const authConfig = {
  trustHost: true, // obligatorio detrás del proxy de Vercel
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  jwt: { maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        identifier: { label: "Correo o usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        // Compatibilidad: acepta `identifier` (nuevo) o `email` (formularios viejos).
        const creds = credentials as Record<string, unknown> | null | undefined;
        const raw = String(creds?.identifier ?? creds?.email ?? "").trim();
        const password = String(creds?.password ?? "");
        if (!raw || !password) return null;

        // Con @ → busca por correo; sin @ → por nombre de usuario.
        const user = raw.includes("@")
          ? await prisma.user.findUnique({
              where: { email: raw.toLowerCase() }
            })
          : await prisma.user.findUnique({
              where: { username: normalizeUsername(raw) }
            });
        if (!user || !user.active) return null;

        let valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid && password !== password.trim()) {
          // Autocompletados que agregan espacios al final
          valid = await bcrypt.compare(password.trim(), user.passwordHash);
        }
        if (!valid) return null;

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role
        } as never;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.username = (user as { username: string }).username;
        token.role = (user as { role: UserRole }).role;
        return token;
      }
      // Refrescar rol desde la DB: cambios de rol y baneos aplican sin re-login.
      if (typeof token?.id === "string") {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id },
            select: { role: true, active: true, username: true },
          });
          if (!fresh || !fresh.active) return { ...token, role: "ASPIRANT" as UserRole, username: "" };
          token.role = fresh.role;
          token.username = fresh.username;
        } catch {
          /* sin DB: mantener token */
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = (token.username as string) ?? "";
        session.user.role = token.role as UserRole;
        // Doble verificación en cada uso de auth(): rol y estado frescos.
        if (typeof token?.id === "string") {
          try {
            const fresh = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { role: true, active: true, username: true, firstName: true, lastName: true, email: true },
            });
            if (!fresh || !fresh.active) {
              session.user.role = "ASPIRANT";
            } else {
              session.user.role = fresh.role;
              session.user.username = fresh.username;
              session.user.name = `${fresh.firstName} ${fresh.lastName}`;
              session.user.email = fresh.email ?? "";
            }
          } catch {
            /* sin DB: mantener token */
          }
        }
      }
      return session;
    }
  }
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
