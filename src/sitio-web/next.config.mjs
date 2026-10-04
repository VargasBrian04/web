/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Las imágenes institucionales se sirven desde /public/images sin optimización de dominios externos.
    unoptimized: true
  }
};

export default nextConfig;