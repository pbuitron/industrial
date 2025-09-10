import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Industrial Iot - Abrazaderas y Kits de Reparación de fugas SealPRO - Epóxicos Arcor Epoxy Technologies",
  description:
    "Soluciones industriales profesionales: abrazaderas industriales, kits para reparar fugas y epóxicos para recubrir metales. Calidad y confianza para su empresa.",
  generator: "v0.app",
  keywords: "abrazaderas industriales, kits reparación fugas, epóxicos metales, soluciones industriales",
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
