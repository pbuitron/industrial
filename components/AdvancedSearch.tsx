"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  ArrowRight,
  Tag
} from "lucide-react"
import { useSearch, SearchProduct } from "@/hooks/useSearch"
import Link from "next/link"

interface AdvancedSearchProps {
  placeholder?: string
  showFilters?: boolean
  compact?: boolean
  autoFocus?: boolean
}

export function AdvancedSearch({ 
  placeholder = "Buscar productos industriales...",
  showFilters = true,
  compact = false,
  autoFocus = false
}: AdvancedSearchProps) {
  const {
    query,
    filters,
    results,
    isLoading,
    search,
    updateFilters,
    clearSearch,
    getFilterOptions,
    getAutocompleteSuggestions
  } = useSearch()

  const [inputValue, setInputValue] = useState(query)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const filterOptions = getFilterOptions()

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Manejar cambio en input con debounce para sugerencias
  const handleInputChange = (value: string) => {
    setInputValue(value)
    
    // Clear previous timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current)
    }
    
    // Set new timeout for suggestions
    suggestionTimeoutRef.current = setTimeout(() => {
      if (value.trim().length > 1) {
        const newSuggestions = getAutocompleteSuggestions(value)
        setSuggestions(newSuggestions)
        setShowSuggestions(newSuggestions.length > 0)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)
  }

  // Ejecutar búsqueda
  const handleSearch = (searchTerm?: string) => {
    const term = searchTerm || inputValue
    search(term)
    setShowSuggestions(false)
    setInputValue(term)
  }

  // Manejar Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Limpiar búsqueda
  const handleClear = () => {
    setInputValue('')
    clearSearch()
    setShowSuggestions(false)
    setSuggestions([])
  }

  // Contar filtros activos
  const activeFiltersCount = Object.values(filters).filter(filter => filter).length

  // Obtener categoría display name
  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'abrazaderas': 'Abrazaderas',
      'kits': 'Kits de Reparación',
      'epoxicos': 'Epóxicos'
    }
    return categoryMap[category] || category
  }

  // Generar URL del producto
  const getProductUrl = (product: SearchProduct) => {
    return `/productos/${product.category}/${product.id}`
  }

  return (
    <div className="w-full space-y-4">
      {/* Barra de búsqueda principal */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true)
            }}
            onBlur={() => {
              // Delay para permitir clicks en sugerencias
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            className={`pl-10 pr-20 ${compact ? 'h-10' : 'h-12'}`}
          />
          
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            {inputValue && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              onClick={() => handleSearch()}
              disabled={isLoading}
              size="sm"
              className="h-8"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Sugerencias de autocompletado */}
        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
            <CardContent className="p-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-muted rounded-md text-sm transition-colors"
                >
                  <Search className="inline h-3 w-3 mr-2 text-muted-foreground" />
                  {suggestion}
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filtros avanzados */}
      {showFilters && (
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros Avanzados
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
                {filtersOpen ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({
                  category: '',
                  application: '',
                  material: '',
                  priceRange: '',
                  availability: ''
                })}
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>

          <CollapsibleContent className="space-y-4">
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Filtro de categoría */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoría</label>
                  <Select
                    value={filters.category || 'all'}
                    onValueChange={(value) => updateFilters({ category: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {filterOptions.categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de aplicación */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Aplicación</label>
                  <Select
                    value={filters.application || 'all'}
                    onValueChange={(value) => updateFilters({ application: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las aplicaciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las aplicaciones</SelectItem>
                      {filterOptions.applications.slice(0, 10).map((app) => (
                        <SelectItem key={app.value} value={app.value}>
                          {app.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de material */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Material</label>
                  <Select
                    value={filters.material || 'all'}
                    onValueChange={(value) => updateFilters({ material: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los materiales" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los materiales</SelectItem>
                      {filterOptions.materials.slice(0, 10).map((material) => (
                        <SelectItem key={material.value} value={material.value}>
                          {material.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Filtros activos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {getCategoryDisplayName(filters.category)}
              <button onClick={() => updateFilters({ category: '' })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.application && (
            <Badge variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {filters.application}
              <button onClick={() => updateFilters({ application: '' })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.material && (
            <Badge variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {filters.material}
              <button onClick={() => updateFilters({ material: '' })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Resultados de búsqueda */}
      {(query || activeFiltersCount > 0) && (
        <div className="space-y-4">
          {/* Información de resultados */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando...
                </div>
              ) : (
                `${results.totalResults} producto${results.totalResults !== 1 ? 's' : ''} encontrado${results.totalResults !== 1 ? 's' : ''}`
              )}
            </div>
            
            {/* Contadores por categoría */}
            {Object.keys(results.categories).length > 0 && (
              <div className="flex gap-2">
                {Object.entries(results.categories).map(([category, count]) => (
                  <Badge key={category} variant="outline" className="text-xs">
                    {getCategoryDisplayName(category)}: {count}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Lista de productos */}
          {results.products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.products.map((product) => (
                <Card key={`${product.category}-${product.id}`} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                      <img 
                        src={product.image || product.image_url || '/placeholder-product.jpg'} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {getCategoryDisplayName(product.category)}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                      
                      {product.applications && product.applications.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {product.applications.slice(0, 2).map((app, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {app}
                            </Badge>
                          ))}
                          {product.applications.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{product.applications.length - 2} más
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <Link href={getProductUrl(product)}>
                        <Button size="sm" className="w-full mt-2">
                          Ver Detalles
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !isLoading && (query || activeFiltersCount > 0) && (
            <Card className="p-8 text-center">
              <div className="space-y-4">
                <Search className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-semibold mb-2">No se encontraron productos</h3>
                  <p className="text-muted-foreground text-sm">
                    Intenta con otros términos de búsqueda o ajusta los filtros
                  </p>
                </div>
                
                {results.suggestedTerms.length > 0 && (
                  <div>
                    <p className="text-sm mb-2">Términos sugeridos:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {results.suggestedTerms.map((term) => (
                        <Button
                          key={term}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSearch(term)}
                        >
                          {term}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}