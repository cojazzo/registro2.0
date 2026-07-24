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
      where: { service: "TRABAJO_SOCIAL" },
      orderBy: { dateTime: "desc" },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, curp: true, clinicalId: true } },
        notes: true,
      },
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Sistema de Registro"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Trabajo Social")

    const headers = [
      "ID Cita", "Fecha Cita", "ID Paciente", "Nombre Paciente", "CURP", "ID Clínico",
      "Cuidador Nombre", "Cuidador Edad", "Cuidador Edo Civil", "Cuidador Teléfono",
      "Núcleo Familiar",
      "Egreso Alimentos", "Egreso Luz", "Egreso Gas", "Egreso Teléfono", "Egreso Agua",
      "Egreso Educación", "Egreso Infonavit", "Egreso Transporte", "Egreso Otros",
      "Ingreso Per Cápita", "Gasto Per Cápita",
      "Clasificación Familiar", "Etapa Ciclo Vital", "Problemáticas",
      "Alim Leche", "Alim Verduras", "Alim Leguminosas", "Alim Jugos",
      "Alim Embutidos", "Alim Huevo", "Alim Cereales", "Alim Carne",
      "Alim Refresco", "Alim Fritos", "Alim Café/Té", "Alim Frutas",
      "Calidad Alimentación",
      "Vivienda Tipo", "Vivienda Tenencia", "Vivienda Crédito",
      "Dormitorios", "Cocina", "Comedor", "Sala", "Cochera", "Baños", "Patio",
      "Material Paredes", "Material Pisos", "Material Techos",
      "Muebles", "Servicios", "Personas por Cuarto", "Focos", "Vehículo", "Convivencia Animales",
      "Redes de Apoyo", "Seguridad Social", "Servicios de Salud Usados",
      "Descripción del Caso", "Dinámica Familiar", "Actitudes del Paciente",
      "Viabilidad de Trasplante", "Diagnóstico Situacional", "Plan Social / Pronóstico",
    ]

    const headerRow = sheet.addRow(headers)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } }
      cell.alignment = { vertical: "middle", wrapText: true }
      cell.border = { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } }
    })
    headerRow.height = 32

    for (const c of citas) {
      const nota = c.notes[0]
      const p = safeJsonParse(nota?.content ?? null)
      const cp = p?.cuidadorPrimario ?? {}
      const eg = p?.egresos ?? {}
      const al = p?.alimentacion ?? {}
      const viv = p?.vivienda ?? {}
      const mat = p?.materiales ?? {}

      sheet.addRow([
        c.id,
        c.dateTime.toISOString().split("T")[0],
        c.patient.id,
        `${c.patient.firstName} ${c.patient.lastName}`,
        c.patient.curp || "",
        c.patient.clinicalId || "",
        cp.nombre ?? "", cp.edad ?? "", cp.edoCivil ?? "", cp.telefono ?? "",
        Array.isArray(p?.nucleoFamiliar)
          ? p.nucleoFamiliar.map((m: any) => `${m.nombre} (${m.parentesco})`).join("; ")
          : "",
        eg.alimentos ?? "", eg.luz ?? "", eg.gas ?? "", eg.tel ?? "", eg.agua ?? "",
        eg.educacion ?? "", eg.infonavit ?? "", eg.transporte ?? "", eg.otro ?? "",
        p?.ingresoPercapita ?? "", p?.gastoPercapita ?? "",
        p?.tipoFamilia ?? "", p?.etapaCicloVital ?? "", p?.problematicas ?? "",
        al.leche ?? "", al.verduras ?? "", al.leguminosas ?? "", al.jugos ?? "",
        al.embutidos ?? "", al.huevo ?? "", al.cereales ?? "", al.carne ?? "",
        al.refresco ?? "", al.fritos ?? "", al.cafe ?? "", al.frutas ?? "",
        p?.calidadAlimentacion ?? "",
        viv.tipo ?? "", viv.tenencia ?? "", viv.credito ?? "",
        viv.dormitorios ?? "", viv.cocina ?? "", viv.comedor ?? "",
        viv.sala ?? "", viv.cochera ?? "", viv.banos ?? "", viv.patio ?? "",
        mat.paredes ?? "", mat.pisos ?? "", mat.techos ?? "",
        arrToStr(p?.muebles), arrToStr(p?.servicios),
        p?.personasPorCuarto ?? "", p?.focos ?? "", p?.vehiculo ?? "", p?.convivenciaAnimales ?? "",
        Array.isArray(p?.redesApoyo)
          ? p.redesApoyo.map((m: any) => `${m.nombre} (${m.parentesco})`).join("; ")
          : "",
        p?.seguridadSocial ?? "", p?.serviciosSaludUsados ?? "",
        p?.descripcionCaso ?? "", p?.dinamicaFamiliar ?? "", p?.actitudesPaciente ?? "",
        p?.viabilidadTrasplante ?? "", p?.diagnosticoSituacional ?? "", p?.planSocialPronostico ?? "",
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
        "Content-Disposition": 'attachment; filename="reporte_trabajo_social.xlsx"',
      },
    })
  } catch (error) {
    console.error("Error exportando datos de trabajo social:", error)
    return new NextResponse("Error al generar reporte", { status: 500 })
  }
}
