import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import ExcelJS from "exceljs"

export async function GET() {
  try {
    const pacientes = await prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Sistema de Registro"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Pacientes")

    const headers = [
      "ID Paciente", "Nombre", "Apellidos", "Sexo", "Fecha Nacimiento",
      "CURP", "ID Clínico", "Teléfono", "Email",
      "Calle", "Colonia", "C.P.", "Ciudad", "Estado",
      "Diagnóstico Principal", "Observaciones", "Fecha Registro",
    ]

    const headerRow = sheet.addRow(headers)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } }
      cell.alignment = { vertical: "middle", wrapText: true }
      cell.border = { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } }
    })
    headerRow.height = 32

    for (const p of pacientes) {
      sheet.addRow([
        p.id,
        p.firstName,
        p.lastName,
        p.gender === "M" ? "Masculino" : "Femenino",
        p.dob.toISOString().split("T")[0],
        p.curp || "",
        p.clinicalId || "",
        p.phone || "",
        p.email || "",
        p.street || "",
        p.neighborhood || "",
        p.zipCode || "",
        p.city || "",
        p.state || "",
        p.mainDiagnosis || "",
        p.observations || "",
        p.createdAt.toISOString().split("T")[0],
      ])
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
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowNum % 2 === 0 ? "FFF0FDF4" : "FFFFFFFF" } }
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
        "Content-Disposition": 'attachment; filename="pacientes.xlsx"',
      },
    })
  } catch (error) {
    console.error("Error exportando pacientes:", error)
    return new NextResponse("Error al generar reporte", { status: 500 })
  }
}
