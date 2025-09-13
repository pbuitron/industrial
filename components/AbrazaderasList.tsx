"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { Info, ArrowRight, Loader2 } from "lucide-react"

interface Abrazadera {
  _id: string
  productId: number
  name: string
  description: string
  details: string
  image: string
  specs: string[]
  applications: string[]
  materials: string[]
  isActive: boolean
}

export function AbrazaderasList() {
  const [productos, setProductos] = useState<Abrazadera[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAbrazaderas() {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔄 Fetching abrazaderas...')
        const response = await fetch('http://localhost:5000/api/products/abrazaderas')
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('📦 API Response:', result)
        
        if (result.success && Array.isArray(result.data)) {
          setProductos(result.data.filter((p: Abrazadera) => p.isActive !== false))
          console.log(`✅ Loaded ${result.data.length} abrazaderas`)
        } else {
          throw new Error('Invalid API response structure')
        }
      } catch (err) {
        console.error('❌ Error fetching abrazaderas:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchAbrazaderas()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando productos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Error al cargar productos: {error}. 
          Verifica que el servidor esté funcionando en http://localhost:5000
        </AlertDescription>
      </Alert>
    )
  }

  if (productos.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No se encontraron productos activos en la categoría de abrazaderas.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {productos.slice(0, 9).map((producto) => (
          <Card key={producto._id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="aspect-square relative mb-4 bg-gray-100 rounded-md overflow-hidden">
                <OptimizedImage
                  src={producto.image || '/placeholder.jpg'}
                  alt={producto.name}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={() => console.warn(`Failed to load image for ${producto.name}:`, producto.image)}
                />
                {producto.materials && producto.materials.length > 0 && (
                  <Badge className="absolute top-2 right-2 bg-white text-gray-800">
                    {producto.materials[0]}
                  </Badge>
                )}
                {/* Fallback badge si no hay materials */}
                {(!producto.materials || producto.materials.length === 0) && (
                  <Badge className="absolute top-2 right-2 bg-blue-600 text-white">
                    Acero Inox.
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {producto.name}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {producto.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {producto.applications && producto.applications.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {producto.applications.slice(0, 4).map((app: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {app}
                    </Badge>
                  ))}
                </div>
              )}
              <Button asChild className="w-full">
                <Link href={`/productos/abrazaderas/${producto._id}`}>
                  Ver Detalles <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {productos.length > 9 && (
        <div className="text-center">
          <Button variant="outline" size="lg">
            Ver Más Productos ({productos.length - 9} restantes)
          </Button>
        </div>
      )}
    </>
  )
}