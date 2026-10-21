import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'ippool.refreshInterval'

export const REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '15s', value: 15_000 },
  { label: '30s', value: 30_000 },
  { label: '1m', value: 60_000 },
  { label: '5m', value: 300_000 },
] as const

const DEFAULT_INTERVAL = 30_000

type Listener = () => void
const listeners = new Set<Listener>()

function read(): number {
  const raw = localStorage.getItem(STORAGE_KEY)
  const n = Number(raw)
  return raw !== null && REFRESH_OPTIONS.some((o) => o.value === n) ? n : DEFAULT_INTERVAL
}

let interval = read()

export function setRefreshInterval(ms: number) {
  interval = ms
  localStorage.setItem(STORAGE_KEY, String(ms))
  listeners.forEach((l) => l())
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Intervalo de auto-refresco en ms; `false` si está desactivado (formato de TanStack Query). */
export function useRefreshInterval(): number | false {
  const value = useSyncExternalStore(subscribe, () => interval)
  return value > 0 ? value : false
}

export function useRefreshIntervalRaw(): number {
  return useSyncExternalStore(subscribe, () => interval)
}
