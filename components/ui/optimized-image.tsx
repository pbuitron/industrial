"use client"

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  sizes = '100vw',
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isInView, setIsInView] = useState(true) // Temporalmente siempre true para debuggear
  const imgRef = useRef<HTMLImageElement>(null)

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (priority) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px'
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  // Generar srcSet para responsive images (deshabilitado temporalmente)
  const generateSrcSet = (baseSrc: string) => {
    // Deshabilitamos srcSet para evitar buscar imágenes que no existen
    // Las imágenes de Mongo como /sealproB.jpg no tienen versiones responsive
    return undefined
  }

  const handleLoad = () => {
    console.log('✅ Image loaded successfully:', src)
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    console.warn('❌ Image failed to load:', src)
    setIsError(true)
    onError?.()
  }

  // Placeholder para imagen por defecto
  const defaultBlurDataURL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+'

  return (
    <>
      {/* Imagen principal - simplificada para debug */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        crossOrigin={src.includes('://') ? 'anonymous' : undefined}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-50",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />

      {/* Fallback para errores */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <div className="text-center">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm">Error al cargar imagen</p>
          </div>
        </div>
      )}
    </>
  )
}