import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDataUri, readBuffer } from "@/lib/storage";

const CT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** GET /api/media/[id]/image — público, bytes de la foto (DB o disco legacy). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await prisma.galleryItem.findUnique({ where: { id }, select: { imageFile: true } });
  if (!g) return NextResponse.json({ error: "Foto inexistente" }, { status: 404 });
  const dataUri = parseDataUri(g.imageFile);
  if (dataUri) {
    return new NextResponse(new Uint8Array(dataUri.buf), {
      headers: {
        "Content-Type": dataUri.mime,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }
  try {
    const buf = await readBuffer(g.imageFile);
    const ext = `.${g.imageFile.split(".").pop()?.toLowerCase() ?? ""}`;
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": CT[ext] ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 410 });
  }
}
