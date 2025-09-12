"use client"

import { useAuth } from "@/contexts/AuthContext"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, Calendar } from "lucide-react"

export default function AdminDashboard() {
  const { admin } = useAuth()

  if (!admin) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-600 mt-2">Bienvenido al sistema de gestión Industrial IOT</p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Información del Administrador</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">{admin.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{admin.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <Badge variant="secondary" className="text-xs">
                    {admin.role}
                  </Badge>
                </div>
                {admin.lastLogin && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      Último acceso: {new Date(admin.lastLogin).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Activo</div>
              <p className="text-xs text-muted-foreground">
                Sistema operativo y funcional
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seguridad</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Seguro</div>
              <p className="text-xs text-muted-foreground">
                Autenticación JWT activa
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Rápido</CardTitle>
              <CardDescription>
                Funcionalidades principales del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full justify-start"
                variant="outline"
                onClick={() => window.location.href = '/admin/contacts'}
              >
                <Mail className="w-4 h-4 mr-2" />
                Gestionar Contactos
              </Button>
              <Button 
                className="w-full justify-start"
                variant="outline"
                onClick={() => window.location.href = '/admin/products'}
              >
                <User className="w-4 h-4 mr-2" />
                Gestionar Productos
              </Button>
              <Button 
                className="w-full justify-start"
                variant="outline"
                onClick={() => window.location.href = '/productos'}
              >
                <User className="w-4 h-4 mr-2" />
                Ver Catálogo Público
              </Button>
              <Button 
                className="w-full justify-start"
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                <Shield className="w-4 h-4 mr-2" />
                Ir al Sitio Principal
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
              <CardDescription>
                Detalles técnicos y configuración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Versión:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Framework:</span>
                <span className="font-medium">Next.js 14</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base de Datos:</span>
                <span className="font-medium">MongoDB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Autenticación:</span>
                <span className="font-medium">JWT + httpOnly Cookies</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  )
}