export interface WhatsAppMessage {
  type: 'contact' | 'quote' | 'product_selection'
  data: {
    name?: string
    company?: string
    phone?: string
    email?: string
    productType?: string
    message?: string
    selectedProducts?: Array<{
      id: string
      name: string
      category: string
      specifications?: string[]
    }>
  }
}

export const WHATSAPP_NUMBER = '51936312086' // Reemplazar con el número real de la empresa

export function sendToWhatsApp(messageData: WhatsAppMessage) {
  let message = ''
  
  switch (messageData.type) {
    case 'contact':
      message = `¡Hola! Me gustaría obtener más información sobre sus productos industriales.

*Datos de contacto:*
• Nombre: ${messageData.data.name || 'No especificado'}
• Empresa: ${messageData.data.company || 'No especificado'}
• Teléfono: ${messageData.data.phone || 'No especificado'}
• Email: ${messageData.data.email || 'No especificado'}
• Tipo de producto: ${messageData.data.productType || 'No especificado'}

*Mensaje:*
${messageData.data.message || 'Sin mensaje adicional'}

¡Espero su respuesta!`
      break
      
    case 'quote':
      message = `¡Hola! Me interesa solicitar una cotización.

*Datos de contacto:*
• Nombre: ${messageData.data.name || 'No especificado'}
• Empresa: ${messageData.data.company || 'No especificado'}
• Teléfono: ${messageData.data.phone || 'No especificado'}
• Email: ${messageData.data.email || 'No especificado'}

Por favor, envíenme información sobre precios y disponibilidad.

¡Gracias!`
      break
      
    case 'product_selection':
      const products = messageData.data.selectedProducts || []
      const productList = products.map(product => 
        `• ${product.name} (${product.category})`
      ).join('\n')
      
      message = `¡Hola! He seleccionado los siguientes productos y me gustaría recibir más información:

*Productos seleccionados:*
${productList}

*Datos de contacto:*
• Nombre: ${messageData.data.name || 'A definir'}
• Empresa: ${messageData.data.company || 'A definir'}
• Teléfono: ${messageData.data.phone || 'A definir'}
• Email: ${messageData.data.email || 'A definir'}

Por favor, envíenme información detallada sobre estos productos, precios y disponibilidad.

¡Espero su respuesta!`
      break
      
    default:
      message = '¡Hola! Me interesa obtener información sobre sus productos industriales.'
  }
  
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`
  
  window.open(whatsappUrl, '_blank')
}

export function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}