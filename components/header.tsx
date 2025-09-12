"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Phone, Mail } from "lucide-react"
import { SearchBar } from "@/components/SearchBar"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  
  // Detectar si estamos en una página que NO es la homepage
  const isNotHomePage = pathname !== '/' && pathname !== null
  
  const navigation = [
    { name: "Inicio", href: isNotHomePage ? "/#inicio" : "#inicio" },
    { name: "Productos", href: isNotHomePage ? "/#productos" : "#productos" },
    { name: "Aplicaciones", href: isNotHomePage ? "/#aplicaciones" : "#aplicaciones" },
    { name: "Nosotros", href: isNotHomePage ? "/#nosotros" : "#nosotros" },
    { name: "Contacto", href: isNotHomePage ? "/#contacto" : "#contacto" },
  ]

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+51 936 312 086</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@industrial-iot.us</span>
              </div>
            </div>
            <div className="hidden md:block">
              <span>Soluciones industriales de confianza</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              INDUSTRIAL IOT
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <SearchBar 
              placeholder="Buscar productos..."
              className="w-64"
            />
            
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="space-y-4">
              <SearchBar 
                placeholder="Buscar productos..."
                className="w-full"
              />
              <nav className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-foreground hover:text-primary transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <Button className="mt-4 w-full">Solicitar Cotización</Button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
