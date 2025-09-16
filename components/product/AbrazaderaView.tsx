"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useWhatsAppForm } from "@/hooks/useWhatsAppForm"
import { WhatsAppFormModal } from "@/components/WhatsAppFormModal"

interface Abrazadera {
  _id: string
  productId: number
  name: string
  description: string
  details: string
  image: string
  specs: string[]
  applications: string[]
  materials: string[]
  isActive: boolean
  technicalData?: {
    headers: string[]
    rows: string[][]
  }
}

interface AbrazaderaViewProps {
  product: Abrazadera
}

export function AbrazaderaView({ product }: AbrazaderaViewProps) {
  const [selected, setSelected] = useState<number[]>([])
  const { isModalOpen, currentMessageData, openWhatsAppForm, closeWhatsAppForm, sendToWhatsApp } = useWhatsAppForm()

  const handleQuote = () => {
    if (product) {
      openWhatsAppForm({
        type: 'product_selection',
        data: {
          selectedProducts: [{
            id: product._id,
            name: product.name,
            category: 'Abrazaderas',
            specifications: [
              `Aplicaciones: ${product.applications.join(', ')}`,
              `Especificaciones: ${product.specs.join(', ')}`
            ]
          }]
        }
      })
    }
  }

  const toggleRow = (index: number) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const handleSendSelected = () => {
    if (product?.technicalData && selected.length > 0) {
      const selectedItems = selected.map((i) => {
        const row = product.technicalData!.rows[i];
        return `${row[0]}: ${row[1]}`;
      });

      openWhatsAppForm({
        type: 'product_selection',
        data: {
          selectedProducts: [{
            id: product._id,
            name: product.name,
            category: 'Abrazaderas',
            specifications: selectedItems
          }]
        }
      })
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
      <p className="text-m text-muted-foreground mb-6">{product.description}</p>

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
            className="absolute top-2 left-2 w-50 h-auto opacity-80 rounded-sm"
          />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-6">
          <div>
            {product.details && (
              <div className="mb-4">
                <h2 className="text-2xl font-semibold mb-2">Detalles</h2>
                <p className=" text-gray-700 leading-relaxed">{product.details}</p>
              </div>
            )}

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

          {product.materials && product.materials.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-2">Materiales</h2>
              <div className=" rounded-md p-3 w-full max-w-full">
                <ul className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside">
                  {product.materials?.map((material, i) => (
                    <li key={i}>{material}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Botón de cotización general */}
      <div className="mt-8 pt-6 border-t">
        <Button onClick={handleQuote} className="w-full md:w-auto px-8 py-3">
          Solicitar Cotización por WhatsApp
        </Button>
      </div>

      {/* Medidas disponibles con selección */}
      {product.technicalData && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Datos Técnicos</h2>
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
                {product.technicalData.rows.map((row: string[], i: number) => (
                  <tr
                    key={i}
                    className={`hover:bg-gray-50 ${selected.includes(i) ? "bg-blue-50" : ""}`}
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
            onClick={handleSendSelected}
            disabled={selected.length === 0}
            className="mt-6"
          >
            Enviar selección ({selected.length})
          </Button>
        </div>
      )}

      {/* Modal de formulario WhatsApp */}
      {currentMessageData && (
        <WhatsAppFormModal
          isOpen={isModalOpen}
          onClose={closeWhatsAppForm}
          messageData={currentMessageData}
          onSend={sendToWhatsApp}
        />
      )}
    </div>
  )
}