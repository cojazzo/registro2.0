'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Pencil, ShieldCheck, Eye, User2 } from 'lucide-react'
import { CreateUserModal } from '@/components/admin/CreateUserModal'
import { EditUserModal } from '@/components/admin/EditUserModal'

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  DOCTOR: 'Doctor',
  READ_ONLY: 'Solo Lectura',
}

const ROLE_COLORS: Record<string, React.CSSProperties> = {
  ADMIN: { background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' },
  DOCTOR: { background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' },
  READ_ONLY: { background: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' },
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  ADMIN: ShieldCheck,
  DOCTOR: User2,
  READ_ONLY: Eye,
}

export function UsersTable({ users: initialUsers }: { users: UserRow[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)

  // Re-render triggered by router.refresh() via revalidatePath in server actions
  const users = initialUsers

  return (
    <>
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}

      <div
        style={{
          background: 'white',
          borderRadius: '1rem',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {/* Table toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {users.length} {users.length === 1 ? 'usuario' : 'usuarios'}
          </span>
          <button
            id="create-user-btn"
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1.1rem',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              border: 'none',
              borderRadius: '0.625rem',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
            }}
          >
            <Plus size={16} />
            Nuevo usuario
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Nombre', 'Correo', 'Rol', 'Creado', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '0.75rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => {
                const RoleIcon = ROLE_ICONS[user.role] ?? User2
                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: i < users.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                  >
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontSize: '0.75rem',
                            color: 'white',
                            fontWeight: 700,
                          }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500, color: '#0f172a', fontSize: '0.9rem' }}>
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#475569', fontSize: '0.875rem' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          ...(ROLE_COLORS[user.role] ?? ROLE_COLORS.READ_ONLY),
                        }}
                      >
                        <RoleIcon size={11} />
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                      {format(new Date(user.createdAt), 'd MMM yyyy', { locale: es })}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <button
                        onClick={() => setEditingUser(user)}
                        title="Editar usuario"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.75rem',
                          background: 'rgba(99,102,241,0.08)',
                          border: '1px solid rgba(99,102,241,0.2)',
                          borderRadius: '0.5rem',
                          color: '#818cf8',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                        }}
                      >
                        <Pencil size={13} />
                        Editar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
