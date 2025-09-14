import { Metadata } from 'next'
import { Header } from "@/components/header"
import { AbrazaderaView } from "@/components/product/AbrazaderaView"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { SEOBreadcrumb } from "@/components/seo-breadcrumb"

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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    const response = await fetch(`${baseUrl}/products/abrazaderas/${id}`, {
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
  
  // Extraer información técnica clave para SEO
  const materialInfo = product.materials?.[0] || 'acero inoxidable'
  const mainApplication = product.applications?.[0] || 'industrial'
  const pressureSpec = product.specs.find(spec => spec.toLowerCase().includes('presión') || spec.toLowerCase().includes('bar'))
  
  return {
    title: `${product.name} ${materialInfo} | Abrazaderas Industriales Alta Presión | SealPro`,
    description: `${product.description}. Abrazadera ${materialInfo} para ${mainApplication.toLowerCase()}. ${pressureSpec || 'Resistencia superior'}. Cotización inmediata por WhatsApp. Certificación ASME.`,
    keywords: [
      'abrazaderas industriales',
      `abrazaderas ${materialInfo}`,
      'conexiones alta presión',
      'reparación tuberías',
      'acople flexible certificado',
      'sealpro méxico',
      ...product.applications.map(app => app.toLowerCase()),
      ...product.specs.map(spec => spec.split(':')[0].toLowerCase()).slice(0, 3)
    ].join(', '),
    openGraph: {
      title: `${product.name} ${materialInfo} | Abrazaderas Alta Presión`,
      description: `${product.description}. Abrazadera ${materialInfo} certificada para ${mainApplication.toLowerCase()}. Cotización inmediata.`,
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
        {/* Breadcrumbs para SEO y navegación */}
        <div className="container mx-auto px-4 py-4">
          <SEOBreadcrumb productName={product.name} />
        </div>
        <AbrazaderaView product={product} />
      </div>
      
      {/* Schema markup mejorado para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${product.image}`,
            sku: product._id,
            mpn: product.productId.toString(),
            brand: {
              "@type": "Brand",
              name: "SealPro Industrial"
            },
            manufacturer: {
              "@type": "Organization",
              name: "SealPro Industrial",
              url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
              logo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/Logo-azul.jpg`
            },
            category: "Abrazaderas Industriales",
            material: product.materials?.join(', '),
            applicationArea: product.applications?.join(', '),
            additionalProperty: [
              ...product.specs.map(spec => ({
                "@type": "PropertyValue",
                name: spec.split(':')[0],
                value: spec.split(':')[1] || spec
              })),
              {
                "@type": "PropertyValue",
                name: "Certificación",
                value: "ASME B31.3"
              },
              {
                "@type": "PropertyValue",
                name: "Aplicaciones",
                value: product.applications?.join(', ')
              }
            ],
            offers: {
              "@type": "Offer",
              availability: "https://schema.org/InStock",
              priceCurrency: "USD",
              priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              seller: {
                "@type": "Organization",
                name: "SealPro Industrial",
                url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
              },
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Catálogo de Abrazaderas Industriales"
              }
            },
            audience: {
              "@type": "BusinessAudience",
              name: "Industria Petroquímica y Manufactura"
            },
            isRelatedTo: product.applications?.map(app => ({
              "@type": "Thing",
              name: app
            }))
          })
        }}
      />
    </>
  )
}