import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = searchParams.get('limit') || '8'

    // Validar parámetros
    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Construir URL del backend
    const backendUrl = new URL('/api/search/suggestions', 'http://localhost:5000')
    backendUrl.searchParams.set('q', query.trim())
    backendUrl.searchParams.set('limit', limit)

    console.log(`🔍 Fetching suggestions from: ${backendUrl.toString()}`)

    // Hacer petición al backend con timeout
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Timeout de 5 segundos
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) {
      console.error(`❌ Backend error: ${response.status} ${response.statusText}`)
      return NextResponse.json({
        success: false,
        message: `Backend error: ${response.status}`
      }, { status: response.status })
    }

    const data = await response.json()
    console.log(`✅ Suggestions fetched: ${data.data?.length || 0} results`)

    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ Search suggestions error:', error)

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