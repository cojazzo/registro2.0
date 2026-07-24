import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import ExcelJS from "exceljs"

function safeJsonParse(content: string | null): any | null {
  if (!content) return null
  try { return JSON.parse(content) } catch { return null }
}

function arrToStr(val: any): string {
  if (Array.isArray(val)) return val.join(", ")
  return String(val ?? "")
}

export async function GET() {
  try {
    const citas = await prisma.appointment.findMany({
      where: { service: "PSICOLOGIA" },
      orderBy: { dateTime: "desc" },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, curp: true, clinicalId: true } },
        notes: true,
      },
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Sistema de Registro"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Psicología")

    const headers = [
      "ID Cita", "Fecha Cita", "ID Paciente", "Nombre Paciente", "CURP", "ID Clínico",
      "Motivo de Intervención",
      "Antecedentes psicológicos",
      "Tipo de tratamiento renal actual",
      "Factores psicosociales",
      "Conocimiento sobre su enfermedad",
      "Consciencia", "Ánimo", "Afecto", "Pensamiento", "Conducta",
      "Mecanismos de afrontamiento",
      "Indicadores de riesgo",
      "Adherencia al tratamiento",
      "Impresión Diagnóstica",
      "Intervención Psicológica Realizada",
      "Otras (Intervención)",
      "Reacción del paciente",
      "Expresión emocional",
      "Plan de Seguimiento",
      "Conclusiones y Pronóstico",
    ]

    // Header row with style
    const headerRow = sheet.addRow(headers)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } }
      cell.alignment = { vertical: "middle", wrapText: true }
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
      }
    })
    headerRow.height = 32

    // Data rows
    for (const c of citas) {
      const nota = c.notes[0]
      const p = safeJsonParse(nota?.content ?? null)

      sheet.addRow([
        c.id,
        c.dateTime.toISOString().split("T")[0],
        c.patient.id,
        `${c.patient.firstName} ${c.patient.lastName}`,
        c.patient.curp || "",
        c.patient.clinicalId || "",
        arrToStr(p?.motivoIntervencion),
        p?.antecedentesPsicologicos ?? "",
        p?.tipoTratamientoActual ?? "",
        arrToStr(p?.factoresPsicosociales),
        p?.conocimientoEnfermedad ?? "",
        p?.estadoConsciencia ?? "",
        p?.estadoAnimo ?? "",
        p?.afecto ?? "",
        p?.pensamiento ?? "",
        p?.conducta ?? "",
        arrToStr(p?.mecanismosAfrontamiento),
        arrToStr(p?.indicadoresRiesgo),
        p?.adherenciaTratamiento ?? "",
        p?.impresionDiagnostica ?? "",
        arrToStr(p?.intervencionPsicologica),
        p?.otrasIntervencion ?? "",
        arrToStr(p?.reaccionPaciente),
        arrToStr(p?.expresionEmocional),
        arrToStr(p?.planSeguimiento),
        p?.conclusionesPronostico ?? "",
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

    // Zebra rows
    sheet.eachRow((row, rowNum) => {
      if (rowNum > 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: rowNum % 2 === 0 ? "FFF5F3FF" : "FFFFFFFF" },
          }
          cell.alignment = { wrapText: true, vertical: "top" }
        })
      }
    })

    // Freeze first row
    sheet.views = [{ state: "frozen", ySplit: 1 }]

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="reporte_psicologia.xlsx"',
      },
    })
  } catch (error) {
    console.error("Error exportando datos de psicología:", error)
    return new NextResponse("Error al generar reporte", { status: 500 })
  }
}
