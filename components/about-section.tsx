import { Card, CardContent } from "@/components/ui/card"
import { Award, Users, Globe, Clock } from "lucide-react"

const stats = [
  { icon: Award, label: "Certificaciones", value: "15+", description: "ISO, ASME, ANSI" },
  { icon: Users, label: "Clientes Satisfechos", value: "1,000+", description: "En toda Latinoamérica" },
  { icon: Globe, label: "Países", value: "4", description: "Distribuidor Nacional de ARCOR" },
  { icon: Clock, label: "Años de Experiencia", value: "5+", description: "Liderando el mercado Peruano" },
]

export function AboutSection() {
  return (
    <section id="nosotros" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-balance">
                Líderes en Soluciones Industriales
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
                Industrial IOT es socio de confianza para empresas que buscan soluciones técnicas de
                alta calidad. Nuestra experiencia y compromiso con la excelencia nos han posicionado como líderes en el
                mercado nacional.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Nuestra Misión</h3>
              <p className="text-muted-foreground leading-relaxed">
                Proporcionar soluciones industriales innovadoras y confiables que optimicen los procesos de nuestros
                clientes, garantizando la máxima eficiencia operativa y el cumplimiento de los más altos estándares de
                calidad y seguridad.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Nuestros Valores</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                  Calidad sin compromisos en cada producto
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                  Innovación constante y mejora continua
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                  Servicio al cliente excepcional
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                  Responsabilidad ambiental y sostenibilidad
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-8">
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/20 rounded-2xl p-8">
              <img
                src="/modern-industrial-facility-manufacturing-plant.jpg"
                alt="Instalaciones IndustrialTech"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <Card key={index}>
                    <CardContent className="p-6 text-center">
                      <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                      <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                      <div className="text-sm font-medium text-foreground mb-1">{stat.label}</div>
                      <div className="text-xs text-muted-foreground">{stat.description}</div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
