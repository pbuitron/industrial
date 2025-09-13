"use client"

import Link from 'next/link'
import { Header } from "@/components/header"
import { SEOBreadcrumb } from "@/components/seo-breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Settings, Wrench, Package } from "lucide-react"

interface CategoryCard {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  badge: string
  features: string[]
}

const categories: CategoryCard[] = [
  {
    title: "Abrazaderas Industriales",
    description: "Conexiones y reparaciones de tuberías de alta presión para aplicaciones críticas en petroquímica y manufactura.",
    href: "/productos/abrazaderas",
    icon: <Settings className="h-8 w-8" />,
    badge: "Alta Presión",
    features: [
      "Acero Inoxidable 316L",
      "Certificación ASME B31.3",
      "Hasta 16 bar de presión",
      "Aplicación sin soldadura"
    ]
  },
  {
    title: "Epóxicos de Reparación",
    description: "Compuestos bicomponente para reparación y reconstrucción de equipos industriales en condiciones extremas.",
    href: "/productos/epoxicos",
    icon: <Wrench className="h-8 w-8" />,
    badge: "Resistencia Química",
    features: [
      "Aplicación submarina",
      "Resistencia térmica superior",
      "Reparación de metal",
      "Curado rápido"
    ]
  },
  {
    title: "Kits de Reparación",
    description: "Soluciones completas de emergencia para mantenimiento predictivo y reparaciones temporales en campo.",
    href: "/productos/kits",
    icon: <Package className="h-8 w-8" />,
    badge: "Emergencia",
    features: [
      "Reparación inmediata",
      "Kit completo portátil",
      "Sellado temporal",
      "Fácil aplicación"
    ]
  }
]

export default function ProductosPage() {
  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <SEOBreadcrumb />
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Productos Industriales Certificados
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Soluciones industriales de alta calidad para petroquímica, manufactura y mantenimiento. 
              Certificaciones internacionales y soporte técnico especializado.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="text-sm">Certificación ASME</Badge>
              <Badge variant="secondary" className="text-sm">Soporte 24/7</Badge>
              <Badge variant="secondary" className="text-sm">Envío Nacional</Badge>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {categories.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      {category.icon}
                    </div>
                    <Badge variant="outline">{category.badge}</Badge>
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <CardDescription className="text-base">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {category.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full group-hover:bg-primary group-hover:text-white">
                    <Link href={category.href}>
                      Ver Productos <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center bg-muted/50 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">
              ¿Necesitas Asesoría Técnica Especializada?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Nuestro equipo de ingenieros te ayuda a seleccionar la solución ideal 
              para tu aplicación específica. Cotización personalizada en 24 horas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  const message = encodeURIComponent("Hola, me interesa solicitar asesoría técnica especializada para productos industriales. ¿Podrían ayudarme?")
                  window.open(`https://wa.me/51936312086?text=${message}`, '_blank')
                }}
              >
                Solicitar Asesoría por WhatsApp
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/search">Buscar Productos</Link>
              </Button>
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
            "name": "Productos Industriales SealPro",
            "description": "Catálogo completo de productos industriales certificados",
            "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/productos`,
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": categories.length,
              "itemListElement": categories.map((category, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Product",
                  "name": category.title,
                  "description": category.description,
                  "category": "Productos Industriales",
                  "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${category.href}`
                }
              }))
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
                }
              ]
            }
          })
        }}
      />
    </>
  )
}