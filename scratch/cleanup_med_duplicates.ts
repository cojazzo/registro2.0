import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Iniciando depuración de medicamentos duplicados en la base de datos...")

  // Obtener todos los pacientes
  const patients = await prisma.patient.findMany({
    include: { medications: { orderBy: { date: 'asc' } } }
  })

  let deletedCount = 0

  for (const patient of patients) {
    const seen = new Set<string>()
    const toDelete: string[] = []

    for (const med of patient.medications) {
      if (seen.has(med.name)) {
        toDelete.push(med.id)
      } else {
        seen.add(med.name)
      }
    }

    if (toDelete.length > 0) {
      console.log(`Paciente ${patient.firstName} ${patient.lastName}: eliminando ${toDelete.length} duplicados de medicamentos.`)
      await prisma.medication.deleteMany({
        where: { id: { in: toDelete } }
      })
      deletedCount += toDelete.length
    }
  }

  console.log(`¡Depuración completada! Se eliminaron ${deletedCount} registros de medicamentos duplicados en total.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
