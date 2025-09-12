import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

interface ResetPasswordPageProps {
  params: {
    token: string
  }
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  return <ResetPasswordForm token={params.token} />
}

export const metadata = {
  title: 'Restablecer Contraseña | Industrial IOT',
  description: 'Establece una nueva contraseña para tu cuenta de administrador',
}