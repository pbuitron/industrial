"use client"

import { Header } from "@/components/header"
import { AdvancedSearch } from "@/components/AdvancedSearch"

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Buscar Productos Industriales
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Encuentra exactamente lo que necesitas con nuestra búsqueda avanzada.
            Filtra por categoría, aplicación, material y más.
          </p>
        </div>

        {/* Advanced search component */}
        <AdvancedSearch 
          placeholder="Buscar abrazaderas, kits de reparación, epóxicos..."
          showFilters={true}
          autoFocus={true}
        />

        {/* Popular searches or categories */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Búsquedas Populares</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { term: "Abrazaderas de reparación", category: "abrazaderas" },
              { term: "Kits para fugas", category: "kits" },
              { term: "Epóxicos resistentes", category: "epoxicos" },
              { term: "Reparación de tuberías", category: "" },
              { term: "Acero inoxidable", category: "" },
              { term: "Alta presión", category: "" },
              { term: "Resistente a químicos", category: "" },
              { term: "Emergencias", category: "" }
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  const params = new URLSearchParams()
                  params.set('q', item.term)
                  if (item.category) params.set('category', item.category)
                  window.location.href = `/search?${params.toString()}`
                }}
                className="p-4 bg-muted/50 hover:bg-muted transition-colors rounded-lg text-left group"
              >
                <div className="text-sm font-medium group-hover:text-primary transition-colors">
                  {item.term}
                </div>
                {item.category && (
                  <div className="text-xs text-muted-foreground mt-1 capitalize">
                    en {item.category}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quick filters */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Explorar por Categoría</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                category: "abrazaderas",
                title: "Abrazaderas",
                description: "Sistemas de reparación para tuberías y equipos industriales",
                icon: "🔧",
                color: "bg-blue-500"
              },
              {
                category: "kits",
                title: "Kits de Reparación",
                description: "Soluciones completas para reparación de fugas",
                icon: "🛠️",
                color: "bg-green-500"
              },
              {
                category: "epoxicos",
                title: "Epóxicos",
                description: "Recubrimientos y reparaciones con epóxicos industriales",
                icon: "🧪",
                color: "bg-purple-500"
              }
            ].map((item) => (
              <button
                key={item.category}
                onClick={() => {
                  window.location.href = `/search?category=${item.category}`
                }}
                className="p-6 bg-card hover:shadow-lg transition-all duration-200 rounded-xl border group text-left"
              >
                <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center text-white text-xl mb-4 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}