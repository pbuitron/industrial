import { ProductList } from './ProductList'

interface Epoxico {
  _id: string
  productId: number | string
  name: string
  description?: string
  generic_type?: string
  image?: string
  image_url?: string
  applications?: string[]
  isActive: boolean
}

export function EpoxicosList() {
  return <ProductList<Epoxico> category="epoxicos" />
}