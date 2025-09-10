/*"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Wrench, Droplets, Shield } from "lucide-react"

const products = {
  abrazaderas: [
    {
      id: 1,
      name: "Conector Multifuncional de Tuberias - SEALPRO A",
      description: 'Acople flexible tipo Slip - DN20 a DN500 - 3/4" a 20"',
      image: "/sealproA.webp",
      specs: ["Material: Acero inoxidable 304 / 316", "Presión: Hasta 25 BAR", "Temperatura: -20°C a 250°C"],
      applications: ["Petroquímica", "Minería", "Tratamiento de agua", "Energía", "industria quimica"],
    },
    {
      id: 2,
      name: "Conector con anillo dentado - SEALPRO B",
      description: 'Acople flexible tipo Slip dentado - DN20 a DN500 3/4" a 20"',
      image: "/sealproB.jpg",
      specs: ["Material: Acero inoxidable 304 / 316", "Presión: Hasta 30 BAR", "Temperatura: -20°C a 250°C (Vitón / NBR)"],
      applications: ["Petroquímica", "Minería", "Tratamiento de agua", "Energía"],
    },
    {
      id: 3,
      name: "Abrazadera de reparacion -  One Clip - SEALPRO C",
      description: 'Repara fugas activas - DN25 a DN500 1" a 20"',
      image: "/sealproC.jpg",
      specs: ["Material: Acero inoxidable 304 / 316", "Presión: Hasta 30 BAR", "Temperatura: -40°C a 250°C (Vitón / NBR)"],
      applications: ["Petroquímica", "Minería", "Tratamiento de agua"],
    },
    {
      id: 4,
      name: "Abrazadera de reparacion -  Double Clip - SEALPRO D",
      description: '"Acople y reparación de fugas - DN50 a DN1000 2" a 40"',
      image: "/sealproD.jpg",
      specs: ["Material: Acero inoxidable 304 / 316", "Presión: Hasta 30 BAR", "Temperatura: -40°C a 250°C (Vitón / NBR)"],
      applications: ["Mantenimiento", "Reparaciones urgentes", "Instalaciones temporales"],
    },
    {
      id: 5,
      name: "Abrazadera de reparacion -  Simple Plate - SEALPRO E",
      description: '"Diseñado para reparar microfugas y fisuras',
      image: "/sealproE.jpg",
      specs: ["Material: Acero inoxidable 304 / 316", "Presión: Hasta 16 BAR", "Temperatura: -30°C a 130°C (EPDM)"],
      applications: ["Mantenimiento", "Reparaciones urgentes", "Instalaciones temporales", "Tratamiento de agua"],
    },
    {
      id: 6,
      name: "Abrazadera de reparacion de codos - SEALPRO CE",
      description: '"Principalmente para reparar codos - DN25 a DN300 1" a 12"',
      image: "/sealproCE.jpg",
      specs: ["Material: Acero inoxidable 304 / 316", "Presión: Hasta 16 BAR", "Temperatura: -30°C a 130°C (EPDM)"],
      applications: ["Mantenimiento", "Reparaciones urgentes", "Instalaciones temporales", "reparación de codos"],
    },
  ],
  kits: [
    {
      id: 7,
      name: "Kit Reparación de Fugas con presión - Sealpro",
      description: "Kit completo para reparación de fugas en tuberías en 15 minutos",
      image: "/pipe-leak-repair-kit-professional-tools.jpg",
      specs: ["Incluye:", '1 rollo de fibra de vidrio con resina epóxica (2" - 4" - 6")', '1 rollo de cinta autovulcanizante (1" - 2")', "1 Barra epoxica de curado rápido", "Guantes e instructivo", "Tiempo aplicación: 15 minutos", "Resistencia: 450 PSI", "Duración: Permanente"],
      applications: ["Fugas activas", "Mantenimiento preventivo", "Emergencias industriales"],
    },
    {
      id: 8,
      name: "Kit Reparación de Fugas sin presión - SealPRO",
      description: "Solución rápida para sellado temporal de fugas",
      image: "/temporary-pipe-sealing-kit-industrial.jpg",
      specs: ["Incluye:", '1 rollo de fibra de vidrio con resina epóxica (2" - 4" - 6")', "1 Barra epoxica de curado rápido", "Guantes e instructivo", "Tiempo aplicación: 15 minutos", "Resistencia: 450 PSI", "Duración: Permanente"],

      applications: ["Reparaciones temporales", "Paradas de planta", "Mantenimiento programado"],
    },
  ],
  epoxicos: [
    {
      id: 9,
      name: "Epóxico MetalShield Pro",
      description: "Recubrimiento epóxico de alta resistencia para metales",
      image: "/industrial-epoxy-coating-metal-protection.jpg",
      specs: ["Espesor: 200-500 micrones", "Curado: 24 horas", "Resistencia química: Excelente"],
      applications: ["Tanques de almacenamiento", "Estructuras marinas", "Equipos químicos"],
    },
    {
      id: 10,
      name: "Epóxico Reparación Rápida",
      description: "Epóxico de curado rápido para reparaciones urgentes",
      image: "/fast-curing-epoxy-repair-compound-industrial.jpg",
      specs: ["Curado: 30 minutos", "Temperatura aplicación: 5°C a 40°C", "Adherencia: 25 MPa"],
      applications: ["Reparaciones de emergencia", "Mantenimiento correctivo", "Sellado de grietas"],
    },
  ],
}

export function ProductsSection() {
  const [activeTab, setActiveTab] = useState("abrazaderas")

  return (
    <section id="productos" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 text-balance">Nuestros Productos</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Soluciones técnicas especializadas para cada necesidad industrial. Calidad certificada y respaldo técnico
            garantizado.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-12">
            <TabsTrigger value="abrazaderas" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Abrazaderas
            </TabsTrigger>
            <TabsTrigger value="kits" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Kits de Reparación
            </TabsTrigger>
            <TabsTrigger value="epoxicos" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Epóxicos
            </TabsTrigger>
          </TabsList>

          {Object.entries(products).map(([category, items]) => (
            <TabsContent key={category} value={category}>
              <div className="grid md:grid-cols-2 gap-8">
                {items.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-muted">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      <CardDescription className="text-base">{product.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Especificaciones:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {product.specs.map((spec, index) => (
                            <li key={index}>• {spec}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Aplicaciones:</h4>
                        <div className="flex flex-wrap gap-2">
                          {product.applications.map((app, index) => (
                            <Badge key={index} variant="secondary">
                              {app}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        
                          <Link href={`/productos/${product.id}`}>
                            <Button className="flex-1">
                              Ver Detalles
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        
                        <Button variant="outline">Cotizar</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}

*/

"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Wrench, Droplets, Shield } from "lucide-react"
import { products } from "@/lib/products"   // ⬅️ importamos desde /lib

export function ProductsSection() {
  const [activeTab, setActiveTab] = useState("abrazaderas")

  return (
    <section id="productos" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 text-balance">Nuestros Productos</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Soluciones técnicas especializadas para cada necesidad industrial. Calidad certificada y respaldo técnico
            garantizado.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-12">
            <TabsTrigger value="abrazaderas" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Abrazaderas
            </TabsTrigger>
            <TabsTrigger value="kits" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Kits de Reparación
            </TabsTrigger>
            <TabsTrigger value="epoxicos" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Epóxicos
            </TabsTrigger>
          </TabsList>

          {Object.entries(products).map(([category, items]) => (
            <TabsContent key={category} value={category}>
              <div className="flex justify-center">
              <div className="  grid md:grid-cols-3 gap-8">
                {items.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-muted">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      <CardDescription className="text-base">{product.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Especificaciones:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {product.specs.map((spec, index) => (
                            <li key={index}>• {spec}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Aplicaciones:</h4>
                        <div className="flex flex-wrap gap-2">
                          {product.applications.map((app, index) => (
                            <Badge key={index} variant="secondary">
                              {app}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Link href={`/productos/${product.id}`} className="flex-1">
                          <Button className="w-full">
                            Ver Detalles
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline">Cotizar</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}
