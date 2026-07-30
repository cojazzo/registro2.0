'use client'

import { useActionState } from 'react'
import { updateUser, deleteUser, type UserFormState } from '@/app/actions/users'
import { X, Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'

const ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'TRABAJO_SOCIAL', label: 'Trabajo Social' },
  { value: 'NUTRICION', label: 'Nutrición' },
  { value: 'PSICOLOGIA', label: 'Psicología' },
  { value: 'ESTUDIANTE', label: 'Estudiante' },
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

type EditableUser = { id: string; name: string; email: string; role: string; titulo: string | null; cedulaProfesional: string | null }

export function EditUserModal({
  user,
  onClose,
}: {
  user: EditableUser
  onClose: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [state, action, pending] = useActionState<UserFormState, FormData>(
    async (s, fd) => {
      const result = await updateUser(s, fd)
      if (result?.success) onClose()
      return result
    },
    undefined
  )

  async function handleDelete() {
    const result = await deleteUser(user.id)
    if (result?.error) {
      setDeleteError(result.error)
    } else {
      onClose()
    }
  }

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
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Editar usuario</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {(state?.error || deleteError) && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', color: '#fca5a5', fontSize: '0.875rem' }}>
            {state?.error ?? deleteError}
          </div>
        )}

        <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="hidden" name="id" value={user.id} />
          <div>
            <label style={labelStyle} htmlFor="edit-name">Nombre completo</label>
            <input id="edit-name" name="name" required defaultValue={user.name} style={inputStyle} />
          </div>
          <div>
            <label style={{ ...labelStyle, color: '#475569' }}>Correo (no editable)</label>
            <input disabled value={user.email} style={{ ...inputStyle, opacity: 0.5 }} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="edit-role">Rol</label>
            <select id="edit-role" name="role" defaultValue={user.role} style={{ ...inputStyle, cursor: 'pointer' }}>
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle} htmlFor="edit-titulo">Título Profesional</label>
              <input id="edit-titulo" name="titulo" defaultValue={user.titulo ?? ''} style={inputStyle} placeholder="Ej. Lic. Trabajo Social" />
            </div>
            <div>
              <label style={labelStyle} htmlFor="edit-cedula">Cédula Profesional</label>
              <input id="edit-cedula" name="cedulaProfesional" defaultValue={user.cedulaProfesional ?? ''} style={inputStyle} placeholder="Ej. 12345678" />
            </div>
          </div>
          <div>
            <label style={labelStyle} htmlFor="edit-password">Nueva contraseña <span style={{ color: '#475569' }}>(dejar en blanco para no cambiar)</span></label>
            <input id="edit-password" name="password" type="password" style={inputStyle} placeholder="••••••••" />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={pending}
              style={{
                flex: 1,
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
              {pending ? 'Guardando…' : 'Guardar cambios'}
            </button>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                style={{
                  padding: '0.7rem 1rem',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '0.5rem',
                  color: '#f87171',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.875rem',
                }}
              >
                <Trash2 size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  padding: '0.7rem 1rem',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                ¿Confirmar?
              </button>
            )}
          </div>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
