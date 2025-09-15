"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react"

interface Variante {
  codigo: string
  descripcion: string
  precio: number
  unidad: string
}

export default function NewProductPage() {
  const { admin } = useAuth()
  const router = useRouter()
  
  const [category, setCategory] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Main product fields
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [applications, setApplications] = useState<string[]>([""])

  // Abrazaderas specific fields
  const [details, setDetails] = useState("")
  const [image, setImage] = useState("")
  const [specs, setSpecs] = useState<string[]>([""])
  const [materials, setMaterials] = useState<string[]>([""])

  // Epoxicos specific fields
  const [genericType, setGenericType] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [productUrl, setProductUrl] = useState("")
  const [colors, setColors] = useState<string[]>([""])
  const [shelfLife, setShelfLife] = useState("")
  const [mixRatio, setMixRatio] = useState("")
  const [solidsByVolume, setSolidsByVolume] = useState("")
  const [viscosity, setViscosity] = useState("")
  const [potLife, setPotLife] = useState("")
  const [specialFeatures, setSpecialFeatures] = useState<string[]>([""])

  // Kits specific fields
  const [content, setContent] = useState<string[]>([""])
  const [instructions, setInstructions] = useState<string[]>([""])

  // Technical Data (for abrazaderas and kits) - se convertirá en variantes
  const [technicalDataHeaders, setTechnicalDataHeaders] = useState<string[]>([])
  const [technicalDataRows, setTechnicalDataRows] = useState<string[][]>([[]])

  // Variantes (para productos sin tabla técnica o adicionales)
  const [variantes, setVariantes] = useState<Variante[]>([
    { codigo: "", descripcion: "", precio: 0, unidad: "UND" }
  ])

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

  const addVariante = () => {
    setVariantes(prev => [...prev, { codigo: "", descripcion: "", precio: 0, unidad: "UND" }])
  }

  const updateVariante = (index: number, field: keyof Variante, value: string | number) => {
    setVariantes(prev => {
      const newVariantes = [...prev]
      newVariantes[index] = { ...newVariantes[index], [field]: value }
      return newVariantes
    })
  }

  const removeVariante = (index: number) => {
    if (variantes.length > 1) {
      setVariantes(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!category) {
      setError("Por favor selecciona una categoría")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Preparar datos básicos del producto
      let productData: any = {
        name: name.trim(),
        description: description.trim(),
        category: category,
        applications: applications.filter(app => app.trim() !== ""),
        isActive: true
      }

      // Agregar metadatos específicos por categoría (para compatibilidad con el modelo legacy)
      if (category === "abrazaderas") {
        productData.image = image.trim() || undefined
        productData.metadata = {
          details: details.trim(),
          specs: specs.filter(spec => spec.trim() !== ""),
          materials: materials.filter(mat => mat.trim() !== "")
        }
      } else if (category === "epoxicos") {
        productData.image = imageUrl.trim() || undefined
        productData.metadata = {
          generic_type: genericType.trim(),
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
        productData.image = image.trim() || undefined
        productData.metadata = {
          specs: specs.filter(spec => spec.trim() !== ""),
          content: content.filter(item => item.trim() !== ""),
          instructions: instructions.filter(inst => inst.trim() !== "")
        }
      }

      // Generar variantes desde datos técnicos o usar variantes manuales
      let finalVariantes: Variante[] = []

      // Si hay datos técnicos, generar variantes desde ellos
      if (technicalDataHeaders.length > 0 && technicalDataRows.length > 0) {
        const validRows = technicalDataRows.filter(row =>
          row.some(cell => cell.trim() !== "")
        )

        validRows.forEach((row, index) => {
          let codigo = `${category.toUpperCase()}-${String(index + 1).padStart(3, '0')}`
          let descripcion = `${name.trim()}`

          // Usar primera columna como identificador principal
          if (technicalDataHeaders.length > 0 && row[0]) {
            descripcion += ` - ${technicalDataHeaders[0]}: ${row[0]}`
          }

          finalVariantes.push({
            codigo,
            descripcion,
            precio: 0, // Precio por defecto
            unidad: 'UND'
          })
        })
      } else {
        // Usar variantes manuales
        finalVariantes = variantes.filter(v =>
          v.codigo.trim() !== "" &&
          v.descripcion.trim() !== ""
        )
      }

      // Validar que hay al menos una variante
      if (finalVariantes.length === 0) {
        setError("Debes agregar al menos una variante válida o completar la tabla de datos técnicos")
        return
      }

      productData.variantes = finalVariantes

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(productData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(`Producto "${name}" creado exitosamente con ${finalVariantes.length} variantes`)

        // Reset form after successful creation
        setTimeout(() => {
          router.push('/admin/products')
        }, 2000)
      } else {
        setError(result.message || 'Error al crear el producto')
      }

    } catch (err) {
      console.error('Error creating product:', err)
      setError('Error de conexión. Verifica que el servidor esté funcionando.')
    } finally {
      setLoading(false)
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

  const renderVariantesInputs = () => (
    <div className="space-y-4">
      <Label>Variantes Manuales (Opcional)</Label>
      <p className="text-sm text-gray-600">
        Agrega variantes manuales si no tienes tabla de datos técnicos o quieres variantes adicionales.
      </p>
      {variantes.map((variante, index) => (
        <Card key={index} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                value={variante.codigo}
                onChange={(e) => updateVariante(index, 'codigo', e.target.value)}
                placeholder="SPU001"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={variante.descripcion}
                onChange={(e) => updateVariante(index, 'descripcion', e.target.value)}
                placeholder="Descripción de la variante"
              />
            </div>
            <div className="space-y-2">
              <Label>Precio</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={variante.precio}
                onChange={(e) => updateVariante(index, 'precio', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2 flex items-end">
              <div className="flex-1 space-y-2">
                <Label>Unidad</Label>
                <Select
                  value={variante.unidad}
                  onValueChange={(value) => updateVariante(index, 'unidad', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UND">UND</SelectItem>
                    <SelectItem value="KIT">KIT</SelectItem>
                    <SelectItem value="PZA">PZA</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeVariante(index)}
                disabled={variantes.length === 1}
                className="ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addVariante}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Agregar Variante Manual
      </Button>
    </div>
  )

  if (!admin) {
    return null
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Producto</h1>
              <p className="text-gray-600 mt-2">Agrega un nuevo producto al catálogo</p>
            </div>
          </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
            <CardDescription>
              Completa los datos del nuevo producto. Los campos marcados con * son obligatorios.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abrazaderas">Abrazaderas</SelectItem>
                    <SelectItem value="epoxicos">Epóxicos</SelectItem>
                    <SelectItem value="kits">Kits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {category && (
                <>
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
                        <p className="text-sm text-gray-600">
                          Completa la tabla técnica para generar variantes automáticamente, o usa las variantes manuales más abajo.
                        </p>

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
                        <p className="text-sm text-gray-600">
                          Completa la tabla técnica para generar variantes automáticamente, o usa las variantes manuales más abajo.
                        </p>

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

                  {/* Variantes Manuales - Para todas las categorías */}
                  <div className="border-t pt-6">
                    {renderVariantesInputs()}
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
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !category || !name.trim() || !description.trim()}
                  className="flex-1"
                >
                  {loading ? "Creando..." : "Crear Producto"}
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