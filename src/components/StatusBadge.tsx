import { cn } from '@/lib/utils'
import type { IPStatus } from '@/types/api'

const STYLES: Record<IPStatus, { label: string; className: string; dot: string }> = {
  available: {
    label: 'Disponible',
    className: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  assigned: {
    label: 'Asignada',
    className: 'bg-blue-500/10 text-blue-300 ring-blue-500/30',
    dot: 'bg-blue-400',
  },
  failed: {
    label: 'Fallida',
    className: 'bg-red-500/10 text-red-300 ring-red-500/30',
    dot: 'bg-red-400',
  },
}

export function StatusBadge({ status }: { status: IPStatus }) {
  const s = STYLES[status] ?? {
    label: status,
    className: 'bg-slate-500/10 text-slate-300 ring-slate-500/30',
    dot: 'bg-slate-400',
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
