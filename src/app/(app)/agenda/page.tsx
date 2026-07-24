import prisma from "@/lib/prisma"
import { AgendaView } from "@/components/agenda/agenda-view"
import { CalendarPlus } from "lucide-react"
import Link from "next/link"

export default async function AgendaPage() {
  const appointments = await prisma.appointment.findMany({
    include: {
      patient: {
        select: { id: true, firstName: true, lastName: true, curp: true }
      },
      user: {
        select: { name: true }
      }
    },
    orderBy: {
      dateTime: 'asc'
    }
  })

  return (
    <div className="space-y-6 p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Agenda Institucional</h2>
          <p className="text-muted-foreground mt-1">
            Visualiza y administra las citas programadas. Selecciona un día en el calendario.
          </p>
        </div>
        <Link href="/agenda/nueva" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md flex items-center gap-2 font-medium transition-colors whitespace-nowrap">
          <CalendarPlus className="h-5 w-5" />
          Agendar Cita
        </Link>
      </div>
      
      <AgendaView appointments={appointments} />
    </div>
  )
}
