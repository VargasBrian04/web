import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/** GET /api/auditoria — solo ADMIN (?take=,默认 100). */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Solo Dirección" }, { status: 403 });
  const take = Math.min(
    200,
    Math.max(1, Number(new URL(request.url).searchParams.get("take") || "100") || 100)
  );
  const data = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
  return NextResponse.json({ data });
}
