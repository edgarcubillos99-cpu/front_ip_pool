import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const dateTimeFormat = new Intl.DateTimeFormat('es', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const relativeFormat = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFormat.format(d)
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return 'nunca'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const seconds = Math.round((d.getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return relativeFormat.format(seconds, 'second')
  if (abs < 3600) return relativeFormat.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return relativeFormat.format(Math.round(seconds / 3600), 'hour')
  return relativeFormat.format(Math.round(seconds / 86400), 'day')
}

export function formatNumber(n: number): string {
  return n.toLocaleString('es')
}

export function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  const sec = ms / 1000
  if (sec < 60) return `${sec.toFixed(sec < 10 ? 1 : 0)} s`
  const min = Math.floor(sec / 60)
  const remSec = Math.round(sec % 60)
  return remSec > 0 ? `${min}m ${remSec}s` : `${min}m`
}

export function formatSpanDuration(startIso: string | null | undefined, endIso: string | null | undefined): string {
  if (!startIso || !endIso) return '—'
  const s = new Date(startIso).getTime()
  const e = new Date(endIso).getTime()
  if (Number.isNaN(s) || Number.isNaN(e)) return '—'
  return formatDurationMs(Math.max(0, e - s))
}

