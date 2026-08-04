"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LAB_PARAMETERS } from "@/lib/lab-parameters"
import { FlaskConical, Download } from "lucide-react"

const CAMPOS_FIJOS = ["ID Paciente", "Nombre", "Apellido", "CURP", "ID Clínico"]

export function LabReportePanel() {
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [selectedCampos, setSelectedCampos] = useState<Set<string>>(new Set(CAMPOS_FIJOS))
  const [selectedParams, setSelectedParams] = useState<Set<string>>(new Set(LAB_PARAMETERS))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setLoading(true)
    setError(null)
    try {
      const allParamsSelected = selectedParams.size === LAB_PARAMETERS.length
      const params = new URLSearchParams()
      if (fechaInicio) params.append("fecha_inicio", fechaInicio)
      if (fechaFin) params.append("fecha_fin", fechaFin)
      if (selectedCampos.size !== CAMPOS_FIJOS.length) params.append("campos", Array.from(selectedCampos).join(","))
      if (!allParamsSelected) params.append("parametros", Array.from(selectedParams).join(","))

      const res = await fetch(`/api/reportes/laboratorios?${params.toString()}`)
      if (!res.ok) throw new Error("Error al generar el reporte")
      
      const blob = await res.blob()
      const disposition = res.headers.get("content-disposition") || ""
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] || "Laboratorios.xlsx"
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplate = async () => {
    try {
      const res = await fetch("/api/reportes/laboratorios/template")
      if (!res.ok) throw new Error("Error al descargar el template")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const hoy = new Date().toISOString().split("T")[0]
      a.download = `Template_Laboratorios_${hoy}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const toggleCampo = (c: string) => {
    const newSet = new Set(selectedCampos)
    if (newSet.has(c)) newSet.delete(c)
    else newSet.add(c)
    setSelectedCampos(newSet)
  }

  const toggleParam = (p: string) => {
    const newSet = new Set(selectedParams)
    if (newSet.has(p)) newSet.delete(p)
    else newSet.add(p)
    setSelectedParams(newSet)
  }

  return (
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

      <Dialog>
        <DialogTrigger asChild>
          <button className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors">
            <Download className="h-4 w-4" />
            Configurar y Descargar
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exportar Reporte de Laboratorios</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Fecha Inicio</label>
                <input type="date" className="w-full border rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Fecha Fin</label>
                <input type="date" className="w-full border rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Campos Fijos ({selectedCampos.size}/{CAMPOS_FIJOS.length})</h3>
              <div className="flex flex-wrap gap-2">
                {CAMPOS_FIJOS.map(c => (
                  <label key={c} className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:bg-slate-200">
                    <input type="checkbox" checked={selectedCampos.has(c)} onChange={() => toggleCampo(c)} className="accent-rose-600" />
                    {c}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Parámetros ({selectedParams.size}/{LAB_PARAMETERS.length})</h3>
                <div className="space-x-3 text-xs">
                  <button onClick={() => setSelectedParams(new Set(LAB_PARAMETERS))} className="text-blue-600 font-medium hover:underline">Seleccionar Todos</button>
                  <button onClick={() => setSelectedParams(new Set())} className="text-slate-500 hover:underline">Limpiar</button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 max-h-60 overflow-y-auto p-3 border rounded-md bg-slate-50/50">
                {LAB_PARAMETERS.map(p => (
                  <label key={p} className="flex items-center gap-2 text-xs cursor-pointer truncate hover:text-rose-700 transition-colors">
                    <input type="checkbox" checked={selectedParams.has(p)} onChange={() => toggleParam(p)} className="accent-rose-600 shrink-0" />
                    <span className="truncate" title={p}>{p}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
            
            <div className="flex gap-3 pt-4 border-t">
              <button 
                onClick={handleExport} 
                disabled={loading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Generando...' : 'Descargar Excel Pivotado'}
              </button>
              <button 
                onClick={handleTemplate}
                className="flex-1 bg-slate-100 hover:bg-slate-200 border text-slate-900 py-2.5 rounded-md text-sm font-medium transition-colors"
              >
                Descargar Template Vacío
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
