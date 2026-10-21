import type { ReactNode } from 'react'
import { Skeleton } from './ui'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  isFetching,
  empty,
}: {
  columns: Column<T>[]
  rows: T[] | undefined
  rowKey: (row: T) => string | number
  isLoading: boolean
  isFetching?: boolean
  empty: ReactNode
}) {
  return (
    <div className="relative overflow-x-auto">
      {isFetching && !isLoading && (
        <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-sky-500/70" />
      )}
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-800 bg-slate-900/80 text-xs tracking-wide text-slate-400 uppercase">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cn('px-4 py-3 font-medium whitespace-nowrap', c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn('divide-y divide-slate-800/80', isFetching && !isLoading && 'opacity-70')}>
          {isLoading
            ? Array.from({ length: 8 }, (_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-32" />
                    </td>
                  ))}
                </tr>
              ))
            : rows?.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-slate-800/30">
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-4 py-2.5 whitespace-nowrap text-slate-300', c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!isLoading && rows?.length === 0 && empty}
    </div>
  )
}
