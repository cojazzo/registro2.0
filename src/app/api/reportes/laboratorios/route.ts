import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import ExcelJS from "exceljs"
import { LAB_PARAMETERS } from "@/lib/lab-parameters"

// ── Campos fijos disponibles ──────────────────────────────────────────────────
const CAMPOS_FIJOS_KEYS = [
  "ID Paciente",
  "Nombre",
  "Apellido",
  "CURP",
  "ID Clínico",
] as const

type CampoFijo = (typeof CAMPOS_FIJOS_KEYS)[number]

function getCampoValor(patient: {
  id: string
  firstName: string
  lastName: string
  curp: string | null
  clinicalId: string | null
}, campo: CampoFijo): string {
  switch (campo) {
    case "ID Paciente": return patient.id
    case "Nombre":      return patient.firstName
    case "Apellido":    return patient.lastName
    case "CURP":        return patient.curp ?? ""
    case "ID Clínico":  return patient.clinicalId ?? ""
  }
}

// ── Nombre del archivo ────────────────────────────────────────────────────────
function buildFilename(fechaInicio: string | null, fechaFin: string | null): string {
  const hoy = new Date().toISOString().split("T")[0]
  if (fechaInicio && fechaFin)  return `Laboratorios_${fechaInicio}_a_${fechaFin}_generado_${hoy}.xlsx`
  if (fechaInicio)              return `Laboratorios_desde_${fechaInicio}_generado_${hoy}.xlsx`
  if (fechaFin)                 return `Laboratorios_hasta_${fechaFin}_generado_${hoy}.xlsx`
  return `Laboratorios_Completo_${hoy}.xlsx`
}

// ── Estilo de encabezado ──────────────────────────────────────────────────────
const HEADER_COLOR = "FFE11D48" // rose-600

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl

    // ── 1. Parsear parámetros de filtro ─────────────────────────────────────
    const fechaInicio = searchParams.get("fecha_inicio")
    const fechaFin    = searchParams.get("fecha_fin")
    const camposParam = searchParams.get("campos")
    const paramsParam = searchParams.get("parametros")

    // Campos fijos seleccionados
    const selectedCampos: CampoFijo[] = camposParam
      ? (camposParam.split(",").map(c => c.trim()).filter(c =>
          (CAMPOS_FIJOS_KEYS as readonly string[]).includes(c)
        ) as CampoFijo[])
      : [...CAMPOS_FIJOS_KEYS]

    // Parámetros de laboratorio seleccionados
    const selectedParams: Set<string> = paramsParam
      ? new Set(paramsParam.split(",").map(p => p.trim()).filter(p => LAB_PARAMETERS.includes(p)))
      : new Set(LAB_PARAMETERS)

    // ── 2. Query a la base de datos ─────────────────────────────────────────
    const where: any = {}
    if (fechaInicio) where.date = { ...where.date, gte: new Date(fechaInicio) }
    if (fechaFin)    where.date = { ...where.date, lte: new Date(fechaFin + "T23:59:59.999Z") }
    if (selectedParams.size < LAB_PARAMETERS.length) {
      where.parameter = { in: Array.from(selectedParams) }
    }

    const resultados = await prisma.laboratoryResult.findMany({
      where,
      orderBy: [{ patientId: "asc" }, { date: "asc" }, { parameter: "asc" }],
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, curp: true, clinicalId: true },
        },
      },
    })

    // ── 3. Columnas de parámetros — orden del catálogo, filtrado ────────────
    const paramCols: string[] = LAB_PARAMETERS.filter(p => selectedParams.has(p))

    // ── 4. Agrupar por (patientId, fecha_muestra) ────────────────────────────
    type VisitaKey = string // `${patientId}|${date.toISOString().split("T")[0]}`
    const visitaMap = new Map<VisitaKey, {
      patient: (typeof resultados)[0]["patient"]
      fecha: string
      valores: Map<string, number | string>
    }>()

    for (const r of resultados) {
      const fecha = r.date.toISOString().split("T")[0]
      const key: VisitaKey = `${r.patientId}|${fecha}`

      if (!visitaMap.has(key)) {
        visitaMap.set(key, { patient: r.patient, fecha, valores: new Map() })
      }

      const val: number | string =
        r.value !== null && r.value !== undefined
          ? r.value
          : r.textValue ?? ""

      visitaMap.get(key)!.valores.set(r.parameter, val)
    }

    // ── 5. Construir el Workbook ─────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Sistema de Registro"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Laboratorios")

    const allHeaders = ["Fecha Muestra", ...selectedCampos, ...paramCols]

    const headerRow = sheet.addRow(allHeaders)
    headerRow.eachCell((cell) => {
      cell.font      = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_COLOR } }
      cell.alignment = { vertical: "middle", wrapText: true }
      cell.border    = { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } }
    })
    headerRow.height = 32

    // Ordenar visitas por (patientId, fecha)
    const visitasSorted = Array.from(visitaMap.entries()).sort(([a], [b]) => a.localeCompare(b))

    if (visitasSorted.length === 0) {
      // Fila vacía ilustrativa para el xlsx de cero resultados
      const emptyRow = sheet.addRow(Array(allHeaders.length).fill(""))
      emptyRow.getCell(1).value = "Sin resultados para el rango seleccionado"
    }

    let rowNum = 1
    for (const [, visita] of visitasSorted) {
      rowNum++
      const rowData: (string | number)[] = [
        visita.fecha,
        ...selectedCampos.map(c => getCampoValor(visita.patient, c)),
        ...paramCols.map(p => {
          const v = visita.valores.get(p)
          return v !== undefined ? v : ""
        }),
      ]

      const row = sheet.addRow(rowData)
      row.eachCell((cell) => {
        cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: rowNum % 2 === 0 ? "FFFFF1F2" : "FFFFFFFF" } }
        cell.alignment = { wrapText: true, vertical: "top" }
      })
    }

    // Auto-ancho de columnas
    sheet.columns.forEach((col) => {
      let max = 12
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0
        if (len > max) max = len
      })
      col.width = Math.min(max + 4, 50)
    })

    sheet.views = [{ state: "frozen", ySplit: 1 }]

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = buildFilename(fechaInicio, fechaFin)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error exportando laboratorios:", error)
    return new NextResponse("Error al generar reporte de laboratorios", { status: 500 })
  }
}
