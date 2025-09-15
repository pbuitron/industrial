import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Construir URL del backend con todos los parámetros
    const backendUrl = new URL('/api/cotizaciones/productos/search', process.env.BACKEND_URL || 'http://localhost:5000')
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value)
    })

    console.log(`🔍 Searching products for quotes: ${backendUrl.toString()}`)

    // Obtener cookies de autenticación
    const cookies = request.headers.get('cookie')

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(cookies && { 'Cookie': cookies })
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      console.error(`❌ Backend error: ${response.status} ${response.statusText}`)
      const errorData = await response.text()
      return NextResponse.json({
        success: false,
        message: `Backend error: ${response.status}`
      }, { status: response.status })
    }

    const data = await response.json()
    console.log(`✅ Products found for quotes: ${data.data?.length || 0} results`)

    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ Product search error:', error)

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

export const runtime = 'nodejs'