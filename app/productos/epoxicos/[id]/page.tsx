import epoxicos from "@/data/epoxicos.json"

export default function EpoxicoDetail({ params }: { params: { id: string } }) {
  const product = epoxicos.find((p) => p.id === Number(params.id))

  if (!product) return <div className="p-10">Epóxico no encontrado</div>

  return (
    <div className="max-w-6xl mx-auto py-20 px-4">
      <h1 className="text-3xl font-bold mb-6">{product.name}</h1>
      <p className="text-lg text-muted-foreground mb-6">{product.description}</p>

      <img src={product.image} alt={product.name} className="w-full max-w-lg mb-8 rounded-lg shadow" />

      <h2 className="text-2xl font-semibold mb-4">Características</h2>
      <ul className="list-disc pl-6 mb-8">
        {product.specs?.map((spec, i) => (
          <li key={i}>{spec}</li>
        ))}
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Aplicaciones</h2>
      <ul className="list-disc pl-6 mb-8">
        {product.applications?.map((app, i) => (
          <li key={i}>{app}</li>
        ))}
      </ul>
    </div>
  )
}
