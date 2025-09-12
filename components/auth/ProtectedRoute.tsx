"use client"

import { useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Lock } from "lucide-react"

interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = "/auth/login" }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, admin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('🛡️ ProtectedRoute - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'admin:', !!admin);
    if (!isLoading && !isAuthenticated) {
      console.log('🔄 ProtectedRoute - Redirigiendo a login');
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Verificando autenticación...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="w-8 h-8 text-red-600 mb-4" />
            <p className="text-gray-600">Acceso no autorizado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}