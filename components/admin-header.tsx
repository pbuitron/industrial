"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  LayoutDashboard, 
  Package, 
  Mail, 
  Users,
  LogOut, 
  User,
  Settings,
  Home,
  Menu,
  X
} from "lucide-react"

interface AdminNavItem {
  href: string
  label: string
  icon: React.ReactNode
  description?: string
}

const navItems: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
    description: "Panel principal"
  },
  {
    href: "/admin/products",
    label: "Productos",
    icon: <Package className="w-4 h-4" />,
    description: "Gestión de catálogo"
  },
  {
    href: "/admin/contacts",
    label: "Contactos",
    icon: <Mail className="w-4 h-4" />,
    description: "Mensajes recibidos"
  }
]

export function AdminHeader() {
  const { admin, logout } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  const isActiveRoute = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  if (!admin) {
    return null
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Panel Admin
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Industrial IOT
                </p>
              </div>
            </div>
          </div>

          {/* Navegación principal - Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = isActiveRoute(item.href)
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center space-x-2 ${
                      isActive 
                        ? "bg-blue-600 text-white hover:bg-blue-700" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Área de usuario y acciones */}
          <div className="flex items-center space-x-3">
            {/* Link al sitio principal */}
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Sitio Web</span>
              </Button>
            </Link>

            {/* Información del usuario */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-full">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {admin.name}
              </span>
              <Badge variant="secondary" className="text-xs">
                {admin.role}
              </Badge>
            </div>

            {/* Botón de logout */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:ml-2 sm:inline">Salir</span>
            </Button>

            {/* Menú móvil - Toggle */}
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="outline"
              size="sm"
              className="md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Menú móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = isActiveRoute(item.href)
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}>
                      {item.icon}
                      <div>
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className={`text-xs ${
                            isActive ? "text-blue-100" : "text-gray-500"
                          }`}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
              
              {/* Separador */}
              <div className="border-t border-gray-200 my-2"></div>
              
              {/* Links adicionales en móvil */}
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100">
                  <Home className="w-4 h-4" />
                  <span>Ver Sitio Web</span>
                </div>
              </Link>
              
              {/* Info de usuario en móvil */}
              <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-md">
                <User className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                  <div className="text-xs text-gray-500">{admin.email}</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {admin.role}
                </Badge>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}