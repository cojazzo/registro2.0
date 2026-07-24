'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'

export type LoginState =
  | { error?: string; fields?: { email?: string } }
  | undefined

export async function login(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''
  const rememberMe = formData.get('rememberMe') === 'on'

  if (!email || !password) {
    return { error: 'Por favor ingresa tu correo y contraseña.', fields: { email } }
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return { error: 'Credenciales incorrectas.', fields: { email } }
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    return { error: 'Credenciales incorrectas.', fields: { email } }
  }

  await createSession(user.id, user.role, rememberMe)
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
