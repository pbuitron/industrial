import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Wrench, Droplets } from "lucide-react"

export function HeroSection() {
  return (
    <section id="inicio" className="relative bg-gradient-to-br from-primary/5 to-secondary/10 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
                Soluciones Industriales
                <span className="text-primary block">de Confianza</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-pretty">
                Especialistas en abrazaderas industriales, kits para reparar fugas y epóxicos para recubrir metales. Más
                de 25 años brindando soluciones técnicas de calidad.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8">
                Ver Productos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                Solicitar Cotización
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">25+</div>
                <div className="text-sm text-muted-foreground">Años de experiencia</div>
              </div>
              <div className="text-center">
                <Wrench className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">Productos disponibles</div>
              </div>
              <div className="text-center">
                <Droplets className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">99%</div>
                <div className="text-sm text-muted-foreground">Efectividad garantizada</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/20 rounded-2xl p-8">
              <img
                src="/industrial-clamps-and-repair-equipment-professiona.jpg"
                alt="Productos industriales IndustrialTech"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-xl shadow-lg">
              <div className="text-2xl font-bold">ISO 9001</div>
              <div className="text-sm opacity-90">Certificado</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
