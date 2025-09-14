'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  Filter,
  FileText,
  Eye,
  Edit,
  Trash2,
  Download
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Cotizacion {
  _id: string
  numeroCotizacion: string
  cliente: {
    _id: string
    razonSocial: string
    ruc: string
  }
  fechaCotizacion: string
  fechaVencimiento: string
  estado: 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA' | 'VENCIDA'
  total: number
  moneda: string
  creadoPor: {
    name: string
    email: string
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

const estadoColors = {
  'BORRADOR': 'bg-gray-100 text-gray-800',
  'ENVIADA': 'bg-blue-100 text-blue-800',
  'APROBADA': 'bg-green-100 text-green-800',
  'RECHAZADA': 'bg-red-100 text-red-800',
  'VENCIDA': 'bg-orange-100 text-orange-800'
}

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')

  const fetchCotizaciones = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (searchTerm) params.append('search', searchTerm)
      if (estadoFilter) params.append('estado', estadoFilter)

      const response = await fetch(`/api/cotizaciones?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setCotizaciones(data.data.cotizaciones)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching cotizaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCotizaciones()
  }, [pagination.page, searchTerm, estadoFilter])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (estado: string) => {
    setEstadoFilter(estado)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando cotizaciones...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-600">Gestión de cotizaciones y presupuestos</p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => window.location.href = '/admin/cotizaciones/nueva'}
        >
          <Plus className="h-4 w-4" />
          Nueva Cotización
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por número de cotización..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={estadoFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Todos los estados</option>
                <option value="BORRADOR">Borrador</option>
                <option value="ENVIADA">Enviada</option>
                <option value="APROBADA">Aprobada</option>
                <option value="RECHAZADA">Rechazada</option>
                <option value="VENCIDA">Vencida</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cotizaciones List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Cotizaciones ({pagination.total})</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cotizaciones.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay cotizaciones
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || estadoFilter
                  ? "No se encontraron cotizaciones con los filtros aplicados"
                  : "Comienza creando tu primera cotización"
                }
              </p>
              <Button onClick={() => window.location.href = '/admin/cotizaciones/nueva'}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cotización
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cotizaciones.map((cotizacion) => (
                <div
                  key={cotizacion._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {cotizacion.numeroCotizacion}
                        </h3>
                        <Badge className={estadoColors[cotizacion.estado]}>
                          {cotizacion.estado}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <div className="font-medium text-gray-900">Cliente</div>
                          <div>{cotizacion.cliente.razonSocial}</div>
                          <div className="text-xs">RUC: {cotizacion.cliente.ruc}</div>
                        </div>

                        <div>
                          <div className="font-medium text-gray-900">Fechas</div>
                          <div>Creada: {formatDate(cotizacion.fechaCotizacion)}</div>
                          <div>Vence: {formatDate(cotizacion.fechaVencimiento)}</div>
                        </div>

                        <div>
                          <div className="font-medium text-gray-900">Total</div>
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(cotizacion.total, cotizacion.moneda)}
                          </div>
                          <div className="text-xs">Por: {cotizacion.creadoPor.name}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} cotizaciones
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </Button>

                <span className="text-sm">
                  Página {pagination.page} de {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}