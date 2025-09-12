import { AuthProvider } from "@/contexts/AuthContext"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

export const metadata = {
  title: 'Autenticación | Industrial IOT',
  description: 'Sistema de autenticación para administradores',
}