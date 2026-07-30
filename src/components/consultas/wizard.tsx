"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LAB_PARAMETERS } from "@/lib/lab-parameters"
import { saveConsultation } from "@/app/actions/consultas"
import { ChevronRight, ChevronLeft, Plus, Trash2, Activity, FlaskConical, Pill, Stethoscope, Search, Save, Brain, Apple, Sparkles, FileText as FileTextIcon, X, CalendarDays } from "lucide-react"
import { KdigoMatrix } from "@/components/patients/kdigo-matrix"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"
import { calculateEGFR } from "@/lib/clinical-math"
import { differenceInYears } from "date-fns"

type Patient = { 
  id: string, 
  firstName: string, 
  lastName: string, 
  curp: string | null,
  dob?: Date,
  gender?: string,
  vitals?: any[],
  labs?: any[]
}
type Specialist = { id: string, name: string, role: string }
type TS_NucleoFamiliar = { nombre: string; edad: string; edoCivil: string; escolaridad: string; parentesco: string; ocupacion: string; ingresos: string }
type TS_RedApoyo = { nombre: string; edad: string; edoCivil: string; escolaridad: string; parentesco: string; ocupacion: string; vive: string; hijos: string }

const NUT_FOOD_ITEMS = [
  { key: "hojaVerde", label: "Vegetales de hoja verde (espinacas, acelgas, lechugas, quelites)" },
  { key: "vegetalesCocidos", label: "Vegetales cocidos (zanahoria, calabaza, jitomate, etc.)" },
  { key: "frutas", label: "Frutas (plátano, manzana, guayabas, etc.)" },
  { key: "leguminosas", label: "Leguminosas (frijol, lenteja, garbanzo, etc.)" },
  { key: "leche", label: "Leche" },
  { key: "lacteos", label: "Lácteos (yogurt, quesos, crema, mantequilla)" },
  { key: "carneRes", label: "Carne de res" },
  { key: "carnePollo", label: "Carne de pollo" },
  { key: "pescado", label: "Pescado" },
  { key: "embutidos", label: "Embutidos (jamón, chorizo, salchicha)" },
  { key: "huevo", label: "Huevo" },
  { key: "cerealesSinProcesar", label: "Cereales sin procesar (arroz, pasta, papa)" },
  { key: "cerealesProcesados", label: "Cereales procesados (galletas, pan dulce, bolillo, etc.)" },
  { key: "aceite", label: "Aceite para cocinar" },
  { key: "manteca", label: "Manteca" },
  { key: "bebidasAzucar", label: "Bebidas con azúcar (refrescos, jugos)" },
  { key: "bebidasAlcohol", label: "Bebidas alcohólicas" },
  { key: "comidaRapida", label: "Comida rápida (pizza, hamburguesa, alitas)" },
  { key: "snacks", label: "Snacks (papitas, pastelitos industriales)" },
  { key: "cafeTe", label: "Café o té" },
  { key: "consome", label: "Consome granulados (Knorr Suiza)" }
]

export function ConsultaWizard({
  patients,
  specialists,
  defaultUserId,
  isDoctor = false,
  preselectedPatientId,
  preselectedServiceType,
  preselectedUserId,
  appointmentId,
}: {
  patients: Patient[]
  specialists: Specialist[]
  defaultUserId?: string
  isDoctor?: boolean
  preselectedPatientId?: string
  preselectedServiceType?: string
  preselectedUserId?: string
  appointmentId?: string
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const [step, setStep] = useState(preselectedServiceType ? 1 : -1) // -1 is the Pre-Wizard selection screen
  const [loading, setLoading] = useState(false)

  // -- State fields --
  const [serviceType, setServiceType] = useState(preselectedServiceType ?? "")
  const [patientId, setPatientId] = useState(preselectedPatientId ?? "")
  const [userId, setUserId] = useState(preselectedUserId || defaultUserId || "")
  
  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [waist, setWaist] = useState("")
  const [bloodPressure, setBloodPressure] = useState("")
  const [heartRate, setHeartRate] = useState("")
  const [respiratoryRate, setRespiratoryRate] = useState("")
  const [oxygenSaturation, setOxygenSaturation] = useState("")
  const [temperature, setTemperature] = useState("")
  const [physicalExam, setPhysicalExam] = useState("")
  
  const [labs, setLabs] = useState([{ parameter: "", value: "", unit: "", referenceRange: "", isAbnormal: false }])
  const [meds, setMeds] = useState([{ name: "", dosage: "", frequency: "" }])
  const [noteContent, setNoteContent] = useState("")
  const [evolution, setEvolution] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [plan, setPlan] = useState("")
  const [prognosis, setPrognosis] = useState("")
  const [extractedDate, setExtractedDate] = useState<string | null>(null)
  
  // -- Psychology States --
  const [psychMotivo, setPsychMotivo] = useState<string[]>([])
  const [psychAntecedentes, setPsychAntecedentes] = useState("")
  const [psychTxActual, setPsychTxActual] = useState("")
  const [psychFactores, setPsychFactores] = useState<string[]>([])
  const [psychConocimiento, setPsychConocimiento] = useState("")
  
  const [psychEstadoConsciencia, setPsychEstadoConsciencia] = useState("")
  const [psychEstadoAnimo, setPsychEstadoAnimo] = useState("")
  const [psychAfecto, setPsychAfecto] = useState("")
  const [psychPensamiento, setPsychPensamiento] = useState("")
  const [psychConducta, setPsychConducta] = useState("")
  const [psychMecanismos, setPsychMecanismos] = useState<string[]>([])
  const [psychRiesgo, setPsychRiesgo] = useState<string[]>([])
  const [psychAdherencia, setPsychAdherencia] = useState("")
  
  const [psychImpresionDx, setPsychImpresionDx] = useState("")
  const [psychIntervencion, setPsychIntervencion] = useState<string[]>([])
  const [psychOtrasIntervencion, setPsychOtrasIntervencion] = useState("")
  const [psychReaccion, setPsychReaccion] = useState<string[]>([])
  const [psychExpresion, setPsychExpresion] = useState<string[]>([])
  const [psychPlan, setPsychPlan] = useState<string[]>([])
  const [psychConclusiones, setPsychConclusiones] = useState("")

  // -- Trabajo Social States --
  const [tsCuidador, setTsCuidador] = useState({ nombre: "", edad: "", edoCivil: "", telefono: "" })
  const [tsNucleo, setTsNucleo] = useState<TS_NucleoFamiliar[]>([])
  const [tsEgresos, setTsEgresos] = useState({ alimentos: "", luz: "", gas: "", tel: "", agua: "", educacion: "", infonavit: "", transporte: "", otro: "" })
  const [tsIngresoPercapita, setTsIngresoPercapita] = useState("")
  const [tsDerechohabiencia, setTsDerechohabiencia] = useState("")
  const [tsTiempoTraslado, setTsTiempoTraslado] = useState("")
  const [tsCostoTraslado, setTsCostoTraslado] = useState("")
  const [tsMedioTransporte, setTsMedioTransporte] = useState("")
  const [tsDificultadesAcceso, setTsDificultadesAcceso] = useState("")
  const [tsGastoPercapita, setTsGastoPercapita] = useState("")
  const [tsRedesApoyo, setTsRedesApoyo] = useState<TS_RedApoyo[]>([])
  
  const [tsTipoFamilia, setTsTipoFamilia] = useState("")
  const [tsEtapaCiclo, setTsEtapaCiclo] = useState("")
  const [tsProblematicas, setTsProblematicas] = useState("")
  
  const [tsAlimentacion, setTsAlimentacion] = useState({ leche: "", verduras: "", leguminosas: "", jugos: "", embutidos: "", huevo: "", cereales: "", carne: "", bebidasGasificadas: "", fritos: "", cafe: "", frutas: "" })
  const [tsCalidadAlimentacion, setTsCalidadAlimentacion] = useState("")
  
  const [tsVivienda, setTsVivienda] = useState({ tipo: "", tenencia: "", credito: "", dormitorios: "", cocina: "", comedor: "", sala: "", cochera: "", banos: "", patio: "" })
  const [tsMuebles, setTsMuebles] = useState<string[]>([])
  const [tsServicios, setTsServicios] = useState<string[]>([])
  const [tsMateriales, setTsMateriales] = useState({ paredes: "", pisos: "", techos: "" })
  const [tsPersonasCuarto, setTsPersonasCuarto] = useState("")
  const [tsFocos, setTsFocos] = useState("")
  const [tsVehiculoTiene, setTsVehiculoTiene] = useState(false)
  const [tsVehiculoEspecificacion, setTsVehiculoEspecificacion] = useState("")
  const [tsAnimalesTiene, setTsAnimalesTiene] = useState(false)
  const [tsAnimalesEspecificacion, setTsAnimalesEspecificacion] = useState("")
  // Conductas de Riesgo
  const [tsConductas, setTsConductas] = useState({ tabaquismo: "", omisionDialisisPeritoneal: "", ausentismoHemodialisis: "", transgresionHidrica: "", consumoAlcohol: "" })
  // Datos del Procedimiento
  const [tsDatosProcedimiento, setTsDatosProcedimiento] = useState({ cuandoSeSolicito: "", queProfesionalSolicito: "", cuandoProgramaron: "" })
  
  const [tsSeguridadSocial, setTsSeguridadSocial] = useState("")
  const [tsServicioSalud, setTsServicioSalud] = useState("")
  
  const [tsDescripcionCaso, setTsDescripcionCaso] = useState("")
  const [tsDinamicaFamiliar, setTsDinamicaFamiliar] = useState("")
  const [tsActitudes, setTsActitudes] = useState("")
  const [tsViabilidad, setTsViabilidad] = useState("")
  const [tsDiagnostico, setTsDiagnostico] = useState("")
  const [tsPlanSocial, setTsPlanSocial] = useState("")

  // -- Nutrición States --
  const [nutOcupacion, setNutOcupacion] = useState("")
  const [nutHorarioOcupacion, setNutHorarioOcupacion] = useState("")
  const [nutGrasa, setNutGrasa] = useState("")
  const [nutMME, setNutMME] = useState("")
  const [nutAlimentacion, setNutAlimentacion] = useState<Record<string, string>>({
    hojaVerde: "", vegetalesCocidos: "", frutas: "", leguminosas: "", leche: "",
    lacteos: "", carneRes: "", carnePollo: "", pescado: "", embutidos: "",
    huevo: "", cerealesSinProcesar: "", cerealesProcesados: "", aceite: "",
    manteca: "", bebidasAzucar: "", bebidasAlcohol: "", comidaRapida: "",
    snacks: "", cafeTe: "", consome: ""
  })
  const [nutAguaNatural, setNutAguaNatural] = useState("")
  const [nutAguaCocina, setNutAguaCocina] = useState("")
  const [nutEjercicio, setNutEjercicio] = useState("")
  const [nutEjercicioDetalle, setNutEjercicioDetalle] = useState("")
  const [nutHorasSueno, setNutHorasSueno] = useState("")
  const [nutSuplemento, setNutSuplemento] = useState("")
  const [nutCambioAlimentacion, setNutCambioAlimentacion] = useState("")
  const [nutDificultadDieta, setNutDificultadDieta] = useState("")
  const [nutAlimentoDisgusto, setNutAlimentoDisgusto] = useState("")
  const [nutDesayuno, setNutDesayuno] = useState("")
  const [nutComida, setNutComida] = useState("")
  const [nutCena, setNutCena] = useState("")
  const [nutSnacks, setNutSnacks] = useState("")

  const [searchQuery, setSearchQuery] = useState("")

  // Auto-calculate per capita income and food expenses
  useEffect(() => {
    if (serviceType === "TRABAJO_SOCIAL") {
      const totalIncome = tsNucleo.reduce((acc, m) => acc + (parseFloat(m.ingresos) || 0), 0)
      const totalMembers = tsNucleo.length + 1 // Patient + family members
      const computedIncomePercapita = totalMembers > 0 ? (totalIncome / totalMembers).toFixed(2) : "0"
      setTsIngresoPercapita(computedIncomePercapita)

      const foodExpense = parseFloat(tsEgresos.alimentos) || 0
      const computedFoodPercapita = totalMembers > 0 ? (foodExpense / totalMembers).toFixed(2) : "0"
      setTsGastoPercapita(computedFoodPercapita)
    }
  }, [tsNucleo, tsEgresos.alimentos, serviceType])

  const filteredPatients = patients.filter(p => 
    p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.curp && p.curp.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // -- AI Extraction States --
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiText, setAiText] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsAiLoading(true)
    try {
      // Importación dinámica para evitar errores SSR (DOMMatrix is not defined)
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
      
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ""
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(" ")
        fullText += pageText + "\n"
      }
      setAiText(prev => prev + "\n" + fullText)
    } catch (err) {
      console.error("Error reading PDF:", err)
      alert("No se pudo extraer el texto del PDF. Intenta copiar y pegarlo directamente.")
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleAiExtract = async () => {
    if (!aiText) return
    setIsAiLoading(true)
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText })
      })
      if (!res.ok) throw new Error("Ollama API call failed")
      const data = await res.json()
      
      // Auto-fill logic
      if (data.weight) setWeight(String(data.weight))
      if (data.height) setHeight(String(data.height))
      if (data.waist) setWaist(String(data.waist))
      if (data.bloodPressure) setBloodPressure(String(data.bloodPressure))
      if (data.heartRate) setHeartRate(String(data.heartRate))
      if (data.respiratoryRate) setRespiratoryRate(String(data.respiratoryRate))
      if (data.oxygenSaturation) setOxygenSaturation(String(data.oxygenSaturation))
      if (data.temperature) setTemperature(String(data.temperature))
      if (data.physicalExam) setPhysicalExam(String(data.physicalExam))
      if (data.notes) setNoteContent(String(data.notes))
      if (data.evolution) setEvolution(String(data.evolution))
      if (data.diagnosis) setDiagnosis(String(data.diagnosis))
      if (data.plan) setPlan(String(data.plan))
      if (data.prognosis) setPrognosis(String(data.prognosis))
      if (data.date) setExtractedDate(String(data.date))
      
      if (data.labs && Array.isArray(data.labs) && data.labs.length > 0) {
        setLabs(data.labs.map((l: any) => ({
          parameter: l.parameter || "",
          value: l.value ? String(l.value) : "",
          unit: l.unit || "",
          referenceRange: l.referenceRange || "",
          isAbnormal: false
        })))
      }
      
      if (data.medications && Array.isArray(data.medications) && data.medications.length > 0) {
        setMeds(data.medications.map((m: any) => ({
          name: m.name || "",
          dosage: m.dosage || "",
          frequency: m.frequency || ""
        })))
      }

      setShowAiModal(false)
      setAiText("")
      alert("✅ Datos extraídos correctamente. Navega por el Wizard para revisar la información extraída.")
    } catch (e) {
      console.error(e)
      alert("❌ Falló la extracción con Ollama. ¿Está el servidor encendido y la VPN conectada?")
    } finally {
      setIsAiLoading(false)
    }
  }

  let steps = [
    { title: "Paciente", icon: <Search className="w-4 h-4"/> },
    { title: "Exploración", icon: <Activity className="w-4 h-4"/> },
    { title: "Laboratorios", icon: <FlaskConical className="w-4 h-4"/> },
    { title: "Receta", icon: <Pill className="w-4 h-4"/> },
    { title: "Evolución", icon: <Stethoscope className="w-4 h-4"/> }
  ]

  if (serviceType === "PSICOLOGIA") {
    steps = [
      { title: "Paciente", icon: <Search className="w-4 h-4"/> },
      { title: "Evaluación Psicológica", icon: <Brain className="w-4 h-4"/> },
      { title: "Nota de Psicología", icon: <FileTextIcon className="w-4 h-4"/> }
    ]
  } else if (serviceType === "TRABAJO_SOCIAL") {
    steps = [
      { title: "Paciente", icon: <Search className="w-4 h-4"/> },
      { title: "Familia y Economía", icon: <FileTextIcon className="w-4 h-4"/> },
      { title: "Condiciones de Vida", icon: <FileTextIcon className="w-4 h-4"/> },
      { title: "Evaluación Social", icon: <FileTextIcon className="w-4 h-4"/> }
    ]
  } else if (serviceType === "NUTRICION") {
    steps = [
      { title: "Paciente", icon: <Search className="w-4 h-4"/> },
      { title: "Historia y Somatometría", icon: <Activity className="w-4 h-4"/> },
      { title: "Frecuencia de Alimentos", icon: <CalendarDays className="w-4 h-4"/> },
      { title: "Hábitos y 24 Horas", icon: <FileTextIcon className="w-4 h-4"/> }
    ]
  }

  const handleStartFormat = (type: string) => {
    setServiceType(type)
    setStep(0)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      let finalNoteContent = noteContent
      let finalEvolution = evolution

      if (serviceType === "PSICOLOGIA") {
        // Build structured JSON for reliable Excel export
        const psychData = {
          motivoIntervencion: psychMotivo,
          antecedentesPsicologicos: psychAntecedentes,
          tipoTratamientoActual: psychTxActual,
          factoresPsicosociales: psychFactores,
          conocimientoEnfermedad: psychConocimiento,
          estadoConsciencia: psychEstadoConsciencia,
          estadoAnimo: psychEstadoAnimo,
          afecto: psychAfecto,
          pensamiento: psychPensamiento,
          conducta: psychConducta,
          mecanismosAfrontamiento: psychMecanismos,
          indicadoresRiesgo: psychRiesgo,
          adherenciaTratamiento: psychAdherencia,
          impresionDiagnostica: psychImpresionDx,
          intervencionPsicologica: psychIntervencion,
          otrasIntervencion: psychOtrasIntervencion,
          reaccionPaciente: psychReaccion,
          expresionEmocional: psychExpresion,
          planSeguimiento: psychPlan,
          conclusionesPronostico: psychConclusiones
        }
        // Store JSON in noteContent for structured data access
        finalNoteContent = JSON.stringify(psychData)

        // Build readable markdown for display in evolution
        finalEvolution = `## Motivo de Intervención
${psychMotivo.map(m => `- ${m}`).join('\n')}

## Historia Clínica
- **Antecedentes psicológicos:** ${psychAntecedentes}
- **Tipo de tratamiento actual:** ${psychTxActual}
- **Factores psicosociales relevantes:** ${psychFactores.join(', ')}
- **Conocimiento del paciente sobre su enfermedad:** ${psychConocimiento}

## Observación Clínica y Evaluación Psicológica
- **Estado de consciencia y orientación:** ${psychEstadoConsciencia}
- **Estado de ánimo:** ${psychEstadoAnimo}
- **Afecto:** ${psychAfecto}
- **Pensamiento:** ${psychPensamiento}
- **Conducta:** ${psychConducta}
- **Mecanismos de afrontamiento:** ${psychMecanismos.join(', ')}
- **Indicadores de riesgo:** ${psychRiesgo.join(', ')}
- **Adherencia al tratamiento:** ${psychAdherencia}

## Impresión Diagnóstica
${psychImpresionDx}

## Intervención Psicológica
${psychIntervencion.map(i => {
  if (i === "Otras" && psychOtrasIntervencion.trim() !== "") {
    return `- Otras: ${psychOtrasIntervencion}`
  }
  return `- ${i}`
}).join('\n')}
- **Reacción del paciente:** ${psychReaccion.join(', ')}
- **Expresión emocional:** ${psychExpresion.join(', ')}

## Plan de Seguimiento y Recomendaciones
${psychPlan.map(p => `- ${p}`).join('\n')}

## Conclusiones y Pronóstico Psicológico
${psychConclusiones}
`
      } else if (serviceType === "TRABAJO_SOCIAL") {
        // Build structured JSON for reliable Excel export
        const tsData = {
          cuidadorPrimario: tsCuidador,
          nucleoFamiliar: tsNucleo,
          egresos: tsEgresos,
          ingresoPercapita: tsIngresoPercapita,
          gastoPercapita: tsGastoPercapita,
          tipoFamilia: tsTipoFamilia,
          etapaCicloVital: tsEtapaCiclo,
          problematicas: tsProblematicas,
          alimentacion: tsAlimentacion,
          calidadAlimentacion: tsCalidadAlimentacion,
          vivienda: tsVivienda,
          materiales: tsMateriales,
          muebles: tsMuebles,
          servicios: tsServicios,
          personasPorCuarto: tsPersonasCuarto,
          focos: tsFocos,
          vehiculo: tsVehiculoTiene ? `Sí (${tsVehiculoEspecificacion})` : "No",
          convivenciaAnimales: tsAnimalesTiene ? `Sí (${tsAnimalesEspecificacion})` : "No",
          redesApoyo: tsRedesApoyo,
          seguridadSocial: tsSeguridadSocial,
          serviciosSaludUsados: tsServicioSalud,
          derechohabiencia: tsDerechohabiencia,
          tiempoTraslado: tsTiempoTraslado,
          costoTraslado: tsCostoTraslado,
          medioTransporte: tsMedioTransporte,
          dificultadesAcceso: tsDificultadesAcceso,
          conductasRiesgo: tsConductas,
          datosProcedimiento: tsDatosProcedimiento,
          descripcionCaso: tsDescripcionCaso,
          dinamicaFamiliar: tsDinamicaFamiliar,
          actitudesPaciente: tsActitudes,
          viabilidadTrasplante: tsViabilidad,
          diagnosticoSituacional: tsDiagnostico,
          planSocialPronostico: tsPlanSocial
        }
        // Store JSON in noteContent for structured data access
        finalNoteContent = JSON.stringify(tsData)

        // Build readable markdown for display in evolution
        finalEvolution = `## Estructura Familiar y Economía
**Cuidador Primario:** ${tsCuidador.nombre} (${tsCuidador.edad} años, ${tsCuidador.edoCivil}) - Tel: ${tsCuidador.telefono}

### Núcleo Familiar
| Nombre | Edad | Edo. Civil | Escolaridad | Parentesco | Ocupación | Ingresos |
|---|---|---|---|---|---|---|
${tsNucleo.map(m => `| ${m.nombre} | ${m.edad} | ${m.edoCivil} | ${m.escolaridad} | ${m.parentesco} | ${m.ocupacion} | ${m.ingresos} |`).join('\n')}

### Egresos Mensuales
- Alimentos: ${tsEgresos.alimentos}, Luz: ${tsEgresos.luz}, Gas: ${tsEgresos.gas}, Teléfono: ${tsEgresos.tel}, Agua: ${tsEgresos.agua}
- Educación: ${tsEgresos.educacion}, Infonavit: ${tsEgresos.infonavit}, Transporte: ${tsEgresos.transporte}, Otros: ${tsEgresos.otro}

**Ingreso per cápita:** ${tsIngresoPercapita} | **Gasto per cápita:** ${tsGastoPercapita}
- **Clasificación Familiar:** ${tsTipoFamilia}
- **Etapa Ciclo Vital:** ${tsEtapaCiclo}
- **Problemáticas:** ${tsProblematicas}

## Condiciones de Vida
### Alimentación (Frecuencia por Semana)
- Leche: ${tsAlimentacion.leche} | Verduras: ${tsAlimentacion.verduras} | Leguminosas: ${tsAlimentacion.leguminosas} | Jugos: ${tsAlimentacion.jugos}
- Embutidos: ${tsAlimentacion.embutidos} | Huevo: ${tsAlimentacion.huevo} | Cereales: ${tsAlimentacion.cereales} | Carne: ${tsAlimentacion.carne}
- Bebidas Gasificadas: ${tsAlimentacion.bebidasGasificadas} | Fritos: ${tsAlimentacion.fritos} | Café/Té: ${tsAlimentacion.cafe} | Frutas: ${tsAlimentacion.frutas}
- **Calidad de Alimentación:** ${tsCalidadAlimentacion}

### Vivienda
- **Tipo:** ${tsVivienda.tipo} | **Tenencia:** ${tsVivienda.tenencia} | **Crédito:** ${tsVivienda.credito}
- **Habitaciones:** Dormitorios (${tsVivienda.dormitorios}), Cocina (${tsVivienda.cocina}), Comedor (${tsVivienda.comedor}), Sala (${tsVivienda.sala}), Cochera (${tsVivienda.cochera}), Baños (${tsVivienda.banos}), Patio (${tsVivienda.patio})
- **Materiales:** Paredes (${tsMateriales.paredes}), Pisos (${tsMateriales.pisos}), Techos (${tsMateriales.techos})
- **Muebles:** ${tsMuebles.join(', ')}
- **Servicios:** ${tsServicios.join(', ')}
- **Convivencia animales:** ${tsAnimalesTiene ? `Sí (${tsAnimalesEspecificacion})` : 'No'} | **Vehículo:** ${tsVehiculoTiene ? `Sí (${tsVehiculoEspecificacion})` : 'No'} | **Personas por cuarto:** ${tsPersonasCuarto} | **Focos:** ${tsFocos}

### Redes de Apoyo y Salud
| Nombre | Edad | Edo. Civil | Escolaridad | Parentesco | Ocupación | Vive | Hijos |
|---|---|---|---|---|---|---|---|
${tsRedesApoyo.map(m => `| ${m.nombre} | ${m.edad} | ${m.edoCivil} | ${m.escolaridad} | ${m.parentesco} | ${m.ocupacion} | ${m.vive} | ${m.hijos} |`).join('\n')}

- **Seguridad Social / Derechohabiencia:** ${tsDerechohabiencia || tsSeguridadSocial}
- **Servicios de Salud Usados:** ${tsServicioSalud}
- **Logística de Acceso:** Transporte: ${tsMedioTransporte || "—"} | Tiempo Traslado: ${tsTiempoTraslado || "—"} | Costo: ${tsCostoTraslado ? `$${tsCostoTraslado}` : "—"}
- **Dificultades de Acceso:** ${tsDificultadesAcceso || "Ninguna"}

### Conductas de Riesgo
- **Tabaquismo:** ${tsConductas.tabaquismo || "—"} | **Omisión de Diálisis Peritoneal:** ${tsConductas.omisionDialisisPeritoneal || "—"} | **Ausentismo en Hemodiálisis:** ${tsConductas.ausentismoHemodialisis || "—"}
- **Transgresión Hídrica:** ${tsConductas.transgresionHidrica || "—"} | **Consumo de Alcohol:** ${tsConductas.consumoAlcohol || "—"}

### Datos del Procedimiento
- **¿Cuándo se le solicitó el apoyo?** ${tsDatosProcedimiento.cuandoSeSolicito || "—"}
- **¿Qué profesional lo solicitó?** ${tsDatosProcedimiento.queProfesionalSolicito || "—"}
- **¿Cuándo programaron la intervención?** ${tsDatosProcedimiento.cuandoProgramaron || "—"}

## Evaluación y Diagnóstico Social
- **Descripción del Caso:** ${tsDescripcionCaso}
- **Dinámica Familiar:** ${tsDinamicaFamiliar}
- **Actitudes del Paciente:** ${tsActitudes}
- **Viabilidad de Trasplante:** ${tsViabilidad}
- **Diagnóstico Situacional:** ${tsDiagnostico}
- **Plan Social / Pronóstico:** ${tsPlanSocial}
`
      } else if (serviceType === "NUTRICION") {
        const nutData = {
          ocupacion: nutOcupacion,
          horarioOcupacion: nutHorarioOcupacion,
          grasaCorporal: nutGrasa,
          mme: nutMME,
          alimentacion: nutAlimentacion,
          aguaNatural: nutAguaNatural,
          aguaCocina: nutAguaCocina,
          ejercicio: nutEjercicio,
          ejercicioDetalle: nutEjercicioDetalle,
          horasSueno: nutHorasSueno,
          suplemento: nutSuplemento,
          cambioAlimentacion: nutCambioAlimentacion,
          dificultadDieta: nutDificultadDieta,
          alimentoDisgusto: nutAlimentoDisgusto,
          desayuno: nutDesayuno,
          comida: nutComida,
          cena: nutCena,
          snacks: nutSnacks
        }
        finalNoteContent = JSON.stringify(nutData)

        finalEvolution = `## Historia del Cliente y Somatometría
- **Ocupación:** ${nutOcupacion || "—"} | **Horario:** ${nutHorarioOcupacion || "—"}
- **Medidas Antropométricas:** Peso: ${weight ? `${weight} kg` : "—"} | Talla: ${height ? `${height} cm` : "—"} | Cintura: ${waist ? `${waist} cm` : "—"}
- **Composición Corporal:** Grasa Corporal: ${nutGrasa ? `${nutGrasa} %` : "—"} | Masa Músculo Esquelética (MME): ${nutMME ? `${nutMME} kg` : "—"}

## Frecuencia de Consumo de Alimentos por Semana
${Object.entries(nutAlimentacion)
  .filter(([_, val]) => val !== "")
  .map(([key, val]) => {
    const item = NUT_FOOD_ITEMS.find(i => i.key === key);
    return `- **${item ? item.label : key}:** ${val}`;
  })
  .join('\n') || "Ninguno registrado."}

## Hidratación y Actividad Física
- **Consumo de Agua Natural al día:** ${nutAguaNatural || "—"}
- **Agua para cocinar alimentos:** ${nutAguaCocina || "—"}
- **Ejercicio:** ${nutEjercicio || "No"}${nutEjercicio === "Sí" ? ` (${nutEjercicioDetalle})` : ""}
- **Horas de Sueño:** ${nutHorasSueno || "—"} horas

## Cambio de Hábitos y Reevaluación
- **Suplementos alimenticios:** ${nutSuplemento || "—"}
- **Alimento no deseado/alergia:** ${nutAlimentoDisgusto || "—"}
- **Cambio en forma de alimentación:** ${nutCambioAlimentacion || "—"}
- **Mayor dificultad de adherencia:** ${nutDificultadDieta || "—"}

## Recordatorio de 24 Horas
- **Desayuno:** ${nutDesayuno || "—"}
- **Comida:** ${nutComida || "—"}
- **Cena:** ${nutCena || "—"}
- **Snacks:** ${nutSnacks || "—"}
`
      }

      const payload = {
        patientId,
        userId,
        serviceType,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        waist: waist ? parseFloat(waist) : undefined,
        bloodPressure,
        heartRate: heartRate ? parseInt(heartRate) : undefined,
        respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : undefined,
        oxygenSaturation: oxygenSaturation ? parseFloat(oxygenSaturation) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        physicalExam,
        diagnosis,
        plan,
        prognosis,
        extractedDate: extractedDate || undefined,
        labs: labs.filter(l => l.parameter && l.value).map(l => ({...l, value: parseFloat(l.value)})),
        medications: meds.filter(m => m.name),
        noteContent: finalNoteContent,
        evolution: finalEvolution,
        appointmentId
      }
      const res = await saveConsultation(payload)
      if (res.success) {
        router.push(`/pacientes/${res.patientId}`)
      }
    } catch (e) {
      console.error(e)
      alert("Hubo un error al guardar la consulta.")
    } finally {
      setLoading(false)
    }
  }

  const selectedPatient = patients.find(p => p.id === patientId)

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    )
  }

  // ===== PRE-WIZARD: SELECCIÓN DE ÁREA =====
  if (step === -1) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 mt-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-slate-800">¿Qué tipo de consulta realizarás?</h2>
          <p className="text-slate-500">El formato se adaptará a tu área clínica.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button 
            onClick={() => handleStartFormat("MEDICINA")}
            className="group flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-transparent shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-slate-700 hover:text-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <Stethoscope className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold">Medicina</h3>
            <p className="text-sm mt-3 text-center text-slate-500 group-hover:text-slate-600">Exploración física, laboratorios avanzados y prescripción farmacológica.</p>
          </button>
          
          <button 
            onClick={() => handleStartFormat("PSICOLOGIA")}
            className="group flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-transparent shadow-sm hover:border-purple-500 hover:shadow-md transition-all text-slate-700 hover:text-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-100"
          >
            <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <Brain className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold">Psicología</h3>
            <p className="text-sm mt-3 text-center text-slate-500 group-hover:text-slate-600">Evaluación del estado mental, tests psicológicos y seguimiento emocional.</p>
          </button>

          <button 
            onClick={() => handleStartFormat("NUTRICION")}
            className="group flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-transparent shadow-sm hover:border-green-500 hover:shadow-md transition-all text-slate-700 hover:text-green-600 focus:outline-none focus:ring-4 focus:ring-green-100"
          >
            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <Apple className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold">Nutrición</h3>
            <p className="text-sm mt-3 text-center text-slate-500 group-hover:text-slate-600">Somatometría, control de peso, encuestas corporales y plan alimenticio.</p>
          </button>
          
          <button 
            onClick={() => handleStartFormat("TRABAJO_SOCIAL")}
            className="group flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-transparent shadow-sm hover:border-orange-500 hover:shadow-md transition-all text-slate-700 hover:text-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100"
          >
            <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <FileTextIcon className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold">Trabajo Social</h3>
            <p className="text-sm mt-3 text-center text-slate-500 group-hover:text-slate-600">Estudio socioeconómico, redes de apoyo y dinámica familiar.</p>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Botón Volver y Badge del área */}
      <div className="flex items-center justify-between">
        <button onClick={() => setStep(-1)} className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1 font-medium">
          <ChevronLeft className="w-4 h-4"/> Cambiar Área Seleccionada
        </button>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white shadow-sm ${
          serviceType === 'MEDICINA' ? 'bg-blue-500' : serviceType === 'PSICOLOGIA' ? 'bg-purple-500' : serviceType === 'TRABAJO_SOCIAL' ? 'bg-orange-500' : 'bg-green-500'
        }`}>
          Consulta de {serviceType}
        </span>
      </div>

      {/* Progreso */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        {steps.map((s, idx) => (
          <div key={idx} className={`flex flex-col items-center gap-2 ${step === idx ? 'text-blue-600' : step > idx ? 'text-slate-800' : 'text-slate-300'}`}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= idx ? 'border-current bg-blue-50/50' : 'border-slate-200'}`}>
               {s.icon}
            </div>
            <span className="text-xs font-semibold hidden md:block">{s.title}</span>
          </div>
        ))}
      </div>

      <Card className="shadow-sm border-none shadow-slate-200/50">
        <CardContent className="p-8 min-h-[400px]">
          
          {/* PASO 0: Paciente y Doctor */}
          {step === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Selección de Paciente</h3>
                  <p className="text-slate-500">Busca el paciente y confirma el especialista asignado a esta sesión clínica.</p>
                </div>
                
                <button 
                  onClick={() => setShowAiModal(true)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Extraer Datos con IA
                </button>
              </div>

              {/* AI Modal Overlay */}
              {showAiModal && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col p-6 rounded-xl border-2 border-indigo-100 shadow-xl animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600" /> Motor Analítico Ollama (Llama 3)
                    </h4>
                    <button onClick={() => setShowAiModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-500"/></button>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-4">Pega el texto de cualquier documento externo, nota de evolución, o PDF desestructurado. Nuestro servidor VPN local procesará el texto usando Llama 3 para rellenar los datos del Wizard automáticamente.</p>

                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 bg-slate-50 border p-3 rounded-md">
                      <FileTextIcon className="w-6 h-6 text-slate-400" />
                      <div className="flex-1">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">O Extraer directo de PDF</Label>
                        <Input type="file" accept="application/pdf" onChange={handlePdfUpload} disabled={isAiLoading} className="h-8 text-xs cursor-pointer" />
                      </div>
                    </div>

                    <textarea
                      value={aiText}
                      onChange={e => setAiText(e.target.value)}
                      placeholder="Pega el texto libre aquí..."
                      className="flex-1 w-full rounded-md border p-4 text-sm resize-none focus:ring-2 focus:ring-indigo-500"
                      disabled={isAiLoading}
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={handleAiExtract}
                      disabled={isAiLoading || !aiText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold shadow-md disabled:opacity-50 transition-all"
                    >
                      {isAiLoading ? "Analizando con IA..." : "Procesar y Autollenar"}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                  <Label>Buscar Paciente</Label>
                  <Input 
                    placeholder="Nombre o apellidos..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <div className="bg-slate-50 border rounded-md max-h-[250px] overflow-y-auto p-2 space-y-1">
                    {filteredPatients.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => setPatientId(p.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${patientId === p.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-700'}`}
                      >
                        {p.lastName}, {p.firstName} (Exp. {p.id})
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <Label>Especialista a Cargo *</Label>
                  {isDoctor ? (
                    <div className="flex h-10 w-full items-center rounded-md border border-input bg-slate-50 px-3 py-2 text-sm text-slate-700 gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 text-indigo-700 px-2.5 py-0.5 text-xs font-semibold">
                        Doctor
                      </span>
                      {specialists.find(u => u.id === defaultUserId)?.name ?? "Tú"}
                    </div>
                  ) : (
                    <select
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="">Seleccione su perfil...</option>
                      {specialists.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  )}
                  
                   {selectedPatient && (
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg animate-in zoom-in-95 duration-200">
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Paciente Confirmado</p>
                      <p className="text-lg font-semibold text-slate-900 mt-1">{selectedPatient.lastName}, {selectedPatient.firstName}</p>
                      <p className="text-sm font-mono text-slate-600">Expediente: {selectedPatient.id}</p>
                      <p className="text-sm font-mono text-slate-600">CURP: {selectedPatient.curp || 'Sin CURP'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PASO 1: Vitales y Exploración (Sólo Medicina) */}
          {step === 1 && serviceType === "MEDICINA" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Signos Vitales y Exploración</h3>
                <p className="text-slate-500">Captura de parámetros antropométricos básicos.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Ej. 75.5" />
                </div>
                <div className="space-y-2">
                  <Label>Talla (cm)</Label>
                  <Input type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} placeholder="Ej. 175" />
                </div>
                <div className="space-y-2">
                  <Label>Perímetro Abdominal (cm)</Label>
                  <Input type="number" step="0.1" value={waist} onChange={e => setWaist(e.target.value)} placeholder="Ej. 90" />
                </div>
                <div className="space-y-2">
                  <Label>Presión Arterial (mmHg)</Label>
                  <Input value={bloodPressure} onChange={e => setBloodPressure(e.target.value)} placeholder="Ej. 120/80" />
                </div>
                <div className="space-y-2">
                  <Label>Frecuencia Cardíaca (lpm)</Label>
                  <Input type="number" value={heartRate} onChange={e => setHeartRate(e.target.value)} placeholder="Ej. 70" />
                </div>
                <div className="space-y-2">
                  <Label>Frecuencia Respiratoria (rpm)</Label>
                  <Input type="number" value={respiratoryRate} onChange={e => setRespiratoryRate(e.target.value)} placeholder="Ej. 14" />
                </div>
                <div className="space-y-2">
                  <Label>Saturación de Oxígeno (%)</Label>
                  <Input type="number" step="0.1" value={oxygenSaturation} onChange={e => setOxygenSaturation(e.target.value)} placeholder="Ej. 98" />
                </div>
                <div className="space-y-2">
                  <Label>Temperatura (°C)</Label>
                  <Input type="number" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)} placeholder="Ej. 36.6" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Label>Exploración Física detallada</Label>
                <textarea 
                  className="w-full flex min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={physicalExam}
                  onChange={e => setPhysicalExam(e.target.value)}
                  placeholder="Paciente consciente, orientado, mucosas hidratadas..."
                />
              </div>
            </div>
          )}

          {/* PASO 2: Laboratorios (Sólo Medicina) */}
          {step === 2 && serviceType === "MEDICINA" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Captura de Laboratorios</h3>
                <p className="text-slate-500">Añade los resultados de estudios recientes para graficarlos longitudinalmente.</p>
              </div>
              <div className="space-y-4 pt-4">
                {labs.map((lab, index) => (
                  <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="w-full md:w-1/3 space-y-1">
                      <Label className="text-xs">Parámetro</Label>
                      <select 
                        value={lab.parameter}
                        onChange={e => {
                          const n = [...labs]; n[index].parameter = e.target.value; setLabs(n);
                        }}
                        className="flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Seleccione...</option>
                        {LAB_PARAMETERS.map(param => (
                          <option key={param} value={param}>{param}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-1/3 md:w-1/6 space-y-1">
                      <Label className="text-xs">Valor</Label>
                      <Input type="number" step="0.01" value={lab.value} onChange={e => { const n=[...labs]; n[index].value=e.target.value; setLabs(n); }} placeholder="0.0" />
                    </div>
                    <div className="w-1/3 md:w-1/6 space-y-1">
                      <Label className="text-xs">Unidad (Opc.)</Label>
                      <Input value={lab.unit} onChange={e => { const n=[...labs]; n[index].unit=e.target.value; setLabs(n); }} placeholder="mg/dL" />
                    </div>
                    <div className="w-1/3 md:w-1/6 space-y-1">
                      <Label className="text-xs">Rango (Opc.)</Label>
                      <Input value={lab.referenceRange} onChange={e => { const n=[...labs]; n[index].referenceRange=e.target.value; setLabs(n); }} placeholder="70-100" />
                    </div>
                    <div className="w-auto flex items-center h-10 px-2 gap-2">
                       <input type="checkbox" id={`abn-${index}`} checked={lab.isAbnormal} onChange={e => { const n=[...labs]; n[index].isAbnormal=e.target.checked; setLabs(n); }} className="w-4 h-4"/>
                       <Label htmlFor={`abn-${index}`} className="text-xs text-red-600 font-bold">¡Anormal!</Label>
                    </div>
                    <button onClick={() => setLabs(labs.filter((_, i) => i !== index))} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={() => setLabs([...labs, { parameter: "", value: "", unit: "", referenceRange: "", isAbnormal: false }])}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Agregar Parámetro
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Medicamentos (Sólo Medicina) */}
          {step === 3 && serviceType === "MEDICINA" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Receta / Medicamentos</h3>
                <p className="text-slate-500">Ingresa el esquema de tratamiento indicado.</p>
              </div>
              <div className="space-y-4 pt-4">
                {meds.map((med, index) => (
                  <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="w-full md:w-2/5 space-y-1">
                      <Label className="text-xs">Nombre Comercial o Activo</Label>
                      <Input value={med.name} onChange={e => { const n=[...meds]; n[index].name=e.target.value; setMeds(n) }} placeholder="Ej. Metformina" />
                    </div>
                    <div className="w-1/2 md:w-1/4 space-y-1">
                      <Label className="text-xs">Dosis</Label>
                      <Input value={med.dosage} onChange={e => { const n=[...meds]; n[index].dosage=e.target.value; setMeds(n) }} placeholder="Ej. 850mg" />
                    </div>
                    <div className="w-1/2 md:w-1/4 space-y-1">
                      <Label className="text-xs">Frecuencia / Vía</Label>
                      <Input value={med.frequency} onChange={e => { const n=[...meds]; n[index].frequency=e.target.value; setMeds(n) }} placeholder="1 cada 12h, V.O." />
                    </div>
                    <button onClick={() => setMeds(meds.filter((_, i) => i !== index))} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={() => setMeds([...meds, { name: "", dosage: "", frequency: "" }])}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Agregar Medicamento
                </button>
              </div>
            </div>
          )}

          {/* PASO 4: Nota y Cierre (Sólo Medicina) */}
          {step === 4 && serviceType === "MEDICINA" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Nota de Evolución Institucional</h3>
                <p className="text-slate-500">Documentación detallada de la sesión (Formato SOAP).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Evolución / Subjetivo</Label>
                  <textarea 
                    className="w-full h-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    placeholder="Acude a seguimiento..."
                    value={evolution}
                    onChange={e => setEvolution(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Diagnósticos</Label>
                  <textarea 
                    className="w-full h-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    placeholder="Diagnósticos CIE-10..."
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Plan a seguir</Label>
                  <textarea 
                    className="w-full h-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    placeholder="Indicaciones y citas..."
                    value={plan}
                    onChange={e => setPlan(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pronóstico</Label>
                  <textarea 
                    className="w-full h-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    placeholder="Para la vida y función..."
                    value={prognosis}
                    onChange={e => setPrognosis(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= PASOS NUTRICION ================= */}
          {/* PASO 1 (Nutrición): Historia y Somatometría */}
          {step === 1 && serviceType === "NUTRICION" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Historia del Cliente y Somatometría</h3>
                <p className="text-slate-500">Ingrese los datos antropométricos y ocupacionales básicos del paciente.</p>
              </div>

              {/* Banner de Laboratorios Clínicos Recientes */}
              {selectedPatient && selectedPatient.labs && selectedPatient.labs.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-8">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500"/>
                    Información Clínica Reciente
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-slate-600 mb-2">Evolución de Función Renal</p>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...(selectedPatient.labs || [])].reverse().reduce((acc: any[], lab: any) => {
                            const date = new Date(lab.date).toLocaleDateString();
                            let existing = acc.find(item => item.date === date);
                            if (!existing) {
                              existing = { date };
                              acc.push(existing);
                            }
                            if (lab.parameter === 'Creatinina serica' && selectedPatient.dob && selectedPatient.gender) {
                              const age = differenceInYears(new Date(), new Date(selectedPatient.dob));
                              const egfr = calculateEGFR(lab.value, age, selectedPatient.gender, selectedPatient.vitals?.[0]?.height);
                              if (egfr !== null) existing.tfg = egfr;
                            }
                            if (lab.parameter === 'Relacion Albumina/Creatinina') existing.acr = lab.value;
                            return acc;
                          }, [])}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '11px' }}/>
                            <Line yAxisId="left" type="monotone" dataKey="tfg" name="TFG (mL/min)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                            <Line yAxisId="right" type="monotone" dataKey="acr" name="ACR (mg/g)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <div className="w-full max-w-sm">
                        {(() => {
                          const latestScr = selectedPatient.labs?.find((l: any) => l.parameter === 'Creatinina serica')?.value;
                          const latestAcr = selectedPatient.labs?.find((l: any) => l.parameter === 'Relacion Albumina/Creatinina')?.value;
                          let egfr = null;
                          if (latestScr && selectedPatient.dob && selectedPatient.gender) {
                            const age = differenceInYears(new Date(), new Date(selectedPatient.dob));
                            egfr = calculateEGFR(latestScr, age, selectedPatient.gender, selectedPatient.vitals?.[0]?.height);
                          }
                          return <KdigoMatrix egfr={egfr} acr={latestAcr ?? null} />;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Ocupación</Label>
                    <Input value={nutOcupacion} onChange={e => setNutOcupacion(e.target.value)} placeholder="Ej. Oficinista, Estudiante, Docente" />
                  </div>
                  <div className="space-y-2">
                    <Label>Horario de Ocupación</Label>
                    <Input value={nutHorarioOcupacion} onChange={e => setNutHorarioOcupacion(e.target.value)} placeholder="Ej. 8:00 AM - 5:00 PM" />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">Medidas Antropométricas</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label>Peso Actual (kg)</Label>
                      <Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Ej. 70.5" />
                    </div>
                    <div className="space-y-2">
                      <Label>Talla Actual (cm)</Label>
                      <Input type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} placeholder="Ej. 170" />
                    </div>
                    <div className="space-y-2">
                      <Label>CC Actual (Cintura en cm)</Label>
                      <Input type="number" step="0.1" value={waist} onChange={e => setWaist(e.target.value)} placeholder="Ej. 85" />
                    </div>
                    <div className="space-y-2">
                      <Label>% Grasa Corporal</Label>
                      <Input type="number" step="0.1" value={nutGrasa} onChange={e => setNutGrasa(e.target.value)} placeholder="Ej. 22.4" />
                    </div>
                    <div className="space-y-2">
                      <Label>MME (Masa Músculo Esq. en kg)</Label>
                      <Input type="number" step="0.1" value={nutMME} onChange={e => setNutMME(e.target.value)} placeholder="Ej. 30.5" />
                    </div>
                  </div>

                  {/* Cálculos Dinámicos de Nutrición */}
                  {(() => {
                    const w = parseFloat(weight);
                    const h = parseFloat(height);
                    const cc = parseFloat(waist);
                    
                    const calculatedBmi = w && h ? (w / ((h / 100) * (h / 100))).toFixed(1) : null;
                    const calculatedIca = cc && h ? (cc / h).toFixed(2) : null;

                    if (!calculatedBmi && !calculatedIca) return null;

                    return (
                      <div className="mt-6 bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-wrap gap-6 text-sm">
                        {calculatedBmi && (
                          <div>
                            <span className="text-slate-500">IMC Calculado: </span>
                            <strong className="text-slate-800">{calculatedBmi} kg/m²</strong>
                          </div>
                        )}
                        {calculatedIca && (
                          <div>
                            <span className="text-slate-500">ICA (Índice Cintura Altura): </span>
                            <strong className="text-slate-800">{calculatedIca}</strong>
                            <span className="text-xs text-slate-400 ml-1">(Normal: &lt; 0.50)</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* PASO 2 (Nutrición): Frecuencia de Alimentos */}
          {step === 2 && serviceType === "NUTRICION" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Frecuencia de Consumo de Alimentos</h3>
                <p className="text-slate-500">Registre la regularidad de consumo de alimentos del paciente en una semana.</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {NUT_FOOD_ITEMS.map((item) => (
                    <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-2">
                      <Label className="text-xs text-slate-700 max-w-[280px] leading-normal">{item.label}</Label>
                      <select
                        value={nutAlimentacion[item.key] || ""}
                        onChange={(e) => setNutAlimentacion({ ...nutAlimentacion, [item.key]: e.target.value })}
                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 w-full sm:w-[180px]"
                      >
                        <option value="">Seleccione...</option>
                        <option value="Nunca / Raras veces">Nunca / Raras veces</option>
                        <option value="1-2 veces por semana">1-2 veces por semana</option>
                        <option value="3-4 veces por semana">3-4 veces por semana</option>
                        <option value="Diario">Diario</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASO 3 (Nutrición): Hábitos y Recordatorio de 24 horas */}
          {step === 3 && serviceType === "NUTRICION" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Hidratación, Actividad y Recordatorio 24h</h3>
                <p className="text-slate-500">Historial de hidratación, hábitos de ejercicio, adherencia a la dieta y recordatorio diario.</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
                
                {/* Hidratación y Sueño */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-4">Hidratación y Descanso</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Agua Natural al Día (Lts o vasos)</Label>
                      <Input value={nutAguaNatural} onChange={e => setNutAguaNatural(e.target.value)} placeholder="Ej. 2 Litros o 8 vasos" />
                    </div>
                    <div className="space-y-2">
                      <Label>¿Con qué agua cocina los alimentos?</Label>
                      <Input value={nutAguaCocina} onChange={e => setNutAguaCocina(e.target.value)} placeholder="Ej. Agua purificada de garrafón" />
                    </div>
                    <div className="space-y-2">
                      <Label>Horas de Sueño sin Interrupciones</Label>
                      <Input type="number" step="0.5" value={nutHorasSueno} onChange={e => setNutHorasSueno(e.target.value)} placeholder="Ej. 7" />
                    </div>
                  </div>
                </div>

                {/* Actividad Física */}
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-4">Actividad Física</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>¿Realiza Ejercicio Regularmente?</Label>
                      <select
                        value={nutEjercicio}
                        onChange={e => setNutEjercicio(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="">Seleccione...</option>
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    {nutEjercicio === "Sí" && (
                      <div className="md:col-span-2 space-y-2 animate-in fade-in duration-200">
                        <Label>Detalles (Tipo de ejercicio, días/semana, duración)</Label>
                        <Input value={nutEjercicioDetalle} onChange={e => setNutEjercicioDetalle(e.target.value)} placeholder="Ej. Caminata 30 min, 5 días a la semana" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Cambio de Hábitos y Suplementos */}
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-4">Cambio de Hábitos y Reevaluación</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>¿Consume algún suplemento nutricional?</Label>
                      <Input value={nutSuplemento} onChange={e => setNutSuplemento(e.target.value)} placeholder="Ej. Omega 3, Proteína, Multivitamínicos" />
                    </div>
                    <div className="space-y-2">
                      <Label>Alimento que no le gusta o causa malestar</Label>
                      <Input value={nutAlimentoDisgusto} onChange={e => setNutAlimentoDisgusto(e.target.value)} placeholder="Ej. Pescado, Brócoli cocido" />
                    </div>
                    <div className="space-y-2">
                      <Label>¿Qué tanto cambió la forma de alimentarse?</Label>
                      <textarea value={nutCambioAlimentacion} onChange={e => setNutCambioAlimentacion(e.target.value)} className="w-full h-16 rounded-md border p-3 text-sm resize-none" placeholder="Paciente comenta que..." />
                    </div>
                    <div className="space-y-2">
                      <Label>¿Qué es lo que más le ha costado adherirse a la dieta?</Label>
                      <textarea value={nutDificultadDieta} onChange={e => setNutDificultadDieta(e.target.value)} className="w-full h-16 rounded-md border p-3 text-sm resize-none" placeholder="Control de porciones de pan..." />
                    </div>
                  </div>
                </div>

                {/* Recordatorio de 24 Horas */}
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-4">Recordatorio de 24 Horas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Desayuno</Label>
                      <textarea value={nutDesayuno} onChange={e => setNutDesayuno(e.target.value)} className="w-full h-20 rounded-md border p-3 text-sm resize-none" placeholder="Huevo con ejotes, 2 tortillas..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Comida</Label>
                      <textarea value={nutComida} onChange={e => setNutComida(e.target.value)} className="w-full h-20 rounded-md border p-3 text-sm resize-none" placeholder="Pechuga a la plancha, ensalada..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Cena</Label>
                      <textarea value={nutCena} onChange={e => setNutCena(e.target.value)} className="w-full h-20 rounded-md border p-3 text-sm resize-none" placeholder="Quesadillas con queso panela..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Snacks</Label>
                      <textarea value={nutSnacks} onChange={e => setNutSnacks(e.target.value)} className="w-full h-20 rounded-md border p-3 text-sm resize-none" placeholder="Manzana picada con almendras..." />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ================= PASOS PSICOLOGIA ================= */}
          {/* PASO 1 (Psicología): Evaluación Psicológica y Banner */}
          {step === 1 && serviceType === "PSICOLOGIA" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Evaluación Psicológica</h3>
                <p className="text-slate-500">Motivo de intervención, antecedentes y evaluación del estado mental.</p>
              </div>

              {selectedPatient && ((selectedPatient.vitals?.length ?? 0) > 0 || (selectedPatient.labs?.length ?? 0) > 0) && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl shadow-sm mb-6 space-y-6">
                  <div className="flex gap-4">
                    <Activity className="w-8 h-8 text-amber-500 shrink-0" />
                    <div className="flex-1 text-sm">
                      <h4 className="font-bold text-amber-900 mb-2">Información Clínica Reciente</h4>
                      {selectedPatient.vitals?.[0] && (
                        <div>
                          <p className="font-semibold text-amber-800 mb-1">Últimos Signos Vitales ({new Date(selectedPatient.vitals[0].date).toLocaleDateString()})</p>
                          <ul className="text-amber-700 list-disc list-inside flex flex-wrap gap-x-6 gap-y-1">
                            {selectedPatient.vitals[0].weight && <li>Peso: {selectedPatient.vitals[0].weight} kg</li>}
                            {selectedPatient.vitals[0].height && <li>Talla: {selectedPatient.vitals[0].height} cm</li>}
                            {selectedPatient.vitals[0].bloodPressure && <li>PA: {selectedPatient.vitals[0].bloodPressure}</li>}
                            {selectedPatient.vitals[0].heartRate && <li>FC: {selectedPatient.vitals[0].heartRate} lpm</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {(selectedPatient.labs?.length ?? 0) > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-4 rounded-lg border border-amber-100">
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-4 text-sm flex items-center gap-2">
                          <FlaskConical className="w-4 h-4 text-amber-600"/> Evolución Renal (TFG y ACR)
                        </h4>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[...(selectedPatient.labs || [])].reverse().reduce((acc: any[], lab: any) => {
                              const date = new Date(lab.date).toLocaleDateString();
                              let existing = acc.find(item => item.date === date);
                              if (!existing) {
                                existing = { date };
                                acc.push(existing);
                              }
                              if (lab.parameter === 'Creatinina serica' && selectedPatient.dob && selectedPatient.gender) {
                                const age = differenceInYears(new Date(), new Date(selectedPatient.dob));
                                const egfr = calculateEGFR(lab.value, age, selectedPatient.gender, selectedPatient.vitals?.[0]?.height);
                                if (egfr !== null) existing.tfg = egfr;
                              }
                              if (lab.parameter === 'Relacion Albumina/Creatinina') existing.acr = lab.value;
                              return acc;
                            }, [])}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                              <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis yAxisId="left" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                              <Legend wrapperStyle={{ fontSize: '11px' }}/>
                              <Line yAxisId="left" type="monotone" dataKey="tfg" name="TFG (mL/min)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                              <Line yAxisId="right" type="monotone" dataKey="acr" name="ACR (mg/g)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-sm">
                          {(() => {
                            const latestScr = selectedPatient.labs?.find((l: any) => l.parameter === 'Creatinina serica')?.value;
                            const latestAcr = selectedPatient.labs?.find((l: any) => l.parameter === 'Relacion Albumina/Creatinina')?.value;
                            let egfr = null;
                            if (latestScr && selectedPatient.dob && selectedPatient.gender) {
                              const age = differenceInYears(new Date(), new Date(selectedPatient.dob));
                              egfr = calculateEGFR(latestScr, age, selectedPatient.gender, selectedPatient.vitals?.[0]?.height);
                            }
                            return <KdigoMatrix egfr={egfr} acr={latestAcr ?? null} />;
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Formulario Psicología Paso 1 */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Motivo de Intervención</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {["Psiconefroeducación inicial", "Psiconefroeducación subsecuente", "Psiconefroeducación sobre opciones de tratamiento renal", "Apoyo emocional ante progresión", "Intervención en crisis", "Toma de decisiones sobre tratamiento", "Manejo de ansiedad/depresión", "Asesoramiento pretrasplante/postrasplante", "Otro"].map(motivo => (
                      <label key={motivo} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={psychMotivo.includes(motivo)} onChange={e => {
                          if (e.target.checked) setPsychMotivo([...psychMotivo, motivo]);
                          else setPsychMotivo(psychMotivo.filter(m => m !== motivo));
                        }} className="rounded border-slate-300 text-purple-600 focus:ring-purple-600"/>
                        {motivo}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Antecedentes psicológicos</Label>
                    <Input value={psychAntecedentes} onChange={e => setPsychAntecedentes(e.target.value)} placeholder="Ej. Depresión tratada hace 5 años..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de tratamiento renal actual</Label>
                    <select value={psychTxActual} onChange={e => setPsychTxActual(e.target.value)} className="w-full h-10 rounded-md border bg-white px-3 text-sm">
                      <option value="">Seleccione...</option>
                      <option value="Conservador">Conservador</option>
                      <option value="Hemodiálisis">Hemodiálisis</option>
                      <option value="D.P.">Diálisis Peritoneal (D.P.)</option>
                      <option value="Trasplante">Trasplante</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Factores psicosociales relevantes</Label>
                    <div className="grid grid-cols-1 gap-1 mt-1">
                      {["Falta de apoyo familiar", "Problemas económicos", "Aislamiento social", "Duelo reciente", "Conflictos familiares", "Desempleo", "Otro"].map(factor => (
                        <label key={factor} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={psychFactores.includes(factor)} onChange={e => {
                            if (e.target.checked) setPsychFactores([...psychFactores, factor]);
                            else setPsychFactores(psychFactores.filter(f => f !== factor));
                          }} className="rounded border-slate-300 text-purple-600 focus:ring-purple-600"/>
                          {factor}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Conocimiento del paciente sobre su enfermedad</Label>
                    <select value={psychConocimiento} onChange={e => setPsychConocimiento(e.target.value)} className="w-full h-10 rounded-md border bg-white px-3 text-sm">
                      <option value="">Seleccione...</option>
                      <option value="Nulo">Nulo</option>
                      <option value="Parcial">Parcial</option>
                      <option value="Adecuado">Adecuado</option>
                      <option value="Completo">Completo</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Observación Clínica (Mental)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border rounded-lg">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Consciencia</span>
                      <select value={psychEstadoConsciencia} onChange={e => setPsychEstadoConsciencia(e.target.value)} className="w-full text-sm border-slate-200 rounded p-1"><option value="">-</option><option>Lúcido</option><option>Desorientado</option><option>Letárgico</option></select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Ánimo</span>
                      <select value={psychEstadoAnimo} onChange={e => setPsychEstadoAnimo(e.target.value)} className="w-full text-sm border-slate-200 rounded p-1"><option value="">-</option><option>Eutímico</option><option>Depresivo</option><option>Ansioso</option><option>Irritable</option></select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Afecto</span>
                      <select value={psychAfecto} onChange={e => setPsychAfecto(e.target.value)} className="w-full text-sm border-slate-200 rounded p-1"><option value="">-</option><option>Congruente</option><option>Incongruente</option><option>Plano</option><option>Lábil</option></select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Pensamiento</span>
                      <select value={psychPensamiento} onChange={e => setPsychPensamiento(e.target.value)} className="w-full text-sm border-slate-200 rounded p-1"><option value="">-</option><option>Lógico</option><option>Desorganizado</option><option>Ideas delirantes</option><option>Rumiaciones</option></select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Conducta</span>
                      <select value={psychConducta} onChange={e => setPsychConducta(e.target.value)} className="w-full text-sm border-slate-200 rounded p-1"><option value="">-</option><option>Cooperativa</option><option>Hostil</option><option>Pasiva</option><option>Agitada</option><option>Retraída</option></select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Mecanismos de afrontamiento</Label>
                    <div className="grid grid-cols-1 gap-1 mt-1">
                      {["Negación", "Evitación", "Búsqueda de apoyo", "Resolución de problemas", "Reestructuración cognitiva", "Religiosidad/espiritualidad"].map(m => (
                        <label key={m} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={psychMecanismos.includes(m)} onChange={e => {
                            if (e.target.checked) setPsychMecanismos([...psychMecanismos, m]);
                            else setPsychMecanismos(psychMecanismos.filter(x => x !== m));
                          }} className="rounded border-slate-300 text-purple-600 focus:ring-purple-600"/>
                          {m}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Indicadores de riesgo</Label>
                    <div className="grid grid-cols-1 gap-1 mt-1">
                      {["Ideación suicida", "Autolesiones", "Abuso de sustancias", "Violencia familiar", "Abandono de tratamiento", "Ninguno"].map(r => (
                        <label key={r} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={psychRiesgo.includes(r)} onChange={e => {
                            if (e.target.checked) setPsychRiesgo([...psychRiesgo, r]);
                            else setPsychRiesgo(psychRiesgo.filter(x => x !== r));
                          }} className="rounded border-slate-300 text-purple-600 focus:ring-purple-600"/>
                          {r}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Adherencia al tratamiento</Label>
                    <select value={psychAdherencia} onChange={e => setPsychAdherencia(e.target.value)} className="w-full h-10 rounded-md border bg-white px-3 text-sm">
                      <option value="">Seleccione...</option>
                      <option value="Buena">Buena</option>
                      <option value="Parcial">Parcial</option>
                      <option value="Mala">Mala</option>
                      <option value="Nula">Nula</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2 (Psicología): Nota y Plan */}
          {step === 2 && serviceType === "PSICOLOGIA" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Nota de Psicología</h3>
                <p className="text-slate-500">Impresión diagnóstica e intervenciones.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Impresión Diagnóstica</Label>
                  <textarea value={psychImpresionDx} onChange={e => setPsychImpresionDx(e.target.value)} className="w-full h-24 rounded-md border p-3 text-sm resize-none" placeholder="Escriba el diagnóstico psicológico..."/>
                </div>

                <div className="space-y-2">
                  <Label>Intervención Psicológica Realizada</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {["Información sobre la ERC", "Psicoeducación sobre opciones de TR", "Intervención en crisis", "Contención emocional", "Terapia breve para afrontamiento", "Técnicas de reducción de ansiedad", "Estrategias adherencia", "Otras"].map(inter => (
                      <label key={inter} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={psychIntervencion.includes(inter)} onChange={e => {
                          if (e.target.checked) setPsychIntervencion([...psychIntervencion, inter]);
                          else setPsychIntervencion(psychIntervencion.filter(m => m !== inter));
                        }} className="rounded border-slate-300 text-purple-600 focus:ring-purple-600"/>
                        {inter}
                      </label>
                    ))}
                  </div>
                  {psychIntervencion.includes("Otras") && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-xs text-slate-500">Especifique &quot;Otras&quot;</Label>
                      <Input 
                        value={psychOtrasIntervencion} 
                        onChange={e => setPsychOtrasIntervencion(e.target.value)} 
                        placeholder="Describa la otra intervención..." 
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Reacción del paciente</Label>
                    <div className="grid grid-cols-1 gap-1 mt-1">
                      {["Receptivo", "Resistente", "Ambivalente", "Colaborador", "Indiferente"].map(r => (
                        <label key={r} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={psychReaccion.includes(r)} onChange={e => {
                            if (e.target.checked) setPsychReaccion([...psychReaccion, r]);
                            else setPsychReaccion(psychReaccion.filter(x => x !== r));
                          }} className="rounded border-slate-300 text-purple-600 focus:ring-purple-600"/>
                          {r}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Expresión emocional</Label>
                    <div className="grid grid-cols-1 gap-1 mt-1">
                      {["Llanto", "Enojo", "Angustia", "Tranquilidad", "Aplanamiento", "Risa nerviosa"].map(e => (
                        <label key={e} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={psychExpresion.includes(e)} onChange={ev => {
                            if (ev.target.checked) setPsychExpresion([...psychExpresion, e]);
                            else setPsychExpresion(psychExpresion.filter(x => x !== e));
                          }} className="rounded border-slate-300 text-purple-600 focus:ring-purple-600"/>
                          {e}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Plan de Seguimiento y Recomendaciones</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-1">
                    {["Seguimiento semanal", "Seguimiento quincenal", "Seguimiento mensual", "Referencia a psiquiatría", "Intervención familiar", "Grupo de apoyo", "Alta psicológica"].map(p => (
                      <label key={p} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={psychPlan.includes(p)} onChange={ev => {
                          if (ev.target.checked) setPsychPlan([...psychPlan, p]);
                          else setPsychPlan(psychPlan.filter(x => x !== p));
                        }} className="rounded border-slate-300 text-purple-600 focus:ring-purple-600"/>
                        {p}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Conclusiones y Pronóstico</Label>
                  <textarea value={psychConclusiones} onChange={e => setPsychConclusiones(e.target.value)} className="w-full h-24 rounded-md border p-3 text-sm resize-none" placeholder="Conclusiones de la sesión y pronóstico psicoterapéutico..."/>
                </div>
              </div>
            </div>
          )}

          {/* PASO 1 (Trabajo Social): Familia y Economía */}
          {step === 1 && serviceType === "TRABAJO_SOCIAL" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Banner de Laboratorios Clínicos Recientes (Igual que Psicología) */}
              {selectedPatient && selectedPatient.labs && selectedPatient.labs.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-8">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500"/>
                    Información Clínica Reciente
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-slate-600 mb-2">Evolución de Función Renal</p>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...(selectedPatient.labs || [])].reverse().reduce((acc: any[], lab: any) => {
                            const date = new Date(lab.date).toLocaleDateString();
                            let existing = acc.find(item => item.date === date);
                            if (!existing) {
                              existing = { date };
                              acc.push(existing);
                            }
                            if (lab.parameter === 'Creatinina serica' && selectedPatient.dob && selectedPatient.gender) {
                              const age = differenceInYears(new Date(), new Date(selectedPatient.dob));
                              const egfr = calculateEGFR(lab.value, age, selectedPatient.gender, selectedPatient.vitals?.[0]?.height);
                              if (egfr !== null) existing.tfg = egfr;
                            }
                            if (lab.parameter === 'Relacion Albumina/Creatinina') existing.acr = lab.value;
                            return acc;
                          }, [])}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '11px' }}/>
                            <Line yAxisId="left" type="monotone" dataKey="tfg" name="TFG (mL/min)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                            <Line yAxisId="right" type="monotone" dataKey="acr" name="ACR (mg/g)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <div className="w-full max-w-sm">
                        {(() => {
                          const latestScr = selectedPatient.labs?.find((l: any) => l.parameter === 'Creatinina serica')?.value;
                          const latestAcr = selectedPatient.labs?.find((l: any) => l.parameter === 'Relacion Albumina/Creatinina')?.value;
                          let egfr = null;
                          if (latestScr && selectedPatient.dob && selectedPatient.gender) {
                            const age = differenceInYears(new Date(), new Date(selectedPatient.dob));
                            egfr = calculateEGFR(latestScr, age, selectedPatient.gender, selectedPatient.vitals?.[0]?.height);
                          }
                          return <KdigoMatrix egfr={egfr} acr={latestAcr ?? null} />;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-2xl font-bold text-slate-800">Estructura Familiar y Economía</h3>
                <p className="text-slate-500">Datos socioeconómicos básicos del paciente y su familia.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-orange-600">Cuidador Primario: Nombre</Label>
                  <Input value={tsCuidador.nombre} onChange={e => setTsCuidador({...tsCuidador, nombre: e.target.value})} placeholder="Nombre completo" />
                </div>
                <div className="space-y-2">
                  <Label>Edad</Label>
                  <Input type="number" value={tsCuidador.edad} onChange={e => setTsCuidador({...tsCuidador, edad: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Estado Civil</Label>
                  <Input value={tsCuidador.edoCivil} onChange={e => setTsCuidador({...tsCuidador, edoCivil: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={tsCuidador.telefono} onChange={e => setTsCuidador({...tsCuidador, telefono: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold">Núcleo Familiar</Label>
                  <button onClick={() => setTsNucleo([...tsNucleo, { nombre: "", edad: "", edoCivil: "", escolaridad: "", parentesco: "", ocupacion: "", ingresos: "" }])} className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1">
                    <Plus className="w-4 h-4"/> Agregar Miembro
                  </button>
                </div>
                {tsNucleo.length === 0 && <p className="text-sm text-slate-500 italic">No hay miembros agregados al núcleo familiar.</p>}
                {tsNucleo.map((miembro, idx) => (
                  <div key={idx} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end p-3 bg-slate-50 border rounded-lg">
                    <div className="col-span-2 md:col-span-1"><Label className="text-xs">Nombre</Label><Input value={miembro.nombre} onChange={e => { const copy = [...tsNucleo]; copy[idx].nombre = e.target.value; setTsNucleo(copy); }} className="text-xs h-8"/></div>
                    <div><Label className="text-xs">Edad</Label><Input value={miembro.edad} onChange={e => { const copy = [...tsNucleo]; copy[idx].edad = e.target.value; setTsNucleo(copy); }} className="text-xs h-8"/></div>
                    <div><Label className="text-xs">Edo. Civil</Label><Input value={miembro.edoCivil} onChange={e => { const copy = [...tsNucleo]; copy[idx].edoCivil = e.target.value; setTsNucleo(copy); }} className="text-xs h-8"/></div>
                    <div><Label className="text-xs">Escolaridad</Label><Input value={miembro.escolaridad} onChange={e => { const copy = [...tsNucleo]; copy[idx].escolaridad = e.target.value; setTsNucleo(copy); }} className="text-xs h-8"/></div>
                    <div><Label className="text-xs">Parentesco</Label><Input value={miembro.parentesco} onChange={e => { const copy = [...tsNucleo]; copy[idx].parentesco = e.target.value; setTsNucleo(copy); }} className="text-xs h-8"/></div>
                    <div><Label className="text-xs">Ocupación</Label><Input value={miembro.ocupacion} onChange={e => { const copy = [...tsNucleo]; copy[idx].ocupacion = e.target.value; setTsNucleo(copy); }} className="text-xs h-8"/></div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1"><Label className="text-xs">Ingresos</Label><Input type="number" value={miembro.ingresos} onChange={e => { const copy = [...tsNucleo]; copy[idx].ingresos = e.target.value; setTsNucleo(copy); }} className="text-xs h-8"/></div>
                      <button onClick={() => setTsNucleo(tsNucleo.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1.5 rounded self-end mb-0.5"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-lg font-bold">Egresos Mensuales (Gastos)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.keys(tsEgresos).map((key) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs capitalize">{key}</Label>
                      <Input type="number" value={(tsEgresos as any)[key]} onChange={e => setTsEgresos({...tsEgresos, [key]: e.target.value})} className="h-8"/>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2"><Label className="font-bold text-green-700">Ingreso Percápita</Label><Input type="number" value={tsIngresoPercapita} onChange={e => setTsIngresoPercapita(e.target.value)} /></div>
                  <div className="space-y-2"><Label className="font-bold text-red-700">Gasto Alimenticio Percápita</Label><Input type="number" value={tsGastoPercapita} onChange={e => setTsGastoPercapita(e.target.value)} /></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="space-y-2"><Label>Tipo de Familia</Label><Input value={tsTipoFamilia} onChange={e => setTsTipoFamilia(e.target.value)} /></div>
                <div className="space-y-2"><Label>Etapa Ciclo Vital</Label><Input value={tsEtapaCiclo} onChange={e => setTsEtapaCiclo(e.target.value)} /></div>
                <div className="space-y-2"><Label>Problemáticas Detectadas</Label><Input value={tsProblematicas} onChange={e => setTsProblematicas(e.target.value)} /></div>
              </div>
            </div>
          )}

          {/* PASO 2 (Trabajo Social): Condiciones de Vida */}
          {step === 2 && serviceType === "TRABAJO_SOCIAL" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Condiciones de Vida</h3>
                <p className="text-slate-500">Alimentación, vivienda y redes de apoyo.</p>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-bold">Alimentación (Frecuencia por Semana)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {([
                    { key: 'leche', label: 'Leche' },
                    { key: 'verduras', label: 'Verduras' },
                    { key: 'leguminosas', label: 'Leguminosas' },
                    { key: 'jugos', label: 'Jugos' },
                    { key: 'embutidos', label: 'Embutidos' },
                    { key: 'huevo', label: 'Huevo' },
                    { key: 'cereales', label: 'Cereales' },
                    { key: 'carne', label: 'Carne' },
                    { key: 'bebidasGasificadas', label: 'Bebidas Gasificadas' },
                    { key: 'fritos', label: 'Fritos' },
                    { key: 'cafe', label: 'Café/Té' },
                    { key: 'frutas', label: 'Frutas' },
                  ] as { key: keyof typeof tsAlimentacion, label: string }[]).map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <Input type="number" value={tsAlimentacion[key]} onChange={e => setTsAlimentacion({...tsAlimentacion, [key]: e.target.value})} className="h-8"/>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Calidad de Alimentación (Suficiente / Deficiente)</Label>
                  <Input value={tsCalidadAlimentacion} onChange={e => setTsCalidadAlimentacion(e.target.value)} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-lg font-bold">Vivienda</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Tipo</Label><Input value={tsVivienda.tipo} onChange={e => setTsVivienda({...tsVivienda, tipo: e.target.value})} placeholder="Urbana/Rural..."/></div>
                  <div className="space-y-2"><Label>Tenencia</Label><Input value={tsVivienda.tenencia} onChange={e => setTsVivienda({...tsVivienda, tenencia: e.target.value})} placeholder="Propia/Rentada..."/></div>
                  <div className="space-y-2"><Label>Crédito</Label><Input value={tsVivienda.credito} onChange={e => setTsVivienda({...tsVivienda, credito: e.target.value})} placeholder="FOVISSSTE/INFONAVIT..."/></div>
                </div>
                
                <Label className="font-semibold text-sm block mt-4">Distribución (Cantidad)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['dormitorios', 'cocina', 'comedor', 'sala', 'cochera', 'banos', 'patio'].map(key => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs capitalize">{key}</Label>
                      <Input type="number" value={(tsVivienda as any)[key]} onChange={e => setTsVivienda({...tsVivienda, [key]: e.target.value})} className="h-8"/>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2"><Label>Material Paredes</Label><Input value={tsMateriales.paredes} onChange={e => setTsMateriales({...tsMateriales, paredes: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Material Pisos</Label><Input value={tsMateriales.pisos} onChange={e => setTsMateriales({...tsMateriales, pisos: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Material Techos</Label><Input value={tsMateriales.techos} onChange={e => setTsMateriales({...tsMateriales, techos: e.target.value})} /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Convivencia con animales domésticos - Sí/No */}
                  <div className="space-y-2">
                    <Label>Convivencia con animales domésticos</Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={tsAnimalesTiene} onChange={e => { setTsAnimalesTiene(e.target.checked); if (!e.target.checked) setTsAnimalesEspecificacion(""); }} className="w-4 h-4 rounded border-slate-300 accent-orange-600" />
                        <span className="text-sm">Sí</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!tsAnimalesTiene} onChange={e => { setTsAnimalesTiene(!e.target.checked); setTsAnimalesEspecificacion(""); }} className="w-4 h-4 rounded border-slate-300" />
                        <span className="text-sm">No</span>
                      </label>
                    </div>
                    {tsAnimalesTiene && (
                      <Input value={tsAnimalesEspecificacion} onChange={e => setTsAnimalesEspecificacion(e.target.value)} placeholder="Especifique cuál(es)..." className="mt-1" />
                    )}
                  </div>
                  {/* Vehículo - Sí/No */}
                  <div className="space-y-2">
                    <Label>Vehículos</Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={tsVehiculoTiene} onChange={e => { setTsVehiculoTiene(e.target.checked); if (!e.target.checked) setTsVehiculoEspecificacion(""); }} className="w-4 h-4 rounded border-slate-300 accent-orange-600" />
                        <span className="text-sm">Sí</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!tsVehiculoTiene} onChange={e => { setTsVehiculoTiene(!e.target.checked); setTsVehiculoEspecificacion(""); }} className="w-4 h-4 rounded border-slate-300" />
                        <span className="text-sm">No</span>
                      </label>
                    </div>
                    {tsVehiculoTiene && (
                      <Input value={tsVehiculoEspecificacion} onChange={e => setTsVehiculoEspecificacion(e.target.value)} placeholder="Especifique (año/modelo)..." className="mt-1" />
                    )}
                  </div>
                  <div className="space-y-2"><Label>Personas que duermen por cuarto</Label><Input value={tsPersonasCuarto} onChange={e => setTsPersonasCuarto(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Cantidad de Focos</Label><Input type="number" value={tsFocos} onChange={e => setTsFocos(e.target.value)} /></div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold">Redes de Apoyo</Label>
                  <button onClick={() => setTsRedesApoyo([...tsRedesApoyo, { nombre: "", edad: "", edoCivil: "", escolaridad: "", parentesco: "", ocupacion: "", vive: "", hijos: "" }])} className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1">
                    <Plus className="w-4 h-4"/> Agregar Red de Apoyo
                  </button>
                </div>
                {tsRedesApoyo.length === 0 && <p className="text-sm text-slate-500 italic">No hay redes de apoyo agregadas.</p>}
                {tsRedesApoyo.map((red, idx) => (
                  <div key={idx} className="grid grid-cols-2 md:grid-cols-8 gap-2 items-end p-3 bg-slate-50 border rounded-lg">
                    <div className="col-span-2 md:col-span-1"><Label className="text-xs">Nombre</Label><Input value={red.nombre} onChange={e => { const copy = [...tsRedesApoyo]; copy[idx].nombre = e.target.value; setTsRedesApoyo(copy); }} className="text-xs h-8"/></div>
                    <div><Label className="text-xs">Edad</Label><Input value={red.edad} onChange={e => { const copy = [...tsRedesApoyo]; copy[idx].edad = e.target.value; setTsRedesApoyo(copy); }} className="text-xs h-8"/></div>
                    <div><Label className="text-xs">Edo. Civil</Label><Input value={red.edoCivil} onChange={e => { const copy = [...tsRedesApoyo]; copy[idx].edoCivil = e.target.value; setTsRedesApoyo(copy); }} className="text-xs h-8"/></div>
                    <div><Label className="text-xs">Escolaridad</Label><Input value={red.escolaridad} onChange={e => { const copy = [...tsRedesApoyo]; copy[idx].escolaridad = e.target.value; setTsRedesApoyo(copy); }} className="text-xs h-8"/></div>
                    <div><Label className="text-xs">Parentesco</Label><Input value={red.parentesco} onChange={e => { const copy = [...tsRedesApoyo]; copy[idx].parentesco = e.target.value; setTsRedesApoyo(copy); }} className="text-xs h-8"/></div>
                    <div><Label className="text-xs">Ocupación</Label><Input value={red.ocupacion} onChange={e => { const copy = [...tsRedesApoyo]; copy[idx].ocupacion = e.target.value; setTsRedesApoyo(copy); }} className="text-xs h-8"/></div>
                    <div><Label className="text-xs">Vive (Sí/No)</Label><Input value={red.vive} onChange={e => { const copy = [...tsRedesApoyo]; copy[idx].vive = e.target.value; setTsRedesApoyo(copy); }} className="text-xs h-8"/></div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1"><Label className="text-xs">Hijos</Label><Input value={red.hijos} onChange={e => { const copy = [...tsRedesApoyo]; copy[idx].hijos = e.target.value; setTsRedesApoyo(copy); }} className="text-xs h-8"/></div>
                      <button onClick={() => setTsRedesApoyo(tsRedesApoyo.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1.5 rounded self-end mb-0.5"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-lg font-bold text-slate-800">Acceso a Servicios de Salud y Seguridad Social</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Seguridad Social / Derechohabiencia</Label>
                    <select
                      value={tsDerechohabiencia}
                      onChange={e => {
                        setTsDerechohabiencia(e.target.value);
                        setTsSeguridadSocial(e.target.value); // Sincroniza con el estado anterior para compatibilidad
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="">Seleccione...</option>
                      <option value="IMSS">IMSS</option>
                      <option value="ISSSTE">ISSSTE</option>
                      <option value="IMSS-Bienestar / INSABI">IMSS-Bienestar / INSABI</option>
                      <option value="Seguro Privado">Seguro Privado</option>
                      <option value="Ninguno">Ninguno</option>
                      <option value="Otro">Otro (Especifique en observaciones)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Servicio de Salud Utilizado Frecuentemente</Label>
                    <Input value={tsServicioSalud} onChange={e => setTsServicioSalud(e.target.value)} placeholder="Ej. Centro de Salud Local, Clínica de Especialidades, Hospital General" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label>Medio de Transporte Utilizado</Label>
                    <Input value={tsMedioTransporte} onChange={e => setTsMedioTransporte(e.target.value)} placeholder="Ej. Transporte Público, Taxi, Auto Propio" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tiempo de Traslado (Horas/Minutos)</Label>
                    <Input value={tsTiempoTraslado} onChange={e => setTsTiempoTraslado(e.target.value)} placeholder="Ej. 45 minutos, 1.5 horas" />
                  </div>
                  <div className="space-y-2">
                    <Label>Costo de Traslado ($ por viaje)</Label>
                    <Input type="number" value={tsCostoTraslado} onChange={e => setTsCostoTraslado(e.target.value)} placeholder="Ej. 120" />
                  </div>
                </div>

                <div className="space-y-2 mt-2">
                  <Label>Dificultades Principales de Acceso</Label>
                  <Input value={tsDificultadesAcceso} onChange={e => setTsDificultadesAcceso(e.target.value)} placeholder="Ej. Falta de recursos económicos, Distancia, Horarios de atención, Ninguna" />
                </div>
              </div>

              {/* Conductas de Riesgo */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-lg font-bold text-slate-800">Conductas de Riesgo</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tabaquismo</Label>
                    <Input value={tsConductas.tabaquismo} onChange={e => setTsConductas({...tsConductas, tabaquismo: e.target.value})} placeholder="Ej. Activo, Exfumador, No" />
                  </div>
                  <div className="space-y-2">
                    <Label>Omisión de Diálisis Peritoneal</Label>
                    <Input value={tsConductas.omisionDialisisPeritoneal} onChange={e => setTsConductas({...tsConductas, omisionDialisisPeritoneal: e.target.value})} placeholder="Ej. Frecuente, Ocasional, No" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ausentismo en Hemodiálisis</Label>
                    <Input value={tsConductas.ausentismoHemodialisis} onChange={e => setTsConductas({...tsConductas, ausentismoHemodialisis: e.target.value})} placeholder="Ej. Frecuente, Ocasional, No" />
                  </div>
                  <div className="space-y-2">
                    <Label>Transgresión Hídrica</Label>
                    <Input value={tsConductas.transgresionHidrica} onChange={e => setTsConductas({...tsConductas, transgresionHidrica: e.target.value})} placeholder="Ej. Sí, No" />
                  </div>
                  <div className="space-y-2">
                    <Label>Consumo de Alcohol</Label>
                    <Input value={tsConductas.consumoAlcohol} onChange={e => setTsConductas({...tsConductas, consumoAlcohol: e.target.value})} placeholder="Ej. Activo, Exbebedor, No" />
                  </div>
                </div>
              </div>

              {/* Datos del Procedimiento */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-lg font-bold text-slate-800">Datos del Procedimiento</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>¿Cuándo se le solicitó el apoyo?</Label>
                    <Input value={tsDatosProcedimiento.cuandoSeSolicito} onChange={e => setTsDatosProcedimiento({...tsDatosProcedimiento, cuandoSeSolicito: e.target.value})} placeholder="Fecha o descripción" />
                  </div>
                  <div className="space-y-2">
                    <Label>¿Qué profesional lo solicitó?</Label>
                    <Input value={tsDatosProcedimiento.queProfesionalSolicito} onChange={e => setTsDatosProcedimiento({...tsDatosProcedimiento, queProfesionalSolicito: e.target.value})} placeholder="Ej. Médico Nefrólogo, Enfermería" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>¿Cuándo programaron la intervención?</Label>
                    <Input value={tsDatosProcedimiento.cuandoProgramaron} onChange={e => setTsDatosProcedimiento({...tsDatosProcedimiento, cuandoProgramaron: e.target.value})} placeholder="Fecha programada" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3 (Trabajo Social): Evaluación Social */}
          {step === 3 && serviceType === "TRABAJO_SOCIAL" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Evaluación Social</h3>
                <p className="text-slate-500">Diagnóstico situacional y pronóstico.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2"><Label>Descripción del Caso</Label><textarea value={tsDescripcionCaso} onChange={e => setTsDescripcionCaso(e.target.value)} className="w-full h-24 rounded-md border p-3 text-sm resize-none" /></div>
                <div className="space-y-2"><Label>Dinámica Familiar</Label><textarea value={tsDinamicaFamiliar} onChange={e => setTsDinamicaFamiliar(e.target.value)} className="w-full h-24 rounded-md border p-3 text-sm resize-none" /></div>
                <div className="space-y-2"><Label>Actitudes del Paciente ante la Familia y Enfermedad</Label><textarea value={tsActitudes} onChange={e => setTsActitudes(e.target.value)} className="w-full h-24 rounded-md border p-3 text-sm resize-none" /></div>
                <div className="space-y-2"><Label>Viabilidad de Trasplante</Label><textarea value={tsViabilidad} onChange={e => setTsViabilidad(e.target.value)} className="w-full h-16 rounded-md border p-3 text-sm resize-none" /></div>
                <div className="space-y-2"><Label>Diagnóstico Situacional</Label><textarea value={tsDiagnostico} onChange={e => setTsDiagnostico(e.target.value)} className="w-full h-24 rounded-md border p-3 text-sm resize-none" /></div>
                <div className="space-y-2"><Label>Plan Social / Pronóstico</Label><textarea value={tsPlanSocial} onChange={e => setTsPlanSocial(e.target.value)} className="w-full h-24 rounded-md border p-3 text-sm resize-none" /></div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Controles del Wizard */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <button 
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="px-6 py-2.5 rounded-md text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4"/> Atrás
        </button>

        {step < steps.length - 1 ? (
          <button 
            onClick={() => {
              if (step === 0 && (!patientId || !userId)) {
                alert("Seleccione un paciente y confirme el especialista para continuar.")
                return;
              }
              setStep(step + 1)
            }}
            className="px-6 py-2.5 rounded-md text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 flex items-center gap-2 transition-colors"
          >
            Siguiente <ChevronRight className="w-4 h-4"/>
          </button>
        ) : (
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            {loading ? "Guardando..." : <><Save className="w-4 h-4"/> Finalizar y Guardar</>}
          </button>
        )}
      </div>

    </div>
  )
}
