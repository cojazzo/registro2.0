"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileUp, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"

export default function ImportarPacientesPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{
    patientsCreated: number;
    appointmentsCreated: number;
    vitalsCreated: number;
    labsCreated: number;
    medsCreated: number;
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setError(null)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/pacientes/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error al importar el archivo")
      }

      setResult(data)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "No se pudo procesar el archivo")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Importar Pacientes</h1>
        <p className="text-slate-500 mt-1">Sube un archivo de Excel (.xlsx) con el formato establecido para registrar pacientes, citas y laboratorios masivamente.</p>
      </div>

      {!result ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center hover:bg-slate-50 transition-colors">
            <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-700 font-medium text-lg mb-2">Selecciona tu archivo de Excel</p>
            <p className="text-slate-500 text-sm mb-6">El archivo debe contener el formato de base de datos (con columnas de paciente, talla, labs, etc.)</p>
            
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <FileUp className="w-4 h-4" />
              Elegir Archivo
            </label>
          </div>

          {file && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">{file.name}</p>
                  <p className="text-xs text-blue-700">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {isUploading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Procesando...</>
                ) : (
                  "Procesar Archivo"
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error de importación</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Importación Exitosa</h2>
          <p className="text-slate-500 mb-8">El archivo ha sido procesado y los datos se guardaron en la base de datos.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8 text-left">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <p className="text-slate-500 text-sm font-medium">Pacientes</p>
              <p className="text-2xl font-bold text-slate-900">{result.patientsCreated}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <p className="text-slate-500 text-sm font-medium">Citas / Consultas</p>
              <p className="text-2xl font-bold text-slate-900">{result.appointmentsCreated}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <p className="text-slate-500 text-sm font-medium">Signos Vitales</p>
              <p className="text-2xl font-bold text-slate-900">{result.vitalsCreated}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <p className="text-slate-500 text-sm font-medium">Laboratorios</p>
              <p className="text-2xl font-bold text-slate-900">{result.labsCreated}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <p className="text-slate-500 text-sm font-medium">Medicamentos</p>
              <p className="text-2xl font-bold text-slate-900">{result.medsCreated}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => { setFile(null); setResult(null); }}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              Subir otro archivo
            </button>
            <button
              onClick={() => router.push("/pacientes")}
              className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir a Pacientes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
