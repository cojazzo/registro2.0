import { PrismaClient } from '@prisma/client'
import { differenceInYears } from "date-fns"
import { calculateEgfr } from "../src/lib/clinical-math"

const prisma = new PrismaClient()

async function main() {
  const patients = await prisma.patient.findMany({
    include: {
      labs: {
        orderBy: { date: 'asc' }
      }
    }
  })

  console.log(`Pacientes totales: ${patients.length}`)

  const riskLinks: { source: number; target: number; value: number }[] = []
  const tfgLinks: { source: number; target: number; value: number }[] = []
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
        else if (tfg >= 45) g = 3
        else if (tfg >= 30) g = 4
        else if (tfg >= 15) g = 5
        else g = 6
      }
      let a = 1
      if (acr !== null) {
        if (acr < 30) a = 1
        else if (acr <= 300) a = 2
        else a = 3
      }
      if (g <= 2) {
        if (a === 1) return 0
        if (a === 2) return 1
        return 2
      } else if (g === 3) {
        if (a === 1) return 1
        if (a === 2) return 2
        return 3
      } else if (g === 4) {
        if (a === 1) return 2
        return 3
      } else {
        return 3
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

  console.log("=== KDIGO RISK FLOW LINKS ===")
  console.log(riskLinks)

  console.log("=== TFG FLOW LINKS ===")
  console.log(tfgLinks)

  console.log("=== ACR FLOW LINKS ===")
  console.log(acrLinks)
}

main().catch(console.error).finally(() => prisma.$disconnect())
