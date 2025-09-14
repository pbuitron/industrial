  /** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de imágenes
  images: {
    unoptimized: true,
    domains: ['industrial-iot.us', 'localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // Configuración básica
  poweredByHeader: false,

  // TypeScript y ESLint más permisivos para desarrollo
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_ENV: process.env.NODE_ENV || 'development',
  },

  // Configuración condicional según el entorno
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,

    // Headers de seguridad solo en producción
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
          ],
        },
      ];
    },
  }),
}

  export default nextConfig