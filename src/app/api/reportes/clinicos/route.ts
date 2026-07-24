import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import ExcelJS from "exceljs"

export async function GET() {
  try {
    const citas = await prisma.appointment.findMany({
      where: { service: "MEDICINA" },
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

    const sheet = workbook.addWorksheet("Consultas Médicas")

    const headers = [
      "ID Cita", "Fecha Cita", "ID Paciente", "Nombre Paciente", "CURP", "ID Clínico",
      "Peso (kg)", "Talla (cm)", "Cintura (cm)", "Tensión Arterial",
      "Frecuencia Cardiaca", "Frecuencia Respiratoria", "Temp (°C)", "SpO2 (%)",
      "Evolución", "Diagnóstico", "Plan", "Pronóstico",
    ]

    const headerRow = sheet.addRow(headers)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } }
      cell.alignment = { vertical: "middle", wrapText: true }
      cell.border = { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } }
    })
    headerRow.height = 32

    for (const c of citas) {
      const nota = c.notes[0]
      const signos = c.vitals[0]
      sheet.addRow([
        c.id,
        c.dateTime.toISOString().split("T")[0],
        c.patient.id,
        `${c.patient.firstName} ${c.patient.lastName}`,
        c.patient.curp || "",
        c.patient.clinicalId || "",
        signos?.weight ?? "",
        signos?.height ?? "",
        signos?.waist ?? "",
        signos?.bloodPressure ?? "",
        signos?.heartRate ?? "",
        signos?.respiratoryRate ?? "",
        signos?.temperature ?? "",
        signos?.oxygenSaturation ?? "",
        nota?.evolution ?? "",
        nota?.diagnosis ?? "",
        nota?.plan ?? "",
        nota?.prognosis ?? "",
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
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowNum % 2 === 0 ? "FFEFF6FF" : "FFFFFFFF" } }
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
        "Content-Disposition": 'attachment; filename="historial_clinico.xlsx"',
      },
    })
  } catch (error) {
    console.error("Error exportando datos clínicos:", error)
    return new NextResponse("Error al generar reporte", { status: 500 })
  }
}
