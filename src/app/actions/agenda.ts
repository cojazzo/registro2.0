"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createAppointment(formData: FormData) {
  const session = await getSession()
  if (!session) redirect("/login")

  const patientId = formData.get("patientId") as string
  const service = formData.get("service") as string
  const dateStr = formData.get("date") as string
  const timeStr = formData.get("time") as string
  const room = formData.get("room") as string

  // Doctors are always assigned to themselves.
  // Admins can pick any specialist from the form.
  const userId =
    session.role === "DOCTOR"
      ? session.userId
      : (formData.get("userId") as string)

  if (!patientId || !userId || !service || !dateStr || !timeStr || !room) {
    throw new Error("Faltan campos obligatorios")
  }

  const dateTime = new Date(`${dateStr}T${timeStr}`)

  await prisma.appointment.create({
    data: {
      patientId,
      userId,
      service,
      room,
      dateTime,
      status: "SCHEDULED",
    },
  })

  revalidatePath("/agenda")
  redirect(`/agenda`)
}
