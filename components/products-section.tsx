"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Wrench, Droplets, Shield, Search } from "lucide-react"
import { useWhatsAppForm } from "@/hooks/useWhatsAppForm"
import { WhatsAppFormModal } from "@/components/WhatsAppFormModal"

// Importa los datos
import abrazaderas from "@/data/abrazaderas.json"
import kits from "@/data/kits.json"
import epoxicos from "@/data/epoxicos.json"


export function ProductsSection() {
  const [activeTab, setActiveTab] = useState("abrazaderas")
  const { isModalOpen, currentMessageData, openWhatsAppForm, closeWhatsAppForm, sendToWhatsApp } = useWhatsAppForm()

  const handleQuoteClick = (product: any, category: string) => {
    openWhatsAppForm({
      type: 'quote',
      data: {
        message: `Me interesa solicitar una cotización para el producto: ${product.name} (${category}).`
      }
    })
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
          <Link href="/search" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium">
            <Search className="h-4 w-4" />
            Búsqueda Avanzada de Productos
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-12">
            <TabsTrigger value="abrazaderas" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Abrazaderas
            </TabsTrigger>
            <TabsTrigger value="kits" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" /> Kits de Reparación
            </TabsTrigger>
            <TabsTrigger value="epoxicos" className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Epóxicos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="abrazaderas">
            <div className="grid md:grid-cols-3 gap-8">
              {abrazaderas.map((product) => (
  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
    <div className="aspect-video bg-muted">
      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
    </div>
    <CardHeader>
      <CardTitle className="text-xl">{product.name}</CardTitle>
      <CardDescription className="text-base">{product.description}</CardDescription>
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
            className="absolute bottom-0 right-0 bg-white/70 px-1 cursor-pointer text-sm text-primary font-medium"
            onClick={() => window.location.href = `/productos/abrazaderas/${product.id}`}
          >
            ...más
          </div>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Aplicaciones:</h4>
        <div className="flex flex-wrap gap-2">
          {product.applications?.map((app, index) => (
            <Badge key={index} variant="secondary">
              {app}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Link href={`/productos/abrazaderas/${product.id}`} className="flex-1">
          <Button className="w-full">
            Ver Detalles <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Button variant="outline" onClick={() => handleQuoteClick(product, 'Abrazaderas')}>Cotizar</Button>
      </div>
    </CardContent>
  </Card>
))}


            </div>
          </TabsContent>
          <TabsContent value="kits">
            <div className="grid md:grid-cols-2 gap-8">
              {kits.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <CardDescription className="text-base">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <h4 className="font-semibold mb-2">Aplicaciones:</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.applications?.map((app, index) => (
                        <Badge key={index} variant="secondary">
                          {app}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Link href={`/productos/kits/${product.id}`} className="flex-1">
                        <Button className="w-full">Ver Detalles</Button>
                      </Link>
                      <Button variant="outline" onClick={() => handleQuoteClick(product, 'Kits de Reparación')}>Cotizar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="epoxicos">
            <div className="grid md:grid-cols-2 gap-8">
              {epoxicos.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <CardDescription className="text-base">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <h4 className="font-semibold mb-2">Aplicaciones:</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.applications?.map((app, index) => (
                        <Badge key={index} variant="secondary">
                          {app}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Link href={`/productos/epoxicos/${product.id}`} className="flex-1">
                        <Button className="w-full">Ver Detalles</Button>
                      </Link>
                      <Button variant="outline" onClick={() => handleQuoteClick(product, 'Epóxicos')}>Cotizar</Button>
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
