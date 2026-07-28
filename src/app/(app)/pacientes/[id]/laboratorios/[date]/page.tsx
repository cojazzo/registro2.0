import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, FlaskConical, AlertTriangle, Hash } from "lucide-react"

export default async function LabDetailsPage({
  params,
}: {
  params: Promise<{ id: string; date: string }>
}) {
  const { id, date } = await params
  
  const dateObj = new Date(decodeURIComponent(date))
  if (isNaN(dateObj.getTime())) {
    notFound()
  }

  const patient = await prisma.patient.findUnique({
    where: { id },
  })

  if (!patient) notFound()

  // Find all labs for this specific patient and exact timestamp
  const labs = await prisma.laboratoryResult.findMany({
    where: {
      patientId: id,
      date: dateObj
    },
    orderBy: { parameter: "asc" }
  })

  if (labs.length === 0) notFound()

  const requestNum = labs.find(l => l.requestNumber)?.requestNumber

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header / Back navigation */}
      <div className="flex items-center gap-4">
        <Link
          href={`/pacientes/${id}`}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Resultados de Laboratorio
          </h1>
          <div className="flex items-center gap-2 flex-wrap text-muted-foreground text-sm mt-1">
            <span>Paciente: <strong>{patient.lastName}, {patient.firstName}</strong></span>
            <span>·</span>
            <span>Fecha: {format(dateObj, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</span>
            {requestNum && (
              <>
                <span>·</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center gap-1 border border-slate-200">
                  <Hash className="h-3 w-3 text-slate-400" />
                  Petición: {requestNum}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-3">
          <FlaskConical className="h-5 w-5 text-cyan-500" /> Detalles del Estudio
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <th className="px-4 py-3 text-left font-medium rounded-tl-lg">Parámetro Analizado</th>
                <th className="px-4 py-3 text-left font-medium">Resultado</th>
                <th className="px-4 py-3 text-left font-medium">Unidad</th>
                <th className="px-4 py-3 text-left font-medium rounded-tr-lg">Rango de Referencia</th>
              </tr>
            </thead>
            <tbody>
              {labs.map((lab) => (
                <tr
                  key={lab.id}
                  className={`border-b last:border-0 hover:bg-slate-50/50 transition-colors ${lab.isAbnormal ? "bg-red-50/20" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{lab.parameter}</td>
                  <td
                    className={`px-4 py-3 font-bold ${
                      lab.isAbnormal ? "text-red-600" : "text-slate-900"
                    }`}
                  >
                    {lab.textValue ?? lab.value ?? "—"}
                    {lab.isAbnormal && (
                      <AlertTriangle className="inline h-4 w-4 ml-2 text-red-500" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{lab.unit ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {lab.referenceRange ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
