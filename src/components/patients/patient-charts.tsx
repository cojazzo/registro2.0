"use client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

export type ChartDataPoint = {
  name: string
  Valor: number
}

export type MedicationEvent = {
  name: string
  dateFormatted: string
}

export function AcrChart({ data, medications = [] }: { data: ChartDataPoint[], medications?: MedicationEvent[] }) {
  const losartan = medications.find(m => m.name === "Losartán")
  const dapa = medications.find(m => m.name === "Dapagliflozina")

  if (!data || data.length === 0) return <p className="text-muted-foreground text-sm text-center py-6 border border-dashed rounded-md mt-4">No hay datos de Relación Albúmina/Creatinina reportados.</p>

  return (
    <div className="h-[220px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 55, bottom: 5, left: -25 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            domain={[0, (dataMax: number) => Math.max(350, Math.ceil(dataMax * 1.15))]} 
            tickMargin={10} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
            itemStyle={{ color: '#0ea5e9' }}
          />
          
          {/* Líneas de Corte Clínicas (ACR) */}
          <ReferenceLine y={30} stroke="#f59e0b" strokeDasharray="2 2" label={{ value: 'A2 (30)', fill: '#b45309', fontSize: 9, position: 'right' }} />
          <ReferenceLine y={300} stroke="#ef4444" strokeDasharray="2 2" label={{ value: 'A3 (300)', fill: '#b91c1c', fontSize: 9, position: 'right' }} />

          {losartan && (
            <ReferenceLine 
              x={losartan.dateFormatted} 
              stroke="#6366f1" 
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{ position: 'top', value: "Losartán", fill: '#4f46e5', fontSize: 10, fontWeight: 'bold' }} 
            />
          )}
          {dapa && (
            <ReferenceLine 
              x={dapa.dateFormatted} 
              stroke="#6366f1" 
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{ position: 'top', value: "Dapagliflozina", fill: '#4f46e5', fontSize: 10, fontWeight: 'bold' }} 
            />
          )}
          <Line connectNulls={true} type="monotone" name="ACR (mg/g)" dataKey="Valor" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: "white", strokeWidth: 2 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function EgfrChart({ data, medications = [] }: { data: ChartDataPoint[], medications?: MedicationEvent[] }) {
  const losartan = medications.find(m => m.name === "Losartán")
  const dapa = medications.find(m => m.name === "Dapagliflozina")

  if (!data || data.length === 0) return <p className="text-muted-foreground text-sm text-center py-6 border border-dashed rounded-md mt-4">No hay datos de creatinina sérica para estimar la TFG.</p>

  return (
    <div className="h-[220px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 55, bottom: 5, left: -25 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            domain={[0, 150]} 
            tickMargin={10} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
            itemStyle={{ color: '#10b981' }}
          />

          {/* Líneas de Corte Clínicas (KDIGO TFG) */}
          <ReferenceLine y={90} stroke="#10b981" strokeDasharray="2 2" label={{ value: 'G1 (90)', fill: '#047857', fontSize: 9, position: 'right' }} />
          <ReferenceLine y={60} stroke="#059669" strokeDasharray="2 2" label={{ value: 'G2 (60)', fill: '#047857', fontSize: 9, position: 'right' }} />
          <ReferenceLine y={45} stroke="#f59e0b" strokeDasharray="2 2" label={{ value: 'G3a (45)', fill: '#b45309', fontSize: 9, position: 'right' }} />
          <ReferenceLine y={30} stroke="#d97706" strokeDasharray="2 2" label={{ value: 'G3b (30)', fill: '#b45309', fontSize: 9, position: 'right' }} />
          <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="2 2" label={{ value: 'G4 (15)', fill: '#b91c1c', fontSize: 9, position: 'right' }} />

          {losartan && (
            <ReferenceLine 
              x={losartan.dateFormatted} 
              stroke="#6366f1" 
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{ position: 'top', value: "Losartán", fill: '#4f46e5', fontSize: 10, fontWeight: 'bold' }} 
            />
          )}
          {dapa && (
            <ReferenceLine 
              x={dapa.dateFormatted} 
              stroke="#6366f1" 
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{ position: 'top', value: "Dapagliflozina", fill: '#4f46e5', fontSize: 10, fontWeight: 'bold' }} 
            />
          )}
          <Line connectNulls={true} type="monotone" name="eGFR (mL/min/1.73m²)" dataKey="Valor" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "white", strokeWidth: 2 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
