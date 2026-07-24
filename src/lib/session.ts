import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export type SessionPayload = {
  userId: string
  role: string
  expiresAt: Date
}

const secretKey = process.env.SESSION_SECRET
if (!secretKey) throw new Error('SESSION_SECRET is not set')
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(payload.expiresAt)
    .sign(encodedKey)
}

export async function decrypt(token: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as { userId: string; role: string; exp: number }
  } catch {
    return null
  }
}

/**
 * Creates a session cookie.
 * @param rememberMe - if true, session lasts 30 days; otherwise 7 days.
 */
export async function createSession(
  userId: string,
  role: string,
  rememberMe = false
) {
  const days = rememberMe ? 30 : 7
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  const token = await encrypt({ userId, role, expiresAt })
  const cookieStore = await cookies()

  cookieStore.set('session', token, {
    httpOnly: true,
    secure: false, // Allow HTTP connections on LAN (192.168.x.x)
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

/** Returns the current session payload, or null if not authenticated. */
export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null
  return decrypt(token)
}
