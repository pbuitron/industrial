"use client"

import { useState, useEffect } from "react"
import { use } from 'react'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/header"
import { Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useWhatsAppForm } from "@/hooks/useWhatsAppForm"
import { SEOBreadcrumb } from "@/components/seo-breadcrumb"
import { WhatsAppFormModal } from "@/components/WhatsAppFormModal"

interface Epoxico {
  _id: string
  productId: number
  name: string
  description: string
  generic_type: string
  image_url: string
  product_url: string
  applications: string[]
  isActive: boolean
  specifications?: {
    colors?: string[]
    shelf_life?: string
    mix_ratio?: string
    solids_by_volume?: string
    viscosity?: string
    pot_life?: string
  }
  temperature_resistance?: {
    immersion_max?: string
    dry_max?: string
    immersion_spike?: string
    dry_spike?: string
  }
  special_features?: string[]
}

export default function EpoxicoDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [product, setProduct] = useState<Epoxico | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  const { isModalOpen, currentMessageData, openWhatsAppForm, closeWhatsAppForm, sendToWhatsApp } = useWhatsAppForm()

  const handleQuote = () => {
    if (product) {
      openWhatsAppForm({
        type: 'product_selection',
        data: {
          selectedProducts: [{
            id: product._id,
            name: product.name,
            category: 'Epóxicos',
            specifications: [
              `Tipo: ${product.generic_type}`,
              `Aplicaciones: ${product.applications.join(', ')}`
            ]
          }]
        }
      })
    }
  }

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch(`http://localhost:5000/api/products/epoxicos/${id}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setProduct(result.data)
      } else {
        setError(result.message || 'Producto no encontrado')
      }
    } catch (err) {
      console.error('Error fetching product:', err)
      setError('Error de conexión. Verifica que el servidor esté funcionando.')
    } finally {
      setLoading(false)
    }
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-6xl mx-auto py-12 px-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando producto...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-6xl mx-auto py-12 px-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Producto no encontrado'}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Breadcrumbs para SEO y navegación */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <SEOBreadcrumb productName={product.name} />
      </div>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">{product.name}</h1>
        <p className="text-lg text-muted-foreground mb-6">{product.generic_type}</p>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Imagen con logo superpuesto */}
          <div className="relative w-full md:w-1/2">
            <img src={product.image_url} alt={product.name} className="w-full rounded-lg shadow" />
            <img
              src="/Logo-azul.jpg"
              alt="Industrial IOT Logo"
              className="absolute bottom-2 right-2 w-16 h-auto opacity-80 rounded-sm"
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Descripción</h2>
              <p className="text-sm text-justify text-gray-700">{product.description}</p>
            </div>

            {product.specifications && (
              <div>
                <h2 className="text-2xl font-semibold mb-2">Especificaciones</h2>
                <ul className="text-sm list-disc pl-6 space-y-1">
                  {product.specifications.colors && (
                    <li>Colores disponibles: {product.specifications.colors.join(', ')}</li>
                  )}
                  {product.specifications.shelf_life && (
                    <li>Vida útil: {product.specifications.shelf_life}</li>
                  )}
                  {product.specifications.mix_ratio && (
                    <li>Relación de mezcla: {product.specifications.mix_ratio}</li>
                  )}
                  {product.specifications.solids_by_volume && (
                    <li>Sólidos por volumen: {product.specifications.solids_by_volume}</li>
                  )}
                  {product.specifications.viscosity && (
                    <li>Viscosidad: {product.specifications.viscosity}</li>
                  )}
                  {product.specifications.pot_life && (
                    <li>Vida en envase: {product.specifications.pot_life}</li>
                  )}
                </ul>
              </div>
              
            )}
            <div className="flex gap-2 pt-4">
                      <Link href={`${product.product_url}`} className="flex-1" target="_blank" rel="noopener noreferrer">
                        <Button className="w-full">Ir a la página ARCOR</Button>
                      </Link>
                      
                    </div>
          </div>
        </div>

        {/* Aplicaciones */}
        {product.applications && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Aplicaciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {product.applications.map((app, i) => (
                <div key={i} className="bg-gray-50 p-2 rounded text-sm">{app}</div>
              ))}
            </div>
          </div>
        )}

        {/* Resistencia a la temperatura */}
        {product.temperature_resistance && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Resistencia a la Temperatura</h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <ul className="text-sm space-y-1">
                {product.temperature_resistance.immersion_max && (
                  <li><strong>Inmersión máxima:</strong> {product.temperature_resistance.immersion_max}</li>
                )}
                {product.temperature_resistance.dry_max && (
                  <li><strong>Servicio seco máximo:</strong> {product.temperature_resistance.dry_max}</li>
                )}
                {product.temperature_resistance.immersion_spike && (
                  <li><strong>Inmersión pico:</strong> {product.temperature_resistance.immersion_spike}</li>
                )}
                {product.temperature_resistance.dry_spike && (
                  <li><strong>Seco pico:</strong> {product.temperature_resistance.dry_spike}</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Características especiales */}
        {product.special_features && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Características Especiales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {product.special_features.map((feature, i) => (
                <div key={i} className="bg-gray-50 p-2 rounded text-sm">{feature}</div>
              ))}
            </div>
          </div>
        )}

        {/* Botón de cotización */}
        <div className="mt-8 pt-6 border-t">
          <Button onClick={handleQuote} className="w-full md:w-auto px-8 py-3">
            Solicitar Cotización por WhatsApp
          </Button>
        </div>
      </div>
      
      {/* Modal de formulario WhatsApp */}
      {currentMessageData && (
        <WhatsAppFormModal
          isOpen={isModalOpen}
          onClose={closeWhatsAppForm}
          messageData={currentMessageData}
          onSend={sendToWhatsApp}
        />
      )}
    </div>
  )
}
