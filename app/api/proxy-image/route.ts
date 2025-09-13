import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Validar que la URL sea válida y de un dominio permitido
    let url: URL
    try {
      url = new URL(imageUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Lista de dominios permitidos para mayor seguridad
    const allowedDomains = [
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

    const isAllowedDomain = allowedDomains.some(domain =>
      url.hostname === domain || url.hostname.endsWith('.' + domain)
    )

    if (!isAllowedDomain) {
      console.warn(`🚫 Blocked domain: ${url.hostname}`)
      return NextResponse.json(
        { error: 'Domain not allowed' },
        { status: 403 }
      )
    }

    console.log(`📡 Proxying image from: ${imageUrl}`)

    // Realizar la petición a la imagen externa
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      // Timeout de 10 segundos
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      console.error(`❌ Failed to fetch image: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type')

    // Verificar que sea realmente una imagen
    if (!contentType?.startsWith('image/')) {
      console.warn(`⚠️ Invalid content type: ${contentType}`)
      return NextResponse.json(
        { error: 'Not an image' },
        { status: 400 }
      )
    }

    const imageBuffer = await response.arrayBuffer()

    console.log(`✅ Image proxied successfully: ${imageBuffer.byteLength} bytes, type: ${contentType}`)

    // Devolver la imagen con las cabeceras apropiadas
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache por 24 horas
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    console.error('❌ Proxy image error:', error)

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 408 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Configuración para Edge Runtime (opcional, para mejor performance)
export const runtime = 'nodejs' // Usamos nodejs para mayor compatibilidad