import type { MetadataRoute } from "next";

const BASE = "https://colegio-solano-lopez.vercel.app";

/** Reglas para buscadores: portal, API y documentos privados fuera del índice. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal/", "/api/", "/carnet/", "/no-autorizado"],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
