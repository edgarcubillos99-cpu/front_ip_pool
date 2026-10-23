import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Lock, Mail, Network, User } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { getErrorMessage } from '@/api/client'
import { login, resendMFA, verifyMFA } from '@/api/endpoints'
import { Spinner } from '@/components/ui'
import { config } from '@/config'
import { setSession, useSession } from '@/lib/auth'
import { isMFAChallenge, type MFAChallengeResponse, type TokenResponse } from '@/types/api'

export function LoginPage() {
  const session = useSession()
  const location = useLocation()
  const queryClient = useQueryClient()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [challenge, setChallenge] = useState<MFAChallengeResponse | null>(null)

  const startSession = (data: TokenResponse) => {
    queryClient.clear()
    setSession(data.access_token, data.username || username.trim(), data.role, data.expires_in)
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (isMFAChallenge(data)) {
        setChallenge(data)
        setCode('')
        return
      }
      startSession(data)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (value: string) => verifyMFA(challenge!.mfa_token, value),
    onSuccess: (data) => {
      if (isMFAChallenge(data)) {
        setChallenge(data)
        return
      }
      startSession(data)
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => resendMFA(challenge!.mfa_token),
    onSuccess: (data) => {
      if (isMFAChallenge(data)) {
        setChallenge(data)
        setCode('')
      }
    },
  })

  if (session) return <Navigate to={from} replace />

  const pending = loginMutation.isPending || verifyMutation.isPending
  const error = verifyMutation.error ?? resendMutation.error ?? loginMutation.error

  const onCredentials = (e: FormEvent) => {
    e.preventDefault()
    loginMutation.mutate({ username: username.trim(), password })
  }

  const onVerify = (e: FormEvent) => {
    e.preventDefault()
    verifyMutation.mutate(code.trim())
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.15),transparent_60%)]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-500/40">
            <Network className="size-6 text-sky-400" />
          </div>
          <h1 className="text-xl font-semibold text-white">IP Pool · Torres</h1>
          <p className="mt-1 text-sm text-slate-400">
            {challenge ? 'Verificación en dos pasos' : 'Panel de operaciones de red'}
          </p>
        </div>

        {challenge ? (
          <form
            onSubmit={onVerify}
            className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur"
          >
            <p className="text-sm text-slate-300">
              Enviamos un código de 6 dígitos a{' '}
              <span className="font-mono text-sky-300">{challenge.email_hint}</span>
            </p>
            <Field
              label="Código"
              icon={<Mail className="size-4" />}
              value={code}
              onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              autoComplete="one-time-code"
              inputMode="numeric"
              autoFocus
            />
            {error && (
              <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                {getErrorMessage(error)}
              </p>
            )}
            {resendMutation.isSuccess && !verifyMutation.isError && (
              <p className="text-xs text-emerald-300">Código reenviado.</p>
            )}
            <button
              type="submit"
              disabled={pending || code.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifyMutation.isPending && <Spinner />}
              Verificar
            </button>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setChallenge(null)
                  setCode('')
                  loginMutation.reset()
                  verifyMutation.reset()
                  resendMutation.reset()
                }}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200"
              >
                <ArrowLeft className="size-3.5" /> Volver
              </button>
              <button
                type="button"
                disabled={resendMutation.isPending}
                onClick={() => resendMutation.mutate()}
                className="text-sky-400 hover:text-sky-300 disabled:opacity-50"
              >
                {resendMutation.isPending ? 'Reenviando…' : 'Reenviar código'}
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={onCredentials}
            className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur"
          >
            <Field
              label="Usuario"
              icon={<User className="size-4" />}
              value={username}
              onChange={setUsername}
              autoComplete="username"
              autoFocus
            />
            <Field
              label="Contraseña"
              icon={<Lock className="size-4" />}
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            {loginMutation.isError && (
              <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                {getErrorMessage(loginMutation.error)}
              </p>
            )}
            <button
              type="submit"
              disabled={pending || !username || !password}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loginMutation.isPending && <Spinner />}
              Iniciar sesión
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-[11px] text-slate-500">
          API: <span className="font-mono">{config.apiUrl}</span>
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  icon,
  value,
  onChange,
  type = 'text',
  autoComplete,
  autoFocus,
  inputMode,
}: {
  label: string
  icon: ReactNode
  value: string
  onChange: (v: string) => void
  type?: string
  autoComplete?: string
  autoFocus?: boolean
  inputMode?: 'numeric' | 'text'
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-300">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          inputMode={inputMode}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pr-3 pl-9 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
        />
      </div>
    </label>
  )
}
