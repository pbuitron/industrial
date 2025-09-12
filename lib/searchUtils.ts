// Utilidades para mejorar la búsqueda
export class SearchUtils {
  
  // Palabras comunes que se pueden ignorar en búsquedas
  static STOP_WORDS = new Set([
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su',
    'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las', 'una', 'como', 'pero', 'sus', 'han',
    'the', 'of', 'and', 'a', 'to', 'in', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on'
  ])

  // Sinónimos y términos relacionados para mejorar búsquedas
  static SYNONYMS = new Map([
    ['reparacion', ['reparación', 'arreglo', 'compostura', 'fix', 'repair']],
    ['repair', ['reparación', 'reparacion', 'arreglo', 'compostura']],
    ['tuberia', ['tubería', 'tubo', 'pipe', 'pipeline', 'conducto']],
    ['pipe', ['tubería', 'tuberia', 'tubo', 'conducto']],
    ['fuga', ['leak', 'goteo', 'escape', 'derrame']],
    ['leak', ['fuga', 'goteo', 'escape', 'derrame']],
    ['presion', ['presión', 'pressure']],
    ['pressure', ['presión', 'presion']],
    ['acero', ['steel', 'metalico', 'metálico']],
    ['steel', ['acero', 'metalico', 'metálico']],
    ['quimico', ['químico', 'chemical']],
    ['chemical', ['químico', 'quimico']],
    ['industrial', ['industria', 'factory', 'plant']],
    ['emergencia', ['emergency', 'urgente', 'rapido', 'rápido']],
    ['emergency', ['emergencia', 'urgente', 'rapido', 'rápido']],
    ['resistente', ['resistant', 'duradero', 'fuerte']],
    ['resistant', ['resistente', 'duradero', 'fuerte']]
  ])

  // Expansión de términos de búsqueda con sinónimos
  static expandSearchTerms(query: string): string[] {
    const terms = this.tokenize(query)
    const expandedTerms = new Set(terms)

    terms.forEach(term => {
      const normalizedTerm = this.normalize(term)
      if (this.SYNONYMS.has(normalizedTerm)) {
        this.SYNONYMS.get(normalizedTerm)?.forEach(synonym => {
          expandedTerms.add(synonym)
        })
      }
    })

    return Array.from(expandedTerms)
  }

  // Tokenizar y limpiar términos de búsqueda
  static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\sáéíóúñü]/g, ' ') // Conservar caracteres españoles
      .split(/\s+/)
      .filter(word => word.length > 1 && !this.STOP_WORDS.has(word))
  }

  // Normalizar texto (quitar acentos y convertir a minúsculas)
  static normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .trim()
  }

  // Calcular similitud entre dos strings (algoritmo Jaccard)
  static calculateSimilarity(str1: string, str2: string): number {
    const set1 = new Set(this.tokenize(str1))
    const set2 = new Set(this.tokenize(str2))
    
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    return intersection.size / union.size
  }

  // Generar sugerencias de corrección ortográfica simple
  static generateSpellingSuggestions(word: string, dictionary: string[]): string[] {
    const suggestions: { word: string, distance: number }[] = []
    const maxDistance = Math.min(2, Math.floor(word.length / 3))

    dictionary.forEach(dictWord => {
      const distance = this.levenshteinDistance(word.toLowerCase(), dictWord.toLowerCase())
      if (distance <= maxDistance && distance > 0) {
        suggestions.push({ word: dictWord, distance })
      }
    })

    return suggestions
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(s => s.word)
  }

  // Calcular distancia de Levenshtein para corrección ortográfica
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  // Resaltar términos de búsqueda en texto
  static highlightSearchTerms(text: string, searchTerms: string[]): string {
    let highlightedText = text
    
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
    })

    return highlightedText
  }

  // Generar filtros inteligentes basados en la consulta
  static generateSmartFilters(query: string): { [key: string]: string[] } {
    const filters: { [key: string]: string[] } = {
      materials: [],
      applications: [],
      features: []
    }

    const normalizedQuery = this.normalize(query)
    
    // Detectar materiales
    if (normalizedQuery.includes('acero')) {
      filters.materials.push('Acero inoxidable', 'Acero al carbón')
    }
    if (normalizedQuery.includes('plastico') || normalizedQuery.includes('plastic')) {
      filters.materials.push('Plástico', 'PVC', 'Polietileno')
    }

    // Detectar aplicaciones
    if (normalizedQuery.includes('tuberia') || normalizedQuery.includes('pipe')) {
      filters.applications.push('Tuberías', 'Sistemas de tuberías')
    }
    if (normalizedQuery.includes('fuga') || normalizedQuery.includes('leak')) {
      filters.applications.push('Reparación de fugas', 'Sellado de fugas')
    }

    // Detectar características
    if (normalizedQuery.includes('alta') && normalizedQuery.includes('presion')) {
      filters.features.push('Alta presión')
    }
    if (normalizedQuery.includes('resistente')) {
      filters.features.push('Resistente a químicos', 'Resistente a temperatura')
    }
    if (normalizedQuery.includes('emergencia') || normalizedQuery.includes('emergency')) {
      filters.features.push('Reparación rápida', 'Instalación sin soldadura')
    }

    return filters
  }

  // Formatear sugerencias de búsqueda
  static formatSearchSuggestions(suggestions: string[], maxLength: number = 50): string[] {
    return suggestions
      .map(suggestion => {
        if (suggestion.length > maxLength) {
          return suggestion.substring(0, maxLength) + '...'
        }
        return suggestion
      })
      .slice(0, 8) // Limitar a 8 sugerencias
  }

  // Validar y limpiar parámetros de búsqueda
  static sanitizeSearchParams(params: { [key: string]: any }): { [key: string]: string } {
    const sanitized: { [key: string]: string } = {}
    
    // Lista de parámetros permitidos
    const allowedParams = ['q', 'category', 'application', 'material', 'page', 'limit', 'sortBy', 'sortOrder']
    
    allowedParams.forEach(param => {
      if (params[param] && typeof params[param] === 'string') {
        // Limpiar caracteres peligrosos
        sanitized[param] = params[param]
          .replace(/[<>'"]/g, '') // Remover caracteres HTML peligrosos
          .substring(0, 100) // Limitar longitud
          .trim()
      }
    })

    // Validar valores específicos
    if (sanitized.category && !['abrazaderas', 'kits', 'epoxicos'].includes(sanitized.category)) {
      delete sanitized.category
    }

    if (sanitized.sortBy && !['name', 'createdAt', 'updatedAt'].includes(sanitized.sortBy)) {
      sanitized.sortBy = 'name'
    }

    if (sanitized.sortOrder && !['asc', 'desc'].includes(sanitized.sortOrder)) {
      sanitized.sortOrder = 'asc'
    }

    if (sanitized.limit) {
      const limit = parseInt(sanitized.limit)
      sanitized.limit = Math.min(Math.max(limit, 1), 100).toString()
    }

    if (sanitized.page) {
      const page = parseInt(sanitized.page)
      sanitized.page = Math.max(page, 1).toString()
    }

    return sanitized
  }

  // Generar breadcrumbs para navegación de búsqueda
  static generateSearchBreadcrumbs(query: string, filters: { [key: string]: string }): Array<{ label: string, url: string }> {
    const breadcrumbs = [
      { label: 'Inicio', url: '/' },
      { label: 'Búsqueda', url: '/search' }
    ]

    if (query) {
      breadcrumbs.push({ label: `"${query}"`, url: `/search?q=${encodeURIComponent(query)}` })
    }

    if (filters.category) {
      const categoryLabels: { [key: string]: string } = {
        abrazaderas: 'Abrazaderas',
        kits: 'Kits de Reparación',
        epoxicos: 'Epóxicos'
      }
      breadcrumbs.push({ 
        label: categoryLabels[filters.category], 
        url: `/search?category=${filters.category}` 
      })
    }

    return breadcrumbs
  }
}

export default SearchUtils