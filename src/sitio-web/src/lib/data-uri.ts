/** Utilidades para leer data URIs almacenadas en la base (fotos de planillas y adjuntos). */

export { extFromMime } from "./file-types";

export type DataUriInfo = {
  mime: string;
  base64: string;
  size: number;
};

export function parseDataUri(value: string | null | undefined): DataUriInfo | null {
  if (!value || !value.startsWith("data:")) return null;
  const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/i.exec(value);
  if (!match) return null;

  const mime = match[1].toLowerCase();
  const isBase64 = !!match[2];
  const payload = match[3] ?? "";

  if (isBase64) {
    const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
    return {
      mime,
      base64: payload,
      size: Math.max(0, Math.floor((payload.length * 3) / 4) - padding),
    };
  }

  let decoded = payload;
  try {
    decoded = decodeURIComponent(payload);
  } catch {
    // Si el data URI no está bien escapado, se usa el contenido literal.
  }
  return { mime, base64: "", size: Buffer.byteLength(decoded) };
}

export type DataUriMeta = {
  mime: string;
  base64: boolean;
  size: number | null;
};

/**
 * Lee solo la cabecera del data URI. Evita copiar el payload completo
 * (que puede pesar varios MB) cuando únicamente se necesitan MIME/tamaño.
 */
export function dataUriMeta(value: string | null | undefined): DataUriMeta | null {
  if (!value || !value.startsWith("data:")) return null;
  const comma = value.indexOf(",");
  if (comma < 5) return null;
  const match = /^data:([^;,]+)(;base64)?$/i.exec(value.slice(0, comma));
  if (!match) return null;

  const mime = match[1].toLowerCase();
  const isBase64 = !!match[2];
  if (isBase64) {
    const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
    const payloadLength = value.length - comma - 1;
    return { mime, base64: true, size: Math.max(0, Math.floor((payloadLength * 3) / 4) - padding) };
  }

  const payload = value.slice(comma + 1);
  try {
    return { mime, base64: false, size: Buffer.byteLength(decodeURIComponent(payload)) };
  } catch {
    return { mime, base64: false, size: Buffer.byteLength(payload) };
  }
}

export function dataUriMime(value: string | null | undefined): string | null {
  return dataUriMeta(value)?.mime ?? null;
}

export function dataUriSize(value: string | null | undefined): number | null {
  return dataUriMeta(value)?.size ?? null;
}

export function dataUriToBuffer(value: string | null | undefined): Buffer | null {
  const info = parseDataUri(value);
  if (!info) return null;
  if (info.base64) return Buffer.from(info.base64, "base64");
  try {
    return Buffer.from(decodeURIComponent(value!.slice(value!.indexOf(",") + 1)), "utf8");
  } catch {
    return Buffer.from(value!.slice(value!.indexOf(",") + 1), "utf8");
  }
}

export function storageUrl(kind: "fotolog" | "assignment", id: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return kind === "fotolog" ? `/api/fotolog/${id}/photo` : `/api/assignments/${id}/file`;
}
