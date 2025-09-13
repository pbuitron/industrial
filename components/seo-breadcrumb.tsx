"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface BreadcrumbItemData {
  label: string
  href?: string
  isCurrentPage?: boolean
}

interface SEOBreadcrumbProps {
  items?: BreadcrumbItemData[]
  productName?: string
  className?: string
}

export function SEOBreadcrumb({ items, productName, className }: SEOBreadcrumbProps) {
  const pathname = usePathname()
  
  // Generar breadcrumbs automáticamente si no se proporcionan
  const breadcrumbItems = React.useMemo(() => {
    if (items) return items
    
    const pathSegments = pathname.split('/').filter(Boolean)
    const autoItems: BreadcrumbItemData[] = []

    // Mapear segmentos a labels legibles
    const segmentMap: Record<string, string> = {
      'productos': 'Productos',
      'abrazaderas': 'Abrazaderas',
      'epoxicos': 'Epóxicos',
      'kits': 'Kits de Reparación',
      'search': 'Buscar Productos',
      'admin': 'Administración'
    }

    let currentPath = ''
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Skip dynamic segments (IDs) pero incluir el nombre del producto si está disponible
      if (segment.match(/^[0-9a-f]{24}$|^\d+$/)) {
        if (productName) {
          autoItems.push({
            label: productName,
            isCurrentPage: true
          })
        }
        return
      }

      const label = segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      
      autoItems.push({
        label,
        href: currentPath,
        isCurrentPage: index === pathSegments.length - 1 && !productName
      })
    })

    return autoItems
  }, [pathname, items, productName])

  return (
    <>
      {/* Schema markup para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Inicio",
                "item": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/`
              },
              ...breadcrumbItems.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 2,
                "name": item.label,
                ...(item.href && { 
                  "item": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${item.href}` 
                })
              }))
            ]
          })
        }}
      />
      
      <Breadcrumb className={className}>
        <BreadcrumbList>
          {/* Home */}
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="flex items-center">
                <Home className="h-4 w-4 mr-1" />
                <span className="sr-only sm:not-sr-only">Inicio</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {item.href && !item.isCurrentPage ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  )
}

// Hook para usar en páginas
export function useBreadcrumbs(productName?: string) {
  const pathname = usePathname()
  
  return React.useMemo(() => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const items: BreadcrumbItemData[] = []

    const segmentMap: Record<string, string> = {
      'productos': 'Productos',
      'abrazaderas': 'Abrazaderas',
      'epoxicos': 'Epóxicos', 
      'kits': 'Kits de Reparación',
      'search': 'Buscar Productos'
    }

    let currentPath = ''
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      if (segment.match(/^[0-9a-f]{24}$|^\d+$/)) {
        if (productName) {
          items.push({
            label: productName,
            isCurrentPage: true
          })
        }
        return
      }

      const label = segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      
      items.push({
        label,
        href: currentPath,
        isCurrentPage: index === pathSegments.length - 1 && !productName
      })
    })

    return items
  }, [pathname, productName])
}