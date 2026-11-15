import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = "https://colegio-solano-lopez.vercel.app";

/** Mapa del sitio: páginas públicas fijas + noticias publicadas. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const rutas: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/noticias`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/noticias/todas`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/calendario`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/comunicados`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/encuestas`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/galeria`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/preguntas`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/buscar`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/registro`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/registro/docente`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/registro/tutor`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/acceso`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  try {
    const posts = await prisma.newsPost.findMany({
      where: { status: "PUBLICADA" },
      select: { slug: true, updatedAt: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 500,
    });
    for (const p of posts) {
      rutas.push({
        url: `${BASE}/noticias/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // Sin base de datos: el sitemap igual entrega las páginas fijas.
  }

  return rutas;
}
