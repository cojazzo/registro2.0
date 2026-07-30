'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    throw new Error('No autorizado')
  }
}

export type UserFormState =
  | { error?: string; success?: boolean }
  | undefined

export async function createUser(
  _state: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireAdmin()

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''
  const role = (formData.get('role') as string | null) ?? 'READ_ONLY'
  const titulo = (formData.get('titulo') as string | null)?.trim() || null
  const cedulaProfesional = (formData.get('cedulaProfesional') as string | null)?.trim() || null

  if (!name || !email || !password) {
    return { error: 'Todos los campos son obligatorios.' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'Ya existe un usuario con ese correo.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { name, email, passwordHash, role, titulo, cedulaProfesional } })

  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function updateUser(
  _state: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireAdmin()

  const id = formData.get('id') as string
  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const role = (formData.get('role') as string | null) ?? 'READ_ONLY'
  const newPassword = (formData.get('password') as string | null)?.trim()
  const titulo = (formData.get('titulo') as string | null)?.trim() || null
  const cedulaProfesional = (formData.get('cedulaProfesional') as string | null)?.trim() || null

  if (!id || !name) {
    return { error: 'Datos incompletos.' }
  }

  const data: { name: string; role: string; passwordHash?: string; titulo: string | null; cedulaProfesional: string | null } = { name, role, titulo, cedulaProfesional }
  if (newPassword) {
    data.passwordHash = await bcrypt.hash(newPassword, 12)
  }

  await prisma.user.update({ where: { id }, data })

  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function deleteUser(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const session = await getSession()

  if (session?.userId === id) {
    return { error: 'No puedes eliminar tu propio usuario.' }
  }

  await prisma.user.delete({ where: { id } })
  revalidatePath('/admin/usuarios')
  return {}
}
