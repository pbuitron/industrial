"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Package, 
  Search,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  AlertCircle,
  CheckCircle
} from "lucide-react"

interface Product {
  _id: string
  productId: string | number
  name: string
  description: string
  image?: string
  image_url?: string
  applications: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminProductsPage() {
  const { admin } = useAuth()
  const [products, setProducts] = useState<{
    abrazaderas: Product[]
    epoxicos: Product[]
    kits: Product[]
  }>({
    abrazaderas: [],
    epoxicos: [],
    kits: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchAllProducts()
  }, [])

  const fetchAllProducts = async () => {
    try {
      setLoading(true)
      setError("")

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const [abrazaderasRes, epoxicosRes, kitsRes] = await Promise.all([
        fetch(`${baseUrl}/api/products/abrazaderas?includeInactive=true`, {
          credentials: 'include'
        }),
        fetch(`${baseUrl}/api/products/epoxicos?includeInactive=true`, {
          credentials: 'include'
        }),
        fetch(`${baseUrl}/api/products/kits?includeInactive=true`, {
          credentials: 'include'
        })
      ])

      const [abrazaderasData, epoxicosData, kitsData] = await Promise.all([
        abrazaderasRes.json(),
        epoxicosRes.json(),
        kitsRes.json()
      ])

      setProducts({
        abrazaderas: abrazaderasData.success ? abrazaderasData.data : [],
        epoxicos: epoxicosData.success ? epoxicosData.data : [],
        kits: kitsData.success ? kitsData.data : []
      })

    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Error al cargar productos. Verifica que el servidor esté funcionando.')
    } finally {
      setLoading(false)
    }
  }

  const getTotalProducts = () => {
    return products.abrazaderas.length + products.epoxicos.length + products.kits.length
  }

  const getActiveProducts = () => {
    return products.abrazaderas.filter(p => p.isActive).length +
           products.epoxicos.filter(p => p.isActive).length +
           products.kits.filter(p => p.isActive).length
  }

  const renderProductCard = (product: Product, category: string) => (
    <Card key={product._id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>ID: {product.productId}</span>
              <span>•</span>
              <span>Aplicaciones: {product.applications.length}</span>
              {(product.image || product.image_url) && (
                <>
                  <span>•</span>
                  <ExternalLink className="w-3 h-3" />
                  <span>Con imagen</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/productos/${category}/${product.productId}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.href = `/admin/products/edit/${category}/${product.productId}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-gray-400">
          Actualizado: {new Date(product.updatedAt).toLocaleDateString('es-ES')}
        </div>
      </CardContent>
    </Card>
  )

  const renderCategoryTab = (category: keyof typeof products, title: string, icon: React.ReactNode) => {
    const categoryProducts = products[category]
    const filteredProducts = searchTerm 
      ? categoryProducts.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : categoryProducts

    return (
      <TabsContent value={category} className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-2xl font-bold">{title}</h2>
            <Badge variant="outline">
              {filteredProducts.length} productos
            </Badge>
          </div>
          
          <Button 
            className="flex items-center gap-2"
            onClick={() => window.location.href = '/admin/products/new'}
          >
            <Plus className="w-4 h-4" />
            Nuevo {title.slice(0, -1)}
          </Button>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'No se encontraron productos' : `No hay ${title.toLowerCase()} registradas`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map(product => renderProductCard(product, category))}
          </div>
        )}
      </TabsContent>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando productos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
              <p className="text-gray-600 mt-2">Administra el catálogo de productos Industrial IOT</p>
            </div>
            
            <div className="text-sm text-gray-500">
              <span className="font-medium">{getActiveProducts()}</span> activos de {getTotalProducts()} productos
            </div>
          </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="abrazaderas" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Abrazaderas ({products.abrazaderas.length})
            </TabsTrigger>
            <TabsTrigger value="epoxicos" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Epóxicos ({products.epoxicos.length})
            </TabsTrigger>
            <TabsTrigger value="kits" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Kits ({products.kits.length})
            </TabsTrigger>
          </TabsList>

          {/* Barra de búsqueda */}
          {activeTab !== "overview" && (
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Abrazaderas</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{products.abrazaderas.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {products.abrazaderas.filter(p => p.isActive).length} activas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Epóxicos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{products.epoxicos.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {products.epoxicos.filter(p => p.isActive).length} activos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Kits</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{products.kits.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {products.kits.filter(p => p.isActive).length} activos
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Estado del Catálogo</CardTitle>
                <CardDescription>
                  Información general sobre los productos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Sistema de productos</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    Operativo
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total de productos:</span>
                    <span className="font-medium ml-2">{getTotalProducts()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Productos activos:</span>
                    <span className="font-medium ml-2">{getActiveProducts()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {renderCategoryTab("abrazaderas", "Abrazaderas", <Package className="w-5 h-5" />)}
          {renderCategoryTab("epoxicos", "Epóxicos", <Package className="w-5 h-5" />)}
          {renderCategoryTab("kits", "Kits", <Package className="w-5 h-5" />)}
        </Tabs>
      </div>
      </div>
    </div>
  )
}