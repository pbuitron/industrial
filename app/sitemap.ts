import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  // URLs estáticas con mayor granularidad SEO
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
    // Páginas de categorías específicas
    {
      url: `${baseUrl}/productos/abrazaderas`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/productos/epoxicos`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/productos/kits`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Páginas funcionales
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Admin (con menor prioridad)
    {
      url: `${baseUrl}/admin/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    }
  ]

  try {
    // Obtener productos dinámicamente con mejor manejo de errores
    const productUrls: MetadataRoute.Sitemap = []
    
    // Función helper para procesar productos
    const processProducts = async (category: string, endpoint: string) => {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${endpoint}`, {
          next: { revalidate: 3600 } // Cache por 1 hora
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data && Array.isArray(data.data)) {
            data.data.forEach((product: any) => {
              if (product.isActive !== false) { // Solo productos activos
                productUrls.push({
                  url: `${baseUrl}/productos/${category}/${product.productId || product._id}`,
                  lastModified: new Date(product.updatedAt || product.createdAt || new Date()),
                  changeFrequency: 'monthly',
                  priority: 0.8,
                })
              }
            })
          }
        }
      } catch (error) {
        console.error(`Error fetching ${category}:`, error)
      }
    }

    // Procesar todas las categorías en paralelo para mejor performance
    await Promise.all([
      processProducts('abrazaderas', 'abrazaderas'),
      processProducts('epoxicos', 'epoxicos'),
      processProducts('kits', 'kits')
    ])

    console.log(`Sitemap generado con ${staticUrls.length + productUrls.length} URLs`)
    return [...staticUrls, ...productUrls]
    
  } catch (error) {
    console.error('Error generando sitemap:', error)
    // Si hay error, devolver solo URLs estáticas
    return staticUrls
  }
}