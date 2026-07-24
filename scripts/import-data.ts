import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importData() {
  console.log('📥 Importando datos desde data_backup.json a PostgreSQL...');

  const backupPath = path.join(process.cwd(), 'data_backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ No se encontró el archivo de respaldo en: ${backupPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(backupPath, 'utf-8');
  const data = JSON.parse(rawData);

  try {
    // 1. Usuarios
    console.log(`👤 Insertando ${data.users?.length || 0} usuarios...`);
    for (const item of data.users || []) {
      await prisma.user.upsert({
        where: { id: item.id },
        update: {},
        create: {
          ...item,
          createdAt: new Date(item.createdAt),
        },
      });
    }

    // 2. Pacientes
    console.log(`🏥 Insertando ${data.patients?.length || 0} pacientes...`);
    for (const item of data.patients || []) {
      await prisma.patient.upsert({
        where: { id: item.id },
        update: {},
        create: {
          ...item,
          dob: new Date(item.dob),
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }

    // 3. Citas
    console.log(`📅 Insertando ${data.appointments?.length || 0} citas...`);
    for (const item of data.appointments || []) {
      await prisma.appointment.upsert({
        where: { id: item.id },
        update: {},
        create: {
          ...item,
          dateTime: new Date(item.dateTime),
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }

    // 4. Notas médicas
    console.log(`📝 Insertando ${data.notes?.length || 0} notas médicas...`);
    for (const item of data.notes || []) {
      await prisma.note.upsert({
        where: { id: item.id },
        update: {},
        create: {
          ...item,
          createdAt: new Date(item.createdAt),
        },
      });
    }

    // 5. Resultados de laboratorio
    console.log(`🧪 Insertando ${data.labs?.length || 0} resultados de laboratorio...`);
    for (const item of data.labs || []) {
      await prisma.laboratoryResult.upsert({
        where: { id: item.id },
        update: {},
        create: {
          ...item,
          date: new Date(item.date),
          createdAt: new Date(item.createdAt),
        },
      });
    }

    // 6. Signos vitales
    console.log(`🩺 Insertando ${data.vitals?.length || 0} signos vitales...`);
    for (const item of data.vitals || []) {
      await prisma.vitals.upsert({
        where: { id: item.id },
        update: {},
        create: {
          ...item,
          date: new Date(item.date),
        },
      });
    }

    // 7. Medicamentos
    console.log(`💊 Insertando ${data.medications?.length || 0} medicamentos...`);
    for (const item of data.medications || []) {
      await prisma.medication.upsert({
        where: { id: item.id },
        update: {},
        create: {
          ...item,
          date: new Date(item.date),
        },
      });
    }

    // 8. Logs de auditoría
    console.log(`📋 Insertando ${data.auditLogs?.length || 0} logs de auditoría...`);
    for (const item of data.auditLogs || []) {
      await prisma.auditLog.upsert({
        where: { id: item.id },
        update: {},
        create: {
          ...item,
          createdAt: new Date(item.createdAt),
        },
      });
    }

    console.log('🎉 Importación a PostgreSQL finalizada con éxito.');
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
