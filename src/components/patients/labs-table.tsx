"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { FlaskConical, Search, Hash } from "lucide-react"
import { LabPdfUpload } from "./lab-pdf-upload"

type Lab = {
  id: string
  date: Date | string
  requestNumber?: string | null
  parameter: string
  value: number | null
  textValue?: string | null
  unit: string | null
  referenceRange: string | null
  isAbnormal: boolean
}

export function PatientLabsTable({ labs, patientId }: { labs: Lab[], patientId: string }) {
  // Agrupar laboratorios por fecha y hora EXACTA
  const groupedLabs = labs.reduce((acc, lab) => {
    const dateStr = new Date(lab.date).toISOString()
    if (!acc[dateStr]) acc[dateStr] = []
    acc[dateStr].push(lab)
    return acc
  }, {} as Record<string, Lab[]>)

  const sortedDates = Object.keys(groupedLabs).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <FlaskConical className="h-4 w-4" /> Historial de Laboratorios
        </h2>
        <LabPdfUpload patientId={patientId} />
      </div>

      {sortedDates.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin laboratorios registrados.</p>
      ) : (
        <div className="space-y-3">
          {sortedDates.map((dateStr) => {
            const sessionLabs = groupedLabs[dateStr]
            const abnormalCount = sessionLabs.filter(l => l.isAbnormal).length
            const requestNum = sessionLabs.find(l => l.requestNumber)?.requestNumber

            return (
              <div
                key={dateStr}
                className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-wrap sm:flex-nowrap items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">
                      {format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: es })}
                    </span>
                    {requestNum && (
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700 flex items-center gap-1">
                        <Hash className="h-3 w-3 text-slate-400" />
                        {requestNum}
                      </span>
                    )}
                    {abnormalCount > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        {abnormalCount} {abnormalCount === 1 ? "anormalidad" : "anormalidades"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sessionLabs.length} parámetros analizados
                  </p>
                </div>
                
                <Link
                  href={`/pacientes/${patientId}/laboratorios/${encodeURIComponent(dateStr)}`}
                  className="text-xs bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold transition-colors shrink-0"
                >
                  <Search className="h-3 w-3 text-cyan-500" />
                  Ver Detalles &rarr;
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
