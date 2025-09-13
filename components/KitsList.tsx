import { ProductList } from './ProductList'

interface Kit {
  _id: string
  productId: number
  name: string
  description: string
  image: string
  applications?: string[]
  isActive: boolean
}

export function KitsList() {
  return <ProductList<Kit> category="kits" />
}