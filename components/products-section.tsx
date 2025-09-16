"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Wrench, Droplets, Shield, Search, Loader2 } from "lucide-react"
import { useWhatsAppForm } from "@/hooks/useWhatsAppForm"
import { WhatsAppFormModal } from "@/components/WhatsAppFormModal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OptimizedImage } from "@/components/ui/optimized-image"

interface Product {
  _id?: string
  id?: number
  productId?: number
  name: string
  description: string
  image?: string
  image_url?: string
  specs?: string[]
  applications?: string[]
  isActive?: boolean
}


export function ProductsSection() {
  const [activeTab, setActiveTab] = useState("abrazaderas")
  const [abrazaderas, setAbrazaderas] = useState<Product[]>([])
  const [kits, setKits] = useState<Product[]>([])
  const [epoxicos, setEpoxicos] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isModalOpen, currentMessageData, openWhatsAppForm, closeWhatsAppForm, sendToWhatsApp } = useWhatsAppForm()

  useEffect(() => {
    async function fetchAllProducts() {
      try {
        setLoading(true)
        setError(null)

        // Usar URL relativa que funciona para ambos dominios
        const apiUrl = '/api'
        console.log('API URL being used:', apiUrl) // Para debugging

        const [abrazaderasRes, kitsRes, epoxicosRes] = await Promise.all([
          fetch(`${apiUrl}/products/abrazaderas`),
          fetch(`${apiUrl}/products/kits`),
          fetch(`${apiUrl}/products/epoxicos`)
        ])

        if (!abrazaderasRes.ok || !kitsRes.ok || !epoxicosRes.ok) {
          throw new Error('Error al cargar algunos productos')
        }

        const [abrazaderasData, kitsData, epoxicosData] = await Promise.all([
          abrazaderasRes.json(),
          kitsRes.json(),
          epoxicosRes.json()
        ])

        if (abrazaderasData.success && Array.isArray(abrazaderasData.data)) {
          setAbrazaderas(abrazaderasData.data.filter((p: Product) => p.isActive !== false).slice(0, 6))
        }
        if (kitsData.success && Array.isArray(kitsData.data)) {
          setKits(kitsData.data.filter((p: Product) => p.isActive !== false).slice(0, 4))
        }
        if (epoxicosData.success && Array.isArray(epoxicosData.data)) {
          setEpoxicos(epoxicosData.data.filter((p: Product) => p.isActive !== false).slice(0, 4))
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchAllProducts()
  }, [])

  const handleQuoteClick = (product: Product, category: string) => {
    openWhatsAppForm({
      type: 'quote',
      data: {
        message: `Me interesa solicitar una cotización para el producto: ${product.name} (${category}).`
      }
    })
  }

  if (loading) {
    return (
      <section id="productos" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando productos...</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="productos" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertDescription>
              Error al cargar productos: {error}. 
              Verifica que el servidor esté funcionando correctamente
            </AlertDescription>
          </Alert>
        </div>
      </section>
    )
  }

  return (
    <section id="productos" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Nuestros Productos</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Soluciones técnicas especializadas para cada necesidad industrial. Calidad certificada y respaldo técnico
            garantizado.
          </p>
          <Link href="/search" className="group inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-all duration-300 font-medium hover:gap-3">
            <Search className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
            Búsqueda Avanzada de Productos
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-12">
            <TabsTrigger value="abrazaderas" className="group flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
              <Wrench className="h-4 w-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" /> Abrazaderas
            </TabsTrigger>
            <TabsTrigger value="kits" className="group flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
              <Droplets className="h-4 w-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" /> Kits de Reparación
            </TabsTrigger>
            <TabsTrigger value="epoxicos" className="group flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
              <Shield className="h-4 w-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" /> Epóxicos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="abrazaderas">
            <div className="grid md:grid-cols-3 gap-8">
              {abrazaderas.map((product) => (
  <Card key={product._id || product.id} className="group overflow-hidden hover:shadow-xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2 border-border hover:border-primary/30">
    <div className="aspect-video bg-muted overflow-hidden">
      <OptimizedImage
        src={product.image || '/placeholder.jpg'}
        alt={product.name}

        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
    </div>
    <CardHeader>
      <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">{product.name}</CardTitle>
      <CardDescription className="text-base group-hover:text-foreground transition-colors duration-300">{product.description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">Especificaciones:</h4>
        <div className="relative">
          <ul className="text-sm text-muted-foreground space-y-1 overflow-hidden line-clamp-1">
            {product.specs?.map((spec, index) => (
              <li key={index}>• {spec}</li>
            ))}
          </ul>
          {/* Overlay para el "...más" */}
          <div
            className="absolute bottom-0 right-0 bg-white/70 px-1 cursor-pointer text-sm text-primary font-medium hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-tl-md"
            onClick={() => window.location.href = `/productos/abrazaderas/${product._id || product.id}`}
          >
            ...más
          </div>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Aplicaciones:</h4>
        <div className="flex flex-wrap gap-2">
          {product.applications?.map((app, index) => (
            <Badge key={index} variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors duration-300 cursor-default">
              {app}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Link href={`/productos/abrazaderas/${product._id || product.id}`} className="flex-1">
          <Button className="w-full group/btn hover:shadow-lg hover:shadow-primary/25 transition-all duration-300">
            Ver Detalles <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
          </Button>
        </Link>
        <Button variant="outline" onClick={() => handleQuoteClick(product, 'Abrazaderas')} className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 hover:shadow-md">Cotizar</Button>
      </div>
    </CardContent>
  </Card>
))}


            </div>
          </TabsContent>
          <TabsContent value="kits">
            <div className="grid md:grid-cols-2 gap-8">
              {kits.map((product) => (
                <Card key={product._id || product.id} className="group overflow-hidden hover:shadow-xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2 border-border hover:border-primary/30">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <OptimizedImage
                      src={product.image || '/placeholder.jpg'}
                      alt={product.name}
                      width={400}
                      height={225}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">{product.name}</CardTitle>
                    <CardDescription className="text-base group-hover:text-foreground transition-colors duration-300">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <h4 className="font-semibold mb-2">Aplicaciones:</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.applications?.map((app, index) => (
                        <Badge key={index} variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors duration-300 cursor-default">
                          {app}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Link href={`/productos/kits/${product._id || product.id}`} className="flex-1">
                        <Button className="w-full group/btn hover:shadow-lg hover:shadow-primary/25 transition-all duration-300">
                          Ver Detalles <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </Button>
                      </Link>
                      <Button variant="outline" onClick={() => handleQuoteClick(product, 'Kits de Reparación')} className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 hover:shadow-md">Cotizar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="epoxicos">
            <div className="grid md:grid-cols-2 gap-8">
              {epoxicos.map((product) => (
                <Card key={product._id || product.id} className="group overflow-hidden hover:shadow-xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2 border-border hover:border-primary/30">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <OptimizedImage
                      src={product.image || product.image_url || '/placeholder.jpg'}
                      alt={product.name}
                      width={400}
                      height={225}
                      className="absolute inset-0 w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">{product.name}</CardTitle>
                    <CardDescription className="text-base group-hover:text-foreground transition-colors duration-300">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <h4 className="font-semibold mb-2">Aplicaciones:</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.applications?.map((app, index) => (
                        <Badge key={index} variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors duration-300 cursor-default">
                          {app}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Link href={`/productos/epoxicos/${product._id || product.id}`} className="flex-1">
                        <Button className="w-full group/btn hover:shadow-lg hover:shadow-primary/25 transition-all duration-300">
                          Ver Detalles <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </Button>
                      </Link>
                      <Button variant="outline" onClick={() => handleQuoteClick(product, 'Epóxicos')} className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 hover:shadow-md">Cotizar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

        </Tabs>
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
    </section>
  )
}
