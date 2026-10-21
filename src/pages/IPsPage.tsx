import { Network } from 'lucide-react'
import { useIPs } from '@/api/queries'
import { DataTable, type Column } from '@/components/DataTable'
import { SearchInput, TowerSelect } from '@/components/Filters'
import { Pagination } from '@/components/Pagination'
import { StatusBadge } from '@/components/StatusBadge'
import { Card, EmptyState, ErrorState, Mono, PageHeader } from '@/components/ui'
import { useQueryParams } from '@/lib/useQueryParams'
import { cn, formatDateTime, formatNumber } from '@/lib/utils'
import type { IPStatus, IPView } from '@/types/api'

const TABS: { value: '' | IPStatus; label: string; active: string }[] = [
  { value: '', label: 'Todas', active: 'bg-slate-700 text-white' },
  { value: 'available', label: 'Disponibles', active: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40' },
  { value: 'assigned', label: 'Asignadas', active: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40' },
  { value: 'failed', label: 'Fallidas', active: 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40' },
]

const COLUMNS: Column<IPView>[] = [
  { key: 'ip', header: 'IP cliente', cell: (r) => <Mono className="text-slate-100">{r.ip_address}</Mono> },
  { key: 'gw', header: 'Gateway', cell: (r) => <Mono>{r.gateway}</Mono> },
  { key: 'cidr', header: 'CIDR', cell: (r) => <Mono>{r.cidr}</Mono> },
  { key: 'mask', header: 'Máscara', cell: (r) => <Mono className="text-slate-400">{r.subnet_mask}</Mono> },
  {
    key: 'tower',
    header: 'Torre',
    cell: (r) => (
      <div>
        <p className="text-slate-200">{r.device_name}</p>
        <Mono className="text-xs text-slate-500">{r.device_ip}</Mono>
      </div>
    ),
  },
  { key: 'iface', header: 'Interfaz', cell: (r) => <span className="text-slate-400">{r.interface}</span> },
  { key: 'status', header: 'Estado', cell: (r) => <StatusBadge status={r.status} /> },
  {
    key: 'ticket',
    header: 'Ticket',
    cell: (r) => (r.ticket_id ? <span className="text-blue-300">#{r.ticket_id}</span> : <span className="text-slate-600">—</span>),
  },
  { key: 'created', header: 'Creada', cell: (r) => <span className="text-slate-400">{formatDateTime(r.created_at)}</span> },
]

type Key = 'status' | 'torre' | 'q' | 'size'

export function IPsPage() {
  const { get, getNumber, update } = useQueryParams<Key>()
  const rawStatus = get('status')
  const status = TABS.some((t) => t.value === rawStatus) ? (rawStatus as '' | IPStatus) : ''
  const torre = get('torre')
  const q = get('q')
  const page = getNumber('page', 1)
  const pageSize = getNumber('size', 25)

  const { data, isLoading, isFetching, isError, error, refetch } = useIPs({
    status: status || undefined,
    torre,
    q,
    page,
    page_size: pageSize,
  })

  return (
    <>
      <PageHeader
        title="Pool de IPs"
        description="Todas las IPs /30 creadas en las torres: disponibles, asignadas y fallidas."
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-1 rounded-lg bg-slate-950/60 p-1">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => update({ status: t.value })}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  status === t.value ? t.active : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <TowerSelect value={torre} onChange={(v) => update({ torre: v })} />
            <SearchInput
              value={q}
              onChange={(v) => update({ q: v })}
              placeholder="IP, gateway, CIDR, torre o ticket…"
            />
          </div>
        </div>

        {isError && !data ? (
          <ErrorState error={error} onRetry={() => refetch()} className="m-4" />
        ) : (
          <>
            <DataTable
              columns={COLUMNS}
              rows={data?.items}
              rowKey={(r) => r.id}
              isLoading={isLoading}
              isFetching={isFetching}
              empty={
                <EmptyState
                  icon={<Network className="size-8" />}
                  title="No hay IPs que coincidan"
                  description="Prueba con otro estado, torre o término de búsqueda."
                />
              }
            />
            {data && (
              <Pagination
                page={data.page}
                totalPages={data.total_pages}
                total={data.total}
                pageSize={data.page_size}
                onPageChange={(p) => update({ page: p })}
                onPageSizeChange={(s) => update({ size: s })}
              />
            )}
          </>
        )}
      </Card>

      {data && (torre || q) && (
        <p className="mt-3 text-xs text-slate-500">
          {formatNumber(data.total)} resultado(s)
          {torre && <> en <strong className="text-slate-300">{torre}</strong></>}
          {q && <> para «{q}»</>}
        </p>
      )}
    </>
  )
}
