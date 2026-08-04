import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import ExcelJS from "exceljs"

function safeJsonParse(content: string | null): any | null {
  if (!content) return null
  try { return JSON.parse(content) } catch { return null }
}

// Food item keys → readable column headers
const FOOD_COLUMNS: { key: string; label: string }[] = [
  { key: "hojaVerde", label: "Veg. Hoja Verde" },
  { key: "vegetalesCocidos", label: "Veg. Cocidos" },
  { key: "frutas", label: "Frutas" },
  { key: "leguminosas", label: "Leguminosas" },
  { key: "leche", label: "Leche" },
  { key: "lacteos", label: "Lácteos" },
  { key: "carneRes", label: "Carne Res" },
  { key: "carnePollo", label: "Carne Pollo" },
  { key: "pescado", label: "Pescado" },
  { key: "embutidos", label: "Embutidos" },
  { key: "huevo", label: "Huevo" },
  { key: "cerealesSinProcesar", label: "Cereales S/Procesar" },
  { key: "cerealesProcesados", label: "Cereales Procesados" },
  { key: "aceite", label: "Aceite" },
  { key: "manteca", label: "Manteca" },
  { key: "bebidasAzucar", label: "Bebidas Azúcar" },
  { key: "bebidasAlcohol", label: "Bebidas Alcohol" },
  { key: "comidaRapida", label: "Comida Rápida" },
  { key: "snacks", label: "Snacks" },
  { key: "cafeTe", label: "Café / Té" },
  { key: "consome", label: "Consomé Granulado" },
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const fechaInicio = searchParams.get("fecha_inicio")
    const fechaFin    = searchParams.get("fecha_fin")

    const dateWhere: any = {}
    if (fechaInicio) dateWhere.gte = new Date(fechaInicio)
    if (fechaFin)    dateWhere.lte = new Date(fechaFin + "T23:59:59.999Z")

    const citas = await prisma.appointment.findMany({
      where: { service: "NUTRICION", ...(Object.keys(dateWhere).length ? { dateTime: dateWhere } : {}) },
      orderBy: { dateTime: "desc" },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, curp: true, clinicalId: true } },
        notes: true,
        vitals: true,
      },
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Sistema de Registro"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Nutrición")

    const headers = [
      // --- Identificación ---
      "ID Cita", "Fecha Cita", "ID Paciente", "Nombre Paciente", "CURP", "ID Clínico",
      // --- Somatometría ---
      "Peso (kg)", "Talla (cm)", "Cintura (cm)", "% Grasa Corporal", "MME (kg)",
      // --- Historia ---
      "Ocupación", "Horario Ocupación",
      // --- Frecuencia de Alimentos (21 columnas) ---
      ...FOOD_COLUMNS.map(f => f.label),
      // --- Hidratación y Hábitos ---
      "Agua Natural / Día", "Agua para Cocinar", "Horas de Sueño",
      "¿Ejercicio?", "Detalle Ejercicio",
      // --- Reevaluación ---
      "Suplementos", "Alimento Disgusto / Intolerancia",
      "Cambio en Alimentación", "Dificultad Adherencia Dieta",
      // --- Recordatorio 24h ---
      "Desayuno", "Comida", "Cena", "Snacks",
    ]

    // Header row styling
    const headerRow = sheet.addRow(headers)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF97316" } }
      cell.alignment = { vertical: "middle", wrapText: true }
      cell.border = { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } }
    })
    headerRow.height = 32

    // Data rows
    for (const c of citas) {
      const nota = c.notes[0]
      const signos = c.vitals[0]
      const p = safeJsonParse(nota?.content ?? null)

      const alimentacion = p?.alimentacion ?? {}

      sheet.addRow([
        // Identificación
        c.id,
        c.dateTime.toISOString().split("T")[0],
        c.patient.id,
        `${c.patient.firstName} ${c.patient.lastName}`,
        c.patient.curp || "",
        c.patient.clinicalId || "",
        // Somatometría
        signos?.weight ?? "",
        signos?.height ?? "",
        signos?.waist ?? "",
        p?.grasaCorporal ?? "",
        p?.mme ?? "",
        // Historia
        p?.ocupacion ?? "",
        p?.horarioOcupacion ?? "",
        // Frecuencia de Alimentos (21 columnas)
        ...FOOD_COLUMNS.map(f => alimentacion[f.key] ?? ""),
        // Hidratación y Hábitos
        p?.aguaNatural ?? "",
        p?.aguaCocina ?? "",
        p?.horasSueno ?? "",
        p?.ejercicio ?? "",
        p?.ejercicioDetalle ?? "",
        // Reevaluación
        p?.suplemento ?? "",
        p?.alimentoDisgusto ?? "",
        p?.cambioAlimentacion ?? "",
        p?.dificultadDieta ?? "",
        // Recordatorio 24h
        p?.desayuno ?? "",
        p?.comida ?? "",
        p?.cena ?? "",
        p?.snacks ?? "",
      ])
    }

    // Auto-width columns
    sheet.columns.forEach((col) => {
      let max = 14
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0
        if (len > max) max = len
      })
      col.width = Math.min(max + 2, 50)
    })

    // Zebra striping
    sheet.eachRow((row, rowNum) => {
      if (rowNum > 1) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowNum % 2 === 0 ? "FFFFF7ED" : "FFFFFFFF" } }
          cell.alignment = { wrapText: true, vertical: "top" }
        })
      }
    })

    // Freeze header row
    sheet.views = [{ state: "frozen", ySplit: 1 }]

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="reporte_nutricion.xlsx"',
      },
    })
  } catch (error) {
    console.error("Error exportando datos de nutrición:", error)
    return new NextResponse("Error al generar reporte", { status: 500 })
  }
}
