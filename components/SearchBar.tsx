"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Loader2 } from "lucide-react"

interface SearchBarProps {
  placeholder?: string
  className?: string
}

export function SearchBar({ 
  placeholder = "Buscar productos...", 
  className = "" 
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch suggestions from API
  const fetchSuggestions = async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchTerm)}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setSuggestions(result.data)
        setShowSuggestions(result.data.length > 0)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change with debounce
  const handleInputChange = (value: string) => {
    setQuery(value)
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Set new timeout for API call
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)
  }

  // Handle search
  const handleSearch = (searchTerm?: string) => {
    const term = searchTerm || query
    if (term.trim()) {
      setShowSuggestions(false)
      router.push(`/search?q=${encodeURIComponent(term.trim())}`)
    }
  }

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true)
          }}
          onBlur={() => {
            // Delay to allow suggestion clicks
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          className="pl-10 pr-12 h-9"
        />
        
        <Button
          onClick={() => handleSearch()}
          disabled={isLoading || !query.trim()}
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          variant="ghost"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Search className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
          <CardContent className="p-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-muted rounded-md text-sm transition-colors flex items-center gap-2"
              >
                <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}