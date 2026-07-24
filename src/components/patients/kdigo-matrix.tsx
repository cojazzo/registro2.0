import React from "react"
import { ShieldAlert } from "lucide-react"
import { getEgfrStage, getAcrStage } from "@/lib/clinical-math"

interface KdigoMatrixProps {
  egfr: number | null
  acr: number | null
}

const KDIGO_GRID = [
  { stage: "G1", desc: "≥ 90", a1: "Bajo", a2: "Moderado", a3: "Alto" },
  { stage: "G2", desc: "60-89", a1: "Bajo", a2: "Moderado", a3: "Alto" },
  { stage: "G3a", desc: "45-59", a1: "Moderado", a2: "Alto", a3: "Muy Alto" },
  { stage: "G3b", desc: "30-44", a1: "Alto", a2: "Muy Alto", a3: "Muy Alto" },
  { stage: "G4", desc: "15-29", a1: "Muy Alto", a2: "Muy Alto", a3: "Muy Alto" },
  { stage: "G5", desc: "< 15", a1: "Muy Alto", a2: "Muy Alto", a3: "Muy Alto" },
]

export function KdigoMatrix({ egfr, acr }: KdigoMatrixProps) {
  if (egfr === null) return null;

  const currentG = getEgfrStage(egfr).stage; // e.g. "G1", "G2"
  const currentA = acr !== null ? getAcrStage(acr).stage : "A1"; // default to A1 if missing for visual purposes

  const getColorClass = (risk: string, isActive: boolean) => {
    let base = "bg-slate-100 text-transparent" // default empty look
    
    if (risk === "Bajo") base = "bg-emerald-100"
    if (risk === "Moderado") base = "bg-amber-100"
    if (risk === "Alto") base = "bg-orange-200"
    if (risk === "Muy Alto") base = "bg-red-300"

    if (isActive) {
      if (risk === "Bajo") base = "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105 ring-2 ring-emerald-600 z-10 font-bold"
      if (risk === "Moderado") base = "bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105 ring-2 ring-amber-600 z-10 font-bold"
      if (risk === "Alto") base = "bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105 ring-2 ring-orange-600 z-10 font-bold"
      if (risk === "Muy Alto") base = "bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105 ring-2 ring-red-700 z-10 font-bold"
    }
    
    return base + " transition-all duration-300 flex items-center justify-center rounded-md"
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
      <h2 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-2 text-sm">
        <ShieldAlert className="h-4 w-4 text-rose-500" /> Riesgo Renal (KDIGO)
      </h2>
      
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[280px] w-full">
          {/* Header Row (ACR) */}
          <div className="grid grid-cols-4 gap-1 mb-1">
            <div className="text-[10px] font-semibold text-slate-400 p-1 flex items-end leading-tight">TFG<br/>(mL/min)</div>
            <div className="text-center">
              <div className="text-[11px] font-bold text-slate-700">A1</div>
              <div className="text-[9px] text-slate-500 leading-tight">{"< 30 mg/g"}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-bold text-slate-700">A2</div>
              <div className="text-[9px] text-slate-500 leading-tight">{"30-300 mg/g"}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-bold text-slate-700">A3</div>
              <div className="text-[9px] text-slate-500 leading-tight">{"> 300 mg/g"}</div>
            </div>
          </div>

          {/* Grid Rows (eGFR) */}
          <div className="space-y-1 relative">
            {KDIGO_GRID.map((row) => (
              <div key={row.stage} className="grid grid-cols-4 gap-1 h-8">
                <div className="flex flex-col justify-center px-1 border-r border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 leading-none">{row.stage}</span>
                  <span className="text-[9px] text-slate-500 leading-none">{row.desc}</span>
                </div>
                <div className={getColorClass(row.a1, currentG === row.stage && currentA === "A1")}>
                  {currentG === row.stage && currentA === "A1" && <span className="text-[10px]">Actual</span>}
                </div>
                <div className={getColorClass(row.a2, currentG === row.stage && currentA === "A2")}>
                  {currentG === row.stage && currentA === "A2" && <span className="text-[10px]">Actual</span>}
                </div>
                <div className={getColorClass(row.a3, currentG === row.stage && currentA === "A3")}>
                  {currentG === row.stage && currentA === "A3" && <span className="text-[10px]">Actual</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
