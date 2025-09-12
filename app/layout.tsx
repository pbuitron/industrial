import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "SealPro Industrial - Abrazaderas Industriales, Kits de Reparación y Epóxicos para Metales",
  description:
    "Soluciones industriales profesionales: abrazaderas industriales SealPro, kits para reparar fugas y epóxicos Arcor para recubrir metales. Calidad y confianza para su empresa.",
  keywords: [
    "abrazaderas industriales",
    "kits reparación fugas", 
    "epóxicos metales",
    "soluciones industriales",
    "sealpro",
    "arcor epoxy",
    "conexiones industriales",
    "tubería industrial",
    "sellado industrial"
  ].join(", "),
  authors: [{ name: "SealPro Industrial" }],
  creator: "SealPro Industrial",
  publisher: "SealPro Industrial",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    siteName: 'SealPro Industrial',
    title: 'SealPro Industrial - Soluciones Industriales Profesionales',
    description: 'Abrazaderas industriales, kits de reparación de fugas y epóxicos para metales. Calidad y confianza para su empresa.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SealPro Industrial - Soluciones Industriales',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SealPro Industrial - Soluciones Industriales Profesionales',
    description: 'Abrazaderas industriales, kits de reparación de fugas y epóxicos para metales.',
    images: ['/og-image.jpg'],
  },
  verification: {
    // google: 'your-google-verification-code', // Agregar cuando tengas el código
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
