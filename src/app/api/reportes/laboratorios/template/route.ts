import { NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { LAB_PARAMETERS } from "@/lib/lab-parameters"

export async function GET() {
  try {
    const hoy = new Date().toISOString().split("T")[0]

    const metaCols = ["Fecha Muestra", "ID Paciente", "Nombre", "Apellido", "CURP", "ID Clínico"]
    const allHeaders = [...metaCols, ...LAB_PARAMETERS]

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Sistema de Registro"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Datos")

    const headerRow = sheet.addRow(allHeaders)
    headerRow.eachCell((cell) => {
      cell.font      = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE11D48" } }
      cell.alignment = { vertical: "middle", wrapText: true }
      cell.border    = { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } }
    })
    headerRow.height = 32

    // Auto-ancho basado en el encabezado
    sheet.columns.forEach((col) => {
      const header = String(col.values?.[1] ?? "")
      col.width = Math.max(header.length + 4, 14)
    })

    // Fila 1 congelada para facilitar la carga
    sheet.views = [{ state: "frozen", ySplit: 1 }]

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Template_Laboratorios_${hoy}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error generando template de laboratorios:", error)
    return new NextResponse("Error al generar el template", { status: 500 })
  }
}
