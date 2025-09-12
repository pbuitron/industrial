"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"

// Importar datos locales
import abrazaderas from "@/data/abrazaderas.json"
import kits from "@/data/kits.json"
import epoxicos from "@/data/epoxicos.json"

export interface SearchProduct {
  id: string | number
  name: string
  description: string
  category: 'abrazaderas' | 'kits' | 'epoxicos'
  image?: string
  image_url?: string
  specs?: string[]
  applications?: string[]
  materials?: string[]
  generic_type?: string
  special_features?: string[]
}

export interface SearchFilters {
  category: string
  application: string
  material: string
  priceRange: string
  availability: string
}

export interface SearchResults {
  products: SearchProduct[]
  totalResults: number
  suggestedTerms: string[]
  categories: { [key: string]: number }
}

export function useSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Estados principales
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [filters, setFilters] = useState<SearchFilters>({
    category: searchParams.get('category') || '',
    application: searchParams.get('application') || '',
    material: searchParams.get('material') || '',
    priceRange: searchParams.get('priceRange') || '',
    availability: searchParams.get('availability') || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResults>({
    products: [],
    totalResults: 0,
    suggestedTerms: [],
    categories: {}
  })

  // Normalizar datos de productos
  const allProducts = useMemo(() => {
    const normalizedProducts: SearchProduct[] = []
    
    // Abrazaderas
    abrazaderas.forEach(product => {
      normalizedProducts.push({
        id: product.id,
        name: product.name,
        description: product.description,
        category: 'abrazaderas',
        image: product.image,
        specs: product.specs,
        applications: product.applications,
        materials: product.materials
      })
    })
    
    // Kits
    kits.forEach(product => {
      normalizedProducts.push({
        id: product.id,
        name: product.name,
        description: product.description,
        category: 'kits',
        image: product.image,
        specs: product.specs,
        applications: product.applications
      })
    })
    
    // Epóxicos
    epoxicos.forEach(product => {
      normalizedProducts.push({
        id: product.id,
        name: product.name,
        description: product.description,
        category: 'epoxicos',
        image_url: product.image_url,
        applications: product.applications,
        generic_type: product.generic_type,
        special_features: product.special_features
      })
    })
    
    return normalizedProducts
  }, [])

  // Función de búsqueda inteligente
  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    setIsLoading(true)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      let filteredProducts = [...allProducts]
      
      // Filtrar por texto
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase()
        const queryWords = queryLower.split(' ').filter(word => word.length > 0)
        
        filteredProducts = filteredProducts.filter(product => {
          const searchableText = [
            product.name,
            product.description,
            ...(product.specs || []),
            ...(product.applications || []),
            ...(product.materials || []),
            product.generic_type,
            ...(product.special_features || [])
          ].join(' ').toLowerCase()
          
          // Búsqueda exacta o por palabras
          return queryWords.every(word => searchableText.includes(word)) ||
                 searchableText.includes(queryLower)
        })
      }
      
      // Aplicar filtros
      if (searchFilters.category) {
        filteredProducts = filteredProducts.filter(product => 
          product.category === searchFilters.category
        )
      }
      
      if (searchFilters.application) {
        filteredProducts = filteredProducts.filter(product =>
          product.applications?.some(app => 
            app.toLowerCase().includes(searchFilters.application.toLowerCase())
          )
        )
      }
      
      if (searchFilters.material) {
        filteredProducts = filteredProducts.filter(product =>
          product.materials?.some(material => 
            material.toLowerCase().includes(searchFilters.material.toLowerCase())
          )
        )
      }
      
      // Generar sugerencias
      const suggestedTerms = generateSuggestions(searchQuery, filteredProducts)
      
      // Contar por categorías
      const categories = filteredProducts.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1
        return acc
      }, {} as { [key: string]: number })
      
      setResults({
        products: filteredProducts,
        totalResults: filteredProducts.length,
        suggestedTerms,
        categories
      })
      
    } catch (error) {
      console.error('Error en búsqueda:', error)
      setResults({
        products: [],
        totalResults: 0,
        suggestedTerms: [],
        categories: {}
      })
    } finally {
      setIsLoading(false)
    }
  }, [allProducts])

  // Generar sugerencias de búsqueda
  const generateSuggestions = (query: string, products: SearchProduct[]): string[] => {
    if (!query.trim() || products.length > 0) return []
    
    const allTerms = new Set<string>()
    
    allProducts.forEach(product => {
      // Agregar términos de nombres y descripciones
      const words = [
        ...product.name.split(' '),
        ...product.description.split(' '),
        ...(product.applications || []),
        ...(product.materials || [])
      ]
      
      words.forEach(word => {
        if (word.length > 2) {
          allTerms.add(word.toLowerCase())
        }
      })
    })
    
    const queryLower = query.toLowerCase()
    return Array.from(allTerms)
      .filter(term => term.includes(queryLower))
      .slice(0, 5)
  }

  // Obtener opciones para filtros
  const getFilterOptions = useCallback(() => {
    const applications = new Set<string>()
    const materials = new Set<string>()
    
    allProducts.forEach(product => {
      product.applications?.forEach(app => applications.add(app))
      product.materials?.forEach(material => materials.add(material))
    })
    
    return {
      categories: [
        { value: 'abrazaderas', label: 'Abrazaderas' },
        { value: 'kits', label: 'Kits de Reparación' },
        { value: 'epoxicos', label: 'Epóxicos' }
      ],
      applications: Array.from(applications).map(app => ({ value: app, label: app })),
      materials: Array.from(materials).map(material => ({ value: material, label: material }))
    }
  }, [allProducts])

  // Actualizar URL con parámetros de búsqueda
  const updateURL = useCallback((newQuery: string, newFilters: SearchFilters) => {
    const params = new URLSearchParams()
    
    if (newQuery.trim()) params.set('q', newQuery)
    if (newFilters.category) params.set('category', newFilters.category)
    if (newFilters.application) params.set('application', newFilters.application)
    if (newFilters.material) params.set('material', newFilters.material)
    if (newFilters.priceRange) params.set('priceRange', newFilters.priceRange)
    if (newFilters.availability) params.set('availability', newFilters.availability)
    
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search'
    router.push(newUrl, { scroll: false })
  }, [router])

  // Funciones públicas
  const search = useCallback((newQuery: string) => {
    setQuery(newQuery)
    performSearch(newQuery, filters)
    updateURL(newQuery, filters)
  }, [filters, performSearch, updateURL])

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    performSearch(query, updatedFilters)
    updateURL(query, updatedFilters)
  }, [filters, query, performSearch, updateURL])

  const clearSearch = useCallback(() => {
    setQuery('')
    setFilters({
      category: '',
      application: '',
      material: '',
      priceRange: '',
      availability: ''
    })
    setResults({
      products: [],
      totalResults: 0,
      suggestedTerms: [],
      categories: {}
    })
    router.push('/search')
  }, [router])

  // Autocompletado
  const getAutocompleteSuggestions = useCallback((searchTerm: string): string[] => {
    if (!searchTerm.trim()) return []
    
    const suggestions = new Set<string>()
    const termLower = searchTerm.toLowerCase()
    
    allProducts.forEach(product => {
      if (product.name.toLowerCase().includes(termLower)) {
        suggestions.add(product.name)
      }
      
      product.applications?.forEach(app => {
        if (app.toLowerCase().includes(termLower)) {
          suggestions.add(app)
        }
      })
    })
    
    return Array.from(suggestions).slice(0, 8)
  }, [allProducts])

  // Ejecutar búsqueda inicial al cargar
  useEffect(() => {
    if (query || Object.values(filters).some(filter => filter)) {
      performSearch(query, filters)
    }
  }, []) // Solo al montar el componente

  return {
    // Estados
    query,
    filters,
    results,
    isLoading,
    
    // Acciones
    search,
    updateFilters,
    clearSearch,
    
    // Utilidades
    getFilterOptions,
    getAutocompleteSuggestions
  }
}