import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

interface ResetPasswordPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params
  return <ResetPasswordForm token={token} />
}

export const metadata = {
  title: 'Restablecer Contraseña | Industrial IOT',
  description: 'Establece una nueva contraseña para tu cuenta de administrador',
}