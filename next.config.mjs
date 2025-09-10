/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de imágenes
  images: {
    unoptimized: true, // Solo si realmente lo necesitas
   domains: [], // Añade dominios permitidos aquí si cargas imágenes externas
  formats: ['image/webp', 'image/avif'],
  },
  
  // Configuración de compilación
  poweredByHeader: false, // Remueve el header "X-Powered-By: Next.js"
  
  // Configuración de TypeScript y ESLint (HABILITADAS)
  typescript: {
    // TypeScript ahora está habilitado para builds
    // ignoreBuildErrors: false, // Por defecto
  },
  eslint: {
    // ESLint ahora está habilitado para builds
    // ignoreDuringBuilds: false, // Por defecto
  },

  // Configuración experimental (opcional)
  experimental: {
    // typedRoutes: true, // Rutas tipadas (Next.js 13.2+)
suppressHydrationWarning: true,

  },

  // Variables de entorno
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Configuración de Webpack (si necesitas customización)
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Customizaciones de webpack aquí si es necesario
    return config;
  },
}

export default nextConfig