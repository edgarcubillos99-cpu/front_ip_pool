import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, Network, User } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { getErrorMessage } from '@/api/client'
import { login } from '@/api/endpoints'
import { Spinner } from '@/components/ui'
import { config } from '@/config'
import { setSession, useSession } from '@/lib/auth'

export function LoginPage() {
  const session = useSession()
  const location = useLocation()
  const queryClient = useQueryClient()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data, vars) => {
      queryClient.clear()
      // Al existir sesión, el <Navigate> de abajo redirige a la ruta original.
      setSession(data.access_token, vars.username, data.expires_in)
    },
  })

  if (session) return <Navigate to={from} replace />

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate({ username: username.trim(), password })
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
          <p className="mt-1 text-sm text-slate-400">Panel de operaciones de red</p>
        </div>

        <form
          onSubmit={onSubmit}
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

          {mutation.isError && (
            <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {getErrorMessage(mutation.error)}
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending || !username || !password}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending && <Spinner />}
            Iniciar sesión
          </button>
        </form>

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
}: {
  label: string
  icon: ReactNode
  value: string
  onChange: (v: string) => void
  type?: string
  autoComplete?: string
  autoFocus?: boolean
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
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pr-3 pl-9 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
        />
      </div>
    </label>
  )
}
