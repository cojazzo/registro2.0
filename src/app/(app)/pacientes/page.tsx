import prisma from "@/lib/prisma"
import { PatientList } from "@/components/patients/patient-list"
import Link from "next/link"
import { UserPlus } from "lucide-react"
import { calculateEgfr, getErcClassification } from "@/lib/clinical-math"

export default async function PacientesPage() {
  // Obtenemos los pacientes desde la DB real con sus laboratorios y signos vitales
  const rawPacientes = await prisma.patient.findMany({
    orderBy: { lastName: 'asc' },
    include: {
      labs: {
        orderBy: { date: 'desc' }
      },
      vitals: {
        orderBy: { date: 'desc' },
        take: 1
      }
    }
  })

  // Mapeamos para calcular dinámicamente el estadio de ERC KDIGO
  const pacientes = rawPacientes.map((p) => {
    const ageYears = Math.floor(
      (new Date().getTime() - new Date(p.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    )

    const latestCreatinineLab = p.labs.find(
      (l) => l.parameter === "Creatinina" || l.parameter === "Creatinina serica"
    )
    const latestAcrLab = p.labs.find(
      (l) => l.parameter === "Relacion Albumina/Creatinina"
    )

    const latestHeight = p.vitals[0]?.height ?? null

    const egfr = latestCreatinineLab
      ? calculateEgfr(latestCreatinineLab.value, ageYears, p.gender, latestHeight)
      : null
    
    const acr = latestAcrLab ? latestAcrLab.value : null

    const erc = getErcClassification(egfr, acr)

    return {
      id: p.id,
      clinicalId: p.clinicalId,
      firstName: p.firstName,
      lastName: p.lastName,
      curp: p.curp,
      mainDiagnosis: p.mainDiagnosis,
      ercStage: erc.stage,
      ercColorClass: erc.colorClass,
      ercRisk: erc.risk
    }
  })

  return (
    <div className="space-y-6 p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Directorio de Pacientes</h2>
          <p className="text-muted-foreground mt-1">
            Buscador global de pacientes. Utiliza la barra inferior para buscar y acceder al expediente longitudinal.
          </p>
        </div>
        <Link href="/pacientes/nuevo" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md flex items-center gap-2 font-medium transition-colors whitespace-nowrap">
          <UserPlus className="h-5 w-5" />
          Nuevo Paciente
        </Link>
      </div>
      
      <PatientList initialPatients={pacientes} />
    </div>
  )
}
