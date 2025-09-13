/**
 * Utilidades para manejo de imágenes
 */

/**
 * Convierte una URL externa a una URL proxy local
 * @param imageUrl URL original de la imagen
 * @returns URL proxy local o la URL original si es local
 */
export function getProxiedImageUrl(imageUrl: string): string {
  if (!imageUrl) {
    return '/placeholder.jpg'
  }

  // Si es una URL local o relativa, devolverla tal como está
  if (imageUrl.startsWith('/') || !imageUrl.includes('://')) {
    return imageUrl
  }

  try {
    const url = new URL(imageUrl)

    // Lista de dominios externos que necesitan proxy
    const externalDomains = [
      'i0.wp.com',
      'www.arcorepoxy.com',
      'arcorepoxy.com',
      'www.hermeticasf.com',
      'hermeticasf.com',
      'www.belzona.com',
      'belzona.com',
      'www.sealxpert.com',
      'sealxpert.com'
    ]

    const needsProxy = externalDomains.some(domain =>
      url.hostname === domain || url.hostname.endsWith('.' + domain)
    )

    if (needsProxy) {
      // Usar el proxy local
      return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
    }

    // Para otras URLs externas, devolverlas tal como están
    return imageUrl

  } catch (error) {
    console.warn('Invalid image URL:', imageUrl, error)
    return '/placeholder.jpg'
  }
}

/**
 * Verifica si una URL es una imagen válida
 * @param url URL a verificar
 * @returns true si parece ser una URL de imagen válida
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false

  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()

    // Verificar extensiones de imagen comunes
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp']
    return imageExtensions.some(ext => pathname.endsWith(ext))
  } catch {
    // Si no es una URL válida, verificar si es un path relativo con extensión de imagen
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp']
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext))
  }
}

/**
 * Genera múltiples URLs de fallback para una imagen
 * @param primaryUrl URL principal de la imagen
 * @returns Array de URLs de fallback ordenadas por prioridad
 */
export function getImageFallbacks(primaryUrl: string): string[] {
  const fallbacks: string[] = []

  if (primaryUrl) {
    fallbacks.push(getProxiedImageUrl(primaryUrl))
  }

  // Agregar imagen placeholder como último recurso
  fallbacks.push('/placeholder.jpg')

  return fallbacks
}