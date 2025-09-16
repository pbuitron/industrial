/**
 * Configuración dinámica de API basada en el dominio actual
 * Esto soluciona el problema de www vs no-www
 */

export function getApiUrl(): string {
  // En el servidor (SSR), usar la URL de producción por defecto
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://industrial-iot.us/api'
  }

  // En el cliente, usar el dominio actual para evitar problemas CORS
  const currentHost = window.location.hostname
  const protocol = window.location.protocol

  // Mapear dominios a APIs correspondientes
  const apiMapping: Record<string, string> = {
    'industrial-iot.us': 'https://industrial-iot.us/api',
    'www.industrial-iot.us': 'https://www.industrial-iot.us/api',
    'localhost': 'http://localhost:3001/api'
  }

  return apiMapping[currentHost] || `${protocol}//${currentHost}/api`
}

export function getBaseUrl(): string {
  // En el servidor (SSR), usar la URL base de producción
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://industrial-iot.us'
  }

  // En el cliente, usar el dominio actual
  return `${window.location.protocol}//${window.location.hostname}${
    window.location.port ? `:${window.location.port}` : ''
  }`
}

/**
 * Hook para obtener la configuración de API en componentes React
 */
export function useApiConfig() {
  return {
    apiUrl: getApiUrl(),
    baseUrl: getBaseUrl()
  }
}