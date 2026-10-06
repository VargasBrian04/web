/**
 * Utilidades del Blog/Noticias. Sin dependencias: el editor del panel
 * produce HTML y aquí se normaliza/sanitiza para guardar y mostrar.
 */

/** Categorías oficiales del sistema (las mismas de siempre). */
export const NEWS_CATEGORIES = [
  "Inscripciones",
  "Académico",
  "Institucional",
  "Avisos",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export function isNewsCategory(v: unknown): v is NewsCategory {
  return (
    typeof v === "string" &&
    (NEWS_CATEGORIES as readonly string[]).includes(v)
  );
}

/** slug estable desde el título: minúsculas, sin tildes ni símbolos. */
export function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "noticia";
}

/** Texto plano para extracto/meta: quita etiquetas y recorta. */
export function plainText(html: string, max = 160): string {
  const t = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h\d|blockquote)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + "…";
}

/**
 * Sanitizado mínimo del HTML del editor: quita scripts, iframes,
 * event handlers (on*) y javascript:. No es un sanitizador completo,
 * pero el contenido solo lo escribe Dirección (rol ADMIN verificado).
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe\s*>/gi, "")
    .replace(/<style[\s\S]*?<\/style\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/href\s*=\s*("|')\s*javascript:[^"']*\1/gi, 'href="#"');
}

/** Imagen a mostrar: subida (API con control) o estática del seed. */
export function newsImageUrl(post: {
  id: string;
  imageFile: string | null;
  imageUrl: string | null;
}): string | null {
  if (post.imageFile) return `/api/news/${post.id}/image`;
  return post.imageUrl;
}
