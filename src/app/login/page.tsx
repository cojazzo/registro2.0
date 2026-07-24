'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '@/app/actions/auth'
import { Stethoscope, Mail, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: '1rem',
      }}
    >
      {/* Background decorative circles */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '-10rem',
          right: '-10rem',
          width: '40rem',
          height: '40rem',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          bottom: '-10rem',
          left: '-10rem',
          width: '35rem',
          height: '35rem',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '26rem',
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '1.25rem',
          padding: '2.5rem',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              marginBottom: '1.25rem',
              boxShadow: '0 8px 20px rgba(99,102,241,0.35)',
            }}
          >
            <Stethoscope size={24} color="white" />
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#f1f5f9',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Expediente Clínico
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#64748b',
              margin: '0.5rem 0 0',
            }}
          >
            Inicia sesión para continuar
          </p>
        </div>

        {/* Error message */}
        {state?.error && (
          <div
            role="alert"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '0.625rem',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#fca5a5',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>⚠</span>
            {state.error}
          </div>
        )}

        {/* Form */}
        <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label
              htmlFor="email"
              style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#94a3b8' }}
            >
              Correo electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#475569',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={state?.fields?.email ?? ''}
                placeholder="doctor@clinica.com"
                style={{
                  width: '100%',
                  padding: '0.6875rem 0.875rem 0.6875rem 2.5rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.625rem',
                  color: '#e2e8f0',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label
              htmlFor="password"
              style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#94a3b8' }}
            >
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#475569',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.6875rem 0.875rem 0.6875rem 2.5rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.625rem',
                  color: '#e2e8f0',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>
          </div>

          {/* Remember me */}
          <label
            htmlFor="rememberMe"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              cursor: 'pointer',
            }}
          >
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              style={{
                width: '1rem',
                height: '1rem',
                accentColor: '#6366f1',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: '0.875rem', color: '#94a3b8', userSelect: 'none' }}>
              Recordarme durante 30 días
            </span>
          </label>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={pending}
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: pending
                ? 'rgba(99,102,241,0.4)'
                : 'linear-gradient(135deg, #3b82f6, #6366f1)',
              border: 'none',
              borderRadius: '0.625rem',
              color: 'white',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: pending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: pending ? 'none' : '0 4px 15px rgba(99,102,241,0.4)',
              transition: 'opacity 0.2s, box-shadow 0.2s',
            }}
          >
            {pending && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
            {pending ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '1.75rem',
            fontSize: '0.75rem',
            color: '#334155',
          }}
        >
          Sistema de uso exclusivo para personal autorizado
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  )
}
