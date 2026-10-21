import { AlertTriangle, Loader2, RotateCw } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { getErrorMessage } from '@/api/client'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm', className)}
      {...props}
    />
  )
}

export function CardHeader({
  title,
  description,
  icon,
  actions,
}: {
  title: string
  description?: ReactNode
  icon?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-100">{title}</h2>
          {description && <p className="truncate text-xs text-slate-400">{description}</p>}
        </div>
      </div>
      {actions}
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-4 animate-spin', className)} />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-800/70', className)} />
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-red-900/60 bg-red-950/30 p-6 text-center',
        className,
      )}
    >
      <AlertTriangle className="size-6 text-red-400" />
      <p className="max-w-lg text-sm text-red-200">{getErrorMessage(error)}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-800 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-900/40"
        >
          <RotateCw className="size-3.5" /> Reintentar
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-slate-400">
      {icon && <span className="text-slate-600">{icon}</span>}
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {description && <p className="text-xs">{description}</p>}
    </div>
  )
}

export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-800', className)}>
      <div
        className={cn('h-full rounded-full bg-emerald-500 transition-[width] duration-500', barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export function Mono({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn('font-mono text-[13px]', className)} {...props} />
}
