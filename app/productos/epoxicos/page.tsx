import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from "@/components/header"
import { SEOBreadcrumb } from "@/components/seo-breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { Wrench, Info, ArrowRight, Ship, Shield, Thermometer, Settings, Hammer } from "lucide-react"

export const metadata: Metadata = {
  title: 'Epóxicos Industriales Bicomponente | Reparación Metal | SealPro',
  description: 'Epóxicos de reparación industrial para aplicaciones mineras expuestas a abrasión, impacto, ataque químico y alta temperatura. Compuestos bicomponente para reconstrucción de equipos críticos en todos los procesos.',
  keywords: 'epóxicos industriales, reparación metal, bicomponente, aplicación minera, celdas de flotación, reparación de chutes, recubrimiento epoxico, compuestos industriales, reconstrucción de equipos, resistencia química',
  openGraph: {
    title: 'Epóxicos de Reparación Industrial | Arcor Epoxy Technologies',
    description: 'Compuestos epóxicos especializados para reparación y reconstrucción de equipos industriales críticos.',
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/productos/epoxicos`,
    siteName: 'SealPro Industrial',
    locale: 'es_PE',
    type: 'website',
  }
}

// Esta función obtendría los productos reales de la API
async function getEpoxicos() {
  try {
    const response = await fetch(`http://localhost:5000/api/products/epoxicos`, {
      next: { revalidate: 3600 } // Cache por 1 hora
    })

    if (response.ok) {
      const result = await response.json()
      return result.success ? result.data : []
    }
  } catch (error) {
    console.error('Error fetching epóxicos:', error)
  }
  return []
}

export default async function EpoxicosPage() {
  const productos = await getEpoxicos()

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
              <Wrench className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Epóxicos de Reparación Arcor</h1>
              <p className="text-xl text-muted-foreground">
                Distribuidores autorizados de Arcor Epoxy Technologies para el Perú
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-muted/30 p-6 rounded-lg flex items-start border border-border">
              <Hammer className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Impacto y Abrasión</h3>
                <p className="text-muted-foreground text-sm">
                  Protección de equipos expuestos a desgaste mecánico severo
                </p>
              </div>
            </div>

            <div className="bg-muted/30 p-6 rounded-lg flex items-start border border-border">
              <Thermometer className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Alta Temperatura</h3>
                <p className="text-muted-foreground text-sm">
                  Resistencia térmica superior para aplicaciones de proceso continuo
                </p>
              </div>
            </div>
            <div className="bg-muted/30 p-6 rounded-lg flex items-start border border-border">
              <Shield className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Resistencia Química</h3>
                <p className="text-muted-foreground text-sm">
                  Protección contra ácidos, bases y solventes industriales agresivos
                </p>
              </div>
            </div>
                        <div className="bg-muted/30 p-6 rounded-lg flex items-start border border-border">
              <Ship className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Aplicación Submarina</h3>
                <p className="text-muted-foreground text-sm">
                  Curado y adhesión efectiva bajo agua en aplicaciones marinas y offshore
                </p>
              </div>

            </div>
          </div>

          {/* Series de Productos */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Líneas de Productos Arcor</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-muted/40 p-4 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-2">Arcor Rebuild</h3>
                <p className="text-muted-foreground text-sm">Sistemas de reparación estructural y reconstrucción de equipos</p>
              </div>
        
              <div className="bg-muted/40 p-4 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-2">Arcor Coating</h3>
                <p className="text-muted-foreground text-sm">Revestimientos anticorrosivos y protección química</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-2">Arcor Chemical </h3>
                <p className="text-muted-foreground text-sm">Soluciones de alta temperatura para procesos industriales</p>
              </div>
                    <div className="bg-muted/40 p-4 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-2">Arcor Marine</h3>
                <p className="text-muted-foreground text-sm">Aplicaciones submarinas y ambientes marinos extremos</p>
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
                        src={producto.image || producto.image_url || '/placeholder.jpg'}
                        alt={producto.name}
                        width={300}
                        height={300}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {producto.generic_type && (
                        <Badge className="absolute top-2 right-2 bg-white text-gray-800">
                          {producto.generic_type}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {producto.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {producto.description || producto.generic_type}
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
                      <Link href={`/productos/epoxicos/${producto._id}`}>
                        Ver Detalles <ArrowRight className="ml-2 h-4 w-4" />
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
                Ver Más Productos ({productos.length - 9} restantes)
              </Button>
            </div>
          )}

          {/* Applications Section */}
          <div className="bg-muted/30 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Aplicaciones Industriales</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Reparación de Tanques</h3>
                <p className="text-sm text-muted-foreground">Sellado y reconstrucción de tanques químicos</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Equipos Industriales</h3>
                <p className="text-sm text-muted-foreground">Reconstrucción de bombas y equipos rotativos</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Protección Marina</h3>
                <p className="text-sm text-muted-foreground">Aplicaciones offshore y submarinas</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Selección Técnica Especializada
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Cada aplicación requiere el epóxico Arcor adecuado. Como distribuidores
                autorizados, nuestros ingenieros te ayudan a seleccionar la formulación
                correcta según temperatura, presión y resistencia química requerida.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Asesoría Técnica WhatsApp
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
            "name": "Epóxicos de Reparación Industrial",
            "description": "Catálogo de epóxicos especializados para reparación industrial",
            "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/productos/epoxicos`,
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": productos.length,
              "itemListElement": productos.slice(0, 9).map((producto: any, index: number) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Product",
                  "name": producto.name,
                  "description": producto.description || producto.generic_type,
                  "category": "Epóxicos de Reparación",
                  "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/productos/epoxicos/${producto._id}`
                }
              }))
            }
          })
        }}
      />
    </>
  )
}