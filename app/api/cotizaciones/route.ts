import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Construir URL del backend con todos los parámetros
    const backendUrl = new URL('/api/cotizaciones', process.env.BACKEND_URL || 'http://localhost:5000')
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value)
    })

    console.log(`🔍 Fetching cotizaciones from: ${backendUrl.toString()}`)

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
    console.log(`✅ Cotizaciones fetched: ${data.data?.cotizaciones?.length || 0} results`)

    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ Cotizaciones fetch error:', error)

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendUrl = new URL('/api/cotizaciones', process.env.BACKEND_URL || 'http://localhost:5000')
    const cookies = request.headers.get('cookie')

    console.log(`📝 Creating cotización...`)

    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(cookies && { 'Cookie': cookies })
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      console.error(`❌ Backend error: ${response.status} ${response.statusText}`)
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    console.log(`✅ Cotización created: ${data.data?.numeroCotizacion}`)

    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ Cotización creation error:', error)

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