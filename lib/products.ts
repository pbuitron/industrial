// /lib/products.ts
export type Product = {
  id: number
  name: string
  description: string
  image: string
  specs: string[]
  applications: string[]
  category: "abrazaderas" | "kits" | "epoxicos"
}

export const products: Record<string, Product[]> = {
  abrazaderas: [
    {
      id: 1,
      name: "Conector Multifuncional de Tuberias - SEALPRO A",
      description: 'Acople flexible tipo Slip - DN20 a DN500 - 3/4" a 20"',
      image: "/sealproA.webp",
      specs: ["Material: Acero inoxidable 304 / 316", "Presión: Hasta 25 BAR", "Temperatura: -20°C a 250°C"],
      applications: ["Petroquímica", "Minería", "Tratamiento de agua", "Energía", "industria quimica"],
    category: "abrazaderas"
    },
    {
      id: 2,
      name: "Conector con anillo dentado - SEALPRO B",
      description: 'Acople flexible tipo Slip dentado - DN20 a DN500 3/4" a 20"',
      image: "/sealproB.jpg",
      specs: ["Material: Acero inoxidable 304 / 316", "Presión: Hasta 30 BAR", "Temperatura: -20°C a 250°C (Vitón / NBR)"],
      applications: ["Petroquímica", "Minería", "Tratamiento de agua", "Energía"],
    category: "abrazaderas"
    },
    {
      id: 3,
      name: "Abrazadera de reparacion -  One Clip - SEALPRO C",
      description: 'Repara fugas activas - DN25 a DN500 1" a 20"',
      image: "/sealproC.jpg",
      specs: ["Material: Acero inoxidable 304 / 316", "Presión: Hasta 30 BAR", "Temperatura: -40°C a 250°C (Vitón / NBR)"],
      applications: ["Petroquímica", "Minería", "Tratamiento de agua"],
    category: "abrazaderas"},
    {
      id: 4,
      name: "Abrazadera de reparacion -  Double Clip - SEALPRO D",
      description: '"Acople y reparación de fugas - DN50 a DN1000 2" a 40"',
      image: "/sealproD.jpg",
      specs: ["Material: Acero inoxidable 304 / 316", "Presión: Hasta 30 BAR", "Temperatura: -40°C a 250°C (Vitón / NBR)"],
      applications: ["Mantenimiento", "Reparaciones urgentes", "Instalaciones temporales"],
    category: "abrazaderas"
    },
    {
      id: 5,
      name: "Abrazadera de reparacion -  Simple Plate - SEALPRO E",
      description: '"Diseñado para reparar microfugas y fisuras',
      image: "/sealproE.jpg",
      specs: ["Material: Acero inoxidable 304 / 316", "Presión: Hasta 16 BAR", "Temperatura: -30°C a 130°C (EPDM)"],
      applications: ["Mantenimiento", "Reparaciones urgentes", "Instalaciones temporales", "Tratamiento de agua"],
    category: "abrazaderas"
    },
    {
      id: 6,
      name: "Abrazadera de reparacion de codos - SEALPRO CE",
      description: '"Principalmente para reparar codos - DN25 a DN300 1" a 12"',
      image: "/sealproCE.jpg",
      specs: ["Material: Acero inoxidable 304 / 316", "Presión: Hasta 16 BAR", "Temperatura: -30°C a 130°C (EPDM)"],
      applications: ["Mantenimiento", "Reparaciones urgentes", "Instalaciones temporales", "reparación de codos"],
    category: "abrazaderas"},
  ],
  kits: [
    {
      id: 7,
      name: "Kit Reparación de Fugas con presión - Sealpro",
      description: "Kit completo para reparación de fugas en tuberías en 15 minutos",
      image: "/kitrf.png",
      specs: ["Incluye:", '1 rollo de fibra de vidrio con resina epóxica (2" - 4" - 6")', '1 rollo de cinta autovulcanizante (1" - 2")', "1 Barra epoxica de curado rápido", "Guantes e instructivo", "Tiempo aplicación: 15 minutos", "Resistencia: 450 PSI", "Duración: Permanente"],
      applications: ["Fugas activas", "Mantenimiento preventivo", "Emergencias industriales"],
    category: "kits"
    },
    {
      id: 8,
      name: "Kit Reparación de Fugas sin presión - SealPRO",
      description: "Solución rápida para sellado temporal de fugas",
      image: "/kitrf.png",
      specs: ["Incluye:", '1 rollo de fibra de vidrio con resina epóxica (2" - 4" - 6")', "1 Barra epoxica de curado rápido", "Guantes e instructivo", "Tiempo aplicación: 15 minutos", "Resistencia: 450 PSI", "Duración: Permanente"],

      applications: ["Reparaciones temporales", "Paradas de planta", "Mantenimiento programado"],
    
    category: "kits"},
  ],
  epoxicos: [
    {
      id: 9,
      name: "Epóxico MetalShield Pro",
      description: "Recubrimiento epóxico de alta resistencia para metales",
      image: "/industrial-epoxy-coating-metal-protection.jpg",
      specs: ["Espesor: 200-500 micrones", "Curado: 24 horas", "Resistencia química: Excelente"],
      applications: ["Tanques de almacenamiento", "Estructuras marinas", "Equipos químicos"],
    category: "epoxicos"
    },
    {
      id: 10,
      name: "Epóxico Reparación Rápida",
      description: "Epóxico de curado rápido para reparaciones urgentes",
      image: "/fast-curing-epoxy-repair-compound-industrial.jpg",
      specs: ["Curado: 30 minutos", "Temperatura aplicación: 5°C a 40°C", "Adherencia: 25 MPa"],
      applications: ["Reparaciones de emergencia", "Mantenimiento correctivo", "Sellado de grietas"],
   
    category: "epoxicos"},
  ],
}

// 🔹 utilidades
export const getAllProducts = () => Object.values(products).flat()
export const getProductById = (id: string) =>
  getAllProducts().find((p) => p.id.toString() === id)
export const getRelatedProducts = (product: Product) =>
  getAllProducts().filter((p) => p.category === product.category && p.id !== product.id)
