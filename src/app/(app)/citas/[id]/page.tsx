import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowLeft,
  Calendar,
  User,
  Stethoscope,
  Activity,
  FlaskConical,
  Pill,
  AlertTriangle,
  CalendarDays,
} from "lucide-react"
import { calculateBMI, calculateEGFR, getErcClassification, getEgfrStage, getAcrStage } from "@/lib/clinical-math"
import { KdigoMatrix } from "@/components/patients/kdigo-matrix"
import { PrintButton } from "@/components/consultas/print-button"

const NUT_FOOD_ITEMS_DISPLAY = [
  { key: "hojaVerde", label: "Vegetales de hoja verde" },
  { key: "vegetalesCocidos", label: "Vegetales cocidos" },
  { key: "frutas", label: "Frutas" },
  { key: "leguminosas", label: "Leguminosas" },
  { key: "leche", label: "Leche" },
  { key: "lacteos", label: "Lácteos" },
  { key: "carneRes", label: "Carne de res" },
  { key: "carnePollo", label: "Carne de pollo" },
  { key: "pescado", label: "Pescado" },
  { key: "embutidos", label: "Embutidos" },
  { key: "huevo", label: "Huevo" },
  { key: "cerealesSinProcesar", label: "Cereales sin procesar" },
  { key: "cerealesProcesados", label: "Cereales procesados" },
  { key: "aceite", label: "Aceite" },
  { key: "manteca", label: "Manteca" },
  { key: "bebidasAzucar", label: "Bebidas azucaradas" },
  { key: "bebidasAlcohol", label: "Bebidas alcohólicas" },
  { key: "comidaRapida", label: "Comida rápida" },
  { key: "snacks", label: "Snacks" },
  { key: "cafeTe", label: "Café o té" },
  { key: "consome", label: "Consomé granulado" }
]

// Determina el tratamiento del profesional según su rol y título registrado
function getProfessionalTitle(role: string, titulo: string | null | undefined, name: string): string {
  // Si tiene título registrado, usarlo directamente
  if (titulo && titulo.trim()) return `${titulo.trim()} ${name}`
  // Si es médico, usar Dr./Dra.
  if (role === "DOCTOR" || role === "MEDICINA") return `Dr(a). ${name}`
  // Por área
  const ROLE_TRATAMIENTO: Record<string, string> = {
    TRABAJO_SOCIAL: "Lic. en Trabajo Social",
    NUTRICION: "Lic. en Nutrición",
    PSICOLOGIA: "Lic. en Psicología",
    ESTUDIANTE: "Est.",
    ADMIN: "",
    READ_ONLY: "",
  }
  const prefix = ROLE_TRATAMIENTO[role]
  return prefix ? `${prefix} ${name}` : name
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Query appointment with all linked clinical data
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      user: { select: { name: true, role: true, titulo: true, cedulaProfesional: true } },
      notes: { 
        include: { user: { select: { name: true, role: true, titulo: true, cedulaProfesional: true } } },
        orderBy: { createdAt: "desc" }
      },
      vitals: { orderBy: { date: "desc" } },
      labs: { orderBy: { date: "asc" } },
      medications: { orderBy: { date: "desc" } },
    }
  })

  if (!appointment) notFound()

  const patient = appointment.patient
  const latestVitals = appointment.vitals[0] ?? null
  const primaryNote = appointment.notes[0] ?? null

  const ageYears = Math.floor(
    (new Date().getTime() - new Date(patient.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  )

  const bmi = latestVitals?.weight && latestVitals?.height
    ? calculateBMI(latestVitals.weight, latestVitals.height)
    : null

  // 1. Get the absolute latest vitals for the patient (overall)
  const latestPatientVitals = await prisma.vitals.findFirst({
    where: { patientId: patient.id },
    orderBy: { date: "desc" }
  })

  // Calculate BMI for the latest patient vitals
  const latestPatientBmi = latestPatientVitals?.weight && latestPatientVitals?.height
    ? calculateBMI(latestPatientVitals.weight, latestPatientVitals.height)
    : null

  // 2. Get the latest appointment that has medications for this patient
  const latestPatientMedAppt = await prisma.appointment.findFirst({
    where: {
      patientId: patient.id,
      medications: { some: {} }
    },
    orderBy: { dateTime: "desc" },
    include: {
      medications: { orderBy: { date: "desc" } }
    }
  })

  // 3. Find labs for eGFR & ACR calculation for KDIGO
  const allPatientLabs = await prisma.laboratoryResult.findMany({
    where: { patientId: patient.id },
    orderBy: { date: "desc" }
  })

  const creatinineLabs = allPatientLabs.filter(
    (l) => l.parameter === "Creatinina" || l.parameter === "Creatinina serica"
  )
  const latestCreatinine = creatinineLabs[0] ?? null

  const acrLabs = allPatientLabs.filter(
    (l) => l.parameter === "Relacion Albumina/Creatinina"
  )
  const latestAcr = acrLabs[0] ?? null

  const egfrVal = latestCreatinine
    ? calculateEGFR(latestCreatinine.value, ageYears, patient.gender, latestPatientVitals?.height)
    : null
  
  const acrVal = latestAcr ? latestAcr.value : null

  // Calculate dynamic ERC KDIGO classification
  const erc = getErcClassification(egfrVal, acrVal)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none">
      {/* Header / Back navigation */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href={`/pacientes/${patient.id}`}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">
              Resumen de Cita Médica
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Realizada el {format(new Date(appointment.dateTime), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })} · Especialista: <strong>{appointment.user.name}</strong>
            </p>
          </div>
        </div>
        <div>
          <PrintButton />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        
        {/* LEFT COLUMN: Patient Info & Vitals */}
        <div className="space-y-6">
          {/* Patient Card */}
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-2">
              <User className="h-4 w-4 text-blue-500" /> Ficha del Paciente
            </h2>
            <div className="space-y-2 text-sm leading-relaxed">
              <p className="text-slate-800 font-bold">
                {patient.lastName}, {patient.firstName}
              </p>
              <div className="space-y-1.5 text-slate-600">
                <p>
                  Edad: <span className="font-medium text-slate-800">{ageYears} años</span>
                </p>
                <p>
                  Sexo: <span className="font-medium text-slate-800">{patient.gender === "M" ? "Masculino" : "Femenino"}</span>
                </p>
                <p className="font-mono text-xs">
                  Expediente: <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{patient.id}</span>
                </p>
                <p className="font-mono text-xs">
                  CURP: <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{patient.curp ?? "Sin CURP"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Vitals / Somatometria Card */}
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-2">
              <Activity className="h-4 w-4 text-emerald-500" /> Última Somatometría
            </h2>
            {latestPatientVitals ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-semibold">
                  Registrada el {format(new Date(latestPatientVitals.date), "d 'de' MMM, yyyy 'a las' HH:mm", { locale: es })}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: "Peso", value: latestPatientVitals.weight ? `${latestPatientVitals.weight} kg` : "—" },
                    { label: "Talla", value: latestPatientVitals.height ? `${latestPatientVitals.height} cm` : "—" },
                    { label: "IMC", value: latestPatientBmi ?? "—" },
                    { label: "T.A.", value: latestPatientVitals.bloodPressure ?? "—" },
                    { label: "F.C.", value: latestPatientVitals.heartRate ? `${latestPatientVitals.heartRate} lpm` : "—" },
                    { label: "F.R.", value: latestPatientVitals.respiratoryRate ? `${latestPatientVitals.respiratoryRate} rpm` : "—" },
                    { label: "Temp.", value: latestPatientVitals.temperature ? `${latestPatientVitals.temperature} °C` : "—" },
                    { label: "SpO2", value: latestPatientVitals.oxygenSaturation ? `${latestPatientVitals.oxygenSaturation} %` : "—" },
                    { label: "Cintura", value: latestPatientVitals.waist ? `${latestPatientVitals.waist} cm` : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-2.5">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
                {latestPatientVitals.physicalExam && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Exploración Física
                    </p>
                    <p className="text-xs text-slate-650 bg-slate-50 p-2 rounded-md border border-slate-100 whitespace-pre-line leading-relaxed">
                      {latestPatientVitals.physicalExam}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin registros de somatometría.</p>
            )}
          </div>

          {/* Últimos Medicamentos Card */}
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-2">
              <Pill className="h-4 w-4 text-orange-500" /> Últimos Medicamentos
            </h2>
            {latestPatientMedAppt ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-semibold">
                  Recetados el {format(new Date(latestPatientMedAppt.dateTime), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 uppercase bg-slate-50 border-b">
                        <th className="px-2.5 py-1.5 text-left font-semibold">Medicamento</th>
                        <th className="px-2.5 py-1.5 text-left font-semibold">Dosis</th>
                        <th className="px-2.5 py-1.5 text-left font-semibold">Frecuencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestPatientMedAppt.medications.map((med) => (
                        <tr key={med.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                          <td className="px-2.5 py-1.5 font-bold text-slate-800">{med.name}</td>
                          <td className="px-2.5 py-1.5 text-slate-600">{med.dosage ?? "—"}</td>
                          <td className="px-2.5 py-1.5 text-slate-600">{med.frequency ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin registros de medicamentos.</p>
            )}
          </div>

          {/* Clasificación KDIGO Card */}
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-2">
              <FlaskConical className="h-4 w-4 text-red-500" /> Clasificación KDIGO (Labs)
            </h2>
            <div className={`p-4 rounded-xl border flex flex-col justify-between items-start gap-2 ${erc.colorClass} shadow-2xs transition-all`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/70 border border-current/25 shadow-3xs">
                    Estadificación
                  </span>
                  <span className="text-[10px] font-semibold">
                    Riesgo: <strong className="underline decoration-current">{erc.risk}</strong>
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight leading-none mt-1">{erc.stage}</h2>
                <p className="text-[10px] opacity-90 leading-relaxed mt-2.5">
                  {egfrVal !== null ? (
                    <>TFG: <strong>{egfrVal.toFixed(1)}</strong> mL/min/1.73m² (<span className="italic">{getEgfrStage(egfrVal).stage}</span>). </>
                  ) : (
                    <>TFG: <span className="font-bold underline">Sin Creatinina</span>. </>
                  )}
                  {acrVal !== null ? (
                    <>ACR: <strong>{acrVal.toFixed(1)}</strong> mg/g (<span className="italic">{getAcrStage(acrVal).stage}</span>).</>
                  ) : (
                    <>ACR: <span className="font-bold underline">Sin ACR</span>.</>
                  )}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <KdigoMatrix 
                egfr={egfrVal} 
                acr={acrVal} 
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Note, Labs, Medications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Note Card */}
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-2">
              <Stethoscope className="h-4 w-4 text-indigo-500" /> Nota de Evolución / Consulta
            </h2>
            {appointment.notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin notas clínicas asociadas.</p>
            ) : (
              <div className="space-y-4">
                {appointment.notes.map((note) => (
                  <div key={note.id} className="space-y-1">
                    <p className="text-xs text-slate-400">
                      Registrado por {getProfessionalTitle(note.user.role, note.user.titulo, note.user.name)}
                    </p>
                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                      {(() => {
                        if (!note.content) return null;
                        
                        try {
                          const parsed = JSON.parse(note.content);
                          
                          if (note.service === "PSICOLOGIA") {
                            return (
                              <div className="space-y-4">
                                <div className="border-b pb-2 mb-2">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                                    Psicología
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Motivo de Intervención</p>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                      {Array.isArray(parsed.motivoIntervencion) ? (
                                        parsed.motivoIntervencion.map((m: string) => (
                                          <span key={m} className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded border border-purple-200/50 font-medium">{m}</span>
                                        ))
                                      ) : (
                                        <p className="text-sm text-slate-700">—</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tratamiento Renal Actual</p>
                                    <p className="text-sm text-slate-800 font-medium">{parsed.tipoTratamientoActual || "—"}</p>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Antecedentes Psicológicos</p>
                                  <p className="text-sm text-slate-800 bg-white p-2.5 rounded border border-slate-100">{parsed.antecedentesPsicologicos || "—"}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Factores Psicosociales</p>
                                    <p className="text-sm text-slate-800">{Array.isArray(parsed.factoresPsicosociales) ? parsed.factoresPsicosociales.join(", ") : parsed.factoresPsicosociales || "—"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Conocimiento de la Enfermedad</p>
                                    <p className="text-sm text-slate-800 font-medium">{parsed.conocimientoEnfermedad || "—"}</p>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Observación Mental (Examen Clínico)</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-100/60 p-3 rounded-lg border border-slate-200/50 text-xs">
                                    <div><span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">Consciencia</span><span className="text-slate-800 font-bold">{parsed.estadoConsciencia || "—"}</span></div>
                                    <div><span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">Ánimo</span><span className="text-slate-800 font-bold">{parsed.estadoAnimo || "—"}</span></div>
                                    <div><span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">Afecto</span><span className="text-slate-800 font-bold">{parsed.afecto || "—"}</span></div>
                                    <div><span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">Pensamiento</span><span className="text-slate-800 font-bold">{parsed.pensamiento || "—"}</span></div>
                                    <div><span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">Conducta</span><span className="text-slate-800 font-bold">{parsed.conducta || "—"}</span></div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mecanismos Afrontamiento</p>
                                    <p className="text-sm text-slate-800">{Array.isArray(parsed.mecanismosAfrontamiento) ? parsed.mecanismosAfrontamiento.join(", ") : "—"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Indicadores de Riesgo</p>
                                    <p className="text-sm font-bold text-rose-600">{Array.isArray(parsed.indicadoresRiesgo) ? parsed.indicadoresRiesgo.join(", ") : "—"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Adherencia al Tratamiento</p>
                                    <p className="text-sm text-slate-800 font-semibold">{parsed.adherenciaTratamiento || "—"}</p>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Impresión Diagnóstica</p>
                                  <p className="text-sm text-slate-800 whitespace-pre-line bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs font-semibold">{parsed.impresionDiagnostica || "—"}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Intervención Realizada</p>
                                    <p className="text-sm text-slate-800 font-medium">
                                      {Array.isArray(parsed.intervencionPsicologica) ? parsed.intervencionPsicologica.join(", ") : "—"}
                                      {parsed.otrasIntervencion && <span className="block text-xs text-slate-500 mt-1 italic font-normal">Otras: {parsed.otrasIntervencion}</span>}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reacción y Expresión Emocional</p>
                                    <p className="text-sm text-slate-800">
                                      {Array.isArray(parsed.reaccionPaciente) ? parsed.reaccionPaciente.join(", ") : "—"} / {Array.isArray(parsed.expresionEmocional) ? parsed.expresionEmocional.join(", ") : "—"}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Plan de Seguimiento</p>
                                    <p className="text-sm text-slate-800 font-medium">{Array.isArray(parsed.planSeguimiento) ? parsed.planSeguimiento.join(", ") : "—"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Conclusiones y Pronóstico</p>
                                    <p className="text-sm text-slate-850 bg-white p-3 rounded border border-slate-100">{parsed.conclusionesPronostico || "—"}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          if (note.service === "TRABAJO_SOCIAL") {
                            return (
                              <div className="space-y-4">
                                <div className="border-b pb-2 mb-2">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                                    Trabajo Social
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cuidador Primario</p>
                                    <p className="text-sm text-slate-800 font-medium">
                                      {parsed.cuidadorPrimario?.nombre || "—"}{parsed.cuidadorPrimario?.edad ? `, ${parsed.cuidadorPrimario.edad} años` : ""}{parsed.cuidadorPrimario?.edoCivil ? ` (${parsed.cuidadorPrimario.edoCivil})` : ""}{parsed.cuidadorPrimario?.telefono ? ` - Tel: ${parsed.cuidadorPrimario.telefono}` : ""}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estructura y Ciclo Familiar</p>
                                    <p className="text-sm text-slate-800 font-medium">
                                      {parsed.tipoFamilia || "—"} · {parsed.etapaCicloVital || "—"}
                                    </p>
                                  </div>
                                </div>

                                {parsed.nucleoFamiliar && parsed.nucleoFamiliar.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Integrantes del Núcleo Familiar</p>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs border bg-white rounded-lg overflow-hidden">
                                        <thead className="bg-slate-100 border-b text-slate-500 font-semibold">
                                          <tr>
                                            <th className="px-3 py-1.5 text-left font-semibold">Nombre</th>
                                            <th className="px-3 py-1.5 text-left font-semibold">Edad</th>
                                            <th className="px-3 py-1.5 text-left font-semibold">Parentesco</th>
                                            <th className="px-3 py-1.5 text-left font-semibold">Escolaridad</th>
                                            <th className="px-3 py-1.5 text-left font-semibold">Ocupación</th>
                                            <th className="px-3 py-1.5 text-left font-semibold">Ingresos</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {parsed.nucleoFamiliar.map((m: any, i: number) => (
                                            <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                                              <td className="px-3 py-1.5 font-medium text-slate-800">{m.nombre}</td>
                                              <td className="px-3 py-1.5 text-slate-650">{m.edad}</td>
                                              <td className="px-3 py-1.5 text-slate-650">{m.parentesco}</td>
                                              <td className="px-3 py-1.5 text-slate-650">{m.escolaridad}</td>
                                              <td className="px-3 py-1.5 text-slate-650">{m.ocupacion}</td>
                                              <td className="px-3 py-1.5 font-semibold text-slate-900">{m.ingresos}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Economía Familiar (Mensual)</p>
                                    <div className="bg-slate-100/50 p-3 rounded-lg border border-slate-200/50 text-xs space-y-1">
                                      <div><span className="text-slate-450 font-medium">Ingreso Per Cápita:</span> <span className="font-bold text-slate-800">{parsed.ingresoPercapita || "—"}</span></div>
                                      <div><span className="text-slate-450 font-medium">Gasto Per Cápita:</span> <span className="font-bold text-slate-800">{parsed.gastoPercapita || "—"}</span></div>
                                      <div><span className="text-slate-450 font-medium">Egresos:</span> <span className="text-slate-700 font-medium">Alimentos: {parsed.egresos?.alimentos || "—"}, Transporte: {parsed.egresos?.transporte || "—"}, Servicios: {parsed.egresos?.luz || "—"}</span></div>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Calidad Alimentación</p>
                                    <p className="text-sm text-slate-800 font-semibold">{parsed.calidadAlimentacion || "—"}</p>
                                    {parsed.alimentacion && (
                                      <span className="block text-xs text-slate-500 mt-1">Frecuentes: {Object.entries(parsed.alimentacion).filter(([_, v]) => v === "Frecuente").map(([k]) => k).join(", ") || "Ninguno"}</span>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Condiciones de Vivienda</p>
                                  <p className="text-xs text-slate-700 bg-slate-100/60 p-3 rounded-lg border border-slate-200/50 leading-relaxed">
                                    Vivienda <strong>{parsed.vivienda?.tipo || "—"}</strong> ({parsed.vivienda?.tenencia || "—"}). Materiales: Paredes {parsed.materiales?.paredes || "—"}, Techos {parsed.materiales?.techos || "—"}. Servs: {Array.isArray(parsed.servicios) ? parsed.servicios.join(", ") : "—"}. Muebles: {Array.isArray(parsed.muebles) ? parsed.muebles.join(", ") : "—"}. Focos: {parsed.focos || "—"}. Convivencia Animales: {parsed.convivenciaAnimales || "—"}.
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Seguridad Social y Acceso a Salud</p>
                                    <div className="text-xs text-slate-800 space-y-1 bg-slate-100/50 p-2.5 rounded-lg border border-slate-200/50">
                                      <div><span className="text-slate-400 font-medium text-[10px] uppercase tracking-wide">Derechohabiencia:</span> <span className="font-bold text-slate-800">{parsed.derechohabiencia || parsed.seguridadSocial || "—"}</span></div>
                                      <div><span className="text-slate-400 font-medium text-[10px] uppercase tracking-wide">Frecuenta:</span> <span className="font-medium text-slate-700">{parsed.serviciosSaludUsados || "—"}</span></div>
                                      <div><span className="text-slate-400 font-medium text-[10px] uppercase tracking-wide">Logística:</span> <span className="font-medium text-slate-700">{parsed.medioTransporte || "—"} ({parsed.tiempoTraslado || "—"})</span></div>
                                      {parsed.costoTraslado && <div><span className="text-slate-400 font-medium text-[10px] uppercase tracking-wide">Costo Traslado:</span> <span className="font-bold text-slate-700">${parsed.costoTraslado}</span></div>}
                                      {parsed.dificultadesAcceso && <div><span className="text-slate-400 font-medium text-[10px] uppercase tracking-wide">Dificultades:</span> <span className="text-red-700 font-semibold">{parsed.dificultadesAcceso}</span></div>}
                                    </div>
                                    {parsed.redesApoyo && parsed.redesApoyo.length > 0 && (
                                      <span className="block text-xs text-slate-500 mt-1.5 italic">Redes: {parsed.redesApoyo.map((m: any) => `${m.nombre} (${m.parentesco})`).join(", ")}</span>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Viabilidad Trasplante</p>
                                    <p className="text-sm text-slate-800 font-semibold">{parsed.viabilidadTrasplante || "—"}</p>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Diagnóstico Situacional</p>
                                  <p className="text-sm text-slate-800 whitespace-pre-line bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs font-semibold">{parsed.diagnosticoSituacional || "—"}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Descripción Familiar</p>
                                    <p className="text-sm text-slate-800 leading-relaxed">{parsed.descripcionCaso || "—"} / {parsed.dinamicaFamiliar || "—"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Plan Social y Pronóstico</p>
                                    <p className="text-sm text-slate-800 whitespace-pre-line bg-white p-2.5 rounded border border-slate-100">{parsed.planSocialPronostico || "—"}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (note.service === "NUTRICION") {
                            return (
                              <div className="space-y-4">
                                <div className="border-b pb-2 mb-2">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                                    Nutrición
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ocupación / Horario</p>
                                    <p className="text-sm text-slate-800 font-semibold">{parsed.ocupacion || "—"} ({parsed.horarioOcupacion || "—"})</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Composición Corporal</p>
                                    <p className="text-sm text-slate-800 font-semibold">Grasa: {parsed.grasaCorporal ? `${parsed.grasaCorporal}%` : "—"} | MME: {parsed.mme ? `${parsed.mme} kg` : "—"}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hidratación y Sueño</p>
                                    <p className="text-sm text-slate-800">Agua: {parsed.aguaNatural || "—"} | Cocina con: {parsed.aguaCocina || "—"} | Sueño: {parsed.horasSueno ? `${parsed.horasSueno} hrs` : "—"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actividad Física</p>
                                    <p className="text-sm text-slate-800 font-semibold">{parsed.ejercicio || "No"}{parsed.ejercicio === "Sí" ? ` — ${parsed.ejercicioDetalle}` : ""}</p>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Frecuencia de Consumo (Semanal)</p>
                                  <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs text-xs grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {Object.entries(parsed.alimentacion || {}).map(([k, v]) => {
                                      const label = NUT_FOOD_ITEMS_DISPLAY.find(i => i.key === k)?.label || k;
                                      return (
                                        <div key={k} className="border-b last:border-0 border-slate-100 pb-1 flex justify-between gap-2">
                                          <span className="text-slate-500 truncate max-w-[130px]" title={label}>{label}</span>
                                          <span className="text-slate-800 font-bold">{String(v || "—")}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cambio de Hábitos / Reevaluación</p>
                                    <div className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-200/60 space-y-1">
                                      <p><strong>Suplementos:</strong> {parsed.suplemento || "—"}</p>
                                      <p><strong>¿Alimento disgusto?:</strong> {parsed.alimentoDisgusto || "—"}</p>
                                      <p><strong>¿Qué cambió?:</strong> {parsed.cambioAlimentacion || "—"}</p>
                                      <p><strong>Dificultad dieta:</strong> {parsed.dificultadDieta || "—"}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recordatorio 24 Horas</p>
                                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200/60 space-y-1 text-xs">
                                      <p><strong>Desayuno:</strong> {parsed.desayuno || "—"}</p>
                                      <p><strong>Comida:</strong> {parsed.comida || "—"}</p>
                                      <p><strong>Cena:</strong> {parsed.cena || "—"}</p>
                                      <p><strong>Snacks:</strong> {parsed.snacks || "—"}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        } catch (e) {
                          // Not valid JSON, fallback to plain text
                        }
                        
                        return <p className="text-sm text-slate-700 whitespace-pre-line">{note.content}</p>;
                      })()}
                      {note.evolution && note.service !== "PSICOLOGIA" && note.service !== "TRABAJO_SOCIAL" && note.service !== "NUTRICION" && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Evolución / Subjetivo</p>
                          <p className="text-sm text-slate-700 whitespace-pre-line">{note.evolution}</p>
                        </div>
                      )}
                      {note.diagnosis && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Diagnósticos</p>
                          <p className="text-sm text-slate-700 whitespace-pre-line">{note.diagnosis}</p>
                        </div>
                      )}
                      {note.plan && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Plan a Seguir</p>
                          <p className="text-sm text-slate-700 whitespace-pre-line">{note.plan}</p>
                        </div>
                      )}
                      {note.prognosis && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pronóstico</p>
                          <p className="text-sm text-slate-700 whitespace-pre-line">{note.prognosis}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Labs Card - Only shown for MEDICINA appointments */}
          {appointment.service === "MEDICINA" && (
            <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-2">
                <FlaskConical className="h-4 w-4 text-cyan-500" /> Resultados de Laboratorios
              </h2>
              {appointment.labs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin laboratorios capturados en esta consulta.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <th className="px-3 py-2 text-left font-medium">Parámetro</th>
                        <th className="px-3 py-2 text-left font-medium">Valor</th>
                        <th className="px-3 py-2 text-left font-medium">Unidad</th>
                        <th className="px-3 py-2 text-left font-medium">Rango Ref.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointment.labs.map((lab) => (
                        <tr
                          key={lab.id}
                          className={`border-b last:border-0 hover:bg-slate-50/50 transition-colors ${lab.isAbnormal ? "bg-red-50/40" : ""}`}
                        >
                          <td className="px-3 py-2 font-medium text-slate-800">{lab.parameter}</td>
                          <td
                            className={`px-3 py-2 font-bold ${
                              lab.isAbnormal ? "text-red-600" : "text-slate-900"
                            }`}
                          >
                            {lab.value}
                            {lab.isAbnormal && (
                              <AlertTriangle className="inline h-3 w-3 ml-1 text-red-500" />
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-500">{lab.unit ?? "—"}</td>
                          <td className="px-3 py-2 text-slate-400 text-xs">
                            {lab.referenceRange ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Medications Card - Only shown for MEDICINA appointments */}
          {appointment.service === "MEDICINA" && (
            <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-2">
                <Pill className="h-4 w-4 text-orange-500" /> Receta / Medicamentos Prescritos
              </h2>
              {appointment.medications.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin medicamentos prescritos en esta consulta.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <th className="px-3 py-2 text-left font-medium">Medicamento</th>
                        <th className="px-3 py-2 text-left font-medium">Dosis</th>
                        <th className="px-3 py-2 text-left font-medium">Frecuencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointment.medications.map((med) => (
                        <tr key={med.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 py-2 font-semibold text-slate-800">{med.name}</td>
                          <td className="px-3 py-2 text-slate-600">{med.dosage ?? "—"}</td>
                          <td className="px-3 py-2 text-slate-600">{med.frequency ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── PRINT-ONLY LAYOUT ── */}
      <div className="hidden print:block w-full max-w-4xl mx-auto p-8 bg-white text-slate-900 text-sm leading-relaxed print-report-container">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: letter !important;
              margin: 0mm !important;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: white !important;
            }
            /* Hacer que el navegador no imprima headers/footers del sistema y limpie fondos */
            html, body, #__next, main, .print-report-container {
              background-color: transparent !important;
              background: transparent !important;
            }
            .print-report-container {
              position: relative !important;
              width: 215.9mm !important;
              min-height: 279.4mm !important;
              padding: 12mm 15mm !important;
              box-sizing: border-box !important;
            }
            /* Con position: absolute, la imagen de fondo se queda en la página 1 */
            .print-report-container img.print-bg {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 215.9mm !important;
              height: 279.4mm !important;
              object-fit: fill !important;
              z-index: 1 !important;
            }
            /* Hacer contenedores ligeramente translúcidos para dejar ver el fondo */
            .print-report-container .bg-slate-50 {
              background-color: rgba(248, 250, 252, 0.82) !important;
            }
            .print-report-container .bg-slate-100 {
              background-color: rgba(241, 245, 249, 0.82) !important;
            }
            /* Ajustes de tamaño de letra */
            .print-report-container text, 
            .print-report-container p, 
            .print-report-container td, 
            .print-report-container th, 
            .print-report-container span, 
            .print-report-container div {
              font-size: 10px !important;
              line-height: 1.25 !important;
            }
            .print-report-container strong {
              font-weight: 700 !important;
            }
            .print-report-container h3 {
              font-size: 10.5px !important;
              margin-top: 8px !important;
              margin-bottom: 3px !important;
            }
            .print-report-container table td,
            .print-report-container table th {
              padding: 2px 4px !important;
            }
            .print-report-container .mt-6 {
              margin-top: 8px !important;
            }
            .print-report-container .mt-20 {
              margin-top: 22px !important;
              page-break-inside: avoid;
            }
            .print-report-container .space-y-4 > * + * {
              margin-top: 4px !important;
            }
            .print-report-container .space-y-6 > * + * {
              margin-top: 6px !important;
            }
            /* Evitar que elementos se corten a la mitad entre páginas */
            .print-report-container table {
              page-break-inside: avoid;
            }
          }
        `}} />
        
        {/* Imagen de fondo real (img) para obligar al navegador a imprimirla */}
        <img 
          src="/background-report.svg" 
          alt="Fondo de Reporte" 
          className="print-bg pointer-events-none" 
          style={{ zIndex: 1 }} 
        />

        <div className="relative z-10">
          {/* Header de la Clínica */}
          <div className="text-center space-y-0.5 pb-2 border-b-2 border-slate-300 mt-[130px]">
            <h2 className="text-sm font-semibold tracking-wider text-slate-600 uppercase">Expediente Clínico Electrónico</h2>
            <p className="text-[10px] text-slate-400">Reporte Oficial de Consulta</p>
          </div>

        {/* Datos del Paciente y de la Consulta */}
        <div className="mt-6 grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Datos del Paciente</h3>
            <p><strong>Nombre:</strong> {patient.lastName}, {patient.firstName}</p>
            <p><strong>Expediente:</strong> {patient.id}</p>
            <p><strong>CURP:</strong> {patient.curp ?? "—"}</p>
            <p><strong>Edad / Sexo:</strong> {ageYears} años / {patient.gender === "M" ? "Masculino" : "Femenino"}</p>
            <p><strong>Diagnóstico Principal:</strong> {patient.mainDiagnosis || "—"}</p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Datos de la Consulta</h3>
            <p><strong>Fecha / Hora:</strong> {format(new Date(appointment.dateTime), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</p>
            <p><strong>Especialista:</strong> {getProfessionalTitle(appointment.user.role, appointment.user.titulo, appointment.user.name)}</p>
            <p><strong>Área de Atención:</strong> {appointment.service}</p>
            {appointment.room && <p><strong>Consultorio:</strong> {appointment.room}</p>}
          </div>
        </div>

        {/* Somatometría de esta Consulta */}
        {latestVitals && (
          <div className="mt-6 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">Somatometría y Signos Vitales</h3>
            <table className="w-full border text-xs text-center border-collapse">
              <thead className="bg-slate-100 font-bold border-b">
                <tr>
                  <th className="p-1.5 border-r border-slate-200">Peso</th>
                  <th className="p-1.5 border-r border-slate-200">Talla</th>
                  <th className="p-1.5 border-r border-slate-200">IMC</th>
                  <th className="p-1.5 border-r border-slate-200">T. Arterial</th>
                  <th className="p-1.5 border-r border-slate-200">F. Cardíaca</th>
                  <th className="p-1.5 border-r border-slate-200">F. Resp.</th>
                  <th className="p-1.5 border-r border-slate-200">Temp.</th>
                  <th className="p-1.5 border-r border-slate-200">SpO2</th>
                  <th className="p-1.5">Cintura</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1.5 border-r border-slate-200">{latestVitals.weight ? `${latestVitals.weight} kg` : "—"}</td>
                  <td className="p-1.5 border-r border-slate-200">{latestVitals.height ? `${latestVitals.height} cm` : "—"}</td>
                  <td className="p-1.5 border-r border-slate-200">{bmi ?? "—"}</td>
                  <td className="p-1.5 border-r border-slate-200">{latestVitals.bloodPressure ?? "—"}</td>
                  <td className="p-1.5 border-r border-slate-200">{latestVitals.heartRate ? `${latestVitals.heartRate} lpm` : "—"}</td>
                  <td className="p-1.5 border-r border-slate-200">{latestVitals.respiratoryRate ? `${latestVitals.respiratoryRate} rpm` : "—"}</td>
                  <td className="p-1.5 border-r border-slate-200">{latestVitals.temperature ? `${latestVitals.temperature} °C` : "—"}</td>
                  <td className="p-1.5 border-r border-slate-200">{latestVitals.oxygenSaturation ? `${latestVitals.oxygenSaturation} %` : "—"}</td>
                  <td className="p-1.5">{latestVitals.waist ? `${latestVitals.waist} cm` : "—"}</td>
                </tr>
              </tbody>
            </table>
            {latestVitals.physicalExam && (
              <div className="mt-2 bg-slate-50 p-2.5 rounded border text-xs leading-relaxed text-slate-700">
                <strong>Exploración Física:</strong> {latestVitals.physicalExam}
              </div>
            )}
          </div>
        )}

        {/* Nota Evolutiva Principal */}
        {primaryNote && (
          <div className="mt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">Detalles de la Nota Clínica</h3>
            {(() => {
              if (!primaryNote.content) return null;
              try {
                const parsed = JSON.parse(primaryNote.content);

                if (primaryNote.service === "PSICOLOGIA") {
                  return (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Motivo de Intervención:</strong>
                          <p className="mt-0.5 text-slate-700">{Array.isArray(parsed.motivoIntervencion) ? parsed.motivoIntervencion.join(", ") : "—"}</p>
                        </div>
                        <div>
                          <strong>Tratamiento Renal Actual:</strong>
                          <p className="mt-0.5 text-slate-700">{parsed.tipoTratamientoActual || "—"}</p>
                        </div>
                      </div>
                      <div>
                        <strong>Antecedentes Psicológicos:</strong>
                        <p className="mt-0.5 text-slate-700 leading-normal bg-slate-50/50 p-2 rounded border border-slate-100">{parsed.antecedentesPsicologicos || "—"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Factores Psicosociales:</strong>
                          <p className="mt-0.5 text-slate-700">{Array.isArray(parsed.factoresPsicosociales) ? parsed.factoresPsicosociales.join(", ") : "—"}</p>
                        </div>
                        <div>
                          <strong>Conocimiento de la Enfermedad:</strong>
                          <p className="mt-0.5 text-slate-700">{parsed.conocimientoEnfermedad || "—"}</p>
                        </div>
                      </div>
                      <div>
                        <strong>Examen Mental / Observación Clínica:</strong>
                        <p className="mt-0.5 text-slate-700 leading-relaxed bg-slate-50/50 p-2 rounded border border-slate-100">
                          Orientación y consciencia: {parsed.estadoConsciencia || "—"} | Estado de ánimo: {parsed.estadoAnimo || "—"} | Afecto: {parsed.afecto || "—"} | Pensamiento: {parsed.pensamiento || "—"} | Conducta: {parsed.conducta || "—"}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <strong>Mecanismos Afrontamiento:</strong>
                          <p className="mt-0.5 text-slate-700">{Array.isArray(parsed.mecanismosAfrontamiento) ? parsed.mecanismosAfrontamiento.join(", ") : "—"}</p>
                        </div>
                        <div>
                          <strong>Indicadores de Riesgo:</strong>
                          <p className="mt-0.5 text-red-650 font-bold">{Array.isArray(parsed.indicadoresRiesgo) ? parsed.indicadoresRiesgo.join(", ") : "—"}</p>
                        </div>
                        <div>
                          <strong>Adherencia al Tratamiento:</strong>
                          <p className="mt-0.5 text-slate-700 font-semibold">{parsed.adherenciaTratamiento || "—"}</p>
                        </div>
                      </div>
                      <div>
                        <strong>Impresión Diagnóstica:</strong>
                        <p className="mt-0.5 text-slate-800 font-bold bg-slate-50 p-2.5 rounded border border-slate-200">{parsed.impresionDiagnostica || "—"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Intervención Realizada:</strong>
                          <p className="mt-0.5 text-slate-700">
                            {Array.isArray(parsed.intervencionPsicologica) ? parsed.intervencionPsicologica.join(", ") : "—"}
                            {parsed.otrasIntervencion && <span className="block text-slate-500 text-[10px] mt-0.5">Otras: {parsed.otrasIntervencion}</span>}
                          </p>
                        </div>
                        <div>
                          <strong>Reacción / Expresión Emocional:</strong>
                          <p className="mt-0.5 text-slate-700">{Array.isArray(parsed.reaccionPaciente) ? parsed.reaccionPaciente.join(", ") : "—"} / {Array.isArray(parsed.expresionEmocional) ? parsed.expresionEmocional.join(", ") : "—"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Plan de Seguimiento:</strong>
                          <p className="mt-0.5 text-slate-700">{Array.isArray(parsed.planSeguimiento) ? parsed.planSeguimiento.join(", ") : "—"}</p>
                        </div>
                        <div>
                          <strong>Conclusiones y Pronóstico:</strong>
                          <p className="mt-0.5 text-slate-700 leading-normal">{parsed.conclusionesPronostico || "—"}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (primaryNote.service === "TRABAJO_SOCIAL") {
                  return (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Cuidador Primario:</strong>
                          <p className="mt-0.5 text-slate-700">
                            {parsed.cuidadorPrimario?.nombre || "—"}{parsed.cuidadorPrimario?.edad ? `, ${parsed.cuidadorPrimario.edad} años` : ""}{parsed.cuidadorPrimario?.edoCivil ? ` (${parsed.cuidadorPrimario.edoCivil})` : ""}{parsed.cuidadorPrimario?.telefono ? ` - Tel: ${parsed.cuidadorPrimario.telefono}` : ""}
                          </p>
                        </div>
                        <div>
                          <strong>Estructura y Ciclo Familiar:</strong>
                          <p className="mt-0.5 text-slate-700">{parsed.tipoFamilia || "—"} · {parsed.etapaCicloVital || "—"}</p>
                        </div>
                      </div>

                      {parsed.nucleoFamiliar && parsed.nucleoFamiliar.length > 0 && (
                        <div>
                          <strong>Integrantes del Núcleo Familiar:</strong>
                          <table className="w-full mt-1 border text-[10px] text-center border-collapse">
                            <thead className="bg-slate-100 font-bold border-b">
                              <tr>
                                <th className="p-1 border-r border-slate-200">Nombre</th>
                                <th className="p-1 border-r border-slate-200">Edad</th>
                                <th className="p-1 border-r border-slate-200">Parentesco</th>
                                <th className="p-1 border-r border-slate-200">Escolaridad</th>
                                <th className="p-1 border-r border-slate-200">Ocupación</th>
                                <th className="p-1">Ingresos</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsed.nucleoFamiliar.map((m: any, idx: number) => (
                                <tr key={idx} className="border-b last:border-0">
                                  <td className="p-1 border-r border-slate-200 font-medium">{m.nombre}</td>
                                  <td className="p-1 border-r border-slate-200">{m.edad}</td>
                                  <td className="p-1 border-r border-slate-200">{m.parentesco}</td>
                                  <td className="p-1 border-r border-slate-200">{m.escolaridad}</td>
                                  <td className="p-1 border-r border-slate-200">{m.ocupacion}</td>
                                  <td className="p-1 font-semibold">{m.ingresos}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Economía Familiar (Mensual):</strong>
                          <p className="mt-0.5 text-slate-700">
                            Ingreso Per Cápita: <strong>{parsed.ingresoPercapita || "—"}</strong> | Gasto Per Cápita: <strong>{parsed.gastoPercapita || "—"}</strong>
                            <span className="block text-[10px] text-slate-500">Alimentos: {parsed.egresos?.alimentos || "—"}, Transporte: {parsed.egresos?.transporte || "—"}, Luz/Gas/Agua: {parsed.egresos?.luz || "—"}</span>
                          </p>
                        </div>
                        <div>
                          <strong>Calidad de Alimentación:</strong>
                          <p className="mt-0.5 text-slate-700">
                            {parsed.calidadAlimentacion || "—"}
                            {parsed.alimentacion && <span className="block text-[10px] text-slate-500">Frecuentes: {Object.entries(parsed.alimentacion).filter(([_, v]) => v === "Frecuente").map(([k]) => k).join(", ") || "Ninguno"}</span>}
                          </p>
                        </div>
                      </div>

                      <div>
                        <strong>Condiciones de Vivienda:</strong>
                        <p className="mt-0.5 text-slate-700 leading-normal">
                          Vivienda {parsed.vivienda?.tipo || "—"} ({parsed.vivienda?.tenencia || "—"}). Materiales: Paredes {parsed.materiales?.paredes || "—"}, Pisos {parsed.materiales?.pisos || "—"}, Techos {parsed.materiales?.techos || "—"}. Animales: {parsed.convivenciaAnimales || "—"}. Vehículo: {parsed.vehiculo || "—"}.
                        </p>
                        {(parsed.vivienda?.dormitorios || parsed.vivienda?.banos) && (
                          <p className="mt-0.5 text-slate-600 text-[10px]">
                            Habitaciones — Dormitorios: {parsed.vivienda?.dormitorios || "—"} | Cocina: {parsed.vivienda?.cocina || "—"} | Comedor: {parsed.vivienda?.comedor || "—"} | Sala: {parsed.vivienda?.sala || "—"} | Cochera: {parsed.vivienda?.cochera || "—"} | Baños: {parsed.vivienda?.banos || "—"} | Patio: {parsed.vivienda?.patio || "—"} | Focos: {parsed.focos || "—"} | Personas/cuarto: {parsed.personasPorCuarto || "—"}
                          </p>
                        )}
                        {Array.isArray(parsed.muebles) && parsed.muebles.length > 0 && (
                          <p className="mt-0.5 text-slate-600 text-[10px]">Muebles: {parsed.muebles.join(", ")}</p>
                        )}
                        {Array.isArray(parsed.servicios) && parsed.servicios.length > 0 && (
                          <p className="mt-0.5 text-slate-600 text-[10px]">Servicios: {parsed.servicios.join(", ")}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Seguridad Social y Acceso a Salud:</strong>
                          <div className="mt-0.5 text-slate-700 space-y-0.5">
                            <p>Seguridad: {parsed.derechohabiencia || parsed.seguridadSocial || "—"} (Servicios: {parsed.serviciosSaludUsados || "—"})</p>
                            <p>Transporte: {parsed.medioTransporte || "—"} | Tiempo: {parsed.tiempoTraslado || "—"} | Costo: {parsed.costoTraslado ? `$${parsed.costoTraslado}` : "—"}</p>
                            {parsed.dificultadesAcceso && <p>Dificultades: {parsed.dificultadesAcceso}</p>}
                          </div>
                          {parsed.redesApoyo && parsed.redesApoyo.length > 0 && (
                            <span className="block text-[10px] text-slate-500 italic mt-1">Redes: {parsed.redesApoyo.map((m: any) => `${m.nombre} (${m.parentesco})`).join(", ")}</span>
                          )}
                        </div>
                        <div>
                          <strong>Viabilidad de Trasplante:</strong>
                          <p className="mt-0.5 text-slate-800 font-bold">{parsed.viabilidadTrasplante || "—"}</p>
                        </div>
                      </div>

                      {parsed.conductasRiesgo && (
                        <div>
                          <strong>Conductas de Riesgo:</strong>
                          <p className="mt-0.5 text-slate-700 text-[10px]">
                            Tabaquismo: {parsed.conductasRiesgo.tabaquismo || "—"} | Omisión Diálisis Peritoneal: {parsed.conductasRiesgo.omisionDialisisPeritoneal || "—"} | Ausentismo Hemodiálisis: {parsed.conductasRiesgo.ausentismoHemodialisis || "—"} | Transgresión Hídrica: {parsed.conductasRiesgo.transgresionHidrica || "—"} | Consumo Alcohol: {parsed.conductasRiesgo.consumoAlcohol || "—"}
                          </p>
                        </div>
                      )}

                      {parsed.datosProcedimiento && (
                        <div>
                          <strong>Datos del Procedimiento:</strong>
                          <p className="mt-0.5 text-slate-700 text-[10px]">
                            Solicitado: {parsed.datosProcedimiento.cuandoSeSolicito || "—"} | Profesional que solicitó: {parsed.datosProcedimiento.queProfesionalSolicito || "—"} | Intervención programada: {parsed.datosProcedimiento.cuandoProgramaron || "—"}
                          </p>
                        </div>
                      )}

                      <div>
                        <strong>Diagnóstico Situacional:</strong>
                        <p className="mt-0.5 text-slate-800 font-bold bg-slate-50 p-2.5 rounded border border-slate-200">{parsed.diagnosticoSituacional || "—"}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Descripción Familiar / Dinámica:</strong>
                          <p className="mt-0.5 text-slate-700 leading-normal">{parsed.descripcionCaso || "—"} / {parsed.dinamicaFamiliar || "—"}</p>
                        </div>
                        <div>
                          <strong>Plan Social y Pronóstico:</strong>
                          <p className="mt-0.5 text-slate-700 leading-normal">{parsed.planSocialPronostico || "—"}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (primaryNote.service === "NUTRICION") {
                  return (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Ocupación / Horario:</strong>
                          <p className="mt-0.5 text-slate-700">{parsed.ocupacion || "—"} ({parsed.horarioOcupacion || "—"})</p>
                        </div>
                        <div>
                          <strong>Composición Corporal:</strong>
                          <p className="mt-0.5 text-slate-700">Grasa: {parsed.grasaCorporal ? `${parsed.grasaCorporal}%` : "—"} | MME: {parsed.mme ? `${parsed.mme} kg` : "—"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Hidratación y Sueño:</strong>
                          <p className="mt-0.5 text-slate-700">Agua: {parsed.aguaNatural || "—"} | Cocina: {parsed.aguaCocina || "—"} | Sueño: {parsed.horasSueno ? `${parsed.horasSueno} hrs` : "—"}</p>
                        </div>
                        <div>
                          <strong>Actividad Física:</strong>
                          <p className="mt-0.5 text-slate-700">{parsed.ejercicio || "No"}{parsed.ejercicio === "Sí" ? ` — ${parsed.ejercicioDetalle}` : ""}</p>
                        </div>
                      </div>

                      <div>
                        <strong>Frecuencia de Consumo de Alimentos por Semana:</strong>
                        <div className="mt-1 bg-slate-50/50 p-3 rounded border text-[10px] grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 border-collapse">
                          {Object.entries(parsed.alimentacion || {}).map(([k, v]) => {
                            const label = NUT_FOOD_ITEMS_DISPLAY.find(i => i.key === k)?.label || k;
                            return (
                              <div key={k} className="border-b border-slate-100 pb-1 flex justify-between gap-2">
                                <span className="text-slate-500 truncate max-w-[140px]" title={label}>{label}</span>
                                <span className="text-slate-800 font-bold">{String(v || "—")}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Cambio de Hábitos y Reevaluación:</strong>
                          <div className="text-[10px] text-slate-700 leading-relaxed bg-slate-50/50 p-2 rounded border space-y-1">
                            <p><strong>Suplementos:</strong> {parsed.suplemento || "—"}</p>
                            <p><strong>¿Alimento disgusto?:</strong> {parsed.alimentoDisgusto || "—"}</p>
                            <p><strong>¿Qué cambió?:</strong> {parsed.cambioAlimentacion || "—"}</p>
                            <p><strong>Dificultad dieta:</strong> {parsed.dificultadDieta || "—"}</p>
                          </div>
                        </div>
                        <div>
                          <strong>Recordatorio de 24 Horas:</strong>
                          <div className="text-[10px] text-slate-700 leading-relaxed bg-slate-50/50 p-2 rounded border space-y-1">
                            <p><strong>Desayuno:</strong> {parsed.desayuno || "—"}</p>
                            <p><strong>Comida:</strong> {parsed.comida || "—"}</p>
                            <p><strong>Cena:</strong> {parsed.cena || "—"}</p>
                            <p><strong>Snacks:</strong> {parsed.snacks || "—"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              } catch (e) {
                // Not JSON
              }

              return (
                <div className="space-y-3 text-xs leading-normal">
                  {primaryNote.content && (
                    <div>
                      <strong>Contenido / Consulta:</strong>
                      <p className="mt-0.5 text-slate-700 whitespace-pre-line">{primaryNote.content}</p>
                    </div>
                  )}
                  {primaryNote.evolution && (
                    <div>
                      <strong>Evolución / Subjetivo:</strong>
                      <p className="mt-0.5 text-slate-700 whitespace-pre-line">{primaryNote.evolution}</p>
                    </div>
                  )}
                  {primaryNote.diagnosis && (
                    <div>
                      <strong>Diagnósticos:</strong>
                      <p className="mt-0.5 text-slate-800 font-bold whitespace-pre-line">{primaryNote.diagnosis}</p>
                    </div>
                  )}
                  {primaryNote.plan && (
                    <div>
                      <strong>Plan a Seguir:</strong>
                      <p className="mt-0.5 text-slate-700 whitespace-pre-line">{primaryNote.plan}</p>
                    </div>
                  )}
                  {primaryNote.prognosis && (
                    <div>
                      <strong>Pronóstico:</strong>
                      <p className="mt-0.5 text-slate-750 whitespace-pre-line">{primaryNote.prognosis}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Medicamentos Recetados en esta Consulta */}
        {appointment.service === "MEDICINA" && appointment.medications.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">Receta y Tratamiento Prescrito</h3>
            <table className="w-full border text-xs text-left border-collapse">
              <thead className="bg-slate-100 font-bold border-b">
                <tr>
                  <th className="p-2 border-r border-slate-200">Medicamento</th>
                  <th className="p-2 border-r border-slate-200">Dosis</th>
                  <th className="p-2">Frecuencia</th>
                </tr>
              </thead>
              <tbody>
                {appointment.medications.map((med) => (
                  <tr key={med.id} className="border-b last:border-0">
                    <td className="p-2 border-r border-slate-200 font-bold text-slate-800">{med.name}</td>
                    <td className="p-2 border-r border-slate-200 text-slate-650">{med.dosage ?? "—"}</td>
                    <td className="p-2 text-slate-650">{med.frequency ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-20 flex justify-between items-center text-xs">
          <div className="space-y-1">
            <p>________________________________________</p>
            <p className="font-semibold text-slate-800">Firma del Especialista</p>
            <p className="text-slate-500">
              {primaryNote 
                ? getProfessionalTitle(primaryNote.user.role, primaryNote.user.titulo, primaryNote.user.name)
                : getProfessionalTitle(appointment.user.role, appointment.user.titulo, appointment.user.name)}
            </p>
            {(primaryNote?.user.cedulaProfesional || appointment.user.cedulaProfesional) && (
              <p className="text-[10px] text-slate-400">
                Cédula Profesional: {primaryNote?.user.cedulaProfesional || appointment.user.cedulaProfesional}
              </p>
            )}
            <p className="text-[10px] text-slate-400">Área: {appointment.service}</p>
          </div>
          <div className="text-right space-y-1 text-slate-500">
            <p><strong>Fecha Impresión:</strong> {format(new Date(), "d 'de' MMM, yyyy")}</p>
            <p className="text-[9px]">CAI Nefrología · Documento digital oficial del ECE</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
