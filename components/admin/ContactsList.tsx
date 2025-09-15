"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Eye, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Contact {
  _id: string
  name: string
  email: string
  company?: string
  phone?: string
  productType: string
  message: string
  status: 'pendiente' | 'en_proceso' | 'completado' | 'archivado'
  createdAt: string
  updatedAt: string
}

interface ContactsResponse {
  success: boolean
  data: Contact[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNext: boolean
    hasPrev: boolean
  }
}

const statusLabels = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  en_proceso: { label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  completado: { label: 'Completado', color: 'bg-green-100 text-green-800' },
  archivado: { label: 'Archivado', color: 'bg-gray-100 text-gray-800' }
}

const productTypeLabels = {
  abrazaderas: 'Abrazaderas Industriales',
  kits: 'Kits de Reparación',
  epoxicos: 'Epóxicos para Metales',
  'Servicio de Recubrimiento': 'Servicio de Recubrimiento',
  'Fabricacion de Pernos': 'Fabricación de Pernos',
  'Reparación de bombas': 'Reparación de bombas',
  otro: 'Otro'
}

export function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [pagination, setPagination] = useState<ContactsResponse['pagination'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [productTypeFilter, setProductTypeFilter] = useState<string>('')

  const fetchContacts = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (statusFilter) params.append('status', statusFilter)
      if (productTypeFilter) params.append('productType', productTypeFilter)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contacts?${params}`, {
        method: 'GET',
        credentials: 'include'
      })
      const result: ContactsResponse = await response.json()

      if (result.success) {
        setContacts(result.data)
        setPagination(result.pagination)
      } else {
        setError('Error al cargar los contactos')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
      console.error('Error fetching contacts:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateContactStatus = async (contactId: string, newStatus: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contacts/${contactId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (result.success) {
        // Actualizar el contacto en la lista local
        setContacts(prevContacts =>
          prevContacts.map(contact =>
            contact._id === contactId
              ? { ...contact, status: newStatus as Contact['status'], updatedAt: new Date().toISOString() }
              : contact
          )
        )
      } else {
        alert('Error al actualizar el estado')
      }
    } catch (err) {
      alert('Error de conexión al actualizar el estado')
      console.error('Error updating status:', err)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [currentPage, statusFilter, productTypeFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gestión de Contactos</h1>
        <p className="text-muted-foreground">Administra las solicitudes de contacto recibidas</p>
      </div>

      {/* Filtros y controles */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="archivado">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Tipo de Producto</label>
              <Select value={productTypeFilter || "all"} onValueChange={(value) => setProductTypeFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los productos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  <SelectItem value="abrazaderas">Abrazaderas Industriales</SelectItem>
                  <SelectItem value="kits">Kits de Reparación</SelectItem>
                  <SelectItem value="epoxicos">Epóxicos para Metales</SelectItem>
                  <SelectItem value="Servicio de Recubrimiento">Servicio de Recubrimiento</SelectItem>
                  <SelectItem value="Fabricacion de Pernos">Fabricación de Pernos</SelectItem>
                  <SelectItem value="Reparación de bombas">Reparación de bombas</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchContacts} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Lista de contactos */}
      <div className="space-y-4">
        {contacts.map((contact) => (
          <Card key={contact._id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{contact.name}</h3>
                    <Badge className={statusLabels[contact.status].color}>
                      {statusLabels[contact.status].label}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Email:</strong> {contact.email}</p>
                    {contact.company && <p><strong>Empresa:</strong> {contact.company}</p>}
                    {contact.phone && <p><strong>Teléfono:</strong> {contact.phone}</p>}
                    <p><strong>Producto:</strong> {productTypeLabels[contact.productType as keyof typeof productTypeLabels] || contact.productType}</p>
                    <p><strong>Fecha:</strong> {formatDate(contact.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalles del Contacto</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="font-semibold">Nombre:</label>
                            <p>{contact.name}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Email:</label>
                            <p>{contact.email}</p>
                          </div>
                          {contact.company && (
                            <div>
                              <label className="font-semibold">Empresa:</label>
                              <p>{contact.company}</p>
                            </div>
                          )}
                          {contact.phone && (
                            <div>
                              <label className="font-semibold">Teléfono:</label>
                              <p>{contact.phone}</p>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="font-semibold">Tipo de Producto:</label>
                          <p>{productTypeLabels[contact.productType as keyof typeof productTypeLabels] || contact.productType}</p>
                        </div>
                        
                        <div>
                          <label className="font-semibold">Mensaje:</label>
                          <p className="bg-gray-50 p-3 rounded-md mt-1">{contact.message}</p>
                        </div>
                        
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Creado: {formatDate(contact.createdAt)}</span>
                          <span>Actualizado: {formatDate(contact.updatedAt)}</span>
                        </div>

                        <div className="pt-4">
                          <label className="font-semibold mb-2 block">Cambiar Estado:</label>
                          <Select
                            value={contact.status}
                            onValueChange={(value) => updateContactStatus(contact._id, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="en_proceso">En Proceso</SelectItem>
                              <SelectItem value="completado">Completado</SelectItem>
                              <SelectItem value="archivado">Archivado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground border-t pt-3">
                <p className="line-clamp-2">{contact.message}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrev || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          <span className="text-sm">
            Página {pagination.currentPage} de {pagination.totalPages} 
            ({pagination.totalItems} total)
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
            disabled={!pagination.hasNext || loading}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {contacts.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No se encontraron contactos con los filtros aplicados.</p>
        </div>
      )}
    </div>
  )
}