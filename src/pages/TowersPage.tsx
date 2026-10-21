import { AlertTriangle, CheckCircle2, Clock, LayoutGrid, List, RadioTower, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useTowers } from '@/api/queries'
import { SearchInput } from '@/components/Filters'
import { Card, EmptyState, ErrorState, Mono, PageHeader, ProgressBar, Skeleton } from '@/components/ui'
import { useQueryParams } from '@/lib/useQueryParams'
import { cn, formatDateTime, formatRelative, percent } from '@/lib/utils'
import type { TowerStockView } from '@/types/api'

type Level = 'empty' | 'low' | 'ok'

function level(t: TowerStockView): Level {
  if (t.available === 0) return 'empty'
  return t.low_stock ? 'low' : 'ok'
}

const LEVEL = {
  empty: { label: 'Sin stock', badge: 'bg-red-500/10 text-red-300 ring-red-500/30', bar: 'bg-red-500', icon: XCircle },
  low: { label: 'Stock bajo', badge: 'bg-amber-500/10 text-amber-300 ring-amber-500/30', bar: 'bg-amber-400', icon: AlertTriangle },
  ok: { label: 'OK', badge: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30', bar: 'bg-emerald-500', icon: CheckCircle2 },
}

type Key = 'q' | 'low' | 'view'

export function TowersPage() {
  const { data, isLoading, isError, error, refetch } = useTowers()
  const { get, update } = useQueryParams<Key>()
  const q = get('q').toLowerCase()
  const onlyLow = get('low') === '1'
  const view = get('view') === 'list' ? 'list' : 'grid'
  const [sort, setSort] = useState<'available' | 'name'>('available')

  const towers = useMemo(() => {
    const list = (data?.towers ?? []).filter(
      (t) =>
        (!onlyLow || t.low_stock) &&
        (!q || t.name.toLowerCase().includes(q) || t.ip.includes(q) || t.map_name.toLowerCase().includes(q)),
    )
    return sort === 'name' ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : list
  }, [data, q, onlyLow, sort])

  const counts = useMemo(() => {
    const all = data?.towers ?? []
    return {
      empty: all.filter((t) => level(t) === 'empty').length,
      low: all.filter((t) => level(t) === 'low').length,
      ok: all.filter((t) => level(t) === 'ok').length,
    }
  }, [data])

  return (
    <>
      <PageHeader
        title="Monitoreo de torres"
        description={
          data
            ? `${data.count} torres activas · alerta cuando hay ${data.min_available} o menos IPs disponibles`
            : 'Stock de IPs disponibles por torre'
        }
        actions={
          data && (
            <div className="flex gap-2 text-xs">
              {(['empty', 'low', 'ok'] as const).map((l) => (
                <span key={l} className={cn('rounded-full px-2.5 py-1 font-medium ring-1', LEVEL[l].badge)}>
                  {LEVEL[l].label}: {counts[l]}
                </span>
              ))}
            </div>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={get('q')} onChange={(v) => update({ q: v })} placeholder="Nombre, IP o mapa…" />
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 select-none">
          <input
            type="checkbox"
            checked={onlyLow}
            onChange={(e) => update({ low: e.target.checked ? '1' : null })}
            className="accent-amber-500"
          />
          Solo stock bajo
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'available' | 'name')}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
          aria-label="Ordenar"
        >
          <option value="available">Menor disponibilidad primero</option>
          <option value="name">Nombre (A-Z)</option>
        </select>
        <div className="ml-auto flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
          {(['grid', 'list'] as const).map((v) => {
            const Icon = v === 'grid' ? LayoutGrid : List
            return (
              <button
                key={v}
                type="button"
                onClick={() => update({ view: v === 'grid' ? null : v })}
                className={cn('rounded-md p-1.5', view === v ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white')}
                aria-label={v === 'grid' ? 'Vista en tarjetas' : 'Vista en lista'}
              >
                <Icon className="size-4" />
              </button>
            )
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : isError && !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : towers.length === 0 ? (
        <Card>
          <EmptyState icon={<RadioTower className="size-8" />} title="No hay torres que coincidan" />
        </Card>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {towers.map((t) => (
            <TowerCard key={t.name} tower={t} />
          ))}
        </div>
      ) : (
        <TowerList towers={towers} />
      )}
    </>
  )
}

function TowerCard({ tower: t }: { tower: TowerStockView }) {
  const l = LEVEL[level(t)]
  const Icon = l.icon
  return (
    <Link to={`/ips?torre=${encodeURIComponent(t.name)}`}>
      <Card
        className={cn(
          'h-full p-4 transition-colors hover:border-slate-600 hover:bg-slate-900',
          level(t) === 'empty' && 'border-red-900/60',
          level(t) === 'low' && 'border-amber-900/50',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-100" title={t.name}>
              {t.name}
            </p>
            <Mono className="text-xs text-slate-500">{t.ip}</Mono>
          </div>
          <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1', l.badge)}>
            <Icon className="size-3" /> {l.label}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold text-white tabular-nums">{t.available}</p>
            <p className="text-xs text-slate-500">disponibles</p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>
              <span className="text-blue-300 tabular-nums">{t.assigned}</span> asignadas
            </p>
            <p>
              <span className="text-slate-200 tabular-nums">{t.total}</span> total
            </p>
          </div>
        </div>

        <ProgressBar value={percent(t.available, t.total)} barClassName={l.bar} className="mt-3" />

        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-500">
          <span className="truncate">{t.map_name || '—'}</span>
          <span className="flex shrink-0 items-center gap-1" title={formatDateTime(t.last_created_at)}>
            <Clock className="size-3" /> {formatRelative(t.last_created_at)}
          </span>
        </div>
      </Card>
    </Link>
  )
}

function TowerList({ towers }: { towers: TowerStockView[] }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-800 bg-slate-900/80 text-xs tracking-wide text-slate-400 uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">Torre</th>
            <th className="px-4 py-3 font-medium">Mapa</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 text-right font-medium">Disp.</th>
            <th className="px-4 py-3 text-right font-medium">Asig.</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="w-48 px-4 py-3 font-medium">Disponibilidad</th>
            <th className="px-4 py-3 font-medium">Última creada</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {towers.map((t) => {
            const l = LEVEL[level(t)]
            return (
              <tr key={t.name} className="hover:bg-slate-800/30">
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <Link to={`/ips?torre=${encodeURIComponent(t.name)}`} className="text-slate-100 hover:text-sky-300">
                    {t.name}
                  </Link>
                  <Mono className="block text-xs text-slate-500">{t.ip}</Mono>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-slate-400">{t.map_name || '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ring-1', l.badge)}>
                    {l.label}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-medium text-white tabular-nums">{t.available}</td>
                <td className="px-4 py-2.5 text-right text-blue-300 tabular-nums">{t.assigned}</td>
                <td className="px-4 py-2.5 text-right text-slate-300 tabular-nums">{t.total}</td>
                <td className="px-4 py-2.5">
                  <ProgressBar value={percent(t.available, t.total)} barClassName={l.bar} />
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-slate-400" title={formatDateTime(t.last_created_at)}>
                  {formatRelative(t.last_created_at)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}
