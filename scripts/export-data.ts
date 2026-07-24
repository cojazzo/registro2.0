import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportData() {
  console.log('📦 Exportando datos desde SQLite (dev.db)...');

  try {
    const users = await prisma.user.findMany();
    const patients = await prisma.patient.findMany();
    const appointments = await prisma.appointment.findMany();
    const notes = await prisma.note.findMany();
    const labs = await prisma.laboratoryResult.findMany();
    const vitals = await prisma.vitals.findMany();
    const medications = await prisma.medication.findMany();
    const auditLogs = await prisma.auditLog.findMany();

    const data = {
      users,
      patients,
      appointments,
      notes,
      labs,
      vitals,
      medications,
      auditLogs,
      exportedAt: new Date().toISOString(),
    };

    const outputPath = path.join(process.cwd(), 'data_backup.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`✅ Exportación completada con éxito: ${outputPath}`);
    console.log(`   - Usuarios: ${users.length}`);
    console.log(`   - Pacientes: ${patients.length}`);
    console.log(`   - Citas: ${appointments.length}`);
    console.log(`   - Notas: ${notes.length}`);
    console.log(`   - Resultados de Lab: ${labs.length}`);
    console.log(`   - Signos Vitales: ${vitals.length}`);
    console.log(`   - Medicamentos: ${medications.length}`);
    console.log(`   - Logs de Auditoría: ${auditLogs.length}`);
  } catch (error) {
    console.error('❌ Error exportando los datos:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
