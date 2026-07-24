"use client"

import React, { useState } from "react"
import { Sankey, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, GitMerge, TrendingUp } from "lucide-react"

interface SankeyData {
  nodes: { name: string }[]
  links: { source: number; target: number; value: number }[]
}

interface DashboardChartsProps {
  sankeyData: {
    risk: SankeyData
    tfg: SankeyData
    acr: SankeyData
  }
}

const colors = {
  Bajo: "#10b981",        // Esmeralda
  Moderado: "#eab308",    // Amarillo
  Alto: "#f97316",        // Naranja
  "Muy Alto": "#ef4444",  // Rojo
  G1: "#10b981",
  G2: "#059669",
  G3a: "#eab308",
  G3b: "#d97706",
  G4: "#ea580c",
  G5: "#ef4444",
  A1: "#10b981",
  A2: "#eab308",
  A3: "#ef4444",
}

const getNodeColor = (name: any) => {
  if (!name || typeof name !== "string") return "#64748b"
  const cleanName = name.replace("Inicio: ", "").replace("Fin: ", "")
  return colors[cleanName as keyof typeof colors] || "#64748b"
}

const CustomSankeyNode = (props: any) => {
  const { x, y, width, height, name, payload } = props
  const nodeName = name || payload?.name || ""
  const isOut = x > 200 // Nodos finales a la derecha
  const color = getNodeColor(nodeName)
  
  let cleanName = nodeName
  if (nodeName.startsWith("Inicio: ")) {
    cleanName = nodeName.replace("Inicio: ", "") + " inicial"
  } else if (nodeName.startsWith("Fin: ")) {
    cleanName = nodeName.replace("Fin: ", "") + " final"
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity="0.85"
        stroke="#475569"
        strokeWidth={0.5}
        rx={3}
        className="transition-all duration-300 hover:fill-opacity-100"
        style={{ cursor: "pointer" }}
      />
      <text
        x={isOut ? x - 8 : x + width + 8}
        y={y + height / 2}
        textAnchor={isOut ? "end" : "start"}
        fontSize="12"
        fontWeight="700"
        fill="#1e293b"
        alignmentBaseline="middle"
        style={{ textShadow: "0px 0px 4px #ffffff, 0px 0px 2px #ffffff" }}
      >
        {cleanName}
      </text>
    </g>
  )
}

const CustomSankeyLink = (props: any) => {
  const { sourceX, sourceY, targetX, targetY, sourceControlX, targetControlX, linkWidth, payload } = props
  const name = payload?.source?.name || ""
  const color = getNodeColor(name)

  return (
    <path
      d={`M ${sourceX} ${sourceY} C ${sourceControlX} ${sourceY}, ${targetControlX} ${targetY}, ${targetX} ${targetY}`}
      fill="none"
      stroke={color}
      strokeOpacity="0.45"
      strokeWidth={linkWidth || 1}
      className="transition-all duration-300 hover:stroke-opacity-75"
      style={{ cursor: "pointer" }}
    />
  )
}

const SankeyTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    if (data && data.source && data.target) {
      const sourceName = (data.source.name || "").replace("Inicio: ", "") + " inicial"
      const targetName = (data.target.name || "").replace("Fin: ", "") + " final"
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-md p-3 text-xs font-semibold text-slate-700">
          <p className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900">{sourceName}</span>
            <span className="text-slate-400">→</span>
            <span className="font-bold text-slate-900">{targetName}</span>
          </p>
          <p className="text-indigo-600 mt-1.5">{data.value} {data.value === 1 ? 'paciente' : 'pacientes'}</p>
        </div>
      )
    }
  }
  return null
}

export function DashboardCharts({ sankeyData }: DashboardChartsProps) {
  const [activeTab, setActiveTab] = useState<"risk" | "tfg" | "acr">("risk")
  const [isMounted, setIsMounted] = useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!sankeyData) return null

  const currentData = sankeyData[activeTab]
  const hasLinks = currentData && currentData.links && currentData.links.length > 0

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-indigo-500" />
            Flujo de Evolución de Pacientes (Inicial → Final)
          </CardTitle>
          <CardDescription>
            Visualiza de forma interactiva la transición y progresión clínica de los pacientes desde su primer registro hasta el último.
          </CardDescription>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
          {[
            { id: "risk", label: "Riesgo KDIGO" },
            { id: "tfg", label: "Estadio TFG (G)" },
            { id: "acr", label: "Estadio ACR (A)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {!isMounted ? (
          <div className="h-[380px] w-full" />
        ) : hasLinks ? (
          <div className="h-[380px] w-full mt-2 px-2">
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={currentData}
                nodeWidth={12}
                nodePadding={18}
                iterations={0}
                margin={{ top: 20, right: 15, bottom: 20, left: 15 }}
                node={<CustomSankeyNode />}
                link={<CustomSankeyLink />}
              >
                <Tooltip content={<SankeyTooltip />} />
              </Sankey>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[380px] w-full flex flex-col items-center justify-center border border-dashed rounded-lg border-slate-200 text-slate-400">
            <TrendingUp className="w-8 h-8 mb-2" />
            <p className="text-sm">No hay suficientes datos de laboratorio registrados para generar el flujo evolutivo.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
