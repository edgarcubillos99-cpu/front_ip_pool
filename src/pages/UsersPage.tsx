import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, Plus, Shield, UserCog, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/api/client'
import { createUser, deactivateUser, updateUser } from '@/api/endpoints'
import { queryKeys, useUsers } from '@/api/queries'
import { Card, EmptyState, ErrorState, PageHeader, Spinner } from '@/components/ui'
import { useSession } from '@/lib/auth'
import { cn, formatDateTime } from '@/lib/utils'
import type { AppUser, CreateUserRequest, UserRole } from '@/types/api'

export function UsersPage() {
  const { data, isLoading, isError, error, refetch } = useUsers()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AppUser | null>(null)

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Crea cuentas y decide quién entra solo con contraseña y quién necesita código por correo."
        actions={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            <Plus className="size-4" /> Nuevo usuario
          </button>
        }
      />

      {isError && !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs tracking-wide text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Acceso</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Creado</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading
                ? Array.from({ length: 4 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-4 w-48 animate-pulse rounded bg-slate-800" />
                      </td>
                    </tr>
                  ))
                : data?.users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-medium text-slate-100">{u.username}</td>
                      <td className="px-4 py-2.5 text-slate-400">{u.email || '—'}</td>
                      <td className="px-4 py-2.5">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-2.5">
                        {u.mfa_enabled ? (
                          <span className="inline-flex items-center gap-1 text-sky-300">
                            <Mail className="size-3.5" /> MFA correo
                          </span>
                        ) : (
                          <span className="text-slate-400">Solo contraseña</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={u.active ? 'text-emerald-300' : 'text-red-300'}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">
                        {formatDateTime(u.created_at)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setEditing(u)}
                          className="text-xs font-medium text-sky-400 hover:text-sky-300"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && data?.users.length === 0 && (
            <EmptyState icon={<Users className="size-8" />} title="No hay usuarios" />
          )}
        </Card>
      )}

      {creating && <UserDialog mode="create" onClose={() => setCreating(false)} />}
      {editing && <UserDialog mode="edit" user={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1',
        role === 'admin'
          ? 'bg-violet-500/10 text-violet-300 ring-violet-500/30'
          : 'bg-slate-500/10 text-slate-300 ring-slate-500/30',
      )}
    >
      {role === 'admin' ? <Shield className="size-3" /> : <UserCog className="size-3" />}
      {role === 'admin' ? 'Admin' : 'Operador'}
    </span>
  )
}

function UserDialog({
  mode,
  user,
  onClose,
}: {
  mode: 'create' | 'edit'
  user?: AppUser
  onClose: () => void
}) {
  const session = useSession()
  const queryClient = useQueryClient()
  const [username, setUsername] = useState(user?.username ?? '')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [role, setRole] = useState<UserRole>(user?.role ?? 'operator')
  const [mfa, setMfa] = useState(user?.mfa_enabled ?? false)
  const [active, setActive] = useState(user?.active ?? true)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.users })

  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })
  const updateMut = useMutation({
    mutationFn: (body: Parameters<typeof updateUser>[1]) => updateUser(user!.id, body),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })
  const deactivateMut = useMutation({
    mutationFn: () => deactivateUser(user!.id),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const pending = createMut.isPending || updateMut.isPending || deactivateMut.isPending
  const error = createMut.error ?? updateMut.error ?? deactivateMut.error
  const isSelf = session?.username === user?.username

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (mode === 'create') {
      const body: CreateUserRequest = {
        username: username.trim(),
        password,
        role,
        mfa_enabled: mfa,
      }
      if (email.trim()) body.email = email.trim()
      createMut.mutate(body)
      return
    }
    updateMut.mutate({
      email: email.trim(),
      role,
      mfa_enabled: mfa,
      active,
      ...(password ? { password } : {}),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-white">
          {mode === 'create' ? 'Nuevo usuario' : `Editar ${user?.username}`}
        </h2>

        {mode === 'create' && (
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">Usuario</span>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputCls}
              autoComplete="off"
            />
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-400">
            Contraseña {mode === 'edit' && <span className="text-slate-600">(vacío = no cambiar)</span>}
          </span>
          <input
            type="password"
            required={mode === 'create'}
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            autoComplete="new-password"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-400">Correo {mfa && '(requerido para MFA)'}</span>
          <input
            type="email"
            required={mfa}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-400">Rol</span>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={inputCls}>
            <option value="operator">Operador — ve el dashboard</option>
            <option value="admin">Admin — también gestiona usuarios</option>
          </select>
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={mfa}
            onChange={(e) => setMfa(e.target.checked)}
            className="mt-0.5 accent-sky-500"
          />
          <span>
            <strong className="text-slate-100">Exigir MFA por correo</strong>
            <span className="mt-0.5 block text-xs text-slate-500">
              Tras la contraseña recibirá un código de 6 dígitos. Si está apagado, entra solo con usuario y
              contraseña.
            </span>
          </span>
        </label>

        {mode === 'edit' && (
          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={active}
              disabled={isSelf}
              onChange={(e) => setActive(e.target.checked)}
              className="accent-emerald-500"
            />
            Usuario activo
          </label>
        )}

        {error && (
          <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {getErrorMessage(error)}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          {mode === 'edit' && user?.active && !isSelf && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm(`¿Desactivar a ${user.username}?`)) deactivateMut.mutate()
              }}
              className="mr-auto text-xs text-red-400 hover:text-red-300"
            >
              Desactivar
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {pending && <Spinner />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none'
