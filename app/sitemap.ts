import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  // URLs estáticas
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/productos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }
  ]

  try {
    // Obtener productos dinámicamente
    const productUrls: MetadataRoute.Sitemap = []
    
    // Obtener abrazaderas
    const abrazaderasResponse = await fetch(`http://localhost:5000/api/products/abrazaderas`)
    if (abrazaderasResponse.ok) {
      const abrazaderasData = await abrazaderasResponse.json()
      if (abrazaderasData.success && abrazaderasData.data) {
        abrazaderasData.data.forEach((product: any) => {
          productUrls.push({
            url: `${baseUrl}/productos/abrazaderas/${product.productId}`,
            lastModified: new Date(product.updatedAt || product.createdAt),
            changeFrequency: 'weekly',
            priority: 0.8,
          })
        })
      }
    }

    // Obtener epóxicos
    const epoxicosResponse = await fetch(`http://localhost:5000/api/products/epoxicos`)
    if (epoxicosResponse.ok) {
      const epoxicosData = await epoxicosResponse.json()
      if (epoxicosData.success && epoxicosData.data) {
        epoxicosData.data.forEach((product: any) => {
          productUrls.push({
            url: `${baseUrl}/productos/epoxicos/${product.productId}`,
            lastModified: new Date(product.updatedAt || product.createdAt),
            changeFrequency: 'weekly',
            priority: 0.8,
          })
        })
      }
    }

    // Obtener kits
    const kitsResponse = await fetch(`http://localhost:5000/api/products/kits`)
    if (kitsResponse.ok) {
      const kitsData = await kitsResponse.json()
      if (kitsData.success && kitsData.data) {
        kitsData.data.forEach((product: any) => {
          productUrls.push({
            url: `${baseUrl}/productos/kits/${product.productId}`,
            lastModified: new Date(product.updatedAt || product.createdAt),
            changeFrequency: 'weekly',
            priority: 0.8,
          })
        })
      }
    }

    return [...staticUrls, ...productUrls]
  } catch (error) {
    console.error('Error generando sitemap:', error)
    // Si hay error, devolver solo URLs estáticas
    return staticUrls
  }
}