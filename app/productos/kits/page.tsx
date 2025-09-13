import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from "@/components/header"
import { SEOBreadcrumb } from "@/components/seo-breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { Package, Info, ArrowRight, Clock, Wrench, AlertTriangle } from "lucide-react"

export const metadata: Metadata = {
  title: 'Kits de Reparación Industrial | Emergencia y Mantenimiento | SealPro',
  description: 'Kits completos de reparación para emergencias industriales. Sellado temporal, reparación inmediata de fugas, mantenimiento predictivo portátil.',
  keywords: 'kits reparación industrial, emergencia, sellado temporal, reparación fugas, mantenimiento predictivo, kit portátil, offshore',
  openGraph: {
    title: 'Kits de Reparación Industrial | SealPro',
    description: 'Soluciones completas para reparaciones de emergencia y mantenimiento industrial.',
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/productos/kits`,
    siteName: 'SealPro Industrial',
    locale: 'es_MX',
    type: 'website',
  }
}

// Esta función obtendría los productos reales de la API
async function getKits() {
  try {
    const response = await fetch(`http://localhost:5000/api/products/kits`, {
      next: { revalidate: 3600 } // Cache por 1 hora
    })
    
    if (response.ok) {
      const result = await response.json()
      return result.success ? result.data : []
    }
  } catch (error) {
    console.error('Error fetching kits:', error)
  }
  return []
}

export default async function KitsPage() {
  const productos = await getKits()

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <SEOBreadcrumb />
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-lg bg-primary/10 text-primary mr-4">
              <Package className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Kits de Reparación</h1>
              <p className="text-xl text-muted-foreground">
                Soluciones completas para emergencias y mantenimiento industrial
              </p>
            </div>
          </div>

          {/* Emergency Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-muted/30 p-6 rounded-lg flex items-start border border-border">
              <AlertTriangle className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Reparación Inmediata</h3>
                <p className="text-muted-foreground text-sm">
                  Solución temporal efectiva para fugas críticas sin parada de proceso
                </p>
              </div>
            </div>
            <div className="bg-muted/30 p-6 rounded-lg flex items-start border border-border">
              <Clock className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Instalación Rápida</h3>
                <p className="text-muted-foreground text-sm">
                  Aplicación en minutos sin herramientas especializadas
                </p>
              </div>
            </div>
            <div className="bg-muted/30 p-6 rounded-lg flex items-start border border-border">
              <Wrench className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Kit Completo</h3>
                <p className="text-muted-foreground text-sm">
                  Incluye todos los componentes necesarios para la reparación
                </p>
              </div>
            </div>
          </div>

          {/* Kit Types */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Tipos de Kits Especializados</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-muted/40 p-6 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-3">Kits de Emergencia</h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>• Sellado temporal de fugas</li>
                  <li>• Reparación sin parada</li>
                  <li>• Portátil y compacto</li>
                  <li>• Aplicación inmediata</li>
                </ul>
              </div>
              <div className="bg-muted/40 p-6 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-3">Kits de Mantenimiento</h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>• Mantenimiento predictivo</li>
                  <li>• Reparaciones programadas</li>
                  <li>• Múltiples aplicaciones</li>
                  <li>• Vida útil extendida</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Productos Grid */}
          {productos.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {productos.slice(0, 9).map((producto: any) => (
                <Card key={producto._id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="aspect-square relative mb-4 bg-gray-100 rounded-md overflow-hidden">
                      <OptimizedImage
                        src={producto.image || '/placeholder-product.jpg'}
                        alt={producto.name}
                        width={300}
                        height={300}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-2 right-2 bg-primary text-white">
                        Kit Completo
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {producto.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {producto.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {producto.applications && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {producto.applications.slice(0, 2).map((app: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {app}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button asChild className="w-full">
                      <Link href={`/productos/kits/${producto._id}`}>
                        Ver Kit Completo <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Los productos están siendo cargados. Si el problema persiste, 
                verifica que el servidor esté funcionando correctamente.
              </AlertDescription>
            </Alert>
          )}

          {productos.length > 9 && (
            <div className="text-center">
              <Button variant="outline" size="lg">
                Ver Más Kits ({productos.length - 9} restantes)
              </Button>
            </div>
          )}

          {/* Industry Applications */}
          <div className="bg-muted/30 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Aplicaciones por Industria</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Petroquímica</h3>
                <p className="text-sm text-muted-foreground">Emergencias en refinerías</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Offshore</h3>
                <p className="text-sm text-muted-foreground">Plataformas marinas</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Manufactura</h3>
                <p className="text-sm text-muted-foreground">Líneas de producción</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Utilities</h3>
                <p className="text-sm text-muted-foreground">Servicios críticos</p>
              </div>
            </div>
          </div>

          {/* Emergency Response */}
          <div className="bg-muted/40 border border-border rounded-lg p-8 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="h-8 w-8 text-primary mr-4 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Respuesta de Emergencia 24/7
                </h2>
                <p className="text-muted-foreground mb-4">
                  Cuando cada minuto cuenta, nuestros kits de emergencia proporcionan
                  soluciones inmediatas para situaciones críticas. Disponibles para
                  entrega urgente en cualquier momento.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-primary hover:bg-primary/90 text-white">
                    Emergencia WhatsApp 24/7
                  </Button>
                  <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                    Ubicaciones de Stock
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Planificación de Mantenimiento
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Mantén kits de reparación estratégicos en tus instalaciones. 
                Te ayudamos a diseñar un programa de mantenimiento preventivo 
                con los kits adecuados para tu operación.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Consulta de Inventario
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/productos">Ver Otras Categorías</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Schema markup para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "CollectionPage",
            "name": "Kits de Reparación Industrial",
            "description": "Catálogo de kits completos para reparaciones industriales",
            "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/productos/kits`,
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": productos.length,
              "itemListElement": productos.slice(0, 9).map((producto: any, index: number) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Product",
                  "name": producto.name,
                  "description": producto.description,
                  "category": "Kits de Reparación",
                  "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/productos/kits/${producto._id}`
                }
              }))
            }
          })
        }}
      />
    </>
  )
}