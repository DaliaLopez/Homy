import type { NextConfig } from "next";

// Configuración mínima (Next.js III): sin cacheComponents ni partialPrefetching,
// porque las páginas leen la cookie de sesión y la URL en cada petición.
const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    // Evidencias, documentos e imágenes viajan en las Server Actions.
    serverActions: {
      bodySizeLimit: "20mb",
    },
    proxyClientMaxBodySize: "20mb",
  },
};

export default nextConfig;
