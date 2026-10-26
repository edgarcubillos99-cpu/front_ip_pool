import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  RadioTower,
  RefreshCw,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { config } from '@/config'
import { clearSession, useSession } from '@/lib/auth'
import { REFRESH_OPTIONS, setRefreshInterval, useRefreshIntervalRaw } from '@/lib/refresh'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/ips', label: 'Pool de IPs', icon: Network },
  { to: '/assigned', label: 'Asignaciones', icon: ClipboardList },
  { to: '/towers', label: 'Torres', icon: RadioTower },
  { to: '/runs', label: 'Ejecuciones (Logs)', icon: Activity },
]

export function Layout() {
  const [open, setOpen] = useState(false)
  const session = useSession()
  const nav = session?.role === 'admin' ? [...NAV, { to: '/users', label: 'Usuarios', icon: Users }] : NAV

  return (
    <div className="flex min-h-screen">
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/15 ring-1 ring-sky-500/40">
              <Network className="size-4.5 text-sky-400" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">IP Pool</p>
              <p className="text-[11px] text-slate-500">Torres MikroTik · NOC</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded p-1 text-slate-400 hover:text-white lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4 text-[11px] text-slate-500">
          <p className="truncate" title={config.apiUrl}>
            API: <span className="font-mono">{config.apiUrl}</span>
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Header onMenu={() => setOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function Header({ onMenu }: { onMenu: () => void }) {
  const session = useSession()
  const queryClient = useQueryClient()
  const fetching = useIsFetching() > 0
  const interval = useRefreshIntervalRaw()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        className="rounded p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
        onClick={onMenu}
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
          <span className="hidden pl-1.5 text-xs text-slate-500 sm:inline">Auto-refresco</span>
          <select
            value={interval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="rounded-md bg-slate-800 px-1.5 py-1 text-xs text-slate-200 focus:outline-none"
            aria-label="Intervalo de auto-refresco"
          >
            {REFRESH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries()}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Refrescar ahora"
            aria-label="Refrescar ahora"
          >
            <RefreshCw className={cn('size-4', fetching && 'animate-spin text-sky-400')} />
          </button>
        </div>

        <div className="hidden text-right text-xs sm:block">
          <p className="font-medium text-slate-200">
            {session?.username}
            {session?.role === 'admin' && (
              <span className="ml-1.5 text-[10px] font-normal text-violet-300">admin</span>
            )}
          </p>
          <p className="text-slate-500">
            Sesión hasta{' '}
            {session &&
              new Date(session.expiresAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearSession()
            queryClient.clear()
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-red-900 hover:bg-red-950/40 hover:text-red-300"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  )
}
