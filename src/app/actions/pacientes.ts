"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

async function generatePatientId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const patientsThisYear = await prisma.patient.findMany({
    where: {
      id: {
        startsWith: `${currentYear}-`
      }
    },
    select: {
      id: true
    }
  });

  let nextNumber = 1;
  if (patientsThisYear.length > 0) {
    const numbers = patientsThisYear
      .map(p => {
        const parts = p.id.split("-");
        if (parts.length === 2) {
          const num = parseInt(parts[1], 10);
          return isNaN(num) ? 0 : num;
        }
        return 0;
      });
    const maxNumber = Math.max(...numbers);
    nextNumber = maxNumber + 1;
  }

  return `${currentYear}-${String(nextNumber).padStart(5, '0')}`;
}

export async function createPatient(formData: FormData) {
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const curp = formData.get("curp") as string || null
  const clinicalId = formData.get("clinicalId") as string || null
  const dobStr = formData.get("dob") as string
  const gender = formData.get("gender") as string
  const phone = formData.get("phone") as string || null
  const email = formData.get("email") as string || null
  const street = formData.get("street") as string || null
  const neighborhood = formData.get("neighborhood") as string || null
  const zipCode = formData.get("zipCode") as string || null
  const city = formData.get("city") as string || null
  const state = formData.get("state") as string || null
  const mainDiagnosis = formData.get("mainDiagnosis") as string || null
  const observations = formData.get("observations") as string || null

  let dob = new Date();
  if (dobStr) {
    dob = new Date(dobStr);
  }

  const id = await generatePatientId();

  // Creación del paciente en Prisma
  const patient = await prisma.patient.create({
    data: {
      id,
      firstName,
      lastName,
      curp: curp === "" ? null : curp,
      clinicalId: clinicalId === "" ? null : clinicalId,
      dob,
      gender,
      phone: phone === "" ? null : phone,
      email: email === "" ? null : email,
      street: street === "" ? null : street,
      neighborhood: neighborhood === "" ? null : neighborhood,
      zipCode: zipCode === "" ? null : zipCode,
      city: city === "" ? null : city,
      state: state === "" ? null : state,
      mainDiagnosis: mainDiagnosis === "" ? null : mainDiagnosis,
      observations: observations === "" ? null : observations
    }
  })

  // Re-validar la lista para mostrar el nuevo paciente y redirigir a su expediente
  revalidatePath("/pacientes")
  redirect(`/pacientes/${patient.id}`)
}
