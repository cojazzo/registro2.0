import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, FileText, Activity } from "lucide-react"
import { calculateEgfr } from "@/lib/clinical-math"
import { differenceInYears, format, subMonths, isAfter, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"

export default async function DashboardPage() {
  const patientCount = await prisma.patient.count()
  const appointmentCount = await prisma.appointment.count()
  const noteCount = await prisma.note.count()
  const abnormalLabs = await prisma.laboratoryResult.count({
    where: { isAbnormal: true }
  })

  // Obtener todos los pacientes con sus laboratorios ordenados cronológicamente
  const patients = await prisma.patient.findMany({
    include: {
      labs: {
        orderBy: { date: 'asc' }
      }
    }
  })

  const riskNodes = [
    { name: "Inicio: Bajo" },
    { name: "Inicio: Moderado" },
    { name: "Inicio: Alto" },
    { name: "Inicio: Muy Alto" },
    { name: "Fin: Bajo" },
    { name: "Fin: Moderado" },
    { name: "Fin: Alto" },
    { name: "Fin: Muy Alto" },
  ]
  const riskLinks: { source: number; target: number; value: number }[] = []

  const tfgNodes = [
    { name: "Inicio: G1" },
    { name: "Inicio: G2" },
    { name: "Inicio: G3a" },
    { name: "Inicio: G3b" },
    { name: "Inicio: G4" },
    { name: "Inicio: G5" },
    { name: "Fin: G1" },
    { name: "Fin: G2" },
    { name: "Fin: G3a" },
    { name: "Fin: G3b" },
    { name: "Fin: G4" },
    { name: "Fin: G5" },
  ]
  const tfgLinks: { source: number; target: number; value: number }[] = []

  const acrNodes = [
    { name: "Inicio: A1" },
    { name: "Inicio: A2" },
    { name: "Inicio: A3" },
    { name: "Fin: A1" },
    { name: "Fin: A2" },
    { name: "Fin: A3" },
  ]
  const acrLinks: { source: number; target: number; value: number }[] = []

  patients.forEach(patient => {
    const creatininaLabs = patient.labs.filter(l => l.parameter === "Creatinina serica")
    const acrLabs = patient.labs.filter(l => l.parameter === "Relacion Albumina/Creatinina")

    if (creatininaLabs.length === 0 && acrLabs.length === 0) return

    const firstCreatinina = creatininaLabs[0]
    const firstAcr = acrLabs[0]
    const lastCreatinina = creatininaLabs[creatininaLabs.length - 1]
    const lastAcr = acrLabs[acrLabs.length - 1]

    const getTfg = (lab: typeof firstCreatinina) => {
      if (!lab) return null
      const age = differenceInYears(lab.date, patient.dob)
      return calculateEgfr(lab.value, age, patient.gender, null)
    }

    const initTfg = getTfg(firstCreatinina)
    const finTfg = getTfg(lastCreatinina)
    const initAcr = firstAcr ? Number(firstAcr.value) : null
    const finAcr = lastAcr ? Number(lastAcr.value) : null

    // KDIGO Risk Index
    const getRiskIndex = (tfg: number | null, acr: number | null) => {
      if (tfg === null && acr === null) return -1
      let g = 1
      if (tfg !== null) {
        if (tfg >= 90) g = 1
        else if (tfg >= 60) g = 2
        else if (tfg >= 45) g = 3 // G3a
        else if (tfg >= 30) g = 4 // G3b
        else if (tfg >= 15) g = 5 // G4
        else g = 6 // G5
      }
      let a = 1
      if (acr !== null) {
        if (acr < 30) a = 1
        else if (acr <= 300) a = 2
        else a = 3
      }

      if (g <= 2) {
        if (a === 1) return 0 // Bajo
        if (a === 2) return 1 // Moderado
        return 2 // Alto
      } else if (g === 3) {
        if (a === 1) return 1 // Moderado
        if (a === 2) return 2 // Alto
        return 3 // Muy Alto
      } else if (g === 4) {
        if (a === 1) return 2 // Alto
        return 3 // Muy Alto
      } else {
        return 3 // Muy Alto
      }
    }

    const initRiskIdx = getRiskIndex(initTfg, initAcr)
    const finRiskIdx = getRiskIndex(finTfg, finAcr)

    if (initRiskIdx >= 0 && finRiskIdx >= 0) {
      const existing = riskLinks.find(l => l.source === initRiskIdx && l.target === finRiskIdx + 4)
      if (existing) existing.value++
      else riskLinks.push({ source: initRiskIdx, target: finRiskIdx + 4, value: 1 })
    }

    // TFG Index
    const getTfgIndex = (tfg: number | null) => {
      if (tfg === null) return -1
      if (tfg >= 90) return 0
      if (tfg >= 60) return 1
      if (tfg >= 45) return 2
      if (tfg >= 30) return 3
      if (tfg >= 15) return 4
      return 5
    }

    const initTfgIdx = getTfgIndex(initTfg)
    const finTfgIdx = getTfgIndex(finTfg)

    if (initTfgIdx >= 0 && finTfgIdx >= 0) {
      const existing = tfgLinks.find(l => l.source === initTfgIdx && l.target === finTfgIdx + 6)
      if (existing) existing.value++
      else tfgLinks.push({ source: initTfgIdx, target: finTfgIdx + 6, value: 1 })
    }

    // ACR Index
    const getAcrIndex = (acr: number | null) => {
      if (acr === null) return -1
      if (acr < 30) return 0
      if (acr <= 300) return 1
      return 2
    }

    const initAcrIdx = getAcrIndex(initAcr)
    const finAcrIdx = getAcrIndex(finAcr)

    if (initAcrIdx >= 0 && finAcrIdx >= 0) {
      const existing = acrLinks.find(l => l.source === initAcrIdx && l.target === finAcrIdx + 3)
      if (existing) existing.value++
      else acrLinks.push({ source: initAcrIdx, target: finAcrIdx + 3, value: 1 })
    }
  })

  const sankeyData = {
    risk: { nodes: riskNodes, links: riskLinks },
    tfg: { nodes: tfgNodes, links: tfgLinks },
    acr: { nodes: acrNodes, links: acrLinks }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Clínica</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientCount}</div>
            <p className="text-xs text-muted-foreground">Pacientes registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Agendadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentCount}</div>
            <p className="text-xs text-muted-foreground">En el calendario general</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notas Clínicas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{noteCount}</div>
            <p className="text-xs text-muted-foreground">Registros en total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labs Alterados</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{abnormalLabs}</div>
            <p className="text-xs text-muted-foreground">Resultados que requieren atención</p>
          </CardContent>
        </Card>
      </div>
      
      <DashboardCharts sankeyData={sankeyData} />
    </div>
  )
}
