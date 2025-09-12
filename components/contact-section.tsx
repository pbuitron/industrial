"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Phone, Mail, Clock } from "lucide-react"

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    productType: "",
    message: "",
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({
    type: null,
    message: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSubmitStatus({ type: null, message: "" })

    try {
      const response = await fetch('http://localhost:5000/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Tu solicitud ha sido enviada exitosamente. Nos pondremos en contacto contigo pronto.'
        })
        
        // Limpiar formulario después del envío exitoso
        setFormData({
          name: "",
          email: "",
          company: "",
          phone: "",
          productType: "",
          message: "",
        })
      } else {
        // Manejar errores de validación
        if (result.errors && Array.isArray(result.errors)) {
          const errorMessages = result.errors.map((error: any) => error.msg).join(', ')
          setSubmitStatus({
            type: 'error',
            message: `Errores de validación: ${errorMessages}`
          })
        } else {
          setSubmitStatus({
            type: 'error',
            message: result.message || 'Ha ocurrido un error al enviar tu solicitud. Por favor intenta nuevamente.'
          })
        }
      }
    } catch (error) {
      console.error('Error al enviar formulario:', error)
      setSubmitStatus({
        type: 'error',
        message: 'No se pudo conectar con el servidor. Por favor verifica tu conexión e intenta nuevamente.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <section id="contacto" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 text-balance">Contáctanos</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Estamos aquí para ayudarte con tus necesidades industriales. Solicita una cotización o consulta técnica sin
            compromiso.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  El Agustino
                  <br />
                 Lima 15006
                  <br />
                  Lima, Perú
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Teléfono
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  +51 936 312 086
                </p>
                <p className="text-muted-foreground">
                  +51 983 411 735
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  info@industrial-iot.us
                  <br />
                  ventas@industrial-iot.us
                  </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Horarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Lunes a Viernes: 8:00 - 18:00
                  <br />
                  Sábados: 9:00 - 12:00
                  <br />
                  Emergencias: 24/7
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Solicitar Cotización</CardTitle>
                <CardDescription>
                  Completa el formulario y nos pondremos en contacto contigo en menos de 24 horas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nombre completo *</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Tu nombre completo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="tu@empresa.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Empresa</label>
                      <Input
                        value={formData.company}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                        placeholder="Nombre de tu empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Teléfono</label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+51 9XX XXX XXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de producto *</label>
                    <Select
                      value={formData.productType}
                      onValueChange={(value) => handleInputChange("productType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de producto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="abrazaderas">Abrazaderas Industriales</SelectItem>
                        <SelectItem value="kits">Kits de Reparación</SelectItem>
                        <SelectItem value="epoxicos">Epóxicos para Metales</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mensaje *</label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="Describe tu proyecto o necesidad específica..."
                      rows={4}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? "Enviando..." : "Enviar Solicitud"}
                  </Button>

                  {submitStatus.type && (
                    <div
                      className={`p-4 rounded-md text-sm ${
                        submitStatus.type === 'success'
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {submitStatus.message}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    Al enviar este formulario, aceptas nuestros términos y condiciones. Nos comprometemos a proteger tu
                    información personal.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
