"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

type LabEntry = {
  parameter: string
  value: number
  unit: string
  referenceRange: string
  isAbnormal: boolean
}

type MedEntry = {
  name: string
  dosage: string
  frequency: string
}

type ConsultationData = {
  patientId: string
  userId: string
  serviceType: string
  
  // Vitals & Exam
  weight?: number
  height?: number
  waist?: number
  bloodPressure?: string
  heartRate?: number
  respiratoryRate?: number
  oxygenSaturation?: number
  temperature?: number
  physicalExam?: string
  
  // Labs
  labs: LabEntry[]
  
  // Meds
  medications: MedEntry[]
  
  // Notes
  noteContent?: string
  evolution?: string
  diagnosis?: string
  plan?: string
  prognosis?: string

  // Extracted metadata
  extractedDate?: string

  // Existing appointment
  appointmentId?: string
}

export async function saveConsultation(data: ConsultationData) {
  const session = await getSession()
  if (!session) redirect("/login")

  // Doctors are always the author — use their session id, not client-supplied value.
  const resolvedUserId =
    session.role === "DOCTOR" ? session.userId : data.userId

  if (!data.patientId || !resolvedUserId) {
    throw new Error("Datos de paciente o especialista faltantes")
  }

  // Override with the resolved userId for the rest of the function.
  data = { ...data, userId: resolvedUserId }

  const now = data.extractedDate ? new Date(data.extractedDate) : new Date()

  // Guardamos todo en una transacción para asegurar consistencia
  await prisma.$transaction(async (tx) => {
    let appointmentIdToLink = data.appointmentId

    if (appointmentIdToLink) {
      // 1. Actualizar la cita existente
      await tx.appointment.update({
        where: { id: appointmentIdToLink },
        data: {
          status: "COMPLETED",
          service: data.serviceType || "MEDICAL",
          userId: data.userId
        }
      })
    } else {
      // 1. Crear una nueva Cita Completada
      const appointment = await tx.appointment.create({
        data: {
          patientId: data.patientId,
          userId: data.userId,
          dateTime: now,
          service: data.serviceType || "MEDICAL",
          status: "COMPLETED"
        }
      })
      appointmentIdToLink = appointment.id
    }

    // 2. Crear los Signos Vitales
    if (data.weight || data.height || data.waist || data.bloodPressure || data.heartRate || data.respiratoryRate || data.oxygenSaturation || data.temperature || data.physicalExam) {
      await tx.vitals.create({
        data: {
          patientId: data.patientId,
          appointmentId: appointmentIdToLink,
          date: now,
          weight: data.weight || null,
          height: data.height || null,
          waist: data.waist || null,
          bloodPressure: data.bloodPressure || null,
          heartRate: data.heartRate || null,
          respiratoryRate: data.respiratoryRate || null,
          oxygenSaturation: data.oxygenSaturation || null,
          temperature: data.temperature || null,
          physicalExam: data.physicalExam || null
        }
      })
    }

    // 3. Crear Nota
    await tx.note.create({
      data: {
        patientId: data.patientId,
        userId: data.userId,
        appointmentId: appointmentIdToLink,
        service: data.serviceType || "MEDICINA", // Dynamic: MEDICINA, PSICOLOGIA, NUTRICION, TRABAJO_SOCIAL
        content: data.noteContent || "",
        evolution: data.evolution || null,
        diagnosis: data.diagnosis || null,
        plan: data.plan || null,
        prognosis: data.prognosis || null,
        createdAt: now
      }
    })

    // 4. Crear Laboratorios
    if (data.labs && data.labs.length > 0) {
      const labsData = data.labs.map(lab => {
        const numVal = lab.value !== undefined && lab.value !== null && !isNaN(Number(lab.value)) ? Number(lab.value) : null
        return {
          patientId: data.patientId,
          appointmentId: appointmentIdToLink,
          date: now,
          parameter: lab.parameter,
          value: numVal,
          textValue: String(lab.value ?? ""),
          unit: lab.unit,
          referenceRange: lab.referenceRange,
          isAbnormal: lab.isAbnormal
        }
      })
      await tx.laboratoryResult.createMany({ data: labsData })
    }

    // 5. Crear Medicamentos
    if (data.medications && data.medications.length > 0) {
      const medsData = data.medications.map(med => ({
        patientId: data.patientId,
        appointmentId: appointmentIdToLink,
        date: now,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency
      }))
      await tx.medication.createMany({ data: medsData })
    }
  })

  // Revalidar para que el expediente muestre la info nueva de inmediato
  revalidatePath(`/pacientes/${data.patientId}`)
  revalidatePath("/dashboard")
  
  return { success: true, patientId: data.patientId }
}
