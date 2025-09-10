import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Factory, Droplets, Zap, Building, Truck, Wrench } from "lucide-react"

const applications = [
  {
    icon: Factory,
    title: "Petroquímica",
    description: "Soluciones para refinerías, plantas químicas y procesamiento de hidrocarburos.",
    features: ["Resistencia a químicos agresivos", "Certificaciones ASME", "Mantenimiento predictivo"],
  },
  {
    icon: Droplets,
    title: "Tratamiento de Agua",
    description: "Sistemas para plantas de tratamiento, distribución y saneamiento.",
    features: ["Materiales aptos para agua potable", "Resistencia a la corrosión", "Instalación rápida"],
  },
  {
    icon: Zap,
    title: "Energía",
    description: "Aplicaciones en centrales eléctricas, plantas nucleares y energías renovables.",
    features: ["Alta temperatura de trabajo", "Certificación nuclear", "Mantenimiento mínimo"],
  },
  {
    icon: Building,
    title: "Construcción",
    description: "Infraestructura, edificios industriales y proyectos de gran envergadura.",
    features: ["Cumplimiento normativo", "Instalación versátil", "Durabilidad extrema"],
  },
  {
    icon: Truck,
    title: "Minería",
    description: "Equipos para procesamiento mineral, transporte de pulpas y relaves.",
    features: ["Resistencia al desgaste", "Ambientes corrosivos", "Operación continua"],
  },
  {
    icon: Wrench,
    title: "Mantenimiento",
    description: "Servicios de reparación, mantenimiento preventivo y correctivo.",
    features: ["Respuesta 24/7", "Técnicos especializados", "Garantía extendida"],
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
