import { Header } from "@/components/header"
import epoxicos from "@/data/epoxicos.json"
import { Button } from "@/components/ui/button"
import Link from "next/link"  
export default async function EpoxicoDetail({ params }: { params: { id: string } }) {
  const { id } = await params // 👈 aquí esperamos params
  const product = epoxicos.find((p) => String(p.id) === String(id))
  
  if (!product) {
    return <div className="p-10">Epóxico no encontrado</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto py-20 px-4">
        <h1 className="text-3xl font-bold mb-6">{product.name}</h1>
        <p className="text-lg text-muted-foreground mb-6">{product.generic_type}</p>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Imagen con logo superpuesto */}
          <div className="relative w-full md:w-1/2">
            <img src={product.image_url} alt={product.name} className="w-full rounded-lg shadow" />
            <img
              src="/Logo-azul.jpg"
              alt="Industrial IOT Logo"
              className="absolute bottom-2 right-2 w-16 h-auto opacity-80 rounded-sm"
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Descripción</h2>
              <p className="text-sm text-justify text-gray-700">{product.description}</p>
            </div>

            {product.specifications && (
              <div>
                <h2 className="text-2xl font-semibold mb-2">Especificaciones</h2>
                <ul className="text-sm list-disc pl-6 space-y-1">
                  {product.specifications.colors && (
                    <li>Colores disponibles: {product.specifications.colors.join(', ')}</li>
                  )}
                  {product.specifications.shelf_life && (
                    <li>Vida útil: {product.specifications.shelf_life}</li>
                  )}
                  {product.specifications.mix_ratio && (
                    <li>Relación de mezcla: {product.specifications.mix_ratio}</li>
                  )}
                  {product.specifications.solids_by_volume && (
                    <li>Sólidos por volumen: {product.specifications.solids_by_volume}</li>
                  )}
                  {product.specifications.viscosity && (
                    <li>Viscosidad: {product.specifications.viscosity}</li>
                  )}
                  {product.specifications.pot_life && (
                    <li>Vida en envase: {product.specifications.pot_life}</li>
                  )}
                </ul>
              </div>
              
            )}
            <div className="flex gap-2 pt-4">
                      <Link href={`${product.product_url}`} className="flex-1" target="_blank" rel="noopener noreferrer">
                        <Button className="w-full">Ir a la página ARCOR</Button>
                      </Link>
                      
                    </div>
          </div>
        </div>

        {/* Aplicaciones */}
        {product.applications && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Aplicaciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {product.applications.map((app, i) => (
                <div key={i} className="bg-gray-50 p-2 rounded text-sm">{app}</div>
              ))}
            </div>
          </div>
        )}

        {/* Resistencia a la temperatura */}
        {product.temperature_resistance && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Resistencia a la Temperatura</h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <ul className="text-sm space-y-1">
                {product.temperature_resistance.immersion_max && (
                  <li><strong>Inmersión máxima:</strong> {product.temperature_resistance.immersion_max}</li>
                )}
                {product.temperature_resistance.dry_max && (
                  <li><strong>Servicio seco máximo:</strong> {product.temperature_resistance.dry_max}</li>
                )}
                {product.temperature_resistance.immersion_spike && (
                  <li><strong>Inmersión pico:</strong> {product.temperature_resistance.immersion_spike}</li>
                )}
                {product.temperature_resistance.dry_spike && (
                  <li><strong>Seco pico:</strong> {product.temperature_resistance.dry_spike}</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Características especiales */}
        {product.special_features && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Características Especiales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {product.special_features.map((feature, i) => (
                <div key={i} className="bg-gray-50 p-2 rounded text-sm">{feature}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
