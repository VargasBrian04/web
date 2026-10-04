/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Las imágenes institucionales se sirven desde /public/images sin optimización de dominios externos.
    unoptimized: true
  },
  async rewrites() {
    // La portada (/) es la vista previa institucional estática.
    // El portal real sigue en /acceso, /login, /portal/*, /api/*.
    return [{ source: "/", destination: "/vista-previa.html" }];
  }
};

export default nextConfig;