"use client"
// force-reload

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, User, FileText, MapPin } from "lucide-react"
import Link from "next/link"

type AppointmentWithDetails = {
  id: string
  dateTime: Date
  service: string
  status: string
  room?: string | null
  patient: { id: string, firstName: string, lastName: string, curp: string | null }
  user: { name: string }
}

const CONSULTORIOS = ["INAER 1", "INAER 2", "CHMH 1", "CHMH 2", "No Asignado"]

export function AgendaView({ appointments }: { appointments: AppointmentWithDetails[] }) {
  const [date, setDate] = useState<Date | undefined>(new Date())

  // Filtrar citas por la fecha seleccionada
  const selectedDateAppointments = appointments.filter(a => {
    if (!date) return false
    const appDate = new Date(a.dateTime)
    return appDate.getDate() === date.getDate() &&
           appDate.getMonth() === date.getMonth() &&
           appDate.getFullYear() === date.getFullYear()
  })

  return (
    <div className="flex flex-col gap-6 mt-6">
      
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Calendario a la Izquierda o Arriba */}
        <Card className="w-full lg:w-[320px] h-fit md:mx-auto lg:mx-0 shadow-sm border-slate-200">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
            />
          </CardContent>
        </Card>
        
        {/* Kanban Board Container */}
        <div className="flex-1">
          <div className="flex justify-between items-end border-b border-slate-200 pb-3 mb-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 capitalize">
                {date ? date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Día seleccionado'}
              </h3>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {selectedDateAppointments.length} Cita(s) distribuidas hoy
              </p>
            </div>
          </div>
          
          {selectedDateAppointments.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground bg-white border border-dashed rounded-md shadow-sm">
              No hay citas programadas para esta fecha en ningún consultorio.
            </div>
          ) : (
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-[65vh] overflow-hidden">
              
              {CONSULTORIOS.map(room => {
                const roomApps = selectedDateAppointments.filter(a => {
                  if (room === "No Asignado") return !a.room || a.room === "No Asignado";
                  return a.room === room;
                })

                // Ocultar la columna de 'No Asignado' si está vacía para no hacer ruido
                if (room === "No Asignado" && roomApps.length === 0) return null;

                return (
                  <div key={room} className="flex flex-col bg-slate-100 rounded-xl rounded-b-md border border-slate-200 overflow-hidden shadow-inner">
                    
                    {/* Header de la columna */}
                    <div className="bg-slate-200/60 px-4 py-3 border-b border-slate-200 flex justify-between items-center z-10">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {room}
                      </h4>
                      <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                        {roomApps.length}
                      </span>
                    </div>
                    
                    {/* Tarjetas Scroll */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {roomApps.length === 0 ? (
                        <div className="text-center text-xs text-slate-400 py-6 border-2 border-dashed border-slate-200 rounded-lg">
                          Libre
                        </div>
                      ) : (
                        roomApps.map(app => (
                          <Card key={app.id} className="shadow-sm hover:shadow transition-shadow bg-white rounded-lg border-transparent">
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" />
                                  {new Date(app.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${app.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {app.status === 'COMPLETED' ? 'Hecha' : 'Pend.'}
                                </span>
                              </div>
                              
                              <div className="font-semibold text-sm flex items-center gap-2 text-slate-900 leading-tight">
                                <User className="h-3 w-3 text-slate-400 shrink-0" /> 
                                <span className="line-clamp-1">{app.patient.firstName} {app.patient.lastName}</span>
                              </div>
                              
                              <div className="text-[11px] text-slate-500 mt-2 space-y-1">
                                <p className="font-medium text-slate-700">{app.service}</p>
                                <p>Dr. {app.user.name}</p>
                              </div>

                              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                                <Link href={`/pacientes/${app.patient.id}`} className="text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium">
                                  Ver Ficha &rarr;
                                </Link>
                                {app.status !== 'COMPLETED' && (
                                  <Link href={`/consultas/nueva?appointmentId=${app.id}`} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md transition-colors font-medium">
                                    Iniciar Consulta
                                  </Link>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
          )}
        </div>
        
      </div>
    </div>
  )
}
