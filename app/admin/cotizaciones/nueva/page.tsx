'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Plus,
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Calculator,
  Save,
  ArrowLeft
} from 'lucide-react'
import { formatCurrency, validateRUC } from '@/lib/utils'
import { ProductTableSelector } from '@/components/admin/ProductTableSelector'

interface Cliente {
  _id: string
  ruc: string
  razonSocial: string
  nombreComercial?: string
  direccion: string
  contacto?: {
    nombre?: string
    telefono?: string
    email?: string
  }
}

interface Producto {
  _id: string
  tipoProducto: string
  codigo: string
  name: string
  description: string
  category: string
  imagen?: string
  technicalData?: {
    headers: string[]
    rows: Array<{ [key: string]: string | number }>
  }
}

interface ItemCotizacion {
  item: number
  tipoProducto: string
  productoId: string
  codigo: string
  descripcion: string
  especificaciones: string
  cantidad: number
  precioUnitario: number
  descuento: number
  subtotal: number
}

export default function NuevaCotizacionPage() {
  const router = useRouter()

  // Estados del formulario
  const [loading, setLoading] = useState(false)
  const [searchRUC, setSearchRUC] = useState('')
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [searchProducto, setSearchProducto] = useState('')
  const [productos, setProductos] = useState<Producto[]>([])
  const [items, setItems] = useState<ItemCotizacion[]>([])

  // Estados de la cotización
  const [formData, setFormData] = useState({
    fechaVencimiento: '',
    moneda: 'PEN' as 'PEN' | 'USD',
    igv: 18,
    observaciones: '',
    terminosCondiciones: 'Validez de la oferta: 30 días calendario.\nTiempo de entrega: 15 días hábiles después de confirmado el pedido.\nForma de pago: 50% adelanto, 50% contra entrega.'
  })

  // Calcular totales
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const totalIGV = subtotal * (formData.igv / 100)
  const total = subtotal + totalIGV

  // Buscar cliente por RUC
  const handleSearchRUC = async () => {
    if (!searchRUC.trim()) return

    if (!validateRUC(searchRUC)) {
      alert('RUC inválido. Debe tener 11 dígitos válidos.')
      return
    }

    try {
      setLoading(true)

      // Primero intentar consultar RUC en SUNAT
      const rucResponse = await fetch('/api/clientes/consulta-ruc', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruc: searchRUC.replace(/\D/g, '') })
      })

      if (rucResponse.ok) {
        const rucData = await rucResponse.json()

        if (rucData.success) {
          // Si el cliente ya existe, usar esos datos
          if (!rucData.esNuevo) {
            setCliente(rucData.data)
          } else {
            // Si es nuevo, crear el cliente con datos de SUNAT
            const createResponse = await fetch('/api/clientes', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(rucData.data)
            })

            if (createResponse.ok) {
              const createData = await createResponse.json()
              if (createData.success) {
                setCliente(createData.data)
              }
            }
          }
        } else {
          alert(`Error consultando RUC: ${rucData.message}`)
        }
      }
    } catch (error) {
      console.error('Error searching RUC:', error)
      alert('Error al consultar RUC')
    } finally {
      setLoading(false)
    }
  }

  // Buscar productos
  const handleSearchProductos = async (query: string) => {
    if (!query.trim()) {
      setProductos([])
      return
    }

    try {
      const response = await fetch(`/api/cotizaciones/productos/search?q=${encodeURIComponent(query)}&limit=10`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProductos(data.data)
        }
      }
    } catch (error) {
      console.error('Error searching products:', error)
    }
  }


  // Actualizar item
  const handleUpdateItem = (index: number, field: keyof ItemCotizacion, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Recalcular subtotal
    if (field === 'cantidad' || field === 'precioUnitario' || field === 'descuento') {
      const item = newItems[index]
      const subtotalSinDescuento = item.cantidad * item.precioUnitario
      const descuentoAmount = subtotalSinDescuento * (item.descuento / 100)
      newItems[index].subtotal = subtotalSinDescuento - descuentoAmount
    }

    setItems(newItems)
  }

  // Remover item
  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    // Renumerar los ítems
    const reNumberedItems = newItems.map((item, idx) => ({
      ...item,
      item: idx + 1
    }))
    setItems(reNumberedItems)
  }

  // Crear cotización
  const handleCreate = async () => {
    if (!cliente) {
      alert('Debe seleccionar un cliente')
      return
    }

    if (items.length === 0) {
      alert('Debe agregar al menos un producto')
      return
    }

    if (!formData.fechaVencimiento) {
      alert('Debe especificar la fecha de vencimiento')
      return
    }

    try {
      setLoading(true)

      const cotizacionData = {
        cliente: cliente._id,
        fechaVencimiento: formData.fechaVencimiento,
        items,
        subtotal,
        igv: formData.igv,
        totalIGV,
        total,
        moneda: formData.moneda,
        observaciones: formData.observaciones,
        terminosCondiciones: formData.terminosCondiciones
      }

      const response = await fetch('/api/cotizaciones', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cotizacionData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(`Cotización ${data.data.numeroCotizacion} creada exitosamente`)
          router.push('/admin/cotizaciones')
        } else {
          alert(`Error: ${data.message}`)
        }
      } else {
        alert(`Error del servidor: ${response.status}`)
      }
    } catch (error) {
      console.error('Error creating cotización:', error)
      alert('Error al crear la cotización')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchProducto) {
        handleSearchProductos(searchProducto)
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchProducto])

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/cotizaciones')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nueva Cotización</h1>
            <p className="text-gray-600">Crear una nueva cotización de productos</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCreate} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Cotización'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Cliente */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Búsqueda RUC */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>RUC del Cliente</Label>
                <Input
                  placeholder="Ingrese RUC (11 dígitos)"
                  value={searchRUC}
                  onChange={(e) => setSearchRUC(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  maxLength={11}
                />
              </div>
              <Button
                onClick={handleSearchRUC}
                disabled={loading || !searchRUC}
                className="mt-6"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>

            {/* Datos del cliente */}
            {cliente && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{cliente.razonSocial}</h3>
                  <Badge>RUC: {cliente.ruc}</Badge>
                </div>

                {cliente.nombreComercial && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span>{cliente.nombreComercial}</span>
                  </div>
                )}

                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span>{cliente.direccion}</span>
                </div>

                {cliente.contacto && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {cliente.contacto.nombre && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{cliente.contacto.nombre}</span>
                      </div>
                    )}
                    {cliente.contacto.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{cliente.contacto.telefono}</span>
                      </div>
                    )}
                    {cliente.contacto.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{cliente.contacto.email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Configuración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Fecha de Vencimiento</Label>
              <Input
                type="date"
                value={formData.fechaVencimiento}
                onChange={(e) => setFormData({...formData, fechaVencimiento: e.target.value})}
              />
            </div>

            <div>
              <Label>Moneda</Label>
              <select
                value={formData.moneda}
                onChange={(e) => setFormData({...formData, moneda: e.target.value as 'PEN' | 'USD'})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="PEN">Soles (PEN)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>

            <div>
              <Label>IGV (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.igv}
                onChange={(e) => setFormData({...formData, igv: parseFloat(e.target.value) || 0})}
              />
            </div>

            {/* Totales */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal, formData.moneda)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IGV ({formData.igv}%):</span>
                <span>{formatCurrency(totalIGV, formData.moneda)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(total, formData.moneda)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productos */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos ({items.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Búsqueda de productos */}
          <div className="mb-6">
            <Label>Buscar Productos</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, código o descripción..."
                value={searchProducto}
                onChange={(e) => setSearchProducto(e.target.value)}
                className="pl-10"
              />

              {productos.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {productos.map((producto) => (
                    <ProductTableSelector
                      key={producto._id}
                      producto={producto}
                      onSelectItems={(selectedData) => {
                        if (selectedData.selectedVariants && selectedData.selectedVariants.length > 0) {
                          // Múltiples variantes seleccionadas
                          selectedData.selectedVariants.forEach((variante, index) => {
                            const nuevoItem: ItemCotizacion = {
                              item: items.length + 1 + index,
                              tipoProducto: selectedData.category,
                              productoId: selectedData.productoId,
                              codigo: variante.codigo,
                              descripcion: variante.descripcion,
                              especificaciones: variante.descripcion,
                              cantidad: 1,
                              precioUnitario: variante.precio,
                              descuento: 0,
                              subtotal: variante.precio
                            }
                            setItems(prevItems => [...prevItems, nuevoItem])
                          })
                        } else {
                          // Producto simple (sin variantes)
                          const nuevoItem: ItemCotizacion = {
                            item: items.length + 1,
                            tipoProducto: selectedData.category,
                            productoId: selectedData.productoId,
                            codigo: selectedData.selectedVariants?.[0]?.codigo || 'SIN-CODIGO',
                            descripcion: selectedData.productName,
                            especificaciones: selectedData.selectedVariants?.[0]?.descripcion || '',
                            cantidad: 1,
                            precioUnitario: selectedData.selectedVariants?.[0]?.precio || 0,
                            descuento: 0,
                            subtotal: selectedData.selectedVariants?.[0]?.precio || 0
                          }
                          setItems(prevItems => [...prevItems, nuevoItem])
                        }
                        setSearchProducto('')
                        setProductos([])
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lista de items */}
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay productos agregados</p>
              <p className="text-sm">Busca y agrega productos usando el campo de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          Ítem {item.item}
                        </Badge>
                        <h4 className="font-semibold">{item.descripcion}</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.codigo} • {item.tipoProducto}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{item.especificaciones}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => handleUpdateItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label>Precio Unitario</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.precioUnitario}
                        onChange={(e) => handleUpdateItem(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Descuento (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.descuento}
                        onChange={(e) => handleUpdateItem(index, 'descuento', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Subtotal</Label>
                      <div className="bg-gray-50 rounded-md px-3 py-2 font-semibold">
                        {formatCurrency(item.subtotal, formData.moneda)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Observaciones y Términos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Observaciones adicionales..."
              value={formData.observaciones}
              onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
              rows={6}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Términos y Condiciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Términos y condiciones..."
              value={formData.terminosCondiciones}
              onChange={(e) => setFormData({...formData, terminosCondiciones: e.target.value})}
              rows={6}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}