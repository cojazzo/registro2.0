import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Limpiar db si es desarrollo (opcional, aunque sqlite push usualmente limpia si modificado)
  await prisma.auditLog.deleteMany()
  await prisma.laboratoryResult.deleteMany()
  await prisma.note.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.user.deleteMany()

  // 1. Usuarios demo
  const hashedPassword = await bcrypt.hash('123456', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      passwordHash: hashedPassword,
      name: 'Dr. Admin',
      role: 'ADMIN'
    }
  })

  const doc = await prisma.user.create({
    data: {
      email: 'doc@demo.com',
      passwordHash: hashedPassword,
      name: 'Dra. María Salud',
      role: 'DOCTOR'
    }
  })

  // 2. Pacientes
  for (let i = 1; i <= 10; i++) {
    const patientId = `2026-${String(i).padStart(5, '0')}`
    const patient = await prisma.patient.create({
      data: {
        id: patientId,
        firstName: `Paciente ${i}`,
        lastName: `Ejemplo`,
        curp: `PACIENTE000${i}XXXXXX`,
        dob: new Date(1980 + i, 5, 10),
        gender: i % 2 === 0 ? 'M' : 'F',
        phone: `555-100-${i}00`,
        mainDiagnosis: 'Diabetes Mellitus Tipo 2',
      }
    })

    // 3. Citas, Notas y Laboratorios por mes
    for (let month = 1; month <= 3; month++) {
      const apptDate = new Date(2026, month - 1, 15)
      
      const appt = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          userId: doc.id,
          dateTime: apptDate,
          service: 'MEDICINA',
          status: 'COMPLETED'
        }
      })

      await prisma.note.create({
        data: {
          patientId: patient.id,
          userId: doc.id,
          appointmentId: appt.id,
          service: 'MEDICINA',
          content: `Nota de evolución para el paciente ${i} en el mes ${month}. Se encuentra estable, ajustando dosis de metformina.`,
          createdAt: apptDate
        }
      })

      // HbA1c
      await prisma.laboratoryResult.create({
        data: {
          patientId: patient.id,
          appointmentId: appt.id,
          date: apptDate,
          parameter: 'HbA1c',
          value: 7.5 - (month * 0.2), // Mejorando
          unit: '%',
          referenceRange: '< 5.7',
          isAbnormal: true
        }
      })
    }

    // Seed Creatinine and ACR values linked to a specific appointment
    const creatinineVal = i % 3 === 0 ? 1.5 : i % 3 === 1 ? 0.9 : 3.0
    const acrVal = i % 3 === 0 ? 150 : i % 3 === 1 ? 15 : 450
    const apptDateMarch20 = new Date(2026, 2, 20)

    const apptMarch20 = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        userId: doc.id,
        dateTime: apptDateMarch20,
        service: 'MEDICINA',
        status: 'COMPLETED'
      }
    })

    await prisma.note.create({
      data: {
        patientId: patient.id,
        userId: doc.id,
        appointmentId: apptMarch20.id,
        service: 'MEDICINA',
        content: `Evaluación de función renal para paciente ${i}. Se revisan valores de creatinina sérica y relación albúmina/creatinina.`,
        createdAt: apptDateMarch20
      }
    })

    await prisma.laboratoryResult.create({
      data: {
        patientId: patient.id,
        appointmentId: apptMarch20.id,
        date: apptDateMarch20,
        parameter: 'Creatinina serica',
        value: creatinineVal,
        unit: 'mg/dL',
        referenceRange: '0.7 - 1.3',
        isAbnormal: creatinineVal > 1.3
      }
    })

    await prisma.laboratoryResult.create({
      data: {
        patientId: patient.id,
        appointmentId: apptMarch20.id,
        date: apptDateMarch20,
        parameter: 'Relacion Albumina/Creatinina',
        value: acrVal,
        unit: 'mg/g',
        referenceRange: '< 30',
        isAbnormal: acrVal >= 30
      }
    })
  }

  console.log('Seed terminado con éxito')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
