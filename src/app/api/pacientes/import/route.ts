import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import ExcelJS from "exceljs"
import { getSession } from "@/lib/session"

function extractText(val: any): string {
  if (val === null || val === undefined) return ""
  if (typeof val === "string" || typeof val === "number") return String(val)
  if (val.richText && Array.isArray(val.richText)) {
    return val.richText.map((rt: any) => rt.text).join("")
  }
  if (val.text) return val.text
  if (val.result !== undefined) return String(val.result)
  if (val instanceof Date) return val.toISOString()
  return String(val)
}

function cellVal(row: ExcelJS.Row, col: number) {
  if (col < 1) return null
  const c = row.getCell(col)
  if (c.result !== undefined) return c.result
  return c.value
}

function toDate(val: any): Date | null {
  if (!val) return null
  if (val instanceof Date) return val
  const str = extractText(val).trim()
  
  // Soporte para formato DD/MM/YYYY o DD-MM-YYYY
  const dmyRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  const match = str.match(dmyRegex)
  if (match) {
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10) - 1 // Meses en JS son index 0
    const year = parseInt(match[3], 10)
    const d = new Date(year, month, day)
    return isNaN(d.getTime()) ? null : d
  }

  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function isNumeric(val: any): boolean {
  if (val === null || val === undefined) return false
  if (typeof val === "number") return !isNaN(val)
  const s = extractText(val).trim()
  return s !== "" && s !== "TAMIZAJE" && !isNaN(Number(s))
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const userId = session.userId

    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as any)
    
    // 1. Detección dinámica de columnas buscando en las primeras 5 filas de TODAS las hojas
    let ws: ExcelJS.Worksheet | null = null
    const colMap: Record<string, number> = {}
    let headerRowNum = 1

    for (const sheet of workbook.worksheets) {
      for (let r = 1; r <= 5; r++) {
        const row = sheet.getRow(r)
        let foundCols = 0
        const tempColMap: Record<string, number> = {}
        
        row.eachCell((cell, colNumber) => {
          const val = extractText(cell.value).toLowerCase().trim()
          if (val.includes("id_paciente") || val === "id paciente") { tempColMap.id = colNumber; foundCols++; }
          if (val.includes("nombre")) { tempColMap.nombre = colNumber; foundCols++; }
          if (val.includes("apellido paterno")) tempColMap.apPat = colNumber
          if (val.includes("apellido materno")) tempColMap.apMat = colNumber
          if (val.includes("fecha_nacimiento") || val.includes("fecha de nacimiento")) tempColMap.fNac = colNumber
          if (val === "edad" || val.includes("edad")) tempColMap.edad = colNumber
          if (val === "curp" || val.includes("curp")) tempColMap.curp = colNumber
          if (val === "sexo" || val.includes("sexo")) tempColMap.sexo = colNumber
          if (val.includes("expediente")) tempColMap.exp = colNumber
          if (val.includes("año de inclusion")) tempColMap.anioInclusion = colNumber
          if (val.includes("reportebx") || val.includes("biopsia")) tempColMap.dx = colNumber
          if (val.includes("fecha laboratorios") || val.includes("fecha_laboratorios")) tempColMap.fechaLab = colNumber
          if (val.includes("creatinina")) tempColMap.cr = colNumber
          if (val === "acr") tempColMap.acr = colNumber
          if (val === "peso" || val.includes("peso")) tempColMap.peso = colNumber
          if (val === "talla" || val.includes("talla")) tempColMap.talla = colNumber
          if (val.includes("losartan")) tempColMap.losartan = colNumber
          if (val.includes("dapaglifozina") || val.includes("dapagliflozina")) tempColMap.dapa = colNumber
          
          if (val.includes("fecha de inicio")) {
            if (tempColMap.losartan && !tempColMap.losartanFecha && colNumber > tempColMap.losartan && (!tempColMap.dapa || colNumber < tempColMap.dapa)) {
              tempColMap.losartanFecha = colNumber
            } else if (tempColMap.dapa && !tempColMap.dapaFecha && colNumber > tempColMap.dapa) {
              tempColMap.dapaFecha = colNumber
            }
          }
        })
        
        if (tempColMap.id) {
          ws = sheet
          headerRowNum = r
          Object.assign(colMap, tempColMap)
          break
        }
      }
      if (ws) break
    }

    console.log("Hoja seleccionada:", ws?.name, "Columnas detectadas en fila " + headerRowNum + ":", colMap)

    if (!ws || !colMap.id) {
      return NextResponse.json({ error: "No se encontró la columna ID_PACIENTE en ninguna hoja del archivo. Asegúrate de subir la tabla de datos base y no una tabla dinámica." }, { status: 400 })
    }

    const patientRows = new Map<string, ExcelJS.Row[]>()
    
    ws.eachRow({ includeEmpty: false }, (row, rn) => {
      if (rn <= headerRowNum) return // skip header
      const id = extractText(cellVal(row, colMap.id)).trim()
      
      // Ignorar totales y filas vacías
      if (!id || id.toLowerCase().includes("total") || id === "undefined" || id === "null") return

      if (!patientRows.has(id)) patientRows.set(id, [])
      patientRows.get(id)!.push(row)
    })

    let totalPatients = 0
    let totalAppointments = 0
    let totalVitals = 0
    let totalLabs = 0
    let totalMeds = 0

    console.log(`Pacientes agrupados (patientRows.size): ${patientRows.size}`)

    for (const [excelId, rows] of patientRows.entries()) {
      let nameRow = rows[0]
      for (const r of rows) {
        const nom = colMap.nombre ? extractText(cellVal(r, colMap.nombre)).trim() : ""
        if (nom.length > 2 && nom !== "XX" && nom !== "AA") {
          nameRow = r
          break
        }
      }

      const firstName = colMap.nombre ? extractText(cellVal(nameRow, colMap.nombre)).trim() : "Paciente"
      const apPat = colMap.apPat ? extractText(cellVal(nameRow, colMap.apPat)).trim() : ""
      const apMat = colMap.apMat ? extractText(cellVal(nameRow, colMap.apMat)).trim() : ""
      const lastName = `${apPat} ${apMat}`.trim() || excelId
      
      let dob = colMap.fNac ? toDate(cellVal(nameRow, colMap.fNac)) : null
      
      // Si no hay DOB, calcularlo a partir de la Edad
      if (!dob && colMap.edad) {
        const edadText = extractText(cellVal(nameRow, colMap.edad))
        const edad = Number(edadText)
        if (!isNaN(edad) && edad > 0) {
          dob = new Date()
          dob.setFullYear(dob.getFullYear() - Math.floor(edad))
        }
      }

      // Si aún no hay DOB, asignar una fecha por defecto para no fallar en Prisma
      if (!dob) {
        dob = new Date("1900-01-01")
      }

      const curp = colMap.curp ? extractText(cellVal(nameRow, colMap.curp)).trim() || null : null
      const gender = colMap.sexo ? extractText(cellVal(nameRow, colMap.sexo)).trim() || "M" : "M"
      const clinicalId = colMap.exp ? extractText(cellVal(nameRow, colMap.exp)).trim() || null : null
      const dx = colMap.dx ? extractText(cellVal(nameRow, colMap.dx)).trim() || null : null
      const yearInclusion = colMap.anioInclusion ? extractText(cellVal(nameRow, colMap.anioInclusion)).trim() : ""

      let patient = null
      if (curp) {
        patient = await prisma.patient.findUnique({ where: { curp } })
      }

      if (!patient) {
        // En caso de que haya duplicados sin CURP, buscar por nombre y apellidos
        const existing = await prisma.patient.findFirst({
          where: { firstName, lastName }
        })
        if (existing) {
          patient = existing
        } else {
          patient = await prisma.patient.create({
            data: {
              firstName: firstName || "Paciente",
              lastName: lastName || excelId,
              curp,
              clinicalId,
              dob,
              gender: gender === "F" || gender === "M" ? gender : "M",
              mainDiagnosis: dx,
              observations: yearInclusion ? `Año de inclusion al protocolo: ${yearInclusion}` : null,
            },
          })
          totalPatients++
        }
      }

      let hasLosartan = false
      let hasDapa = false
      let lastLosartanDate: Date | null = null
      let lastDapaDate: Date | null = null

      for (const row of rows) {
        let labDate = colMap.fechaLab ? toDate(cellVal(row, colMap.fechaLab)) : null
        if (!labDate) {
          // Si no hay fecha de laboratorio, usar la fecha actual (o ignorarla, pero queremos registrar la cita)
          labDate = new Date()
        }

        const existingAppointment = await prisma.appointment.findFirst({
          where: { patientId: patient.id, dateTime: labDate, service: "MEDICINA" }
        })

        let appointment = existingAppointment
        if (!appointment) {
          appointment = await prisma.appointment.create({
            data: {
              patientId: patient.id,
              userId: userId,
              dateTime: labDate,
              service: "MEDICINA",
              status: "COMPLETED",
            },
          })
          totalAppointments++
        }

        const peso = colMap.peso ? cellVal(row, colMap.peso) : null
        const talla = colMap.talla ? cellVal(row, colMap.talla) : null
        if (isNumeric(peso) || isNumeric(talla)) {
          const existingVitals = await prisma.vitals.findFirst({
            where: { patientId: patient.id, date: labDate }
          })
          
          if (!existingVitals) {
            await prisma.vitals.create({
              data: {
                patientId: patient.id,
                appointmentId: appointment.id,
                date: labDate,
                weight: isNumeric(peso) ? Number(peso) : null,
                height: isNumeric(talla) ? Number(talla) : null,
              },
            })
            totalVitals++
          }
        }

        const cr = colMap.cr ? cellVal(row, colMap.cr) : null
        const acr = colMap.acr ? cellVal(row, colMap.acr) : null

        if (isNumeric(cr)) {
          const existingCr = await prisma.laboratoryResult.findFirst({
            where: { patientId: patient.id, date: labDate, parameter: "Creatinina serica" }
          })
          if (!existingCr) {
            await prisma.laboratoryResult.create({
              data: {
                patientId: patient.id,
                appointmentId: appointment.id,
                date: labDate,
                parameter: "Creatinina serica",
                value: Number(cr),
                unit: "mg/dL",
                referenceRange: "0.5 - 1.2",
                isAbnormal: Number(cr) > 1.2 || Number(cr) < 0.5,
              },
            })
            totalLabs++
          }
        }

        if (isNumeric(acr)) {
          const existingAcr = await prisma.laboratoryResult.findFirst({
            where: { patientId: patient.id, date: labDate, parameter: "Relacion Albumina/Creatinina" }
          })
          if (!existingAcr) {
            await prisma.laboratoryResult.create({
              data: {
                patientId: patient.id,
                appointmentId: appointment.id,
                date: labDate,
                parameter: "Relacion Albumina/Creatinina",
                value: Number(acr),
                unit: "mg/g",
                referenceRange: "< 30",
                isAbnormal: Number(acr) >= 30,
              },
            })
            totalLabs++
          }
        }

        const losartanVal = colMap.losartan ? cellVal(row, colMap.losartan) : null
        if (Number(losartanVal) === 1) {
          hasLosartan = true
          if (colMap.losartanFecha) {
            const explicitDate = toDate(cellVal(row, colMap.losartanFecha))
            if (explicitDate) {
              if (!lastLosartanDate || explicitDate < lastLosartanDate) {
                lastLosartanDate = explicitDate
              }
            }
          }
        }
        
        const dapaVal = colMap.dapa ? cellVal(row, colMap.dapa) : null
        if (Number(dapaVal) === 1) {
          hasDapa = true
          if (colMap.dapaFecha) {
            const explicitDate = toDate(cellVal(row, colMap.dapaFecha))
            if (explicitDate) {
              if (!lastDapaDate || explicitDate < lastDapaDate) {
                lastDapaDate = explicitDate
              }
            }
          }
        }
      }

      if (hasLosartan) {
        const medDate = lastLosartanDate || new Date("1900-01-01")
        const existingLosartan = await prisma.medication.findFirst({
          where: { patientId: patient.id, name: "Losartán" }
        })
        if (!existingLosartan) {
          await prisma.medication.create({
            data: {
              patientId: patient.id,
              name: "Losartán",
              dosage: "Activo",
              frequency: "Diario",
              date: medDate,
            },
          })
          totalMeds++
        } else if (existingLosartan.date.getTime() !== medDate.getTime()) {
          await prisma.medication.update({
            where: { id: existingLosartan.id },
            data: { date: medDate }
          })
        }
      }
      if (hasDapa) {
        const medDate = lastDapaDate || new Date("1900-01-01")
        const existingDapa = await prisma.medication.findFirst({
          where: { patientId: patient.id, name: "Dapagliflozina" }
        })
        if (!existingDapa) {
          await prisma.medication.create({
            data: {
              patientId: patient.id,
              name: "Dapagliflozina",
              dosage: "Activo",
              frequency: "Diario",
              date: medDate,
            },
          })
          totalMeds++
        } else if (existingDapa.date.getTime() !== medDate.getTime()) {
          await prisma.medication.update({
            where: { id: existingDapa.id },
            data: { date: medDate }
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      patientsCreated: totalPatients,
      appointmentsCreated: totalAppointments,
      vitalsCreated: totalVitals,
      labsCreated: totalLabs,
      medsCreated: totalMeds,
    })
  } catch (error: any) {
    console.error("Error importando excel:", error)
    return NextResponse.json({ error: error.message || "Error procesando el archivo" }, { status: 500 })
  }
}
