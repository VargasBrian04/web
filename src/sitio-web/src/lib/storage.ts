import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Almacenamiento de documentos académicos (PDF/JPG/PNG).
 * - Con R2_* configurado (cuenta Cloudflare): bucket R2.
 * - Sin R2: disco local (uploads/ o /tmp en Vercel).
 * - Las imágenes de noticias/galería van en DB (data URI), no usan esto.
 */

function r2(): S3Client | null {
  const account = process.env.R2_ACCOUNT_ID;
  const key = process.env.R2_ACCESS_KEY;
  const secret = process.env.R2_SECRET_KEY;
  if (!account || !key || !secret) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${account}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: key, secretAccessKey: secret },
  });
}

function r2Bucket(): string {
  return process.env.R2_BUCKET || "colegio";
}

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

/** Imágenes del blog: PNG, JPG y WEBP (máx 10 MB, igual que planillas). */
export const NEWS_IMAGE_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const MAX_IMAGE_DB_BYTES = 4 * 1024 * 1024; // 4 MB (base64 en DB)

/**
 * Guarda una imagen como data URI en la base de datos (no depende del
 * disco efímero de Vercel). Lanza Error si el tipo o el tamaño no valen.
 */
export function imageToDataUri(
  buf: Buffer,
  mime: string,
  allowed: Record<string, string> = NEWS_IMAGE_MIME,
  label = "PNG/JPG/WEBP"
): string {
  if (!(mime in allowed))
    throw new Error(`Tipo de archivo no permitido (solo ${label})`);
  if (buf.length > MAX_IMAGE_DB_BYTES)
    throw new Error("Imagen muy pesada (máx 4 MB: se guarda en la base de datos)");
  if (buf.length === 0) throw new Error("Archivo vacío");
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/** Decodifica un data URI (o null si no lo es). */
export function parseDataUri(
  uri: string
): { mime: string; buf: Buffer } | null {
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(uri);
  if (!m) return null;
  return { mime: m[1], buf: Buffer.from(m[2], "base64") };
}

export function uploadsDir() {
  // En Vercel el disco es de solo lectura salvo /tmp: allí van los uploads.
  // (Fase siguiente: R2/Blob. Firma idéntica, solo cambia este archivo.)
  if (process.env.VERCEL) return path.join(tmpdir(), "csl-uploads");
  // Raíz del proyecto sitio-web/uploads (gitignored, servido solo vía API con auth).
  return path.join(process.cwd(), "uploads");
}

export function isAllowedMime(mime: string) {
  return mime in ALLOWED_MIME;
}

export async function saveBuffer(
  buf: Buffer,
  mime: string,
  allowed: Record<string, string> = ALLOWED_MIME,
  label = "PDF/JPG/PNG"
): Promise<{ fileName: string; size: number }> {
  if (!(mime in allowed))
    throw new Error(`Tipo de archivo no permitido (solo ${label})`);
  if (buf.length > MAX_FILE_BYTES) throw new Error("Archivo muy pesado (máx 10 MB)");
  if (buf.length === 0) throw new Error("Archivo vacío");
  const ext = allowed[mime];
  const fileName = `${randomUUID()}${ext}`;
  const client = r2();
  if (client) {
    await client.send(
      new PutObjectCommand({ Bucket: r2Bucket(), Key: fileName, Body: buf, ContentType: mime })
    );
    return { fileName, size: buf.length };
  }
  await mkdir(uploadsDir(), { recursive: true });
  await writeFile(path.join(uploadsDir(), fileName), buf);
  return { fileName, size: buf.length };
}

export async function readBuffer(fileName: string): Promise<Buffer> {
  const safe = path.basename(fileName);
  const client = r2();
  if (client) {
    const out = await client.send(new GetObjectCommand({ Bucket: r2Bucket(), Key: safe }));
    const chunks: Uint8Array[] = [];
    const body = out.Body as unknown as AsyncIterable<Uint8Array>;
    for await (const c of body) chunks.push(c);
    return Buffer.concat(chunks);
  }
  return readFile(path.join(uploadsDir(), safe));
}

export async function removeFile(fileName: string): Promise<void> {
  try {
    const client = r2();
    if (client) {
      await client.send(new DeleteObjectCommand({ Bucket: r2Bucket(), Key: path.basename(fileName) }));
      return;
    }
    await unlink(path.join(uploadsDir(), path.basename(fileName)));
  } catch {
    // ya eliminado: no es error
  }
}
