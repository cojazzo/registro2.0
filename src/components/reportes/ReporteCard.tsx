"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download } from "lucide-react"

export function ReporteCard({ 
  title, 
  description, 
  endpoint, 
  icon: Icon, 
  iconClass 
}: { 
  title: string
  description: string
  endpoint: string
  icon: any
  iconClass: string 
}) {
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")

  const getHref = () => {
    const params = new URLSearchParams()
    if (fechaInicio) params.append("fecha_inicio", fechaInicio)
    if (fechaFin) params.append("fecha_fin", fechaFin)
    const qs = params.toString()
    return qs ? `${endpoint}?${qs}` : endpoint
  }

  return (
    <div className="bg-white border rounded-xl shadow-sm p-6 flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-full ${iconClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      
      <Dialog>
        <DialogTrigger render={<button className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors" />}>
          <Download className="h-4 w-4" />
          Descargar
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Filtrar {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Fecha de Inicio (opcional)</label>
              <input 
                type="date" 
                className="w-full border rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                value={fechaInicio} 
                onChange={e => setFechaInicio(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Fecha de Fin (opcional)</label>
              <input 
                type="date" 
                className="w-full border rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                value={fechaFin} 
                onChange={e => setFechaFin(e.target.value)} 
              />
            </div>
            
            <a
              href={getHref()}
              target="_blank"
              className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              Descargar Excel
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
