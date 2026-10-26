import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FlaskConical,
  MinusCircle,
  Network,
  Play,
  PlusCircle,
  RadioTower,
  RefreshCw,
  Server,
  X,
  XCircle,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useRunDetail, useRuns } from '@/api/queries'
import { DataTable, type Column } from '@/components/DataTable'
import { SearchInput } from '@/components/Filters'
import { Pagination } from '@/components/Pagination'
import { Card, CardHeader, EmptyState, ErrorState, Mono, PageHeader, Skeleton } from '@/components/ui'
import { useQueryParams } from '@/lib/useQueryParams'
import {
  cn,
  formatDateTime,
  formatDurationMs,
  formatNumber,
  formatRelative,
  formatSpanDuration,
} from '@/lib/utils'
import type { RunDetail, RunKind, RunSummary, RunTowerReport, TowerRunStatus } from '@/types/api'

const KIND_TABS: { value: '' | RunKind; label: string; active: string }[] = [
  { value: '', label: 'Todos', active: 'bg-slate-700 text-white' },
  {
    value: 'bootstrap',
    label: 'Bootstrap',
    active: 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40',
  },
  {
    value: 'ciclo',
    label: 'Ciclos periódicos',
    active: 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40',
  },
  {
    value: 'refill',
    label: 'Refills puntuales',
    active: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40',
  },
]

const KIND_STYLE: Record<string, { label: string; className: string; icon: typeof Play }> = {
  bootstrap: {
    label: 'Bootstrap',
    className: 'bg-violet-500/10 text-violet-300 ring-violet-500/30',
    icon: Play,
  },
  ciclo: {
    label: 'Ciclo',
    className: 'bg-sky-500/10 text-sky-300 ring-sky-500/30',
    icon: RefreshCw,
  },
  refill: {
    label: 'Refill',
    className: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
    icon: Zap,
  },
}

export function RunKindBadge({ kind, dryRun }: { kind: string; dryRun?: boolean }) {
  const s = KIND_STYLE[kind] ?? {
    label: kind,
    className: 'bg-slate-500/10 text-slate-300 ring-slate-500/30',
    icon: Activity,
  }
  const Icon = s.icon
  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
          s.className,
        )}
      >
        <Icon className="size-3" />
        {s.label}
      </span>
      {dryRun && (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-amber-500/30"
          title="Ejecutado en modo Dry Run (sin cambios en MikroTik)"
        >
          <FlaskConical className="size-3" />
          Dry
        </span>
      )}
    </div>
  )
}

const TOWER_STATUS_STYLE: Record<
  string,
  { label: string; className: string; dot: string; icon: typeof CheckCircle2 }
> = {
  creada: {
    label: 'Con altas',
    className: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
    dot: 'bg-emerald-400',
    icon: CheckCircle2,
  },
  sin_cambios: {
    label: 'Sin cambios',
    className: 'bg-slate-500/10 text-slate-300 ring-slate-500/30',
    dot: 'bg-slate-400',
    icon: MinusCircle,
  },
  fallida: {
    label: 'Fallida',
    className: 'bg-red-500/10 text-red-300 ring-red-500/30',
    dot: 'bg-red-400',
    icon: XCircle,
  },
}

function TowerRunStatusBadge({ status }: { status: TowerRunStatus }) {
  const s = TOWER_STATUS_STYLE[status] ?? {
    label: status || 'fallida',
    className: 'bg-red-500/10 text-red-300 ring-red-500/30',
    dot: 'bg-red-400',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        s.className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

type Key = 'tipo' | 'size' | 'run'

export function RunsPage() {
  const { get, getNumber, update } = useQueryParams<Key>()
  const rawKind = get('tipo')
  const tipo = KIND_TABS.some((t) => t.value === rawKind) ? (rawKind as '' | RunKind) : ''
  const page = getNumber('page', 1)
  const pageSize = getNumber('size', 25)
  const selectedRunId = getNumber('run', 0) || null

  const { data, isLoading, isFetching, isError, error, refetch } = useRuns({
    tipo: tipo || undefined,
    page,
    page_size: pageSize,
  })

  const latestRun = data?.items[0]

  const columns: Column<RunSummary>[] = useMemo(
    () => [
      {
        key: 'id',
        header: 'Run',
        cell: (r) => (
          <button
            type="button"
            onClick={() => update({ run: r.id, page })}
            className="font-mono text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline"
          >
            #{r.id}
          </button>
        ),
      },
      {
        key: 'tipo',
        header: 'Tipo',
        cell: (r) => <RunKindBadge kind={r.tipo} dryRun={r.dry_run} />,
      },
      {
        key: 'iniciado',
        header: 'Iniciado',
        cell: (r) => (
          <div>
            <p className="text-slate-200">{formatDateTime(r.iniciado)}</p>
            <p className="text-xs text-slate-500">{formatRelative(r.iniciado)}</p>
          </div>
        ),
      },
      {
        key: 'duracion',
        header: 'Duración',
        cell: (r) => (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 tabular-nums">
            <Clock className="size-3.5 text-slate-500" />
            {formatSpanDuration(r.iniciado, r.terminado)}
          </span>
        ),
      },
      {
        key: 'revisadas',
        header: 'Torres rev.',
        className: 'text-right',
        cell: (r) => <span className="font-medium text-slate-200 tabular-nums">{formatNumber(r.torres_revisadas)}</span>,
      },
      {
        key: 'creadas',
        header: 'IPs creadas',
        className: 'text-right',
        cell: (r) =>
          r.ips_creadas > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30 tabular-nums">
              +{formatNumber(r.ips_creadas)}
            </span>
          ) : (
            <span className="text-slate-500 tabular-nums">0</span>
          ),
      },
      {
        key: 'resumen_torres',
        header: 'Resultado en torres',
        cell: (r) => (
          <div className="flex items-center gap-2 text-xs tabular-nums">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5',
                r.torres_con_altas > 0 ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-500',
              )}
              title="Torres con altas"
            >
              <CheckCircle2 className="size-3.5" /> {r.torres_con_altas}
            </span>
            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-slate-400" title="Torres sin cambios">
              <MinusCircle className="size-3.5 text-slate-500" /> {r.torres_sin_cambios}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5',
                r.torres_fallidas > 0
                  ? 'bg-red-500/15 font-semibold text-red-300 ring-1 ring-red-500/30'
                  : 'text-slate-500',
              )}
              title="Torres fallidas"
            >
              <XCircle className="size-3.5" /> {r.torres_fallidas}
            </span>
          </div>
        ),
      },
      {
        key: 'router',
        header: 'En router / Saltadas',
        className: 'text-right',
        cell: (r) => (
          <span className="text-xs text-slate-400 tabular-nums" title="IPs /30 ya en router / saltadas por existir">
            {formatNumber(r.ips_que_ya_existian_en_router)} /{' '}
            <span className={r.ips_saltadas_porque_existian > 0 ? 'text-amber-300' : 'text-slate-500'}>
              {formatNumber(r.ips_saltadas_porque_existian)}
            </span>
          </span>
        ),
      },
      {
        key: 'motivos',
        header: 'Motivos / Interfaces',
        cell: (r) => {
          const reasons = Object.entries(r.fallos_por_motivo ?? {})
          const ifaces = Object.entries(r.ips_creadas_por_interfaz ?? {})
          if (reasons.length > 0) {
            const [firstReason, count] = reasons[0]
            return (
              <div className="max-w-xs truncate text-xs text-red-300" title={reasons.map(([k, v]) => `${k}: ${v}`).join(' · ')}>
                <AlertTriangle className="mr-1 inline size-3.5 text-red-400" />
                {firstReason} ({count}){reasons.length > 1 && ` +${reasons.length - 1}`}
              </div>
            )
          }
          if (ifaces.length > 0) {
            return (
              <div className="flex flex-wrap gap-1">
                {ifaces.slice(0, 2).map(([iface, cnt]) => (
                  <span
                    key={iface}
                    className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300"
                  >
                    {iface}: +{cnt}
                  </span>
                ))}
                {ifaces.length > 2 && <span className="text-xs text-slate-500">+{ifaces.length - 2}</span>}
              </div>
            )
          }
          return <span className="text-xs text-slate-600">—</span>
        },
      },
      {
        key: 'actions',
        header: '',
        className: 'text-right',
        cell: (r) => (
          <button
            type="button"
            onClick={() => update({ run: r.id, page })}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-300"
          >
            Ver log
            <ChevronRight className="size-3.5" />
          </button>
        ),
      },
    ],
    [page, update],
  )

  return (
    <>
      <PageHeader
        title="Historial de ejecuciones (Runs)"
        description="Informes detallados de cada pasada del pool worker: bootstrap inicial, ciclos periódicos y refills por torre."
      />

      {latestRun && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard
            label="Última ejecución"
            value={`#${latestRun.id}`}
            sub={`${formatRelative(latestRun.iniciado)} · ${formatSpanDuration(latestRun.iniciado, latestRun.terminado)}`}
            badge={<RunKindBadge kind={latestRun.tipo} dryRun={latestRun.dry_run} />}
            onClick={() => update({ run: latestRun.id, page })}
          />
          <SummaryCard
            label="Torres revisadas (últ. run)"
            value={formatNumber(latestRun.torres_revisadas)}
            sub={`${latestRun.torres_con_altas} con altas · ${latestRun.torres_sin_cambios} sin cambios`}
            icon={<RadioTower className="size-4 text-sky-400" />}
          />
          <SummaryCard
            label="IPs creadas (últ. run)"
            value={`+${formatNumber(latestRun.ips_creadas)}`}
            sub={`${formatNumber(latestRun.ips_que_ya_existian_en_router)} /30 previas en routers`}
            icon={<PlusCircle className="size-4 text-emerald-400" />}
            valueClassName={latestRun.ips_creadas > 0 ? 'text-emerald-400' : undefined}
          />
          <SummaryCard
            label="Torres fallidas (últ. run)"
            value={formatNumber(latestRun.torres_fallidas)}
            sub={
              latestRun.torres_fallidas > 0
                ? Object.keys(latestRun.fallos_por_motivo ?? {})[0] ?? 'Revisa el log para ver el detalle'
                : 'Sin errores reportados'
            }
            icon={
              latestRun.torres_fallidas > 0 ? (
                <AlertTriangle className="size-4 text-red-400" />
              ) : (
                <CheckCircle2 className="size-4 text-emerald-400" />
              )
            }
            valueClassName={latestRun.torres_fallidas > 0 ? 'text-red-400' : undefined}
            onClick={latestRun.torres_fallidas > 0 ? () => update({ run: latestRun.id, page }) : undefined}
          />
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
          <div className="flex flex-wrap gap-1 rounded-lg bg-slate-950/60 p-1">
            {KIND_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => update({ tipo: t.value, run: null })}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  tipo === t.value ? t.active : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {data && (
            <span className="text-xs text-slate-400">
              Total registrados: <strong className="text-slate-200 tabular-nums">{formatNumber(data.total)}</strong>
            </span>
          )}
        </div>

        {isError && !data ? (
          <ErrorState error={error} onRetry={() => refetch()} className="m-4" />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data?.items}
              rowKey={(r) => r.id}
              isLoading={isLoading}
              isFetching={isFetching}
              empty={
                <EmptyState
                  icon={<Activity className="size-8" />}
                  title="Aún no hay ejecuciones registradas"
                  description="Los informes aparecerán cuando el pool worker complete un bootstrap, ciclo o refill."
                />
              }
            />
            {data && (
              <Pagination
                page={data.page}
                totalPages={data.total_pages}
                total={data.total}
                pageSize={data.page_size}
                onPageChange={(p) => update({ page: p, run: selectedRunId })}
                onPageSizeChange={(s) => update({ size: s, run: selectedRunId })}
              />
            )}
          </>
        )}
      </Card>

      {selectedRunId !== null && (
        <RunDetailModal runId={selectedRunId} onClose={() => update({ run: null, page })} />
      )}
    </>
  )
}

function SummaryCard({
  label,
  value,
  sub,
  icon,
  badge,
  valueClassName,
  onClick,
}: {
  label: string
  value: string
  sub: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  valueClassName?: string
  onClick?: () => void
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-4 transition-colors',
        onClick && 'cursor-pointer hover:border-slate-700 hover:bg-slate-900',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        {badge ?? icon}
      </div>
      <p className={cn('mt-2 text-2xl font-semibold tracking-tight text-white tabular-nums', valueClassName)}>
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-slate-500" title={sub}>
        {sub}
      </p>
    </Card>
  )
}

type TowerFilterStatus = 'all' | 'creada' | 'sin_cambios' | 'fallida'

function RunDetailModal({ runId, onClose }: { runId: number; onClose: () => void }) {
  const { data: run, isLoading, isError, error, refetch } = useRunDetail(runId)
  const [statusFilter, setStatusFilter] = useState<TowerFilterStatus>('all')
  const [search, setSearch] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-xs sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/70 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-white">Informe de Ejecución #{runId}</h2>
            {run && <RunKindBadge kind={run.tipo} dryRun={run.dry_run} />}
            {run?.interfaz_requerida && (
              <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">
                interfaz fallback: {run.interfaz_requerida}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Cerrar detalle"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : isError || !run ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : (
            <RunDetailContent
              run={run}
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
              search={search}
              onSearch={setSearch}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function RunDetailContent({
  run,
  statusFilter,
  onStatusFilter,
  search,
  onSearch,
}: {
  run: RunDetail
  statusFilter: TowerFilterStatus
  onStatusFilter: (v: TowerFilterStatus) => void
  search: string
  onSearch: (v: string) => void
}) {
  const reasons = Object.entries(run.fallos_por_motivo ?? {})
  const ifaces = Object.entries(run.ips_creadas_por_interfaz ?? {})
  const towers = useMemo(() => run.torres ?? [], [run.torres])

  const filteredTowers = useMemo(() => {
    const q = search.toLowerCase()
    return towers.filter((t) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'fallida') {
          if (t.estado === 'creada' || t.estado === 'sin_cambios') return false
        } else if (t.estado !== statusFilter) {
          return false
        }
      }
      if (!q) return true
      return (
        t.torre.toLowerCase().includes(q) ||
        (t.ip_gestion && t.ip_gestion.toLowerCase().includes(q)) ||
        (t.mapa && t.mapa.toLowerCase().includes(q)) ||
        (t.interfaz && t.interfaz.toLowerCase().includes(q)) ||
        (t.motivo && t.motivo.toLowerCase().includes(q))
      )
    })
  }, [towers, statusFilter, search])

  const counts = useMemo(() => {
    let creada = 0
    let sinCambios = 0
    let fallida = 0
    for (const t of towers) {
      if (t.estado === 'creada') creada++
      else if (t.estado === 'sin_cambios') sinCambios++
      else fallida++
    }
    return { all: towers.length, creada, sin_cambios: sinCambios, fallida }
  }, [towers])

  return (
    <>
      {/* Metadata & KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricBox
          label="Inicio → Fin"
          value={formatSpanDuration(run.iniciado, run.terminado)}
          sub={`${formatDateTime(run.iniciado)}`}
        />
        <MetricBox
          label="Torres revisadas"
          value={formatNumber(run.torres_revisadas)}
          sub={`${run.torres_con_altas} altas · ${run.torres_sin_cambios} ok`}
        />
        <MetricBox
          label="IPs creadas"
          value={`+${formatNumber(run.ips_creadas)}`}
          valueClass="text-emerald-400"
          sub="Nuevas /30 en pool"
        />
        <MetricBox
          label="Torres fallidas"
          value={formatNumber(run.torres_fallidas)}
          valueClass={run.torres_fallidas > 0 ? 'text-red-400' : 'text-slate-200'}
          sub={run.torres_fallidas > 0 ? 'Con error en pasada' : '0 fallos'}
        />
        <MetricBox
          label="Ya en router"
          value={formatNumber(run.ips_que_ya_existian_en_router)}
          sub="/30 previas detectadas"
        />
        <MetricBox
          label="Saltadas por colisión"
          value={formatNumber(run.ips_saltadas_porque_existian)}
          valueClass={run.ips_saltadas_porque_existian > 0 ? 'text-amber-300' : 'text-slate-200'}
          sub="Ya existían en MikroTik"
        />
      </div>

      {/* Breakdown by interface and failure reasons */}
      {(ifaces.length > 0 || reasons.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {ifaces.length > 0 && (
            <Card>
              <CardHeader
                title="IPs creadas por interfaz"
                icon={<Network className="size-4 text-emerald-400" />}
              />
              <div className="flex flex-wrap gap-2 p-4">
                {ifaces.map(([iface, cnt]) => (
                  <div
                    key={iface}
                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs"
                  >
                    <Mono className="text-slate-200">{iface}</Mono>
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-300 tabular-nums">
                      +{formatNumber(cnt)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {reasons.length > 0 && (
            <Card className="border-red-900/40">
              <CardHeader
                title="Motivos de fallo en esta ejecución"
                icon={<AlertTriangle className="size-4 text-red-400" />}
              />
              <ul className="divide-y divide-slate-800/80 text-xs">
                {reasons.map(([reason, cnt]) => (
                  <li key={reason} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="font-mono text-red-200">{reason}</span>
                    <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 font-semibold text-red-300 ring-1 ring-red-500/30 tabular-nums">
                      {cnt} {cnt === 1 ? 'torre' : 'torres'}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Per-tower detailed table */}
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-950/60 p-1">
            {(
              [
                { key: 'all', label: `Todas (${counts.all})`, active: 'bg-slate-700 text-white' },
                {
                  key: 'creada',
                  label: `Con altas (${counts.creada})`,
                  active: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40',
                },
                {
                  key: 'sin_cambios',
                  label: `Sin cambios (${counts.sin_cambios})`,
                  active: 'bg-slate-600/30 text-slate-200 ring-1 ring-slate-500/40',
                },
                {
                  key: 'fallida',
                  label: `Fallidas (${counts.fallida})`,
                  active: 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40',
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onStatusFilter(tab.key)}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === tab.key
                    ? tab.active
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <SearchInput
            value={search}
            onChange={onSearch}
            placeholder="Filtrar torre, IP, interfaz o motivo…"
            delay={150}
          />
        </div>

        {filteredTowers.length === 0 ? (
          <EmptyState
            icon={<Server className="size-8" />}
            title="No hay torres que coincidan con el filtro"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/80 tracking-wide text-slate-400 uppercase">
                <tr>
                  <th className="px-3.5 py-2.5 font-medium">Torre</th>
                  <th className="px-3.5 py-2.5 font-medium">Estado</th>
                  <th className="px-3.5 py-2.5 font-medium">Interfaz</th>
                  <th className="px-3.5 py-2.5 text-right font-medium">Disp. antes</th>
                  <th className="px-3.5 py-2.5 text-right font-medium">Creadas</th>
                  <th className="px-3.5 py-2.5 text-right font-medium">En router</th>
                  <th className="px-3.5 py-2.5 text-right font-medium">Saltadas</th>
                  <th className="px-3.5 py-2.5 font-medium">Cursores (MySQL / Router → Desde)</th>
                  <th className="px-3.5 py-2.5 text-right font-medium">Duración</th>
                  <th className="px-3.5 py-2.5 font-medium">Motivo / Observación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredTowers.map((t, idx) => (
                  <TowerReportRow key={`${t.torre}-${idx}`} report={t} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

function TowerReportRow({ report: t }: { report: RunTowerReport }) {
  const hasFailures = t.altas_fallidas > 0 || t.inserts_mysql_fallidos > 0
  return (
    <tr className="hover:bg-slate-800/30">
      <td className="px-3.5 py-2.5 whitespace-nowrap">
        {t.torre ? (
          <Link
            to={`/ips?torre=${encodeURIComponent(t.torre)}`}
            className="font-medium text-slate-100 hover:text-sky-300 hover:underline"
          >
            {t.torre}
          </Link>
        ) : (
          <span className="text-slate-400">—</span>
        )}
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          {t.ip_gestion && <Mono className="text-[11px]">{t.ip_gestion}</Mono>}
          {t.mapa && <span>· {t.mapa}</span>}
        </div>
      </td>
      <td className="px-3.5 py-2.5 whitespace-nowrap">
        <TowerRunStatusBadge status={t.estado} />
      </td>
      <td className="px-3.5 py-2.5 whitespace-nowrap">
        {t.interfaz ? <Mono className="text-xs text-slate-300">{t.interfaz}</Mono> : <span className="text-slate-600">—</span>}
      </td>
      <td className="px-3.5 py-2.5 text-right text-slate-300 tabular-nums">{t.disponibles_antes}</td>
      <td className="px-3.5 py-2.5 text-right tabular-nums">
        {t.ips_creadas > 0 ? (
          <span className="font-semibold text-emerald-300">+{t.ips_creadas}</span>
        ) : (
          <span className="text-slate-500">0</span>
        )}
      </td>
      <td className="px-3.5 py-2.5 text-right text-slate-400 tabular-nums">{t.ips_ya_en_router}</td>
      <td className="px-3.5 py-2.5 text-right tabular-nums">
        <span className={t.ips_saltadas_porque_existian > 0 ? 'text-amber-300' : 'text-slate-500'}>
          {t.ips_saltadas_porque_existian}
        </span>
      </td>
      <td className="px-3.5 py-2.5 whitespace-nowrap">
        {t.contador_desde || t.ultimo_cidr_mysql || t.ultima_en_router ? (
          <div className="space-y-0.5 font-mono text-[11px]">
            <div className="text-slate-400">
              <span className="text-slate-500">db:</span> {t.ultimo_cidr_mysql || '—'}{' '}
              <span className="text-slate-500">· rtr:</span> {t.ultima_en_router || '—'}
            </div>
            {t.contador_desde && (
              <div className="text-sky-300">
                <span className="text-slate-500">desde:</span> {t.contador_desde}
              </div>
            )}
          </div>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>
      <td className="px-3.5 py-2.5 text-right whitespace-nowrap text-slate-400 tabular-nums">
        {formatDurationMs(t.duracion_ms)}
      </td>
      <td className="max-w-xs px-3.5 py-2.5">
        {t.motivo ? (
          <span
            className={cn(
              'block truncate',
              t.estado === 'sin_cambios' ? 'text-slate-400' : 'font-mono text-red-300',
            )}
            title={t.motivo}
          >
            {t.motivo}
          </span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
        {hasFailures && (
          <span className="mt-0.5 block text-[11px] text-amber-300">
            {t.altas_fallidas > 0 && `altas fallidas: ${t.altas_fallidas} `}
            {t.inserts_mysql_fallidos > 0 && `inserts DB fallidos: ${t.inserts_mysql_fallidos}`}
          </span>
        )}
      </td>
    </tr>
  )
}

function MetricBox({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string
  value: string
  sub: string
  valueClass?: string
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className={cn('mt-1 text-xl font-semibold text-white tabular-nums', valueClass)}>{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-slate-500" title={sub}>
        {sub}
      </p>
    </div>
  )
}
