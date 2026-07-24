import { FileSpreadsheet, Users, Activity, FlaskConical, Download } from "lucide-react"

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
        {/* Pacientes */}
        <div className="bg-white border rounded-xl shadow-sm p-6 flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Directorio de Pacientes</h2>
            <p className="text-sm text-slate-500 mt-1">
              Exporta los datos demográficos, de contacto y el diagnóstico principal de todos los pacientes registrados.
            </p>
          </div>
          <a
            href="/api/reportes/pacientes"
            target="_blank"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Descargar Excel
          </a>
        </div>

        {/* Datos Clínicos */}
        <div className="bg-white border rounded-xl shadow-sm p-6 flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
            <Activity className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Consultas Médicas</h2>
            <p className="text-sm text-slate-500 mt-1">
              Descarga un registro consolidado de todas las citas médicas, notas de evolución y signos vitales (somatometría).
            </p>
          </div>
          <a
            href="/api/reportes/clinicos"
            target="_blank"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Descargar Excel
          </a>
        </div>

        {/* Laboratorios */}
        <div className="bg-white border rounded-xl shadow-sm p-6 flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
            <FlaskConical className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Estudios de Laboratorio</h2>
            <p className="text-sm text-slate-500 mt-1">
              Extrae una lista completa de todos los resultados de laboratorio procesados y vinculados por paciente y fecha.
            </p>
          </div>
          <a
            href="/api/reportes/laboratorios"
            target="_blank"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Descargar Excel
          </a>
        </div>

        {/* Psicología */}
        <div className="bg-white border rounded-xl shadow-sm p-6 flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <Activity className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Consultas de Psicología</h2>
            <p className="text-sm text-slate-500 mt-1">
              Descarga un registro de todas las citas de psicología, impresiones diagnósticas, intervenciones y planes de seguimiento.
            </p>
          </div>
          <a
            href="/api/reportes/psicologia"
            target="_blank"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Descargar Excel
          </a>
        </div>

        {/* Nutrición */}
        <div className="bg-white border rounded-xl shadow-sm p-6 flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
            <Activity className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Consultas de Nutrición</h2>
            <p className="text-sm text-slate-500 mt-1">
              Extrae el registro de las citas de nutrición, análisis dietéticos, planes de alimentación y recomendaciones.
            </p>
          </div>
          <a
            href="/api/reportes/nutricion"
            target="_blank"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Descargar Excel
          </a>
        </div>

        {/* Trabajo Social */}
        <div className="bg-white border rounded-xl shadow-sm p-6 flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Trabajo Social</h2>
            <p className="text-sm text-slate-500 mt-1">
              Exporta todas las evaluaciones sociales, datos socioeconómicos, estructura familiar y diagnósticos situacionales.
            </p>
          </div>
          <a
            href="/api/reportes/trabajo-social"
            target="_blank"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Descargar Excel
          </a>
        </div>
      </div>
    </div>
  )
}
