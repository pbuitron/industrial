import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from "@/components/header"
import { SEOBreadcrumb } from "@/components/seo-breadcrumb"
import { Button } from "@/components/ui/button"
import { AbrazaderasList } from "@/components/AbrazaderasList"
import { Settings } from "lucide-react"

export const metadata: Metadata = {
  title: 'Abrazaderas Industriales Alta Presión | Acero Inoxidable 316L | SealPro',
  description: 'Abrazaderas industriales certificadas ASME para reparación de tuberías sin soldadura. Acero inoxidable 316L, hasta 16 bar. Petroquímica y manufactura.',
  keywords: 'abrazaderas industriales, acero inoxidable 316L, alta presión, ASME B31.3, reparación tuberías, conexiones industriales, petroquímica',
  openGraph: {
    title: 'Abrazaderas Industriales | SealPro',
    description: 'Abrazaderas certificadas para aplicaciones de alta presión en la industria petroquímica.',
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/productos/abrazaderas`,
    siteName: 'SealPro Industrial',
    locale: 'es_MX',
    type: 'website',
  }
}

export default function AbrazaderasPage() {

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
              <Settings className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Abrazaderas Industriales</h1>
              <p className="text-xl text-muted-foreground">
                Soluciones certificadas para conexiones de alta presión
              </p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-muted/30 p-6 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">Certificación ASME</h3>
              <p className="text-muted-foreground text-sm">
                Cumplimiento con norma ASME B31.3 para aplicaciones de proceso
              </p>
            </div>
            <div className="bg-muted/30 p-6 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">Sin Soldadura</h3>
              <p className="text-muted-foreground text-sm">
                Instalación rápida sin necesidad de soldadura o parada de proceso
              </p>
            </div>
            <div className="bg-muted/30 p-6 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">Alta Presión</h3>
              <p className="text-muted-foreground text-sm">
                Resistencia hasta 16 bar en aplicaciones industriales críticas
              </p>
            </div>
          </div>

          {/* Productos Grid */}
          <AbrazaderasList />

          {/* CTA Section */}
          <div className="bg-muted/50 rounded-lg p-8 mt-12">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">
                ¿No Encuentras la Abrazadera Adecuada?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Nuestros ingenieros te ayudan a seleccionar la solución perfecta 
                para tus especificaciones de presión, material y aplicación.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Consulta Técnica por WhatsApp
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
            "name": "Abrazaderas Industriales",
            "description": "Catálogo de abrazaderas industriales certificadas ASME",
            "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/productos/abrazaderas`,
            "mainEntity": {
              "@type": "ItemList",
              "name": "Abrazaderas Industriales",
              "description": "Productos certificados para conexiones de alta presión"
            },
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Inicio",
                  "item": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/`
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Productos",
                  "item": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/productos`
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Abrazaderas",
                  "item": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/productos/abrazaderas`
                }
              ]
            }
          })
        }}
      />
    </>
  )
}