import { ProductList } from './ProductList'

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
}

export function AbrazaderasList() {
  return <ProductList<Abrazadera> category="abrazaderas" />
}