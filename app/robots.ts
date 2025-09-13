import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/productos/',
          '/search',
          '/sitemap.xml',
          '/robots.txt'
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/_next/',
          '/.next/',
          '/static/',
          '/private/',
          '/server/',
          '*.json',
          '/search?*', // Evitar páginas de búsqueda con parámetros
          '/admin*',
          '/auth*'
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/productos/',
          '/search',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
        ],
        crawlDelay: 1
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/productos/',
          '/search',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
        ],
        crawlDelay: 1
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}