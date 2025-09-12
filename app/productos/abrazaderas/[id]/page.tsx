import { Metadata } from 'next'
import { Header } from "@/components/header"
import { AbrazaderaView } from "@/components/product/AbrazaderaView"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

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

interface PageProps {
  params: Promise<{ id: string }>
}

// Función para obtener el producto (Server-side)
async function getProduct(id: string): Promise<Abrazadera | null> {
  try {
    const response = await fetch(`http://localhost:5000/api/products/abrazaderas/${id}`, {
      cache: 'no-store' // Para datos dinámicos
    })
    
    if (!response.ok) {
      return null
    }
    
    const result = await response.json()
    return result.success ? result.data : null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Generar metadata dinámicos para SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  
  if (!product) {
    return {
      title: 'Producto no encontrado | SealPro Industrial',
      description: 'El producto solicitado no fue encontrado en nuestro catálogo de abrazaderas industriales.'
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  return {
    title: `${product.name} | Abrazaderas Industriales SealPro`,
    description: `${product.description}. ${product.details.substring(0, 150)}...`,
    keywords: [
      'abrazaderas industriales',
      'sealpro',
      'acople flexible',
      'conexiones industriales',
      ...product.applications,
      ...product.specs.map(spec => spec.split(':')[0]).slice(0, 3)
    ].join(', '),
    openGraph: {
      title: `${product.name} | SealPro Industrial`,
      description: product.description,
      url: `${baseUrl}/productos/abrazaderas/${id}`,
      siteName: 'SealPro Industrial',
      images: [
        {
          url: `${baseUrl}${product.image}`,
          width: 800,
          height: 600,
          alt: product.name,
        }
      ],
      locale: 'es_MX',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | SealPro Industrial`,
      description: product.description,
      images: [`${baseUrl}${product.image}`],
    },
    alternates: {
      canonical: `${baseUrl}/productos/abrazaderas/${id}`,
    }
  }
}

export default async function AbrazaderaPage({ params }: PageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Producto no encontrado
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        <AbrazaderaView product={product} />
      </div>
      
      {/* Schema markup para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${product.image}`,
            brand: {
              "@type": "Brand",
              name: "SealPro Industrial"
            },
            manufacturer: {
              "@type": "Organization",
              name: "SealPro Industrial"
            },
            category: "Abrazaderas Industriales",
            additionalProperty: product.specs.map(spec => ({
              "@type": "PropertyValue",
              name: spec.split(':')[0],
              value: spec.split(':')[1] || spec
            })),
            offers: {
              "@type": "Offer",
              availability: "https://schema.org/InStock",
              priceCurrency: "MXN",
              seller: {
                "@type": "Organization",
                name: "SealPro Industrial"
              }
            }
          })
        }}
      />
    </>
  )
}