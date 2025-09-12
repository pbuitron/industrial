"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageCircle } from "lucide-react"
import { WhatsAppMessage } from "@/lib/whatsapp"

interface WhatsAppFormModalProps {
  isOpen: boolean
  onClose: () => void
  messageData: WhatsAppMessage
  onSend: (formData: UserFormData, messageData: WhatsAppMessage) => void
}

export interface UserFormData {
  name: string
  company: string
  phone: string
  email: string
  message?: string
}

export function WhatsAppFormModal({ isOpen, onClose, messageData, onSend }: WhatsAppFormModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    company: "",
    phone: "",
    email: "",
    message: ""
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<UserFormData>>({})

  const validateForm = () => {
    const newErrors: Partial<UserFormData> = {}
    
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido"
    if (!formData.phone.trim()) newErrors.phone = "El teléfono es requerido"
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El email no es válido"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // Simular delay
      onSend(formData, messageData)
      onClose()
      
      // Limpiar formulario
      setFormData({
        name: "",
        company: "",
        phone: "",
        email: "",
        message: ""
      })
    } catch (error) {
      console.error('Error al enviar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const getModalTitle = () => {
    switch (messageData.type) {
      case 'contact':
        return 'Solicitar Información'
      case 'quote':
        return 'Solicitar Cotización'
      case 'product_selection':
        return 'Enviar Selección de Productos'
      default:
        return 'Contactar por WhatsApp'
    }
  }

  const getModalDescription = () => {
    switch (messageData.type) {
      case 'contact':
        return 'Complete sus datos para recibir información personalizada sobre nuestros productos.'
      case 'quote':
        return 'Proporcione sus datos de contacto para enviarle una cotización detallada.'
      case 'product_selection':
        return 'Complete sus datos para enviar la selección de productos por WhatsApp.'
      default:
        return 'Complete el formulario para contactarnos por WhatsApp.'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription>
            {getModalDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* Mostrar productos seleccionados si los hay */}
        {messageData.type === 'product_selection' && messageData.data.selectedProducts && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Productos seleccionados:</Label>
            <div className="max-h-32 overflow-y-auto space-y-2 p-3 bg-muted/50 rounded-md">
              {messageData.data.selectedProducts.map((product, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{product.category}</Badge>
                    <span className="font-medium text-sm">{product.name}</span>
                  </div>
                  {product.specifications && product.specifications.length > 0 && (
                    <div className="text-xs text-muted-foreground pl-2">
                      {product.specifications.slice(0, 2).map((spec, specIndex) => (
                        <div key={specIndex}>• {spec}</div>
                      ))}
                      {product.specifications.length > 2 && (
                        <div>• ... y {product.specifications.length - 2} más</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Su nombre completo"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                type="text"
                placeholder="Nombre de la empresa"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+51 999 999 999"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensaje adicional</Label>
            <Textarea
              id="message"
              placeholder="Cuéntanos más sobre sus necesidades o requerimientos específicos..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Enviar por WhatsApp
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}