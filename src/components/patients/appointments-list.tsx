"use client"

import { useState } from "react"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, Stethoscope } from "lucide-react"
import Link from "next/link"

type Note = {
  id: string
  content: string | null
  createdAt: Date | string
  user: {
    name: string
  }
}

type Appointment = {
  id: string
  dateTime: Date | string
  service: string
  status: string
  room?: string | null
  user: {
    name: string
    role: string
  }
  notes: Note[]
}

export function AppointmentsList({ appointments }: { appointments: Appointment[] }) {
  const statusColors: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    NO_SHOW: "bg-amber-100 text-amber-700",
  }

  const statusLabels: Record<string, string> = {
    SCHEDULED: "Programada",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
    NO_SHOW: "No presentó",
  }

  const [filter, setFilter] = useState<string>("TODAS")

  const filteredAppointments = appointments.filter(appt => 
    filter === "TODAS" || appt.service === filter
  )

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> Historial de Citas
        </h2>
        
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="TODAS">Todas las áreas</option>
          <option value="MEDICINA">Medicina</option>
          <option value="PSICOLOGIA">Psicología</option>
          <option value="NUTRICION">Nutrición</option>
          <option value="TRABAJO_SOCIAL">Trabajo Social</option>
        </select>
      </div>

      {filteredAppointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin citas registradas para esta área.</p>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((appt) => {
            const hasNotes = appt.notes && appt.notes.length > 0

            return (
              <div
                key={appt.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">
                        {format(new Date(appt.dateTime), "d MMM yyyy, HH:mm", { locale: es })}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          statusColors[appt.status] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {statusLabels[appt.status] ?? appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {appt.service} · {appt.room || "No Asignado"} ·{" "}
                      <span className="font-medium">{appt.user.name}</span>
                    </p>
                  </div>
                  
                  {hasNotes && (
                    <Link
                      href={`/citas/${appt.id}`}
                      className="text-xs bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
                    >
                      <Stethoscope className="h-3 w-3 text-blue-500" />
                      Ver Detalles &rarr;
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
