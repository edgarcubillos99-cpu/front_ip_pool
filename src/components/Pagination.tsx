import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn, formatNumber } from '@/lib/utils'

const PAGE_SIZES = [25, 50, 100, 200]

interface Props {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange, onPageSizeChange }: Props) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const last = Math.max(totalPages, 1)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
      <div className="flex items-center gap-3">
        <span>
          {formatNumber(from)}–{formatNumber(to)} de <strong className="text-slate-200">{formatNumber(total)}</strong>
        </span>
        <label className="flex items-center gap-1.5">
          Filas
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <PageButton disabled={page <= 1} onClick={() => onPageChange(1)} label="Primera página">
          <ChevronsLeft className="size-4" />
        </PageButton>
        <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)} label="Página anterior">
          <ChevronLeft className="size-4" />
        </PageButton>
        <span className="px-2 tabular-nums">
          Página <strong className="text-slate-200">{page}</strong> de {last}
        </span>
        <PageButton disabled={page >= last} onClick={() => onPageChange(page + 1)} label="Página siguiente">
          <ChevronRight className="size-4" />
        </PageButton>
        <PageButton disabled={page >= last} onClick={() => onPageChange(last)} label="Última página">
          <ChevronsRight className="size-4" />
        </PageButton>
      </div>
    </div>
  )
}

function PageButton({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled: boolean
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-md border border-slate-700 p-1 text-slate-300 hover:bg-slate-800',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
      )}
    >
      {children}
    </button>
  )
}
