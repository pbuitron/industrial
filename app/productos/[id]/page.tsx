"use client"

import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getProductById, getRelatedProducts } from "@/lib/products"
//import React from "react"

interface ProductDetailProps {
  params: { id: string }
}

export default function ProductDetail({ params }: ProductDetailProps) {
const { id } = params // ⬅️ Usar React.use() para unwrap params
  const product = getProductById(id)

  if (!product) return notFound()

  const related = getRelatedProducts(product)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* principal */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-muted aspect-square flex items-center justify-center">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            width={500}
            height={500}
            className="object-contain rounded-lg"
          />
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <p className="text-lg text-muted-foreground mb-6">{product.description}</p>

            <h3 className="font-semibold text-xl mb-2">Especificaciones:</h3>
            <ul className="list-disc list-inside mb-6 space-y-1">
              {product.specs.map((spec, index) => (
                <li key={index}>{spec}</li>
              ))}
            </ul>

            <h3 className="font-semibold text-xl mb-2">Aplicaciones:</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {product.applications.map((app, index) => (
                <Badge key={index} variant="secondary">
                  {app}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/#contacto">Solicitar Cotización</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* tabla */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Ficha Técnica</h2>
        <table className="w-full border border-border rounded-lg overflow-hidden">
          <tbody>
            {product.specs.map((spec, i) => (
              <tr key={i} className="odd:bg-muted/40">
                <td className="p-3 font-medium border border-border w-1/3">{`Propiedad ${i + 1}`}</td>
                <td className="p-3 border border-border">{spec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* relacionados */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Otros productos de la misma categoría</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {related.map((item) => (
              <Link key={item.id} href={`/productos/${item.id}`}>
                <div className="border border-border rounded-lg p-4 hover:shadow-md transition">
                  <div className="aspect-video bg-muted mb-4">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      width={300}
                      height={200}
                      className="object-contain w-full h-full rounded-md"
                    />
                  </div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
