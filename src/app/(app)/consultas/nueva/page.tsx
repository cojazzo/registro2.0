import prisma from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { ConsultaWizard } from "@/components/consultas/wizard"
import { redirect } from "next/navigation"

export default async function NuevaConsultaPage({
  searchParams,
}: {
  searchParams: Promise<{ appointmentId?: string }>
}) {
  const { appointmentId } = await searchParams
  const session = await getSession()
  if (!session) redirect("/login")

  const isDoctor = session.role === "DOCTOR"

  const pacientes = await prisma.patient.findMany({
    orderBy: { lastName: "asc" },
    select: { 
      id: true, 
      firstName: true, 
      lastName: true, 
      curp: true,
      dob: true,
      gender: true,
      vitals: {
        orderBy: { date: 'desc' },
        take: 1,
      },
      labs: {
        where: { parameter: { in: ['Relacion Albumina/Creatinina', 'Creatinina serica'] } },
        orderBy: { date: 'desc' },
      }
    },
  })

  // Admins can assign any non-read-only user; Doctors see only themselves.
  const especialistas = isDoctor
    ? await prisma.user.findMany({
        where: { id: session.userId },
        select: { id: true, name: true, role: true },
      })
    : await prisma.user.findMany({
        where: { role: { not: "READ_ONLY" } },
        select: { id: true, name: true, role: true },
      })

  let preselectedPatientId = ""
  let preselectedServiceType = ""
  let preselectedUserId = ""

  if (appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        patientId: true,
        service: true,
        userId: true,
      }
    })
    if (appointment) {
      preselectedPatientId = appointment.patientId
      preselectedServiceType = appointment.service
      preselectedUserId = appointment.userId
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 bg-slate-50/30 min-h-[calc(100vh-2rem)]">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
          Captura Clínica <span className="text-blue-600">Avanzada</span>
        </h2>
        <p className="text-muted-foreground mt-1">
          Completa los pasos del asistente para estructurar los datos al expediente longitudinal.
        </p>
      </div>

      <ConsultaWizard
        patients={pacientes}
        specialists={especialistas}
        defaultUserId={isDoctor ? session.userId : undefined}
        isDoctor={isDoctor}
        preselectedPatientId={preselectedPatientId || undefined}
        preselectedServiceType={preselectedServiceType || undefined}
        preselectedUserId={preselectedUserId || undefined}
        appointmentId={appointmentId}
      />
    </div>
  )
}
