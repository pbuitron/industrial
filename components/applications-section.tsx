import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Factory, Droplets, Zap, Building, Truck, Wrench } from "lucide-react"

const applications = [
  {
    icon: Factory,
    title: "Industria Petroquímica",
    description: "Protección total para refinerías y plantas químicas críticas",
    features: ["MTBF +85% en equipos críticos", "Reducción de paradas no planificadas 70%", "ROI recuperado en 18 meses"],
  },
  {
    icon: Droplets,
    title: "Agua y Saneamiento",
    description: "Sistemas seguros para tratamiento y distribución de agua",
    features: ["Disponibilidad operacional +99.5%", "MTTR reducido 60% vs. competencia", "Vida útil extendida +25 años"],
  },
  {
    icon: Zap,
    title: "Sector Energético",
    description: "Soluciones confiables para generación eléctrica y renovables",
    features: ["Eficiencia energética +12%", "Costos de mantenimiento -45%", "Uptime garantizado +99.8%"],
  },
  {
    icon: Building,
    title: "Infraestructura Industrial",
    description: "Construcción robusta para proyectos de gran escala",
    features: ["Tiempo de construcción -30%", "Durabilidad certificada +50 años", "Cumplimiento normativo 100%"],
  },
  {
    icon: Truck,
    title: "Operaciones Mineras",
    description: "Recubrimiento resistentes para procesamiento mineral extremo",
    features: ["Productividad incrementada +22%", "Desgaste de componentes -65%", "Operación continua +8,760 hrs/año"],
  },
  {
    icon: Wrench,
    title: "Servicios Especializados",
    description: "Mantenimiento experto para máxima disponibilidad operacional",
    features: ["Tiempo de respuesta <4 horas", "Satisfacción del cliente +98%", "Garantía de servicio hasta 60 meses"],
  },
]

export function ApplicationsSection() {
  return (
    <section id="aplicaciones" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 text-balance">
            Aplicaciones Industriales
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Nuestras soluciones están diseñadas para los sectores industriales más exigentes, garantizando rendimiento y
            confiabilidad en cada aplicación.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {applications.map((app, index) => {
            const Icon = app.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{app.title}</CardTitle>
                  <CardDescription className="text-base">{app.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {app.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
