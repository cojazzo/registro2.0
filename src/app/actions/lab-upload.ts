"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

type LabEntry = {
  parameter: string
  value?: number | null
  textValue?: string | null
  unit?: string | null
  referenceRange?: string | null
  isAbnormal: boolean
}

export async function saveLabsFromPdf(data: {
  patientId: string
  requestNumber?: string | null
  date: string
  labs: LabEntry[]
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  if (!data.patientId) {
    throw new Error("ID de paciente faltante")
  }

  if (!data.labs || data.labs.length === 0) {
    throw new Error("No hay laboratorios para guardar")
  }

  const labDate = new Date(data.date)
  const reqNum = data.requestNumber?.trim() || null

  // 1. Buscar laboratorios existentes para este paciente con la misma petición o fecha
  const whereCondition: any = {
    patientId: data.patientId,
  }

  if (reqNum) {
    whereCondition.OR = [
      { requestNumber: reqNum },
      { date: labDate },
    ]
  } else {
    whereCondition.date = labDate
  }

  const existingLabs = await prisma.laboratoryResult.findMany({
    where: whereCondition,
    select: { parameter: true },
  })

  const existingParams = new Set(existingLabs.map((l) => l.parameter.trim().toLowerCase()))

  // 2. Filtrar solo los laboratorios que NO existan en la BD (evitar duplicados)
  const labsToInsert = data.labs.filter((lab) => {
    const paramName = lab.parameter.trim().toLowerCase()
    return !existingParams.has(paramName)
  })

  const skippedCount = data.labs.length - labsToInsert.length

  if (labsToInsert.length > 0) {
    await prisma.laboratoryResult.createMany({
      data: labsToInsert.map((lab) => {
        const numValue = lab.value !== undefined && lab.value !== null && !isNaN(Number(lab.value))
          ? Number(lab.value)
          : (lab.textValue && !isNaN(Number(lab.textValue)) ? Number(lab.textValue) : null)

        return {
          patientId: data.patientId,
          requestNumber: reqNum,
          date: labDate,
          parameter: lab.parameter.trim(),
          value: numValue,
          textValue: lab.textValue?.trim() || (numValue !== null ? String(numValue) : null),
          unit: lab.unit?.trim() || null,
          referenceRange: lab.referenceRange?.trim() || null,
          isAbnormal: lab.isAbnormal,
          appointmentId: null,
        }
      }),
    })
  }

  revalidatePath(`/pacientes/${data.patientId}`)
  revalidatePath("/dashboard")

  return {
    success: true,
    addedCount: labsToInsert.length,
    skippedCount: skippedCount,
  }
}
