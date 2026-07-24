import prisma from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { createAppointment } from "@/app/actions/agenda"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CalendarPlus } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function NuevaCitaPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const isDoctor = session.role === "DOCTOR"

  const pacientes = await prisma.patient.findMany({ orderBy: { lastName: "asc" } })

  // Only Admins need to pick a specialist; Doctors are always themselves.
  const especialistas = isDoctor
    ? []
    : await prisma.user.findMany({
        where: { role: { not: "READ_ONLY" } },
        orderBy: { name: "asc" },
      })

  // For Doctor: fetch their own name to display it
  const currentUser = isDoctor
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true },
      })
    : null

  return (
    <div className="space-y-6 p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/agenda" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Agendar Nueva Cita</h2>
          <p className="text-muted-foreground mt-1">Programa una consulta, seguimiento o laboratorio.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <form action={createAppointment} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="patientId">Paciente *</Label>
                <select
                  id="patientId"
                  name="patientId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  required
                >
                  <option value="">Seleccione un paciente...</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.lastName}, {p.firstName} (Exp. {p.id}) - CURP: {p.curp || "Sin CURP"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Servicio o Especialidad *</Label>
                <select
                  id="service"
                  name="service"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  required
                >
                  <option value="">Seleccione...</option>
                  <option value="MEDICAL">Medicina General / Especialidad</option>
                  <option value="PSYCHOLOGY">Psicología</option>
                  <option value="NUTRITION">Nutrición</option>
                  <option value="ADMIN">Trámite Administrativo / Recepción</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="room">Consultorio Asignado *</Label>
                <select
                  id="room"
                  name="room"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  required
                >
                  <option value="">Seleccione consultorio...</option>
                  <option value="INAER 1">INAER 1</option>
                  <option value="INAER 2">INAER 2</option>
                  <option value="CHMH 1">CHMH 1</option>
                  <option value="CHMH 2">CHMH 2</option>
                </select>
              </div>

              {/* Specialist field: read-only for Doctors, dropdown for Admins */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="userId">Especialista Asignado *</Label>
                {isDoctor ? (
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-slate-50 px-3 py-2 text-sm text-slate-700 gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 text-indigo-700 px-2.5 py-0.5 text-xs font-semibold">
                      Doctor
                    </span>
                    {currentUser?.name ?? "Tú"}
                  </div>
                ) : (
                  <select
                    id="userId"
                    name="userId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    required
                  >
                    <option value="">Seleccione especialista...</option>
                    {especialistas.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input id="date" name="date" type="date" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Hora *</Label>
                <Input id="time" name="time" type="time" required />
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t mt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md flex items-center gap-2 font-medium transition-colors"
              >
                <CalendarPlus className="h-4 w-4" />
                Agendar Cita
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
