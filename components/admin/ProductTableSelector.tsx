'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Check, X } from 'lucide-react'

interface Variante {
  _id?: string
  codigo: string
  descripcion: string
  precio: number
  unidad: string
}

interface ProductWithTable {
  _id: string
  name: string
  description: string
  category: string
  image?: string
  variantes?: Variante[]
  // Legacy compatibility
  tipoProducto?: string
  codigo?: string
  technicalData?: {
    headers: string[]
    rows: Array<{[key: string]: string | number}>
  }
}

interface ProductTableSelectorProps {
  producto: ProductWithTable
  onSelectItems: (selectedItems: {
    productoId: string
    productName: string
    category: string
    selectedVariants: Array<{
      codigo: string
      descripcion: string
      precio: number
      unidad: string
    }>
  }) => void
}

export function ProductTableSelector({ producto, onSelectItems }: ProductTableSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set())

  const handleVariantSelect = (variantIndex: number, checked: boolean) => {
    const newSelectedVariants = new Set(selectedVariants)
    if (checked) {
      newSelectedVariants.add(variantIndex)
    } else {
      newSelectedVariants.delete(variantIndex)
    }
    setSelectedVariants(newSelectedVariants)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && producto.variantes) {
      setSelectedVariants(new Set(Array.from({ length: producto.variantes.length }, (_, i) => i)))
    } else {
      setSelectedVariants(new Set())
    }
  }

  const handleConfirmSelection = () => {
    if (selectedVariants.size === 0) return

    const selectedVariantsData = Array.from(selectedVariants).map(variantIndex => {
      const variante = producto.variantes![variantIndex]
      return {
        codigo: variante.codigo,
        descripcion: variante.descripcion,
        precio: variante.precio,
        unidad: variante.unidad
      }
    })

    onSelectItems({
      productoId: producto._id,
      productName: producto.name,
      category: producto.category,
      selectedVariants: selectedVariantsData
    })

    setSelectedVariants(new Set())
    setIsOpen(false)
  }

  const hasVariants = producto.variantes && producto.variantes.length > 0

  // Legacy compatibility
  const canSelectMultiple = hasVariants || (
    producto.technicalData &&
    producto.technicalData.headers &&
    producto.technicalData.rows &&
    producto.technicalData.rows.length > 0
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 group">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-semibold">{producto.name}</div>
                <Badge variant="outline" className="text-xs">
                  {producto.category || producto.tipoProducto}
                </Badge>
                {hasVariants && (
                  <Badge variant="secondary" className="text-xs">
                    Variantes disponibles
                  </Badge>
                )}
              </div>
              {producto.codigo && (
                <div className="text-sm text-gray-600 mb-1">
                  {producto.codigo}
                </div>
              )}
              <div className="text-xs text-gray-500 line-clamp-2">
                {producto.description}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {hasVariants && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  {producto.variantes!.length} variantes
                </Badge>
              )}
              <Plus className="h-4 w-4 text-blue-500 group-hover:text-blue-700" />
            </div>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {producto.name}
              <Badge variant="outline">{producto.category || producto.tipoProducto}</Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            {hasVariants
              ? "Selecciona una o más variantes de este producto para agregar a la cotización"
              : "Agregar producto individual a la cotización"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0">
          {hasVariants ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">
                    Variantes disponibles - {producto.variantes!.length} opciones
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {selectedVariants.size} seleccionadas
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll(selectedVariants.size === 0)}
                    >
                      {selectedVariants.size === producto.variantes!.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="border rounded-lg max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedVariants.size === producto.variantes!.length && producto.variantes!.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="font-semibold">Código</TableHead>
                        <TableHead className="font-semibold">Descripción</TableHead>
                        <TableHead className="font-semibold">Precio</TableHead>
                        <TableHead className="font-semibold">Unidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {producto.variantes!.map((variante, variantIndex) => (
                        <TableRow
                          key={variantIndex}
                          className={selectedVariants.has(variantIndex) ? 'bg-blue-50' : ''}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedVariants.has(variantIndex)}
                              onCheckedChange={(checked) => handleVariantSelect(variantIndex, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{variante.codigo}</TableCell>
                          <TableCell>{variante.descripcion}</TableCell>
                          <TableCell>${variante.precio.toFixed(2)}</TableCell>
                          <TableCell>{variante.unidad}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="text-lg font-semibold mb-2">{producto.name}</div>
                  <div className="text-sm text-gray-600 mb-4">{producto.description}</div>
                  {producto.codigo && (
                    <Badge variant="outline">{producto.codigo}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>

          {hasVariants ? (
            <Button
              onClick={handleConfirmSelection}
              disabled={selectedVariants.size === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Agregar {selectedVariants.size} variante{selectedVariants.size !== 1 ? 's' : ''}
            </Button>
          ) : (
            <Button onClick={() => {
              // Para productos sin variantes, crear una variante temporal
              onSelectItems({
                productoId: producto._id,
                productName: producto.name,
                category: producto.category,
                selectedVariants: [{
                  codigo: producto.codigo || 'SIN-CODIGO',
                  descripcion: producto.name,
                  precio: 0,
                  unidad: 'UND'
                }]
              })
              setIsOpen(false)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}