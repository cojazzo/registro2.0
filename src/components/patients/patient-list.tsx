"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { FileText, Search } from "lucide-react"

type Patient = {
  id: string
  clinicalId: string | null
  firstName: string
  lastName: string
  curp: string | null
  mainDiagnosis: string | null
  ercStage: string
  ercColorClass: string
  ercRisk: string
}

export function PatientList({ initialPatients }: { initialPatients: Patient[] }) {
  const [search, setSearch] = useState("")

  // Si no hay búsqueda, podemos ocultar la lista o mostrar todo. 
  // Para el flujo médico, mostrar todos o los más recientes es útil. 
  // Ocultar la lista hasta que busque es más limpio si la base de datos es gigante.
  // Mostraremos la lista completa al inicio, pero se filtrará dinámicamente.
  const filteredPatients = initialPatients.filter((p) => {
    if (!search) return true 
    const query = search.toLowerCase()
    return (
      p.firstName.toLowerCase().includes(query) ||
      p.lastName.toLowerCase().includes(query) ||
      (p.clinicalId && p.clinicalId.toLowerCase().includes(query)) ||
      (p.curp && p.curp.toLowerCase().includes(query))
    )
  })

  return (
    <div className="space-y-6">
      <div className="relative shadow-sm rounded-md">
        <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Buscar paciente por expediente, nombre, CURP..." 
          className="pl-12 py-7 text-lg bg-white border-slate-200 focus-visible:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {search && filteredPatients.length === 0 && (
        <div className="text-center py-12 bg-white rounded-md border border-dashed">
          <p className="text-muted-foreground text-lg">No se encontraron pacientes que coincidan con "{search}".</p>
        </div>
      )}

      {filteredPatients.length > 0 && (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Expediente / ID</th>
                <th className="px-6 py-4 font-medium">Nombre Completo</th>
                <th className="px-6 py-4 font-medium">CURP</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Estadio ERC (KDIGO)</th>
                <th className="px-6 py-4 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                   <td className="px-6 py-4 font-mono font-medium text-slate-700">
                     {p.clinicalId || 'N/A'}
                   </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900">{p.lastName}</span>, {p.firstName}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500">
                    {p.curp || 'N/A'}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md border ${p.ercColorClass}`}>
                        {p.ercStage}
                      </span>
                      {p.ercStage === "Sin estadificar" && p.mainDiagnosis && (
                        <span className="text-xs text-slate-400 font-medium">
                          ({p.mainDiagnosis})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 flex justify-end">
                    <Link href={`/pacientes/${p.id}`} className="text-sm bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-md flex items-center gap-2 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-slate-900">
                      <FileText className="h-4 w-4" />
                      Abrir Expediente
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
