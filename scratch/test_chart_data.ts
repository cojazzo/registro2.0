import { PrismaClient } from '@prisma/client'
import { format } from "date-fns"
import { es } from "date-fns/locale"

const prisma = new PrismaClient()

async function main() {
  const patient = await prisma.patient.findFirst({
    where: { clinicalId: "2010-03029" },
    include: {
      medications: true,
      labs: { orderBy: { date: 'asc' } }
    }
  })

  if (!patient) return

  const acrLabs = patient.labs.filter((l) => l.parameter === "Relacion Albumina/Creatinina")

  const acrDataPoints = acrLabs.map((l) => ({
    name: format(new Date(l.date), "MMM yy", { locale: es }),
    Valor: l.value,
    dateRaw: new Date(l.date)
  }))

  const medicationsForCharts = patient.medications
    .filter(m => new Date(m.date).getFullYear() > 1900)
    .map(m => ({
      name: m.name,
      dateFormatted: format(new Date(m.date), "MMM yy", { locale: es }),
      dateRaw: new Date(m.date)
    }))

  console.log("=== ACR DATA POINTS ===")
  acrDataPoints.forEach(d => console.log(`  - name: "${d.name}", value: ${d.Valor}, dateRaw: ${d.dateRaw.toISOString()}`))

  console.log("=== MEDICATIONS ===")
  medicationsForCharts.forEach(m => console.log(`  - name: "${m.name}", dateFormatted: "${m.dateFormatted}", dateRaw: ${m.dateRaw.toISOString()}`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
