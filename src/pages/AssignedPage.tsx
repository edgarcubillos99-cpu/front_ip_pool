import { ClipboardList } from 'lucide-react'
import { useAssignedIPs } from '@/api/queries'
import { DataTable, type Column } from '@/components/DataTable'
import { SearchInput, TowerSelect } from '@/components/Filters'
import { Pagination } from '@/components/Pagination'
import { Card, EmptyState, ErrorState, Mono, PageHeader } from '@/components/ui'
import { useQueryParams } from '@/lib/useQueryParams'
import { formatDateTime, formatRelative } from '@/lib/utils'
import type { AssignedIPView } from '@/types/api'

const COLUMNS: Column<AssignedIPView>[] = [
  {
    key: 'ticket',
    header: 'Ticket',
    cell: (r) => <span className="font-medium text-blue-300">#{r.ticket_id}</span>,
  },
  { key: 'ip', header: 'IP cliente', cell: (r) => <Mono className="text-slate-100">{r.ip_address}</Mono> },
  { key: 'gw', header: 'Gateway', cell: (r) => <Mono>{r.gateway}</Mono> },
  { key: 'cidr', header: 'CIDR', cell: (r) => <Mono>{r.cidr}</Mono> },
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
  {
    key: 'assigned',
    header: 'Asignada',
    cell: (r) => (
      <div>
        <p className="text-slate-300">{formatDateTime(r.assigned_at)}</p>
        <p className="text-xs text-slate-500">{formatRelative(r.assigned_at)}</p>
      </div>
    ),
  },
  {
    key: 'comment',
    header: 'Comentario',
    className: 'min-w-64 max-w-md whitespace-normal',
    cell: (r) =>
      r.comment ? (
        <p className="line-clamp-2 text-slate-400" title={r.comment}>
          {r.comment}
        </p>
      ) : (
        <span className="text-slate-600">—</span>
      ),
  },
]

type Key = 'torre' | 'q' | 'size'

export function AssignedPage() {
  const { get, getNumber, update } = useQueryParams<Key>()
  const torre = get('torre')
  const q = get('q')
  const page = getNumber('page', 1)
  const pageSize = getNumber('size', 25)

  const { data, isLoading, isFetching, isError, error, refetch } = useAssignedIPs({
    torre,
    q,
    page,
    page_size: pageSize,
  })

  return (
    <>
      <PageHeader
        title="Auditoría de asignaciones"
        description="Histórico de IPs entregadas a clientes con su ticket de Ubersmith."
      />

      <Card>
        <div className="flex flex-col gap-2 border-b border-slate-800 p-4 sm:flex-row sm:justify-end">
          <TowerSelect value={torre} onChange={(v) => update({ torre: v })} />
          <SearchInput
            value={q}
            onChange={(v) => update({ q: v })}
            placeholder="IP, torre, comentario o ticket…"
          />
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
                  icon={<ClipboardList className="size-8" />}
                  title="No hay asignaciones que coincidan"
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
    </>
  )
}
