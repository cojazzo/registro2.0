import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Iniciando limpieza de duplicados...")

  // 1. Limpiar Citas duplicadas
  const allAppointments = await prisma.appointment.findMany({
    orderBy: { createdAt: 'asc' }
  })
  const seenAppointments = new Set<string>()
  const duplicateAppointments: string[] = []

  for (const appt of allAppointments) {
    const key = `${appt.patientId}-${appt.dateTime.getTime()}-${appt.service}`
    if (seenAppointments.has(key)) {
      duplicateAppointments.push(appt.id)
    } else {
      seenAppointments.add(key)
    }
  }

  if (duplicateAppointments.length > 0) {
    console.log(`Borrando ${duplicateAppointments.length} citas duplicadas...`)
    await prisma.appointment.deleteMany({
      where: { id: { in: duplicateAppointments } }
    })
  } else {
    console.log("No se encontraron citas duplicadas.")
  }

  // 2. Limpiar Vitals duplicados
  const allVitals = await prisma.vitals.findMany({
    orderBy: { date: 'asc' }
  })
  const seenVitals = new Set<string>()
  const duplicateVitals: string[] = []

  for (const v of allVitals) {
    const key = `${v.patientId}-${v.date.getTime()}-${v.weight}-${v.height}`
    if (seenVitals.has(key)) {
      duplicateVitals.push(v.id)
    } else {
      seenVitals.add(key)
    }
  }

  if (duplicateVitals.length > 0) {
    console.log(`Borrando ${duplicateVitals.length} signos vitales duplicados...`)
    await prisma.vitals.deleteMany({
      where: { id: { in: duplicateVitals } }
    })
  } else {
    console.log("No se encontraron signos vitales duplicados.")
  }

  // 3. Limpiar Resultados de Laboratorio duplicados
  const allLabs = await prisma.laboratoryResult.findMany({
    orderBy: { date: 'asc' }
  })
  const seenLabs = new Set<string>()
  const duplicateLabs: string[] = []

  for (const l of allLabs) {
    const key = `${l.patientId}-${l.date.getTime()}-${l.parameter}-${l.value}`
    if (seenLabs.has(key)) {
      duplicateLabs.push(l.id)
    } else {
      seenLabs.add(key)
    }
  }

  if (duplicateLabs.length > 0) {
    console.log(`Borrando ${duplicateLabs.length} resultados de laboratorio duplicados...`)
    await prisma.laboratoryResult.deleteMany({
      where: { id: { in: duplicateLabs } }
    })
  } else {
    console.log("No se encontraron laboratorios duplicados.")
  }

  // 4. Limpiar Medicamentos duplicados
  const allMeds = await prisma.medication.findMany({
    orderBy: { date: 'asc' }
  })
  const seenMeds = new Set<string>()
  const duplicateMeds: string[] = []

  for (const m of allMeds) {
    const key = `${m.patientId}-${m.name}-${m.date.getTime()}`
    if (seenMeds.has(key)) {
      duplicateMeds.push(m.id)
    } else {
      seenMeds.add(key)
    }
  }

  if (duplicateMeds.length > 0) {
    console.log(`Borrando ${duplicateMeds.length} medicamentos duplicados...`)
    await prisma.medication.deleteMany({
      where: { id: { in: duplicateMeds } }
    })
  } else {
    console.log("No se encontraron medicamentos duplicados.")
  }

  console.log("¡Limpieza de base de datos finalizada con éxito!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
