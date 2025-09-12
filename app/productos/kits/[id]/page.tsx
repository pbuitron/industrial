"use client"

import { useState } from "react"
import { use } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Header } from "@/components/header"
import kits from "@/data/kits.json"

export default function KitDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const product = kits.find((p) => p.id === Number(id))

  const [selected, setSelected] = useState<number[]>([])
  const [open, setOpen] = useState(false)

  if (!product) return <div className="p-6">Producto no encontrado</div>

  const toggleRow = (index: number) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const handleSend = () => {
    const selectedItems = selected.map((i) => {
      const row = product.technicalData.rows[i];
      return `${row[0]}: ${row[1]}`;
    });
    console.log("Enviando selección al proveedor:", selectedItems)
    setOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto py-12 px-6">
        <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
        <p className="text-lg text-muted-foreground mb-6">{product.description}</p>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Imagen con logo superpuesto */}
          <div className="relative w-full md:w-1/2">
            <img
              src={product.image}
              alt={product.name}
              className="w-full rounded-lg shadow"
            />
            <img
              src="/Logo-azul.jpg"
              alt="Industrial IOT Logo"
              className="absolute top-2 left-2 w-80 h-auto opacity-80 rounded-sm"
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Características</h2>
              <ul className="list-disc pl-6 space-y-1">
                {product.specs?.map((spec, i) => (
                  <li key={i}>{spec}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">Aplicaciones</h2>
              <div className=" rounded-md p-3 w-full max-w-full">
                <ul className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside">
                  {product.applications?.map((app, i) => (
                    <li key={i}>{app}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">Resistencia</h2>
              <div className=" rounded-md p-3 w-full max-w-full">
                <ul className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside">
                  {product.resistencia?.map((app, i) => (
                    <li key={i}>{app}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Medidas disponibles con selección */}
        {product.technicalData && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Medidas Disponibles</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2"></th>
                    {product.technicalData.headers.map((h: string, i: number) => (
                      <th key={i} className="p-2 text-left border-b border-gray-300">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {product.technicalData.rows.map((row: any[], i: number) => (
                    <tr
                      key={i}
                      className={`hover:bg-gray-50 ${selected.includes(i) ? "bg-blue-50" : ""
                        }`}
                    >
                      <td className="p-2 border-b border-gray-200 text-center">
                        <input
                          type="checkbox"
                          checked={selected.includes(i)}
                          onChange={() => toggleRow(i)}
                          className="h-4 w-4"
                        />
                      </td>
                      {row.map((cell, j) => (
                        <td key={j} className="p-2 border-b border-gray-200">
                          {Array.isArray(cell) ? (
                            <ul className="list-disc pl-4 space-y-1">
                              {cell.map((item: string, idx: number) => (
                                <li key={idx} className="text-sm">{item}</li>
                              ))}
                            </ul>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              onClick={handleSend}
              disabled={selected.length === 0}
              className="mt-6"
            >
              Enviar selección ({selected.length})
            </Button>
          </div>
        )}

        {/* Modal de confirmación */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmación de Envío</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Has seleccionado las siguientes configuraciones:
              </p>
              <ul className="list-disc pl-6 text-sm text-gray-800">
                {selected.map((i) => (
                  <li key={i}>{product.technicalData.rows[i].join(" | ")}</li>
                ))}
              </ul>
              <Button
                onClick={() => {
                  console.log("Enviar a proveedor vía n8n (futuro)")
                  setOpen(false)
                }}
                className="w-full"
              >
                Enviar al Proveedor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
