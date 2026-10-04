import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Almacenamiento local de documentos académicos (PDF/JPG/PNG).
 * - Archivos en disco `uploads/`, NO en la DB (solo metadatos en Prisma).
 * - Diseñado como adaptador: a futuro se reemplaza por R2/Vercel Blob
 *   cambiando solo este archivo (misma firma save/read/remove).
 */

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

export function uploadsDir() {
  // Raíz del proyecto sitio-web/uploads (gitignored, servido solo vía API con auth).
  return path.join(process.cwd(), "uploads");
}

export function isAllowedMime(mime: string) {
  return mime in ALLOWED_MIME;
}

export async function saveBuffer(
  buf: Buffer,
  mime: string
): Promise<{ fileName: string; size: number }> {
  if (!isAllowedMime(mime)) throw new Error("Tipo de archivo no permitido (solo PDF/JPG/PNG)");
  if (buf.length > MAX_FILE_BYTES) throw new Error("Archivo muy pesado (máx 10 MB)");
  if (buf.length === 0) throw new Error("Archivo vacío");
  const ext = ALLOWED_MIME[mime];
  const fileName = `${randomUUID()}${ext}`;
  await mkdir(uploadsDir(), { recursive: true });
  await writeFile(path.join(uploadsDir(), fileName), buf);
  return { fileName, size: buf.length };
}

export async function readBuffer(fileName: string): Promise<Buffer> {
  const safe = path.basename(fileName);
  return readFile(path.join(uploadsDir(), safe));
}

export async function removeFile(fileName: string): Promise<void> {
  try {
    await unlink(path.join(uploadsDir(), path.basename(fileName)));
  } catch {
    // ya eliminado: no es error
  }
}
