import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowLeft,
  CalendarPlus,
  Stethoscope,
  Activity,
  User,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Pill,
  FlaskConical,
} from "lucide-react"
import { AcrChart, EgfrChart, type ChartDataPoint } from "@/components/patients/patient-charts"
import { KdigoMatrix } from "@/components/patients/kdigo-matrix"
import { calculateBMI, calculateEGFR, getErcClassification, getEgfrStage, getAcrStage } from "@/lib/clinical-math"
import { AppointmentsList } from "@/components/patients/appointments-list"
import { PatientLabsTable } from "@/components/patients/labs-table"


export default async function ExpedientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        include: { 
          user: { select: { name: true, role: true } },
          notes: {
            include: { user: { select: { name: true } } }
          }
        },
        orderBy: { dateTime: "desc" },
      },
      labs: { orderBy: { date: "asc" } },
      vitals: { orderBy: { date: "desc" } },
      medications: { orderBy: { date: "desc" } },
    },
  })

  if (!patient) notFound()

  // Find the latest appointment that prescribed medications to filter "active" ones
  const latestMedicationApptId = patient.medications.length > 0 ? patient.medications[0].appointmentId : null
  const rawActiveMedications = patient.medications.filter(med => med.appointmentId === latestMedicationApptId)
  
  // Deduplicar medicamentos por nombre para evitar duplicados visuales
  const activeMedications = rawActiveMedications.filter(
    (med, idx, self) => self.findIndex(m => m.name === med.name) === idx
  )

  const latestVitals = patient.vitals[0] ?? null

  const ageYears = Math.floor(
    (new Date().getTime() - new Date(patient.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  )

  // Find labs for Creatinina (creatinina sérica) and Relación Albúmina/Creatinina (ACR)
  const creatinineLabs = patient.labs.filter(
    (l) => l.parameter === "Creatinina" || l.parameter === "Creatinina serica"
  )
  const latestCreatinine = creatinineLabs[creatinineLabs.length - 1] ?? null

  const acrLabs = patient.labs.filter(
    (l) => l.parameter === "Relacion Albumina/Creatinina"
  )
  const latestAcr = acrLabs[acrLabs.length - 1] ?? null

  const egfrVal = latestCreatinine
    ? calculateEGFR(latestCreatinine.value, ageYears, patient.gender, latestVitals?.height)
    : null
  
  const acrVal = latestAcr ? latestAcr.value : null

  // Calculate dynamic ERC KDIGO classification
  const erc = getErcClassification(egfrVal, acrVal)

  // Map charts data points
  const eGFRData: ChartDataPoint[] = creatinineLabs
    .map((l) => {
      const pointEgfr = calculateEGFR(l.value, ageYears, patient.gender, latestVitals?.height)
      return {
        name: format(new Date(l.date), "MMM yy", { locale: es }),
        Valor: pointEgfr !== null ? parseFloat(pointEgfr.toFixed(1)) : null,
      }
    })
    .filter((point): point is ChartDataPoint => point.Valor !== null)

  const acrDataPoints: ChartDataPoint[] = acrLabs.map((l) => ({
    name: format(new Date(l.date), "MMM yy", { locale: es }),
    Valor: l.value,
  }))

  const medicationsForCharts = patient.medications
    .filter(m => new Date(m.date).getFullYear() > 1900)
    .map(m => ({
      name: m.name,
      dateFormatted: format(new Date(m.date), "MMM yy", { locale: es }),
      dateRaw: new Date(m.date)
    }))
    .reverse()

  // Inject medication months into charts if they don't exist, to allow ReferenceLine to render
  medicationsForCharts.forEach(med => {
    if (!eGFRData.some(d => d.name === med.dateFormatted)) {
      eGFRData.push({ name: med.dateFormatted, Valor: null as any })
    }
    if (!acrDataPoints.some(d => d.name === med.dateFormatted)) {
      acrDataPoints.push({ name: med.dateFormatted, Valor: null as any })
    }
  })

  // Agrupar y promediar puntos por mes para evitar distorsiones y problemas de renderizado de ReferenceLine
  const averageByMonth = (points: ChartDataPoint[]) => {
    const grouped: Record<string, { total: number; count: number }> = {}
    points.forEach(p => {
      if (p.Valor === null || p.Valor === undefined) {
        if (!grouped[p.name]) {
          grouped[p.name] = { total: 0, count: 0 }
        }
        return
      }
      if (!grouped[p.name]) {
        grouped[p.name] = { total: 0, count: 0 }
      }
      grouped[p.name].total += p.Valor
      grouped[p.name].count += 1
    })

    return Object.keys(grouped).map(name => {
      const g = grouped[name]
      return {
        name,
        Valor: g.count > 0 ? parseFloat((g.total / g.count).toFixed(1)) : null
      }
    }) as ChartDataPoint[]
  }

  const eGFRDataGrouped = averageByMonth(eGFRData)
  const acrDataPointsGrouped = averageByMonth(acrDataPoints)

  // Sort by date (assuming name is "MMM yy")
  const parseDate = (mmmYY: string) => {
    const [month, year] = mmmYY.split(" ")
    const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
    const monthIdx = months.indexOf(month.replace(".", "").toLowerCase())
    return new Date(2000 + parseInt(year), monthIdx, 1).getTime()
  }

  eGFRDataGrouped.sort((a, b) => parseDate(a.name) - parseDate(b.name))
  acrDataPointsGrouped.sort((a, b) => parseDate(a.name) - parseDate(b.name))

  const bmi = latestVitals?.weight && latestVitals?.height
    ? calculateBMI(latestVitals.weight, latestVitals.height)
    : null

  const statusColors: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    NO_SHOW: "bg-amber-100 text-amber-700",
  }
  const statusLabels: Record<string, string> = {
    SCHEDULED: "Programada",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
    NO_SHOW: "No presentó",
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Back + Header ── */}
      <div className="flex items-center gap-4">
        <Link
          href="/pacientes"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">
            {patient.lastName}, {patient.firstName}
          </h1>
          <div className="flex items-center gap-2 flex-wrap text-muted-foreground text-sm mt-1">
            <span>{ageYears} años</span>
            <span>·</span>
            <span>{patient.gender === "M" ? "Masculino" : "Femenino"}</span>
            <span>·</span>
            <span className="bg-slate-100 font-semibold px-2 py-0.5 rounded text-xs font-mono text-slate-700">
              Expediente: {patient.id}
            </span>
            <span>·</span>
            <span className="bg-slate-100 font-semibold px-2 py-0.5 rounded text-xs font-mono text-slate-700">
              CURP: {patient.curp ?? "Sin CURP"}
            </span>
            {patient.clinicalId && (
              <>
                <span>·</span>
                <span className="bg-slate-100 font-semibold px-2 py-0.5 rounded text-xs font-mono text-slate-700">
                  ID Clínico: {patient.clinicalId}
                </span>
              </>
            )}
          </div>
        </div>
        <Link
          href={`/agenda/nueva`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <CalendarPlus className="h-4 w-4" />
          Agendar Cita
        </Link>
        <Link
          href="/consultas/nueva"
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Stethoscope className="h-4 w-4" />
          Iniciar Consulta
        </Link>
      </div>

      {/* ── ERC KDIGO Classification Card ── */}
      <div className={`p-5 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${erc.colorClass} shadow-sm transition-all`}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/70 border border-current/25 shadow-2xs">
              Estadificación ERC (KDIGO)
            </span>
            <span className="text-xs font-semibold">
              Riesgo Cardiovascular/Renal: <strong className="underline decoration-current">{erc.risk}</strong>
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight leading-none">{erc.stage}</h2>
          <p className="text-xs opacity-90 leading-relaxed mt-2">
            {egfrVal !== null ? (
              <>TFG estimada: <strong>{egfrVal.toFixed(1)}</strong> mL/min/1.73m² (<span className="italic">{getEgfrStage(egfrVal).stage} - {getEgfrStage(egfrVal).description}</span>). </>
            ) : (
              <>TFG estimada: <span className="font-bold underline">Sin datos de Creatinina</span> para calcular. </>
            )}
            {acrVal !== null ? (
              <>Relación Albúmina/Creatinina (ACR): <strong>{acrVal.toFixed(1)}</strong> mg/g (<span className="italic">{getAcrStage(acrVal).stage} - {getAcrStage(acrVal).description}</span>).</>
            ) : (
              <>ACR (Albuminuria): <span className="font-bold underline">Sin datos de ACR</span> para calcular.</>
            )}
          </p>
        </div>
        <div className="shrink-0 flex gap-2">
          <div className="bg-white/50 backdrop-blur-xs border border-current/20 px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-2xs">
            {erc.risk === "Bajo" && "🟢 Riesgo Bajo (Monitoreo anual)"}
            {erc.risk === "Moderado" && "🟡 Riesgo Moderado (Monitoreo 1-2 veces/año)"}
            {erc.risk === "Alto" && "🟠 Riesgo Alto (Monitoreo 2-3 veces/año)"}
            {erc.risk === "Muy Alto" && "🔴 Riesgo Muy Alto (Monitoreo >=3 veces/año - Referir)"}
            {erc.risk === "Desconocido" && "⚪ Sin laboratorios completos"}
          </div>
        </div>
      </div>

      {/* ── Diagnosis banner ── */}
      {patient.mainDiagnosis && (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-slate-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-700">
            Diagnóstico principal registrado:
          </span>
          <span className="text-sm text-slate-600">{patient.mainDiagnosis}</span>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COL: Demographics + Vitals */}
        <div className="space-y-6">
          {/* Demographics card */}
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <User className="h-4 w-4" /> Datos del Paciente
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(new Date(patient.dob), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
              {patient.phone && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {patient.phone}
                </p>
              )}
              {patient.email && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> {patient.email}
                </p>
              )}
              {(patient.street || patient.neighborhood || patient.city || patient.state) && (
                <div className="text-muted-foreground flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /> 
                  <div className="leading-tight">
                    {patient.street && <span>{patient.street}</span>}
                    {(patient.neighborhood || patient.zipCode) && (
                      <span className="block text-xs">
                        {patient.neighborhood ? `Col. ${patient.neighborhood}` : ""}
                        {patient.neighborhood && patient.zipCode ? ", " : ""}
                        {patient.zipCode ? `C.P. ${patient.zipCode}` : ""}
                      </span>
                    )}
                    {(patient.city || patient.state) && (
                      <span className="block text-xs">
                        {patient.city}
                        {patient.city && patient.state ? ", " : ""}
                        {patient.state}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {patient.emergencyContact && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />{" "}
                  {patient.emergencyContact}
                </p>
              )}
            </div>
            {patient.observations && (
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Observaciones
                </p>
                <p className="text-sm text-slate-600">{patient.observations}</p>
              </div>
            )}
          </div>

          {/* KDIGO Matrix */}
          <KdigoMatrix 
            egfr={egfrVal} 
            acr={acrVal} 
          />

          {/* Vitals card */}
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Última Somatometría
            </h2>
            {latestVitals ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Peso", value: latestVitals.weight ? `${latestVitals.weight} kg` : "—" },
                  { label: "Talla", value: latestVitals.height ? `${latestVitals.height} cm` : "—" },
                  { label: "Cintura", value: latestVitals.waist ? `${latestVitals.waist} cm` : "—" },
                  { label: "T.A.", value: latestVitals.bloodPressure ?? "—" },
                  { label: "IMC", value: bmi ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-base font-bold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin registro de signos vitales.</p>
            )}
          </div>

          {/* Active medications */}
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <Pill className="h-4 w-4" /> Medicamentos Activos
            </h2>
            {activeMedications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin medicamentos registrados.</p>
            ) : (
              <ul className="space-y-2">
                {activeMedications.map((med) => (
                  <li key={med.id} className="text-sm flex justify-between items-start gap-2">
                    <span className="font-medium text-slate-800">{med.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {med.dosage} · {med.frequency}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT COL: Timeline + Charts + Labs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lab charts */}
          {(acrDataPoints.length > 0 || eGFRData.length > 0) && (
            <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <FlaskConical className="h-4 w-4" /> Tendencias de ERC (KDIGO)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {acrDataPointsGrouped.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Albuminuria - ACR (mg/g)
                    </p>
                    <AcrChart data={acrDataPointsGrouped} medications={medicationsForCharts} />
                  </div>
                )}
                {eGFRDataGrouped.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      TFG estimada (mL/min/1.73m²)
                    </p>
                    <EgfrChart data={eGFRDataGrouped} medications={medicationsForCharts} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Appointment timeline with embedded notes */}
          <AppointmentsList appointments={patient.appointments} />

          {/* Lab results table (latest first + historical viewer) */}
          <PatientLabsTable labs={patient.labs} patientId={patient.id} />
        </div>
      </div>
    </div>
  )
}
