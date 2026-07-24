import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const patient = await prisma.patient.findFirst({
    where: { clinicalId: "2010-03029" },
    include: {
      medications: true,
      labs: { orderBy: { date: 'asc' } }
    }
  })

  if (!patient) {
    console.log("Paciente no encontrado")
    return
  }

  console.log(`Paciente: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`)
  console.log("Medicamentos:")
  patient.medications.forEach(m => {
    console.log(`  - ${m.name}: ${m.date.toISOString()} (dosage: ${m.dosage}, freq: ${m.frequency})`)
  })

  console.log("Laboratorios:")
  patient.labs.forEach(l => {
    console.log(`  - ${l.parameter}: ${l.date.toISOString()} = ${l.value}`)
  })
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
