import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Productos Industriales | Abrazaderas, Epóxicos y Kits | SealPro Industrial',
  description: 'Catálogo completo de productos industriales: abrazaderas de alta presión, epóxicos de reparación y kits de mantenimiento. Certificaciones ASME. Cotización inmediata.',
  keywords: 'productos industriales, abrazaderas, epóxicos, kits reparación, sealpro, industrial, petroquímica, mantenimiento',
  openGraph: {
    title: 'Productos Industriales | SealPro',
    description: 'Catálogo completo de productos industriales certificados para la industria petroquímica y manufactura.',
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/productos`,
    siteName: 'SealPro Industrial',
    locale: 'es_MX',
    type: 'website',
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/productos`,
  }
}

export default function ProductosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}