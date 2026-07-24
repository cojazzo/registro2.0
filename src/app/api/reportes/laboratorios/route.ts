import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import ExcelJS from "exceljs"

export async function GET() {
  try {
    const labs = await prisma.laboratoryResult.findMany({
      orderBy: { date: "desc" },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, curp: true, clinicalId: true } },
      },
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Sistema de Registro"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Laboratorios")

    const headers = [
      "ID Laboratorio", "Fecha Muestra", "ID Paciente", "Nombre Paciente", "CURP", "ID Clínico",
      "Parámetro", "Valor", "Unidad", "Rango de Referencia", "¿Anormal?",
    ]

    const headerRow = sheet.addRow(headers)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE11D48" } }
      cell.alignment = { vertical: "middle", wrapText: true }
      cell.border = { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } }
    })
    headerRow.height = 32

    for (const l of labs) {
      const row = sheet.addRow([
        l.id,
        l.date.toISOString().split("T")[0],
        l.patient.id,
        `${l.patient.firstName} ${l.patient.lastName}`,
        l.patient.curp || "",
        l.patient.clinicalId || "",
        l.parameter,
        l.value,
        l.unit || "",
        l.referenceRange || "",
        l.isAbnormal ? "Sí" : "No",
      ])
      if (l.isAbnormal) {
        row.getCell(7).font = { color: { argb: "FFB91C1C" } }
        row.getCell(8).font = { bold: true, color: { argb: "FFB91C1C" } }
      }
    }

    sheet.columns.forEach((col) => {
      let max = 14
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0
        if (len > max) max = len
      })
      col.width = Math.min(max + 2, 50)
    })

    sheet.eachRow((row, rowNum) => {
      if (rowNum > 1) {
        row.eachCell((cell) => {
          if (!cell.fill || (cell.fill as any).fgColor?.argb === undefined) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowNum % 2 === 0 ? "FFFFF1F2" : "FFFFFFFF" } }
          }
          cell.alignment = { wrapText: true, vertical: "top" }
        })
      }
    })

    sheet.views = [{ state: "frozen", ySplit: 1 }]

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="laboratorios.xlsx"',
      },
    })
  } catch (error) {
    console.error("Error exportando laboratorios:", error)
    return new NextResponse("Error al generar reporte", { status: 500 })
  }
}
