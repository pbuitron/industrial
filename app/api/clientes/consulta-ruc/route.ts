import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendUrl = new URL('/api/clientes/consulta-ruc', 'http://localhost:5000')
    const cookies = request.headers.get('cookie')

    console.log(`🔍 Consulting RUC: ${body.ruc}`)

    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(cookies && { 'Cookie': cookies })
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000) // RUC queries can take longer
    })

    if (!response.ok) {
      console.error(`❌ RUC consultation error: ${response.status} ${response.statusText}`)
      const errorData = await response.json().catch(() => ({
        success: false,
        message: `Error ${response.status}: ${response.statusText}`
      }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()

    if (data.success) {
      console.log(`✅ RUC consultation successful: ${data.data?.razonSocial || 'New client data'}`)
    } else {
      console.log(`⚠️ RUC consultation failed: ${data.message}`)
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ RUC consultation error:', error)

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        message: 'La consulta RUC tardó demasiado. Intente nuevamente.'
      }, { status: 408 })
    }

    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor al consultar RUC'
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'