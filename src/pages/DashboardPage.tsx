import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  FlaskConical,
  PlusCircle,
  RadioTower,
  Ticket,
  UserCheck,
  XCircle,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useLatestIPs, useStats, useTowers } from '@/api/queries'
import { StatusBadge } from '@/components/StatusBadge'
import { Card, CardHeader, EmptyState, ErrorState, Mono, PageHeader, ProgressBar, Skeleton } from '@/components/ui'
import { cn, formatDateTime, formatNumber, formatRelative, percent } from '@/lib/utils'

export function DashboardPage() {
  const stats = useStats()
  const s = stats.data

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          s ? (
            <>
              Actualizado {formatRelative(s.generated_at)} · última IP creada {formatRelative(s.last_created_at)}
            </>
          ) : (
            'Estado global del pool de IPs'
          )
        }
        actions={
          s?.dry_run && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
              <FlaskConical className="size-3.5" /> DRY RUN: no se crean IPs en MikroTik
            </span>
          )
        }
      />

      {stats.isError && !s ? (
        <ErrorState error={stats.error} onRetry={() => stats.refetch()} className="mb-6" />
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Kpi label="Total en pool" value={s?.total} icon={<Database />} tone="slate" to="/ips" />
          <Kpi
            label="Disponibles"
            value={s?.available}
            icon={<CheckCircle2 />}
            tone="emerald"
            to="/ips?status=available"
            hint={s && `${percent(s.available, s.total)}% del pool`}
          />
          <Kpi
            label="Asignadas"
            value={s?.assigned}
            icon={<UserCheck />}
            tone="blue"
            to="/ips?status=assigned"
            hint={s && `${percent(s.assigned, s.total)}% del pool`}
          />
          <Kpi label="Fallidas" value={s?.failed} icon={<XCircle />} tone="red" to="/ips?status=failed" />
          <Kpi label="Creadas 24h" value={s?.created_last_24h} icon={<PlusCircle />} tone="sky" />
          <Kpi
            label="Torres stock bajo"
            value={s?.towers_low_stock}
            icon={<AlertTriangle />}
            tone={s && s.towers_low_stock > 0 ? 'amber' : 'slate'}
            to="/towers?low=1"
            hint={s && `${s.towers_empty} sin stock · ${s.towers_active} activas`}
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <PoolDistribution />
          <LowStockTowers />
        </div>
        <LatestFeed />
      </div>
    </>
  )
}

const TONES = {
  slate: 'text-slate-300 bg-slate-500/10 ring-slate-500/30',
  emerald: 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/30',
  blue: 'text-blue-300 bg-blue-500/10 ring-blue-500/30',
  red: 'text-red-300 bg-red-500/10 ring-red-500/30',
  sky: 'text-sky-300 bg-sky-500/10 ring-sky-500/30',
  amber: 'text-amber-300 bg-amber-500/10 ring-amber-500/30',
}

function Kpi({
  label,
  value,
  icon,
  tone,
  hint,
  to,
}: {
  label: string
  value: number | undefined
  icon: ReactNode
  tone: keyof typeof TONES
  hint?: ReactNode
  to?: string
}) {
  const body = (
    <Card className={cn('h-full p-4 transition-colors', to && 'hover:border-slate-700 hover:bg-slate-900')}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <span className={cn('rounded-md p-1.5 ring-1 [&>svg]:size-4', TONES[tone])}>{icon}</span>
      </div>
      {value === undefined ? (
        <Skeleton className="mt-3 h-8 w-20" />
      ) : (
        <p className="mt-2 text-3xl font-semibold tracking-tight text-white tabular-nums">{formatNumber(value)}</p>
      )}
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </Card>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

function PoolDistribution() {
  const { data: s } = useStats()
  if (!s) return <Skeleton className="h-32 w-full rounded-xl" />

  const segments = [
    { label: 'Disponibles', value: s.available, className: 'bg-emerald-500' },
    { label: 'Asignadas', value: s.assigned, className: 'bg-blue-500' },
    { label: 'Fallidas', value: s.failed, className: 'bg-red-500' },
  ]

  return (
    <Card>
      <CardHeader
        title="Distribución del pool"
        description={`Mínimo por torre: ${s.min_available} · lote de relleno: ${s.refill_batch}`}
        icon={<Database className="size-4" />}
      />
      <div className="p-4">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className={cn('h-full transition-[width] duration-500', seg.className)}
              style={{ width: `${percent(seg.value, s.total)}%` }}
              title={`${seg.label}: ${seg.value}`}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
          {segments.map((seg) => (
            <span key={seg.label} className="flex items-center gap-2 text-slate-400">
              <span className={cn('size-2.5 rounded-sm', seg.className)} />
              {seg.label}
              <strong className="text-slate-200 tabular-nums">{formatNumber(seg.value)}</strong>
              <span className="text-slate-500">({percent(seg.value, s.total)}%)</span>
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}

function LowStockTowers() {
  const { data, isLoading, isError, error, refetch } = useTowers()
  const low = (data?.towers ?? []).filter((t) => t.low_stock).slice(0, 8)

  return (
    <Card>
      <CardHeader
        title="Torres con stock bajo"
        description={data && `Disponibles ≤ ${data.min_available}`}
        icon={<RadioTower className="size-4" />}
        actions={
          <Link to="/towers" className="text-xs font-medium text-sky-400 hover:text-sky-300">
            Ver todas →
          </Link>
        }
      />
      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} className="m-4" />
      ) : low.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="size-8 text-emerald-500/60" />}
          title="Todas las torres tienen stock suficiente"
        />
      ) : (
        <ul className="divide-y divide-slate-800">
          {low.map((t) => (
            <li key={t.name}>
              <Link
                to={`/ips?torre=${encodeURIComponent(t.name)}`}
                className="flex items-center gap-4 px-4 py-2.5 hover:bg-slate-800/40"
              >
                <span
                  className={cn('size-2 shrink-0 rounded-full', t.available === 0 ? 'bg-red-500' : 'bg-amber-400')}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{t.name}</p>
                  <Mono className="text-xs text-slate-500">{t.ip}</Mono>
                </div>
                <div className="w-28 sm:w-40">
                  <ProgressBar
                    value={percent(t.available, t.total)}
                    barClassName={t.available === 0 ? 'bg-red-500' : 'bg-amber-400'}
                  />
                </div>
                <span className="w-16 text-right text-sm text-slate-300 tabular-nums">
                  {t.available}/{t.total}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function LatestFeed() {
  const { data, isLoading, isError, error, refetch } = useLatestIPs(10)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Últimas asignadas" icon={<Ticket className="size-4" />} actions={
          <Link to="/assigned" className="text-xs font-medium text-sky-400 hover:text-sky-300">Ver →</Link>
        } />
        <FeedBody isLoading={isLoading} isError={isError} error={error} onRetry={refetch} empty={data?.assigned.length === 0}>
          {data?.assigned.map((a) => (
            <li key={a.id} className="px-4 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <Mono className="text-slate-100">{a.ip_address}</Mono>
                <span className="text-xs text-blue-300">#{a.ticket_id}</span>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="truncate">{a.device_name}</span>
                <span className="flex shrink-0 items-center gap-1" title={formatDateTime(a.assigned_at)}>
                  <Clock className="size-3" /> {formatRelative(a.assigned_at)}
                </span>
              </div>
            </li>
          ))}
        </FeedBody>
      </Card>

      <Card>
        <CardHeader title="Últimas creadas" icon={<PlusCircle className="size-4" />} actions={
          <Link to="/ips" className="text-xs font-medium text-sky-400 hover:text-sky-300">Ver →</Link>
        } />
        <FeedBody isLoading={isLoading} isError={isError} error={error} onRetry={refetch} empty={data?.created.length === 0}>
          {data?.created.map((ip) => (
            <li key={ip.id} className="px-4 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <Mono className="text-slate-100">{ip.ip_address}</Mono>
                <StatusBadge status={ip.status} />
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="truncate">{ip.device_name}</span>
                <span className="flex shrink-0 items-center gap-1" title={formatDateTime(ip.created_at)}>
                  <Clock className="size-3" /> {formatRelative(ip.created_at)}
                </span>
              </div>
            </li>
          ))}
        </FeedBody>
      </Card>
    </div>
  )
}

function FeedBody({
  isLoading,
  isError,
  error,
  onRetry,
  empty,
  children,
}: {
  isLoading: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
  empty: boolean
  children: ReactNode
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  }
  if (isError) return <ErrorState error={error} onRetry={onRetry} className="m-4" />
  if (empty) return <EmptyState title="Sin registros todavía" />
  return <ul className="max-h-[420px] divide-y divide-slate-800 overflow-y-auto">{children}</ul>
}
