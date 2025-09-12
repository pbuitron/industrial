"use client"

import { useState } from "react"
import { WhatsAppMessage, WHATSAPP_NUMBER } from "@/lib/whatsapp"
import { UserFormData } from "@/components/WhatsAppFormModal"

export function useWhatsAppForm() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentMessageData, setCurrentMessageData] = useState<WhatsAppMessage | null>(null)

  const openWhatsAppForm = (messageData: WhatsAppMessage) => {
    setCurrentMessageData(messageData)
    setIsModalOpen(true)
  }

  const closeWhatsAppForm = () => {
    setIsModalOpen(false)
    setCurrentMessageData(null)
  }

  const sendToWhatsApp = (userData: UserFormData, messageData: WhatsAppMessage) => {
    let message = ''
    
    // Combinar datos del usuario con los datos del mensaje
    const combinedData = {
      ...messageData.data,
      ...userData
    }
    
    switch (messageData.type) {
      case 'contact':
        message = `¡Hola! Me gustaría obtener más información sobre sus productos industriales.

*Datos de contacto:*
• Nombre: ${userData.name}
• Empresa: ${userData.company || 'No especificado'}
• Teléfono: ${userData.phone}
• Email: ${userData.email}
• Tipo de producto: ${combinedData.productType || 'No especificado'}

*Mensaje:*
${userData.message || 'Sin mensaje adicional'}

¡Espero su respuesta!`
        break
        
      case 'quote':
        message = `¡Hola! Me interesa solicitar una cotización.

*Datos de contacto:*
• Nombre: ${userData.name}
• Empresa: ${userData.company || 'No especificado'}
• Teléfono: ${userData.phone}
• Email: ${userData.email}

${userData.message ? `*Detalles adicionales:*
${userData.message}

` : ''}Por favor, envíenme información sobre precios y disponibilidad.

¡Gracias!`
        break
        
      case 'product_selection':
        const products = messageData.data.selectedProducts || []
        let productDetails = ''
        
        products.forEach((product, index) => {
          productDetails += `*${index + 1}. ${product.name}* (${product.category})
`
          if (product.specifications && product.specifications.length > 0) {
            product.specifications.forEach(spec => {
              productDetails += `   • ${spec}
`
            })
          }
          productDetails += '\n'
        })
        
        message = `¡Hola! He seleccionado los siguientes productos y me gustaría recibir más información:

${productDetails}*Datos de contacto:*
• Nombre: ${userData.name}
• Empresa: ${userData.company || 'No especificado'}
• Teléfono: ${userData.phone}
• Email: ${userData.email}

${userData.message ? `*Mensaje adicional:*
${userData.message}

` : ''}Por favor, envíenme información detallada sobre estos productos, precios y disponibilidad.

¡Espero su respuesta!`
        break
        
      default:
        message = `¡Hola! Me interesa obtener información sobre sus productos industriales.

*Datos de contacto:*
• Nombre: ${userData.name}
• Empresa: ${userData.company || 'No especificado'}
• Teléfono: ${userData.phone}
• Email: ${userData.email}

${userData.message ? `*Mensaje:*
${userData.message}

` : ''}¡Gracias!`
    }
    
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
    closeWhatsAppForm()
  }

  return {
    isModalOpen,
    currentMessageData,
    openWhatsAppForm,
    closeWhatsAppForm,
    sendToWhatsApp
  }
}