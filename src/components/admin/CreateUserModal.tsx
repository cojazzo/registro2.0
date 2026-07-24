'use client'

import { useActionState } from 'react'
import { createUser, type UserFormState } from '@/app/actions/users'
import { X, Loader2 } from 'lucide-react'

const ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'READ_ONLY', label: 'Solo Lectura' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.875rem',
  background: '#0f172a',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.5rem',
  color: '#e2e8f0',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 500,
  color: '#94a3b8',
  marginBottom: '0.35rem',
}

export function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState<UserFormState, FormData>(
    async (s, fd) => {
      const result = await createUser(s, fd)
      if (result?.success) onClose()
      return result
    },
    undefined
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#1e293b',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '1rem',
          padding: '1.75rem',
          width: '100%',
          maxWidth: '28rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          color: '#e2e8f0',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Crear usuario</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {state?.error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', color: '#fca5a5', fontSize: '0.875rem' }}>
            {state.error}
          </div>
        )}

        <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle} htmlFor="create-name">Nombre completo</label>
            <input id="create-name" name="name" required style={inputStyle} placeholder="Dr. Juan Pérez" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="create-email">Correo electrónico</label>
            <input id="create-email" name="email" type="email" required style={inputStyle} placeholder="juan@clinica.com" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="create-password">Contraseña</label>
            <input id="create-password" name="password" type="password" required style={inputStyle} placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="create-role">Rol</label>
            <select id="create-role" name="role" style={{ ...inputStyle, cursor: 'pointer' }}>
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            style={{
              marginTop: '0.5rem',
              padding: '0.7rem',
              background: pending ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: pending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {pending && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {pending ? 'Creando…' : 'Crear usuario'}
          </button>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
