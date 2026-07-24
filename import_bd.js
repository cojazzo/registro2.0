const ExcelJS = require('exceljs');
const { PrismaClient } = require('./node_modules/.prisma/client');

const prisma = new PrismaClient();
const ADMIN_USER_ID = 'e81b704c-1c1a-4760-bbfc-9bf1f4b4b297'; // Dr. Admin

function cellVal(row, col) {
  const c = row.getCell(col);
  if (c.result !== undefined) return c.result;
  return c.value;
}

function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const str = String(val);
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function isNumeric(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === 'number') return !isNaN(val);
  const s = String(val).trim();
  return s !== '' && s !== 'TAMIZAJE' && !isNaN(Number(s));
}

async function main() {
  console.log('=== IMPORTACION BD_IE.xlsx ===\n');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('C:\\Users\\Emerson.Collazo\\Desktop\\BD_IE.xlsx');
  const ws = workbook.worksheets[0];

  const patientRows = new Map();
  ws.eachRow({ includeEmpty: false }, (row, rn) => {
    if (rn <= 1) return;
    const id = String(cellVal(row, 1));
    if (!patientRows.has(id)) patientRows.set(id, []);
    patientRows.get(id).push(row);
  });

  console.log('Pacientes encontrados: ' + patientRows.size);

  let totalPatients = 0;
  let totalAppointments = 0;
  let totalVitals = 0;
  let totalLabs = 0;
  let totalMeds = 0;

  for (const [excelId, rows] of patientRows) {
    let nameRow = rows[0];
    for (const r of rows) {
      const nom = String(cellVal(r, 2) || '').trim();
      if (nom.length > 2 && nom !== 'XX' && nom !== 'AA') {
        nameRow = r;
        break;
      }
    }

    const firstName = String(cellVal(nameRow, 2) || '').trim();
    const apPat = String(cellVal(nameRow, 3) || '').trim();
    const apMat = String(cellVal(nameRow, 4) || '').trim();
    const lastName = (apPat + ' ' + apMat).trim();
    const dob = toDate(cellVal(nameRow, 5));
    const curp = String(cellVal(nameRow, 7) || '').trim() || null;
    const gender = String(cellVal(nameRow, 8) || 'M').trim();
    const clinicalId = String(cellVal(nameRow, 9) || '').trim() || null;
    const dx = String(cellVal(nameRow, 11) || '').trim() || null;
    const yearInclusion = String(cellVal(nameRow, 10) || '').trim();

    if (!dob) {
      console.log('  WARN Paciente ' + excelId + ': sin fecha de nacimiento, saltando.');
      continue;
    }

    let patient = null;
    if (curp) {
      patient = await prisma.patient.findUnique({ where: { curp: curp } });
    }

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          firstName: firstName,
          lastName: lastName,
          curp: curp,
          clinicalId: clinicalId,
          dob: dob,
          gender: gender,
          mainDiagnosis: dx,
          observations: yearInclusion ? 'Año de inclusion al protocolo: ' + yearInclusion : null,
        },
      });
      console.log('  OK Paciente creado: ' + firstName + ' ' + lastName + ' (' + curp + ') -> ID: ' + patient.id);
      totalPatients++;
    } else {
      console.log('  INFO Paciente ya existe: ' + firstName + ' ' + lastName + ' (' + curp + ') -> ID: ' + patient.id);
    }

    let hasLosartan = false;
    let hasDapa = false;
    let lastLosartanDate = null;
    let lastDapaDate = null;

    for (const row of rows) {
      const labDate = toDate(cellVal(row, 13));
      if (!labDate) continue;

      const nCita = cellVal(row, 14);

      const appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          userId: ADMIN_USER_ID,
          dateTime: labDate,
          service: 'MEDICINA',
          status: 'COMPLETED',
        },
      });
      totalAppointments++;

      const peso = cellVal(row, 17);
      const talla = cellVal(row, 18);
      if (isNumeric(peso) || isNumeric(talla)) {
        await prisma.vitals.create({
          data: {
            patientId: patient.id,
            appointmentId: appointment.id,
            date: labDate,
            weight: isNumeric(peso) ? Number(peso) : null,
            height: isNumeric(talla) ? Number(talla) : null,
          },
        });
        totalVitals++;
      }

      const cr = cellVal(row, 15);
      const acr = cellVal(row, 16);

      if (isNumeric(cr)) {
        await prisma.laboratoryResult.create({
          data: {
            patientId: patient.id,
            appointmentId: appointment.id,
            date: labDate,
            parameter: 'Creatinina serica',
            value: Number(cr),
            unit: 'mg/dL',
            referenceRange: '0.5 - 1.2',
            isAbnormal: Number(cr) > 1.2 || Number(cr) < 0.5,
          },
        });
        totalLabs++;
      }

      if (isNumeric(acr)) {
        await prisma.laboratoryResult.create({
          data: {
            patientId: patient.id,
            appointmentId: appointment.id,
            date: labDate,
            parameter: 'Relacion Albumina/Creatinina',
            value: Number(acr),
            unit: 'mg/g',
            referenceRange: '< 30',
            isAbnormal: Number(acr) >= 30,
          },
        });
        totalLabs++;
      }

      const losartanVal = cellVal(row, 23);
      if (Number(losartanVal) === 1) {
        hasLosartan = true;
        lastLosartanDate = labDate;
      }
      const dapaVal = cellVal(row, 25);
      if (Number(dapaVal) === 1) {
        hasDapa = true;
        lastDapaDate = labDate;
      }

      console.log('    Cita #' + nCita + ' (' + labDate.toISOString().split('T')[0] + ') Cr:' + (isNumeric(cr) ? cr : 'N/A') + ' ACR:' + (isNumeric(acr) ? acr : 'N/A') + ' Peso:' + (isNumeric(peso) ? peso : 'N/A') + ' Talla:' + (isNumeric(talla) ? talla : 'N/A'));
    }

    if (hasLosartan) {
      await prisma.medication.create({
        data: {
          patientId: patient.id,
          name: 'Losartan',
          dosage: 'Activo',
          frequency: 'Diario',
          date: lastLosartanDate || new Date(),
        },
      });
      totalMeds++;
      console.log('    MED: Losartan');
    }
    if (hasDapa) {
      await prisma.medication.create({
        data: {
          patientId: patient.id,
          name: 'Dapagliflozina',
          dosage: 'Activo',
          frequency: 'Diario',
          date: lastDapaDate || new Date(),
        },
      });
      totalMeds++;
      console.log('    MED: Dapagliflozina');
    }
  }

  console.log('\n=== RESUMEN DE IMPORTACION ===');
  console.log('  Pacientes creados:    ' + totalPatients);
  console.log('  Citas creadas:        ' + totalAppointments);
  console.log('  Signos vitales:       ' + totalVitals);
  console.log('  Laboratorios:         ' + totalLabs);
  console.log('  Medicamentos:         ' + totalMeds);
  console.log('=== IMPORTACION COMPLETA ===');
}

main()
  .catch(function(e) { console.error('ERROR:', e); })
  .finally(function() { return prisma.$disconnect(); });
