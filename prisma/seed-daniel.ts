import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding clinical data for Ibarra, Daniel...')

  // 1. Find or create the patient
  let patient = await prisma.patient.findFirst({
    where: {
      firstName: 'Daniel',
      lastName: 'Ibarra'
    }
  })

  const currentYear = new Date().getFullYear();

  if (!patient) {
    console.log('Patient "Ibarra, Daniel" not found. Creating patient...')
    // Generate a formatted clinical ID (e.g. 2026-00001)
    const patientsThisYear = await prisma.patient.findMany({
      where: { id: { startsWith: `${currentYear}-` } },
      select: { id: true }
    })
    let nextNumber = 1
    if (patientsThisYear.length > 0) {
      const numbers = patientsThisYear
        .map(p => {
          const parts = p.id.split("-")
          return parts.length === 2 ? parseInt(parts[1], 10) : 0
        })
        .filter(n => !isNaN(n))
      nextNumber = Math.max(...numbers) + 1
    }
    const patientId = `${currentYear}-${String(nextNumber).padStart(5, '0')}`

    patient = await prisma.patient.create({
      data: {
        id: patientId,
        firstName: 'Daniel',
        lastName: 'Ibarra',
        curp: 'IBAD880412HDFRRN01',
        dob: new Date(1988, 3, 12), // DOB: April 12, 1988 (~38 years old)
        gender: 'M',
        phone: '55 9876 5432',
        email: 'daniel.ibarra@demo.com',
        street: 'Av. de los Insurgentes 120, CDMX',
        mainDiagnosis: 'Enfermedad Renal Crónica'
      }
    })
    console.log(`Created patient with ID: ${patient.id}`)
  } else {
    console.log(`Found existing patient with ID: ${patient.id}`)
  }

  // 2. Find a doctor to associate the appointments with
  const doctor = await prisma.user.findFirst({
    where: { role: 'DOCTOR' }
  })
  if (!doctor) {
    throw new Error('No doctor found in the database. Please make sure the main seed has run.')
  }

  // 3. Clean up existing records for this patient to avoid duplicates
  await prisma.laboratoryResult.deleteMany({ where: { patientId: patient.id } })
  await prisma.note.deleteMany({ where: { patientId: patient.id } })
  await prisma.vitals.deleteMany({ where: { patientId: patient.id } })
  await prisma.medication.deleteMany({ where: { patientId: patient.id } })
  await prisma.appointment.deleteMany({ where: { patientId: patient.id } })

  // 4. Create historical appointments, vital signs, and notes
  console.log('Seeding appointments and evolution notes...')
  
  const dates = [
    new Date(2026, 0, 10, 10, 0),  // Jan 10, 2026
    new Date(2026, 2, 15, 11, 30), // Mar 15, 2026
    new Date(2026, 5, 22, 9, 15),   // Jun 22, 2026
  ]

  const notesContents = [
    "Consulta de primera vez. Paciente masculino de 37 años de edad derivado por hipertensión de difícil control. Refiere astenia leve. Se solicitan laboratorios básicos (creatinina sérica, examen general de orina con relación albúmina/creatinina). Se ajusta tratamiento antihipertensivo.",
    "Consulta de seguimiento. Se revisan estudios de laboratorio de febrero. Se observa creatinina sérica elevada (1.6 mg/dL) con TFG estimada disminuida compatible con ERC G3a. Albuminuria moderada (ACR 150 mg/g, estadio A2). Paciente asintomático, con cifras de presión arterial en metas. Se indica dieta hiposódica y protección renal con IECA.",
    "Control semestral. Paciente refiere adherencia adecuada al plan alimentario y farmacológico. Cifras de TA estables (120/80). Reporta laboratorios de control de la semana pasada con mejoría parcial en albuminuria (ACR 98 mg/g, estadio A2) y estabilización de la función renal (Creatinina 1.45 mg/dL, TFG ~60 mL/min). Se continúa mismo manejo."
  ]

  const vitalSigns = [
    { weight: 82.5, height: 176, waist: 98, bloodPressure: "140/90", physicalExam: "Paciente con discreta palidez de tegumentos. Sin edemas periféricos." },
    { weight: 81.2, height: 176, waist: 96, bloodPressure: "128/82", physicalExam: "Tegumentos normales. Cardiorrespiratorio sin compromiso. Sin edemas." },
    { weight: 79.8, height: 176, waist: 94, bloodPressure: "120/80", physicalExam: "Buen estado general, hidratado. Abdomen blando, extremidades eutróficas sin edema." }
  ]

  const createdAppointments = []

  for (let i = 0; i < dates.length; i++) {
    const appt = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        userId: doctor.id,
        dateTime: dates[i],
        service: 'MEDICINA',
        status: 'COMPLETED',
        room: 'Consultorio A'
      }
    })
    createdAppointments.push(appt)

    // Note linked to appointment
    await prisma.note.create({
      data: {
        patientId: patient.id,
        userId: doctor.id,
        appointmentId: appt.id,
        service: 'MEDICINA',
        content: notesContents[i],
        createdAt: dates[i]
      }
    })

    // Vitals linked to appointment
    await prisma.vitals.create({
      data: {
        patientId: patient.id,
        appointmentId: appt.id,
        date: dates[i],
        weight: vitalSigns[i].weight,
        height: vitalSigns[i].height,
        waist: vitalSigns[i].waist,
        bloodPressure: vitalSigns[i].bloodPressure,
        physicalExam: vitalSigns[i].physicalExam
      }
    })
  }

  // 5. Create historical laboratory results linked to appointments
  console.log('Seeding laboratory results...')
  
  // January 12 labs (linked to January 10 appointment)
  const janApptId = createdAppointments[0].id
  const janDate = new Date(2026, 0, 12)
  await prisma.laboratoryResult.create({
    data: {
      patientId: patient.id,
      appointmentId: janApptId,
      date: janDate,
      parameter: 'Creatinina serica',
      value: 1.8,
      unit: 'mg/dL',
      referenceRange: '0.7 - 1.3',
      isAbnormal: true
    }
  })
  await prisma.laboratoryResult.create({
    data: {
      patientId: patient.id,
      appointmentId: janApptId,
      date: janDate,
      parameter: 'Relacion Albumina/Creatinina',
      value: 340,
      unit: 'mg/g',
      referenceRange: '< 30',
      isAbnormal: true
    }
  })

  // March 10 labs (linked to March 15 appointment)
  const marApptId = createdAppointments[1].id
  const marDate = new Date(2026, 2, 10)
  await prisma.laboratoryResult.create({
    data: {
      patientId: patient.id,
      appointmentId: marApptId,
      date: marDate,
      parameter: 'Creatinina serica',
      value: 1.6,
      unit: 'mg/dL',
      referenceRange: '0.7 - 1.3',
      isAbnormal: true
    }
  })
  await prisma.laboratoryResult.create({
    data: {
      patientId: patient.id,
      appointmentId: marApptId,
      date: marDate,
      parameter: 'Relacion Albumina/Creatinina',
      value: 150,
      unit: 'mg/g',
      referenceRange: '< 30',
      isAbnormal: true
    }
  })

  // June 18 labs (linked to June 22 appointment)
  const junApptId = createdAppointments[2].id
  const junDate = new Date(2026, 5, 18)
  await prisma.laboratoryResult.create({
    data: {
      patientId: patient.id,
      appointmentId: junApptId,
      date: junDate,
      parameter: 'Creatinina serica',
      value: 1.45,
      unit: 'mg/dL',
      referenceRange: '0.7 - 1.3',
      isAbnormal: true
    }
  })
  await prisma.laboratoryResult.create({
    data: {
      patientId: patient.id,
      appointmentId: junApptId,
      date: junDate,
      parameter: 'Relacion Albumina/Creatinina',
      value: 98,
      unit: 'mg/g',
      referenceRange: '< 30',
      isAbnormal: true
    }
  })

  // 6. Create medications linked to appointments
  console.log('Seeding medications...')
  
  // Jan 10 medications
  await prisma.medication.create({
    data: {
      patientId: patient.id,
      appointmentId: janApptId,
      date: dates[0],
      name: 'Losartán',
      dosage: '50 mg',
      frequency: 'Cada 12 horas'
    }
  })

  // Mar 15 medications
  await prisma.medication.create({
    data: {
      patientId: patient.id,
      appointmentId: marApptId,
      date: dates[1],
      name: 'Losartán',
      dosage: '50 mg',
      frequency: 'Cada 12 horas'
    }
  })
  await prisma.medication.create({
    data: {
      patientId: patient.id,
      appointmentId: marApptId,
      date: dates[1],
      name: 'Metformina',
      dosage: '850 mg',
      frequency: 'Cada 12 horas'
    }
  })

  // Jun 22 medications
  await prisma.medication.create({
    data: {
      patientId: patient.id,
      appointmentId: junApptId,
      date: dates[2],
      name: 'Losartán',
      dosage: '50 mg',
      frequency: 'Cada 12 horas'
    }
  })
  await prisma.medication.create({
    data: {
      patientId: patient.id,
      appointmentId: junApptId,
      date: dates[2],
      name: 'Metformina',
      dosage: '850 mg',
      frequency: 'Cada 24 horas'
    }
  })

  console.log('Successfully completed seeding for Ibarra, Daniel!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
