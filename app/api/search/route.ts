import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Obtener todos los parámetros de búsqueda
    const params = new URLSearchParams()

    // Lista de parámetros permitidos
    const allowedParams = ['q', 'category', 'application', 'material', 'limit', 'page', 'sortBy', 'sortOrder']

    allowedParams.forEach(param => {
      const value = searchParams.get(param)
      if (value) {
        params.set(param, value)
      }
    })

    // Construir URL del backend
    const backendUrl = new URL('/api/search', 'http://localhost:5000')
    params.forEach((value, key) => {
      backendUrl.searchParams.set(key, value)
    })

    console.log(`🔍 Fetching search results from: ${backendUrl.toString()}`)

    // Hacer petición al backend con timeout
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Timeout de 10 segundos
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      console.error(`❌ Backend search error: ${response.status} ${response.statusText}`)
      return NextResponse.json({
        success: false,
        message: `Backend error: ${response.status}`
      }, { status: response.status })
    }

    const data = await response.json()
    console.log(`✅ Search completed: ${data.data?.totalResults || 0} total results`)

    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ Search error:', error)

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        message: 'Request timeout'
      }, { status: 408 })
    }

    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

// Configuración para usar Node.js runtime
export const runtime = 'nodejs'