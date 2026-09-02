import { FileSpreadsheet, Users, Activity } from "lucide-react"
import { LabReportePanel } from "@/components/reportes/LabReportePanel"
import { ReporteCard } from "@/components/reportes/ReporteCard"

export default function ReportesPage() {
  return (
    <div className="space-y-6 p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reportes y Exportación</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Descarga la información en formato Excel (.xlsx) con tildes, ñ y todos los caracteres del español correctamente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <ReporteCard
          title="Directorio de Pacientes"
          description="Exporta los datos demográficos, de contacto y el diagnóstico principal de todos los pacientes registrados."
          endpoint="/api/reportes/pacientes"
          icon={<Users className="h-6 w-6" />}
          iconClass="bg-emerald-100 text-emerald-600"
        />

        <ReporteCard
          title="Consultas Médicas"
          description="Descarga un registro consolidado de todas las citas médicas, notas de evolución y signos vitales (somatometría)."
          endpoint="/api/reportes/clinicos"
          icon={<Activity className="h-6 w-6" />}
          iconClass="bg-indigo-100 text-indigo-600"
        />

        <LabReportePanel />

        <ReporteCard
          title="Consultas de Psicología"
          description="Descarga un registro de todas las citas de psicología, impresiones diagnósticas, intervenciones y planes de seguimiento."
          endpoint="/api/reportes/psicologia"
          icon={<Activity className="h-6 w-6" />}
          iconClass="bg-purple-100 text-purple-600"
        />

        <ReporteCard
          title="Consultas de Nutrición"
          description="Extrae el registro de las citas de nutrición, análisis dietéticos, planes de alimentación y recomendaciones."
          endpoint="/api/reportes/nutricion"
          icon={<Activity className="h-6 w-6" />}
          iconClass="bg-orange-100 text-orange-600"
        />

        <ReporteCard
          title="Trabajo Social"
          description="Exporta todas las evaluaciones sociales, datos socioeconómicos, estructura familiar y diagnósticos situacionales."
          endpoint="/api/reportes/trabajo-social"
          icon={<Users className="h-6 w-6" />}
          iconClass="bg-blue-100 text-blue-600"
        />
      </div>
    </div>
  )
}
