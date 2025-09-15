"use client"

import { useState, useEffect } from "react"
import { use } from 'react'
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface Product {
  _id: string
  productId: string | number
  name: string
  description: string
  applications: string[]
  isActive: boolean
  // Abrazaderas fields
  details?: string
  image?: string
  specs?: string[]
  materials?: string[]
  // Epoxicos fields
  generic_type?: string
  image_url?: string
  product_url?: string
  specifications?: {
    colors?: string[]
    shelf_life?: string
    mix_ratio?: string
    solids_by_volume?: string
    viscosity?: string
    pot_life?: string
  }
  special_features?: string[]
  // Kits fields
  content?: string[]
  instructions?: string[]
}

export default function EditProductPage({ 
  params 
}: { 
  params: Promise<{ category: string; id: string }> 
}) {
  const { category, id } = use(params)
  const { admin } = useAuth()
  const router = useRouter()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [applications, setApplications] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)

  // Abrazaderas specific
  const [details, setDetails] = useState("")
  const [image, setImage] = useState("")
  const [specs, setSpecs] = useState<string[]>([])
  const [materials, setMaterials] = useState<string[]>([])

  // Epoxicos specific
  const [genericType, setGenericType] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [productUrl, setProductUrl] = useState("")
  const [colors, setColors] = useState<string[]>([])
  const [shelfLife, setShelfLife] = useState("")
  const [mixRatio, setMixRatio] = useState("")
  const [solidsByVolume, setSolidsByVolume] = useState("")
  const [viscosity, setViscosity] = useState("")
  const [potLife, setPotLife] = useState("")
  const [specialFeatures, setSpecialFeatures] = useState<string[]>([])

  // Kits specific
  const [content, setContent] = useState<string[]>([])
  const [instructions, setInstructions] = useState<string[]>([])

  // Technical Data (for abrazaderas and kits)
  const [technicalDataHeaders, setTechnicalDataHeaders] = useState<string[]>([])
  const [technicalDataRows, setTechnicalDataRows] = useState<string[][]>([[]])

  useEffect(() => {
    fetchProduct()
  }, [category, id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${category}/${id}`, {
        credentials: 'include'
      })
      const result = await response.json()

      if (response.ok && result.success) {
        const productData = result.data
        setProduct(productData)
        
        // Set common fields
        setName(productData.name)
        setDescription(productData.description)
        setApplications(productData.applications || [])
        setIsActive(productData.isActive)

        // Set category-specific fields
        if (category === "abrazaderas") {
          setDetails(productData.details || "")
          setImage(productData.image || "")
          setSpecs(productData.specs || [])
          setMaterials(productData.materials || [])
          // Initialize technicalData
          setTechnicalDataHeaders(productData.technicalData?.headers || [])
          setTechnicalDataRows(productData.technicalData?.rows || [[]])
        } else if (category === "epoxicos") {
          setGenericType(productData.generic_type || "")
          setImageUrl(productData.image_url || "")
          setProductUrl(productData.product_url || "")
          setColors(productData.specifications?.colors || [])
          setShelfLife(productData.specifications?.shelf_life || "")
          setMixRatio(productData.specifications?.mix_ratio || "")
          setSolidsByVolume(productData.specifications?.solids_by_volume || "")
          setViscosity(productData.specifications?.viscosity || "")
          setPotLife(productData.specifications?.pot_life || "")
          setSpecialFeatures(productData.special_features || [])
        } else if (category === "kits") {
          setImage(productData.image || "")
          setSpecs(productData.specs || [])
          setContent(productData.content || [])
          setInstructions(productData.instructions || [])
          // Initialize technicalData
          setTechnicalDataHeaders(productData.technicalData?.headers || [])
          setTechnicalDataRows(productData.technicalData?.rows || [[]])
        }
      } else {
        setError(result.message || 'Producto no encontrado')
      }
    } catch (err) {
      console.error('Error fetching product:', err)
      setError('Error de conexión. Verifica que el servidor esté funcionando.')
    } finally {
      setLoading(false)
    }
  }

  const addArrayField = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, ""])
  }

  const updateArrayField = (
    index: number, 
    value: string, 
    array: string[], 
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const newArray = [...array]
    newArray[index] = value
    setter(newArray)
  }

  const removeArrayField = (
    index: number, 
    array: string[], 
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (array.length > 1) {
      setter(array.filter((_, i) => i !== index))
    }
  }

  // Technical Data Management Functions
  const addHeader = () => {
    setTechnicalDataHeaders(prev => [...prev, ""])
  }

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...technicalDataHeaders]
    newHeaders[index] = value
    setTechnicalDataHeaders(newHeaders)
  }

  const removeHeader = (index: number) => {
    if (technicalDataHeaders.length > 1) {
      setTechnicalDataHeaders(prev => prev.filter((_, i) => i !== index))
      // Also remove corresponding column from all rows
      setTechnicalDataRows(prev => prev.map(row => row.filter((_, i) => i !== index)))
    }
  }

  const addRow = () => {
    const newRow = new Array(technicalDataHeaders.length).fill("")
    setTechnicalDataRows(prev => [...prev, newRow])
  }

  const updateRowCell = (rowIndex: number, cellIndex: number, value: string) => {
    const newRows = [...technicalDataRows]
    newRows[rowIndex][cellIndex] = value
    setTechnicalDataRows(newRows)
  }

  const removeRow = (index: number) => {
    if (technicalDataRows.length > 1) {
      setTechnicalDataRows(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      let productData: any = {
        name: name.trim(),
        description: description.trim(),
        applications: applications.filter(app => app.trim() !== ""),
        isActive
      }

      // Add category-specific fields
      if (category === "abrazaderas") {
        productData = {
          ...productData,
          details: details.trim(),
          image: image.trim(),
          specs: specs.filter(spec => spec.trim() !== ""),
          materials: materials.filter(mat => mat.trim() !== ""),
          technicalData: technicalDataHeaders.length > 0 ? {
            headers: technicalDataHeaders.filter(h => h.trim() !== ""),
            rows: technicalDataRows.filter(row => row.some(cell => cell.trim() !== ""))
          } : null
        }
      } else if (category === "epoxicos") {
        productData = {
          ...productData,
          generic_type: genericType.trim(),
          image_url: imageUrl.trim(),
          product_url: productUrl.trim(),
          specifications: {
            colors: colors.filter(color => color.trim() !== ""),
            shelf_life: shelfLife.trim(),
            mix_ratio: mixRatio.trim(),
            solids_by_volume: solidsByVolume.trim(),
            viscosity: viscosity.trim(),
            pot_life: potLife.trim()
          },
          special_features: specialFeatures.filter(feature => feature.trim() !== "")
        }
      } else if (category === "kits") {
        productData = {
          ...productData,
          image: image.trim(),
          specs: specs.filter(spec => spec.trim() !== ""),
          content: content.filter(item => item.trim() !== ""),
          instructions: instructions.filter(inst => inst.trim() !== ""),
          technicalData: technicalDataHeaders.length > 0 ? {
            headers: technicalDataHeaders.filter(h => h.trim() !== ""),
            rows: technicalDataRows.filter(row => row.some(cell => cell.trim() !== ""))
          } : null
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${category}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(productData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(`Producto "${name}" actualizado exitosamente`)
        
        setTimeout(() => {
          router.push('/admin/products')
        }, 2000)
      } else {
        setError(result.message || 'Error al actualizar el producto')
      }

    } catch (err) {
      console.error('Error updating product:', err)
      setError('Error de conexión. Verifica que el servidor esté funcionando.')
    } finally {
      setSaving(false)
    }
  }

  const renderArrayInputs = (
    label: string,
    array: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    placeholder: string
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {array.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => updateArrayField(index, e.target.value, array, setter)}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeArrayField(index, array, setter)}
            disabled={array.length === 1}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => addArrayField(setter)}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Agregar {label.toLowerCase()}
      </Button>
    </div>
  )

  if (!admin) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando producto...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/products')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/products')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Editar Producto</h1>
                <Badge variant={product?.isActive ? "default" : "secondary"}>
                  {product?.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <p className="text-gray-600 mt-2">
                {category.charAt(0).toUpperCase() + category.slice(1)} • ID: {product?.productId}
              </p>
            </div>
          </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
            <CardDescription>
              Modifica los datos del producto. Los campos marcados con * son obligatorios.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Status Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Producto activo</Label>
              </div>

              {/* Common Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre del producto"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción *</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción del producto"
                    required
                    rows={3}
                  />
                </div>
              </div>

              {/* Applications - Common to all */}
              {renderArrayInputs("Aplicaciones *", applications, setApplications, "Aplicación del producto")}

              {/* Category-specific fields */}
              {category === "abrazaderas" && (
                <>
                  <div className="space-y-2">
                    <Label>Detalles *</Label>
                    <Textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Detalles técnicos del producto"
                      required
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Imagen *</Label>
                    <Input
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="/path/to/image.jpg"
                      required
                    />
                  </div>

                  {renderArrayInputs("Especificaciones *", specs, setSpecs, "Especificación técnica")}
                  {renderArrayInputs("Materiales *", materials, setMaterials, "Material disponible")}
                  
                  {/* Technical Data Editor */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold">Datos Técnicos (Tabla)</h3>
                    
                    {/* Headers */}
                    <div className="space-y-2">
                      <Label>Cabeceras de la Tabla</Label>
                      {technicalDataHeaders.map((header, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={header}
                            onChange={(e) => updateHeader(index, e.target.value)}
                            placeholder="Nombre de la columna"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeHeader(index)}
                            disabled={technicalDataHeaders.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addHeader}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Cabecera
                      </Button>
                    </div>

                    {/* Rows */}
                    {technicalDataHeaders.length > 0 && (
                      <div className="space-y-2">
                        <Label>Filas de Datos</Label>
                        <div className="max-h-60 overflow-y-auto border rounded p-4">
                          {technicalDataRows.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex gap-2 mb-2">
                              {row.map((cell, cellIndex) => (
                                <Input
                                  key={cellIndex}
                                  value={cell}
                                  onChange={(e) => updateRowCell(rowIndex, cellIndex, e.target.value)}
                                  placeholder={technicalDataHeaders[cellIndex] || `Col ${cellIndex + 1}`}
                                  className="flex-1 text-xs"
                                />
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeRow(rowIndex)}
                                disabled={technicalDataRows.length === 1}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addRow}
                          className="w-full"
                          disabled={technicalDataHeaders.length === 0}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Fila
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {category === "epoxicos" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo Genérico *</Label>
                      <Input
                        value={genericType}
                        onChange={(e) => setGenericType(e.target.value)}
                        placeholder="Tipo de epóxico"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL de Imagen *</Label>
                      <Input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>URL del Producto</Label>
                    <Input
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      placeholder="https://example.com/producto"
                    />
                  </div>

                  {/* Specifications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vida Útil</Label>
                      <Input
                        value={shelfLife}
                        onChange={(e) => setShelfLife(e.target.value)}
                        placeholder="12 meses"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Relación de Mezcla</Label>
                      <Input
                        value={mixRatio}
                        onChange={(e) => setMixRatio(e.target.value)}
                        placeholder="2:1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sólidos por Volumen</Label>
                      <Input
                        value={solidsByVolume}
                        onChange={(e) => setSolidsByVolume(e.target.value)}
                        placeholder="75%"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Viscosidad</Label>
                      <Input
                        value={viscosity}
                        onChange={(e) => setViscosity(e.target.value)}
                        placeholder="200 cP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vida en Envase</Label>
                      <Input
                        value={potLife}
                        onChange={(e) => setPotLife(e.target.value)}
                        placeholder="30 minutos"
                      />
                    </div>
                  </div>

                  {renderArrayInputs("Colores", colors, setColors, "Color disponible")}
                  {renderArrayInputs("Características Especiales", specialFeatures, setSpecialFeatures, "Característica especial")}
                </>
              )}

              {category === "kits" && (
                <>
                  <div className="space-y-2">
                    <Label>Imagen *</Label>
                    <Input
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="/path/to/image.jpg"
                      required
                    />
                  </div>

                  {renderArrayInputs("Especificaciones *", specs, setSpecs, "Especificación del kit")}
                  {renderArrayInputs("Contenido", content, setContent, "Elemento del kit")}
                  {renderArrayInputs("Instrucciones", instructions, setInstructions, "Paso de instrucción")}
                  
                  {/* Technical Data Editor */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold">Datos Técnicos (Tabla)</h3>
                    
                    {/* Headers */}
                    <div className="space-y-2">
                      <Label>Cabeceras de la Tabla</Label>
                      {technicalDataHeaders.map((header, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={header}
                            onChange={(e) => updateHeader(index, e.target.value)}
                            placeholder="Nombre de la columna"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeHeader(index)}
                            disabled={technicalDataHeaders.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addHeader}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Cabecera
                      </Button>
                    </div>

                    {/* Rows */}
                    {technicalDataHeaders.length > 0 && (
                      <div className="space-y-2">
                        <Label>Filas de Datos</Label>
                        <div className="max-h-60 overflow-y-auto border rounded p-4">
                          {technicalDataRows.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex gap-2 mb-2">
                              {row.map((cell, cellIndex) => (
                                <Input
                                  key={cellIndex}
                                  value={cell}
                                  onChange={(e) => updateRowCell(rowIndex, cellIndex, e.target.value)}
                                  placeholder={technicalDataHeaders[cellIndex] || `Col ${cellIndex + 1}`}
                                  className="flex-1 text-xs"
                                />
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeRow(rowIndex)}
                                disabled={technicalDataRows.length === 1}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addRow}
                          className="w-full"
                          disabled={technicalDataHeaders.length === 0}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Fila
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Error and Success Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">{success}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/products')}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !name.trim() || !description.trim()}
                  className="flex-1"
                >
                  {saving ? "Guardando..." : "Actualizar Producto"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}